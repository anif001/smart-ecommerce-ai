package com.ecommerce.controller;

import com.ecommerce.model.User;
import com.ecommerce.model.Wishlist;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null) return null;
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> getWishlist(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);

        Wishlist wishlist = wishlistService.getWishlistByUserId(user.getId());
        return ResponseEntity.ok(wishlist);
    }

    @PostMapping("/{productId}")
    public ResponseEntity<?> toggleWishlist(@PathVariable String productId, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);

        Wishlist wishlist = wishlistService.toggleWishlist(user.getId(), productId);
        return ResponseEntity.ok(wishlist);
    }
}
