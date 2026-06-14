package com.ecommerce.service;

import com.ecommerce.model.Wishlist;
import com.ecommerce.repository.WishlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;

@Service
public class WishlistService {

    @Autowired
    private WishlistRepository wishlistRepository;

    public Wishlist getWishlistByUserId(String userId) {
        return wishlistRepository.findByUserId(userId)
                .orElseGet(() -> wishlistRepository.save(
                        Wishlist.builder()
                                .userId(userId)
                                .productIds(new ArrayList<>())
                                .updatedAt(LocalDateTime.now())
                                .build()
                ));
    }

    public Wishlist toggleWishlist(String userId, String productId) {
        Wishlist wishlist = getWishlistByUserId(userId);
        
        if (wishlist.getProductIds().contains(productId)) {
            wishlist.getProductIds().remove(productId);
        } else {
            wishlist.getProductIds().add(productId);
        }
        
        wishlist.setUpdatedAt(LocalDateTime.now());
        return wishlistRepository.save(wishlist);
    }
}
