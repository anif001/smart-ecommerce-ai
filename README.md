# AI-Powered Smart E-Commerce Recommendation System
### Final Year B.Tech Major Project in Computer Science & Engineering

An intelligent, full-stack, production-ready e-commerce platform capable of context-aware product recommendations. The system integrates a React.js frontend, a Java Spring Boot backend, a MongoDB Atlas/local database, and a Python Machine Learning microservice that leverages Natural Language Processing (NLP) techniques (TF-IDF Vectorization and Cosine Similarity) to serve personalized shopping feeds and Explainable AI (XAI) details.

---

## 🖥️ System Architecture & Services
The application is structured as three decoupled microservices:

1. **Frontend (`frontend/`)**: Powered by React.js (Vite), styled with Tailwind CSS, using Lucide React for UI iconography and Recharts for interactive sales/sentiment analytics. Ports to `http://localhost:5173`.
2. **Backend Engine (`backend/`)**: Built using Java Spring Boot. Manages business transactions, user accounts, cart states, wishlists, and role-based permissions (JWT validation filters & Spring Security). Connects to MongoDB on `mongodb://localhost:27017/ecommerce` and ports to `http://localhost:8080`.
3. **ML Microservice (`ml-service/`)**: Driven by Python FastAPI. Preprocesses catalog metadata, fits a TF-IDF Vectorizer, computes Cosine Similarity matrices, performs lexicon-based review sentiment classification, and computes Explainable AI reasons. Ports to `http://localhost:8000`.

---

## 🚀 Setup & Execution Guide

### Prerequisite Checklist
* Java Development Kit (JDK 17 or higher)
* Python 3.8+
* Node.js v18+ (npm)
* MongoDB (installed and running locally on port 27017, or a MongoDB Atlas URI)

---

### Step 1: Run the MongoDB Instance
Ensure your local MongoDB instance is running:
* **Windows**: `net start MongoDB` or verify the MongoDB Service is running in `services.msc`.
* Default URI: `mongodb://localhost:27017/ecommerce`

---

### Step 2: Set up & Run the Python ML Service
1. Open a terminal and navigate to the `ml-service` directory:
   ```bash
   cd ml-service
   ```
2. Run the provided PowerShell startup script (or execute the commands inside manually):
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\run_ml.ps1
   ```
   *This script automatically creates a Python virtual environment, installs standard scikit-learn/FastAPI packages, and starts the Uvicorn server on `http://localhost:8000`.*
3. Verify the ML Service is running by opening `http://localhost:8000/health` in your browser.

---

### Step 3: Set up & Run the Spring Boot Backend
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Build and run the project using the portable Maven wrapper located in the root `tools/` folder:
   ```bash
   ..\tools\apache-maven-3.9.6\bin\mvn spring-boot:run
   ```
   *Upon startup, the DatabaseSeeder class checks if MongoDB is empty. If it is, it automatically inserts default users (admin@ecommerce.com / adminpassword, user@ecommerce.com / userpassword) and 8 products with review logs.*
3. Verify backend health by checking: `http://localhost:8080/api/recommend/trending`

---

### Step 4: Set up & Run the React Frontend
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open your browser to the URL displayed in the terminal: `http://localhost:5173`

---

## 📊 Database Collections (MongoDB)
* **`users`**: Customer profiles, BCrypt passwords, role claims, and `recentlyViewed` product IDs.
* **`products`**: Title, description, category, price, inventory counts, tags, average rating, and popularity score.
* **`carts`**: Active item arrays mapped to user IDs.
* **`orders`**: Transaction snapshots, checkout addresses, payment status, and order status.
* **`reviews`**: Review ratings, comments, and ML-computed sentiment classes (POSITIVE, NEUTRAL, NEGATIVE).
* **`wishlists`**: Saved item lists mapped to user IDs.

---

## 📡 REST API Documentation

### 1. Authentication Services (`/api/auth`)
* `POST /api/auth/register`: Create accounts.
  * *Payload*: `{ "name": "Alice", "email": "alice@gmail.com", "password": "123", "role": "USER" }`
* `POST /api/auth/login`: Authenticate and obtain JWT.
  * *Payload*: `{ "email": "user@ecommerce.com", "password": "userpassword" }`
* `GET /api/auth/profile`: Get logged-in profile metadata.

### 2. Catalog & Review Services (`/api/products`)
* `GET /api/products`: Paginated products search and filtering.
  * *Query Params*: `search` (text), `category` (string), `page`, `size`, `sortBy`, `direction`
