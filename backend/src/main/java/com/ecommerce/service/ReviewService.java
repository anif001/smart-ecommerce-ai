package com.ecommerce.service;

import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.Product;
import com.ecommerce.model.Review;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ReviewRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReviewService {

    private static final Logger logger = LoggerFactory.getLogger(ReviewService.class);

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${ml.service.url}")
    private String mlServiceUrl;

    public Review addReview(String userId, String userName, String productId, Integer rating, String comment) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + productId));

        // Call Python ML service for sentiment analysis
        String sentiment = "NEUTRAL";
        Double confidenceScore = 0.5;

        try {
            String sentimentUrl = mlServiceUrl + "/sentiment";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("text", comment);

            HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(requestBody, headers);
            
            logger.info("Calling ML Sentiment API at {}", sentimentUrl);
            Map<?, ?> response = restTemplate.postForObject(sentimentUrl, requestEntity, Map.class);
            
            if (response != null) {
                sentiment = (String) response.get("sentiment");
                Object conf = response.get("confidenceScore");
                if (conf instanceof Number) {
                    confidenceScore = ((Number) conf).doubleValue();
                }
            }
        } catch (Exception e) {
            logger.error("Failed to connect to Python ML Service for sentiment analysis: {}. Defaulting to NEUTRAL.", e.getMessage());
        }

        Review review = Review.builder()
                .userId(userId)
                .userName(userName)
                .productId(productId)
                .rating(rating)
                .comment(comment)
                .sentiment(sentiment)
                .confidenceScore(confidenceScore)
                .createdAt(LocalDateTime.now())
                .build();

        Review savedReview = reviewRepository.save(review);

        // Recalculate and update product's average rating
        recalculateProductRating(productId);

        return savedReview;
    }

    public List<Review> getReviewsByProductId(String productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    private void recalculateProductRating(String productId) {
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return;

        List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
        if (reviews.isEmpty()) {
            product.setAverageRating(0.0);
        } else {
            double sum = reviews.stream().mapToDouble(Review::getRating).sum();
            double avg = sum / reviews.size();
            // Round to 1 decimal place
            product.setAverageRating(Math.round(avg * 10.0) / 10.0);
        }
        productRepository.save(product);
    }
}
