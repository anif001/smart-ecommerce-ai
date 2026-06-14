import os
import logging
import threading
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from pymongo import MongoClient
from preprocess import clean_text

logger = logging.getLogger(__name__)

# MongoDB Config
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "ecommerce")

class RecommendationEngine:
    def __init__(self):
        self._lock = threading.Lock()
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.products_df = pd.DataFrame()
        self.tfidf_matrix = None
        self.similarity_matrix = None
        self.mongo_client = None
        self.db = None
        
        self.initialize_mongo()
        self.train_model()

    def initialize_mongo(self):
        try:
            self.mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
            self.mongo_client.server_info()
            self.db = self.mongo_client[DB_NAME]
            logger.info("Connected to MongoDB successfully.")
        except Exception as e:
            logger.warning(f"MongoDB connection failed: {e}. Running ML service without database.")
            self.mongo_client = None
            self.db = None

    def fetch_products(self) -> list:
        if self.db is not None:
            try:
                products = list(self.db.products.find({}))
                if len(products) > 0:
                    for p in products:
                        p['_id'] = str(p['_id'])
                    return products
            except Exception as e:
                logger.error(f"Failed to fetch products from MongoDB: {e}")
        return []

    def train_model(self):
        with self._lock:
            logger.info("Training recommendation model...")
            products = self.fetch_products()
            if not products:
                logger.warning("No products found. Model will be empty.")
                self.products_df = pd.DataFrame()
                self.tfidf_matrix = None
                self.similarity_matrix = None
                return
                
            self.products_df = pd.DataFrame(products)
            
            if '_id' in self.products_df.columns:
                self.products_df['id'] = self.products_df['_id'].astype(str)
            elif 'id' not in self.products_df.columns:
                self.products_df['id'] = [str(i) for i in range(len(self.products_df))]
                
            self.products_df['tags_str'] = self.products_df['tags'].apply(
                lambda x: " ".join(x) if isinstance(x, list) else str(x)
            )
            
            self.products_df['combined_features'] = (
                self.products_df['title'].fillna('') + " " +
                self.products_df['category'].fillna('') + " " +
                self.products_df['description'].fillna('') + " " +
                self.products_df['tags_str']
            )
            
            self.products_df['combined_features'] = self.products_df['combined_features'].apply(clean_text)
            self.tfidf_matrix = self.vectorizer.fit_transform(self.products_df['combined_features'])
            self.similarity_matrix = cosine_similarity(self.tfidf_matrix)
            logger.info(f"Model trained successfully. Loaded {len(self.products_df)} products.")

    def get_similar_products(self, product_id: str, limit: int = 5) -> list:
        with self._lock:
            if self.products_df.empty or self.similarity_matrix is None:
                return []
                
            matches = self.products_df[self.products_df['id'] == product_id]
            if matches.empty:
                logger.warning(f"Product {product_id} not found in model dataframe.")
                return []
                
            idx = matches.index[0]
            target_product = matches.iloc[0]
            
            sim_scores = list(enumerate(self.similarity_matrix[idx]))
            sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
            
            results = []
            for i, score in sim_scores:
                if len(results) >= limit:
                    break
                prod = self.products_df.iloc[i]
                if prod['id'] != product_id:
                    results.append({
                        "productId": str(prod['id']),
                        "similarityScore": round(float(score), 4),
                        "explanation": f"Similar to '{target_product['title']}' in category {prod['category']}"
                    })
            return results

    def get_personalized_recommendations(self, user_id: str, viewed_ids: list, purchased_ids: list, limit: int = 5) -> list:
        with self._lock:
            if self.products_df.empty or self.tfidf_matrix is None:
                return []
                
            viewed_indices = self.products_df[self.products_df['id'].isin(viewed_ids)].index.tolist()
            purchased_indices = self.products_df[self.products_df['id'].isin(purchased_ids)].index.tolist()
            
            if not viewed_indices and not purchased_indices:
                popular = self.products_df.head(limit)
                return [
                    {
                        "productId": str(p['id']),
                        "similarityScore": 0.5,
                        "explanation": "Trending product popular among other shoppers"
                    } for _, p in popular.iterrows()
                ]
                
            user_vector = np.zeros(self.tfidf_matrix.shape[1])
            interacted_indices = []
            
            for idx in viewed_indices:
                user_vector += self.tfidf_matrix[idx].toarray()[0] * 1.0
                interacted_indices.append(idx)
                
            for idx in purchased_indices:
                user_vector += self.tfidf_matrix[idx].toarray()[0] * 2.5
                interacted_indices.append(idx)
                
            norm = np.linalg.norm(user_vector)
            if norm > 0:
                user_vector = user_vector / norm
                
            user_vector_2d = user_vector.reshape(1, -1)
            sim_scores = cosine_similarity(user_vector_2d, self.tfidf_matrix)[0]
            
            ranked_scores = list(enumerate(sim_scores))
            ranked_scores = sorted(ranked_scores, key=lambda x: x[1], reverse=True)
            
            results = []
            excluded_ids = set(purchased_ids)
            
            for i, score in ranked_scores:
                if len(results) >= limit:
                    break
                prod = self.products_df.iloc[i]
                prod_id = str(prod['id'])
                
                if prod_id not in excluded_ids:
                    best_reason = "Recommended based on your interest in " + prod['category']
                    max_sub_score = 0.0
                    
                    for hist_idx in interacted_indices:
                        hist_prod = self.products_df.iloc[hist_idx]
                        pair_score = self.similarity_matrix[i][hist_idx]
                        if pair_score > max_sub_score:
                            max_sub_score = pair_score
                            action = "purchased" if hist_prod['id'] in purchased_ids else "viewed"
                            best_reason = f"Similar to '{hist_prod['title']}' which you recently {action}"
                    
                    results.append({
                        "productId": prod_id,
                        "similarityScore": round(float(score), 4),
                        "explanation": best_reason
                    })
            return results
