package com.ecommerce.controller;

import com.ecommerce.dto.ReviewRequest;
import com.ecommerce.model.Product;
import com.ecommerce.model.Review;
import com.ecommerce.model.User;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.ProductService;
import com.ecommerce.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private UserRepository userRepository;

    private static final List<String> VALID_SORT_FIELDS = Arrays.asList("id", "title", "price", "category", "popularityScore", "averageRating", "createdAt");

    @GetMapping
    public ResponseEntity<Page<Product>> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        if (!VALID_SORT_FIELDS.contains(sortBy)) {
            sortBy = "id";
        }
        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Product> products;
        if (search != null && !search.trim().isEmpty()) {
            products = productService.searchProducts(search, pageable);
        } else if (category != null && !category.trim().isEmpty()) {
            products = productService.getProductsByCategory(category, pageable);
        } else {
            products = productService.getAllProducts(pageable);
        }

        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable String id, Authentication authentication) {
        Product product = productService.getProductById(id);

        // Record to recently viewed if user is logged in
        if (authentication != null) {
            String email = authentication.getName();
            userRepository.findByEmail(email).ifPresent(user -> {
                if (user.getRecentlyViewed() == null) {
                    user.setRecentlyViewed(new ArrayList<>());
                }
                // Avoid duplicates in recent list, and push to front
                user.getRecentlyViewed().remove(id);
                user.getRecentlyViewed().add(0, id);
                
                // Cap at 10 items
                if (user.getRecentlyViewed().size() > 10) {
                    user.getRecentlyViewed().remove(user.getRecentlyViewed().size() - 1);
                }
                userRepository.save(user);
            });
        }

        return ResponseEntity.ok(product);
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<List<Review>> getProductReviews(@PathVariable String id) {
        List<Review> reviews = reviewService.getReviewsByProductId(id);
        return ResponseEntity.ok(reviews);
    }

    @PostMapping("/{id}/reviews")
    public ResponseEntity<?> addReview(
            @PathVariable String id,
            @RequestBody ReviewRequest request,
            Authentication authentication
    ) {
        if (authentication == null) {
            return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);
        }
        
        try {
            User user = userRepository.findByEmail(authentication.getName())
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            Review review = reviewService.addReview(
                    user.getId(),
                    user.getName(),
                    id,
                    request.getRating(),
                    request.getComment()
            );
            return new ResponseEntity<>(review, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}
