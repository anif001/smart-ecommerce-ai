package com.ecommerce.controller;

import com.ecommerce.dto.RecommendedItemDTO;
import com.ecommerce.service.RecommendService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommend")
public class RecommendController {

    @Autowired
    private RecommendService recommendService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<RecommendedItemDTO>> getSimilarProducts(
            @PathVariable String productId,
            @RequestParam(defaultValue = "5") int limit
    ) {
        List<RecommendedItemDTO> recommendations = recommendService.getSimilarProducts(productId, limit);
        return ResponseEntity.ok(recommendations);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<RecommendedItemDTO>> getPersonalizedRecommendations(
            @PathVariable String userId,
            @RequestParam(defaultValue = "5") int limit
    ) {
        List<RecommendedItemDTO> recommendations = recommendService.getPersonalizedRecommendations(userId, limit);
        return ResponseEntity.ok(recommendations);
    }

    @GetMapping("/trending")
    public ResponseEntity<List<RecommendedItemDTO>> getTrendingProducts(
            @RequestParam(defaultValue = "5") int limit
    ) {
        List<RecommendedItemDTO> recommendations = recommendService.getTrendingRecommendations(limit);
        return ResponseEntity.ok(recommendations);
    }
}