* `GET /api/products/{id}`: Detailed product specs.
* `POST /api/products/{id}/reviews`: Write a review. Backend automatically delegates comment parsing to the ML sentiment analyzer.
  * *Payload*: `{ "rating": 5, "comment": "Great mouse" }`

### 3. Shopping Cart & Checkout Services (`/api/cart`, `/api/orders`)
* `GET /api/cart`: Fetch cart items.
* `POST /api/cart`: Add products to cart. `{ "productId": "...", "quantity": 1 }`
* `PUT /api/cart/update`: Adjust item quantities.
* `POST /api/orders`: Place a simulated checkout order. `{ "shippingAddress": "123 Main St" }`

### 4. Recommendation Services (`/api/recommend`)
* `GET /api/recommend/product/{productId}`: Fetch TF-IDF similar products.
* `GET /api/recommend/user/{userId}`: Fetch user preference personalized products.
* `GET /api/recommend/trending`: Fetch trending items based on engagement metrics.

---

## 🧠 Machine Learning Engine Details

### Feature Engineering & Text Preprocessing
The model combines multiple attributes (`Title + Category + Description + Tags`) into a unified text document for each item. Text is preprocessed by:
1. Converting all characters to lowercase.
2. Stripping out special characters, digits, and extra spaces.
3. Filtering out common English stop words.

### TF-IDF Vectorization
The text documents are processed using Scikit-Learn's `TfidfVectorizer` to calculate the Term Frequency-Inverse Document Frequency. TF-IDF measures how important a term is to a product document relative to the entire catalog:
$$\text{TF}(t, d) = \frac{\text{Number of times term } t \text{ appears in document } d}{\text{Total number of terms in document } d}$$
$$\text{IDF}(t, D) = \log\left(\frac{\text{Total number of documents } |D|}{\text{Number of documents containing term } t + 1}\right)$$
$$\text{TF-IDF}(t, d, D) = \text{TF}(t, d) \times \text{IDF}(t, D)$$

This converts each product's text metadata into a high-dimensional vector.

### Cosine Similarity
To measure semantic similarity, the cosine of the angle between two product TF-IDF vectors is calculated:
$$\text{Cosine Similarity}(A, B) = \frac{A \cdot B}{\|A\| \|B\|} = \frac{\sum_{i=1}^{n} A_i B_i}{\sqrt{\sum_{i=1}^{n} A_i^2} \sqrt{\sum_{i=1}^{n} B_i^2}}$$
A score of `1.0` indicates identical item profiles, whereas `0.0` represents completely distinct terms.

### Personalized Suggestions Logic
1. When a user navigates the store, the system records viewed items (up to 10) in their `recentlyViewed` database field.
2. On the dashboard, the ML service retrieves these viewed IDs and the user's purchase history.
3. It creates a **User Profile Vector** by calculating a weighted average of the TF-IDF vectors of these items (giving viewed products a weight of `1.0` and purchased items a weight of `2.5`).
4. It computes the cosine similarity between the User Profile Vector and all remaining products, returning the top recommendations.

### Explainable AI (XAI)
To make recommendations transparent, the system matches recommended items back to the user's history. It finds which specific viewed/purchased item has the highest similarity to the recommendation and prints explanations like:
* *"Similar to 'Logitech Gaming Mouse' which you recently purchased"*
* *"Trending product popular among other shoppers"*

---

## 🎓 Viva / Project Defense Preparation Q&A

**Q1: Why was MongoDB chosen instead of MySQL?**
* **A**: E-commerce projects deal with complex, changing metadata (such as variable tags, item descriptions, and user history arrays like `recentlyViewed`). A NoSQL document database like MongoDB allows storing JSON-like documents without rigid schema mappings, facilitating rapid reads and simple scalability.

**Q2: How do the Spring Boot backend and the Python ML service communicate?**
* **A**: They communicate asynchronously over REST APIs. The Spring Boot backend uses `RestTemplate` to trigger POST requests to the Python FastAPI microservice (e.g., to fetch similar product IDs or to run sentiment classification on a review comment).

**Q3: What is the fallback mechanism if the ML service goes offline?**
* **A**: To ensure production-level availability, the backend implements a database-level fallback algorithm. If the Python REST endpoint fails, Spring Boot catches the exception and falls back to a query matching products in the same category or fetching trending products based on database popularity metrics.

**Q4: How is security handled in the system?**
* **A**: Authentication is stateless, secured using JSON Web Tokens (JWT). When a user logs in, Spring Boot generates a token signed using a HMAC-SHA256 key. The React frontend stores this token and sends it in the `Authorization: Bearer <token>` header of every Axios request. The backend validates this token on protected endpoints using a servlet request filter (`JwtFilter`).
