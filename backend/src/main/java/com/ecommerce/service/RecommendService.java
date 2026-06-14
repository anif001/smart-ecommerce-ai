package com.ecommerce.service;

import com.ecommerce.dto.RecommendedItemDTO;
import com.ecommerce.model.Order;
import com.ecommerce.model.Product;
import com.ecommerce.model.User;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Service
public class RecommendService {

    private static final Logger logger = LoggerFactory.getLogger(RecommendService.class);
    private final ExecutorService retrainExecutor = Executors.newSingleThreadExecutor();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${ml.service.url}")
    private String mlServiceUrl;

    public List<RecommendedItemDTO> getSimilarProducts(String productId, int limit) {
        try {
            String url = mlServiceUrl + "/recommend/similar";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("productId", productId);
            body.put("limit", limit);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            logger.info("Calling Python ML Similar API at URL {}", url);
            RecommendedItemDTO[] response = restTemplate.postForObject(url, request, RecommendedItemDTO[].class);

            if (response != null) {
                return Arrays.asList(response);
            }
        } catch (Exception e) {
            logger.error("Failed to fetch similar recommendations from Python ML: {}. Using DB fallback.", e.getMessage());
        }
        return getSimilarProductsFallback(productId, limit);
    }

    public List<RecommendedItemDTO> getPersonalizedRecommendations(String userId, int limit) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return getTrendingRecommendations(limit);
        }

        // Gather purchase history product IDs
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<String> purchasedProductIds = orders.stream()
                .flatMap(order -> order.getItems().stream())
                .map(Order.OrderItem::getProductId)
                .distinct()
                .collect(Collectors.toList());

        List<String> viewedProductIds = user.getRecentlyViewed() != null ? user.getRecentlyViewed() : new ArrayList<>();

        try {
            String url = mlServiceUrl + "/recommend/personal";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("userId", userId);
            body.put("viewedProductIds", viewedProductIds);
            body.put("purchasedProductIds", purchasedProductIds);
            body.put("limit", limit);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            logger.info("Calling Python ML Personalization API at URL {}", url);
            RecommendedItemDTO[] response = restTemplate.postForObject(url, request, RecommendedItemDTO[].class);

            if (response != null && response.length > 0) {
                return Arrays.asList(response);
            }
        } catch (Exception e) {
            logger.error("Failed to fetch personalized recommendations from Python ML: {}. Using DB fallback.", e.getMessage());
        }

        return getPersonalizedFallback(userId, viewedProductIds, purchasedProductIds, limit);
    }

    public List<RecommendedItemDTO> getTrendingRecommendations(int limit) {
        List<Product> trendingProducts = productRepository.findTop5ByOrderByPopularityScoreDesc();
        return trendingProducts.stream()
                .limit(limit)
                .map(p -> RecommendedItemDTO.builder()
                        .productId(p.getId())
                        .similarityScore(0.85)
                        .explanation("Trending in your store right now")
                        .build())
                .collect(Collectors.toList());
    }

    public void triggerRetrain() {
        try {
            String url = mlServiceUrl + "/retrain";
            logger.info("Triggering ML model retrain at URL {}", url);
            restTemplate.postForObject(url, null, Map.class);
        } catch (Exception e) {
            logger.error("Failed to trigger ML retrain: {}", e.getMessage());
        }
    }

    // --- FALLBACK ALGORITHMS (Runs if Python service is down) ---

    private List<RecommendedItemDTO> getSimilarProductsFallback(String productId, int limit) {
        Product target = productRepository.findById(productId).orElse(null);
        if (target == null) return new ArrayList<>();

        Pageable pageable = PageRequest.of(0, limit);
        Page<Product> sameCategory = productRepository.findByCategoryIgnoreCase(target.getCategory(), pageable);
        return sameCategory.stream()
                .filter(p -> !p.getId().equals(productId))
                .map(p -> RecommendedItemDTO.builder()
                        .productId(p.getId())
                        .similarityScore(0.70)
                        .explanation("Related item in category: " + p.getCategory())
                        .build())
                .collect(Collectors.toList());
    }

    private List<RecommendedItemDTO> getPersonalizedFallback(String userId, List<String> viewed, List<String> purchased, int limit) {
        Set<String> targetCategories = new HashSet<>();
        
        List<String> combinedHistory = new ArrayList<>(purchased);
        combinedHistory.addAll(viewed);

        for (String id : combinedHistory) {
            productRepository.findById(id).ifPresent(p -> targetCategories.add(p.getCategory()));
        }

        if (targetCategories.isEmpty()) {
            return getTrendingRecommendations(limit);
        }

        List<RecommendedItemDTO> recs = new ArrayList<>();
        for (String category : targetCategories) {
            if (recs.size() >= limit) break;
            Pageable pageable = PageRequest.of(0, limit - recs.size());
            Page<Product> categoryProducts = productRepository.findByCategoryIgnoreCase(category, pageable);
            categoryProducts.stream()
                    .filter(p -> !purchased.contains(p.getId()))
                    .forEach(p -> recs.add(RecommendedItemDTO.builder()
                            .productId(p.getId())
                            .similarityScore(0.65)
                            .explanation("Similar to items you viewed in " + p.getCategory())
                            .build()));
        }

        if (recs.isEmpty()) {
            return getTrendingRecommendations(limit);
        }

        return recs;
    }
}
