import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from recommendation import RecommendationEngine
from preprocess import analyze_sentiment

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Smart E-Commerce Recommendation API",
    description="Python ML service for product recommendations and sentiment analysis.",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate engine
engine = RecommendationEngine()

# Pydantic Schemas
class SimilarRequest(BaseModel):
    productId: str
    limit: Optional[int] = Field(default=5, ge=1, le=50)

class PersonalRequest(BaseModel):
    userId: str
    viewedProductIds: List[str] = Field(default=[])
    purchasedProductIds: List[str] = Field(default=[])
    limit: Optional[int] = Field(default=5, ge=1, le=50)

class SentimentRequest(BaseModel):
    text: str = Field(..., min_length=1)

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "productsLoaded": len(engine.products_df),
        "dbConnected": engine.db is not None
    }

@app.post("/recommend/similar")
def recommend_similar(request: SimilarRequest):
    try:
        recommendations = engine.get_similar_products(request.productId, request.limit)
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")

@app.post("/recommend/personal")
def recommend_personal(request: PersonalRequest):
    try:
        recommendations = engine.get_personalized_recommendations(
            request.userId, 
            request.viewedProductIds, 
            request.purchasedProductIds, 
            request.limit
        )
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Personalization error: {str(e)}")

@app.post("/sentiment")
def sentiment_analysis(request: SentimentRequest):
    try:
        result = analyze_sentiment(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sentiment analysis error: {str(e)}")

@app.post("/retrain")
def retrain_model():
    try:
        engine.train_model()
        return {
            "status": "SUCCESS",
            "message": f"Recommendation engine retrained successfully with {len(engine.products_df)} products."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
