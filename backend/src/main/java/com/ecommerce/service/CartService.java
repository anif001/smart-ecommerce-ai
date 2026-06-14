package com.ecommerce.service;

import com.ecommerce.model.Cart;
import com.ecommerce.model.Product;
import com.ecommerce.repository.CartRepository;
import com.ecommerce.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;

@Service
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private ProductRepository productRepository;

    public Cart getCartByUserId(String userId) {
        return cartRepository.findByUserId(userId)
                .orElseGet(() -> cartRepository.save(
                        Cart.builder()
                                .userId(userId)
                                .items(new ArrayList<>())
                                .savedForLater(new ArrayList<>())
                                .updatedAt(LocalDateTime.now())
                                .build()
                ));
    }

    public Cart addItemToCart(String userId, String productId, Integer quantity, String variant) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        if (product.getInventory() < quantity) {
            throw new IllegalArgumentException("Insufficient inventory");
        }

        Cart cart = getCartByUserId(userId);

        Optional<Cart.CartItem> existingItem = cart.getItems().stream()
                .filter(item -> item.getProductId().equals(productId))
                .findFirst();

        if (existingItem.isPresent()) {
            existingItem.get().setQuantity(existingItem.get().getQuantity() + quantity);
        } else {
            cart.getItems().add(Cart.CartItem.builder()
                    .productId(productId)
                    .quantity(quantity)
                    .variant(variant)
                    .build());
        }

        cart.setUpdatedAt(LocalDateTime.now());
        return cartRepository.save(cart);
    }

    public Cart updateItemQuantity(String userId, String productId, Integer quantity) {
        Cart cart = getCartByUserId(userId);

        if (quantity <= 0) {
            return removeItemFromCart(userId, productId);
        }

        cart.getItems().stream()
                .filter(item -> item.getProductId().equals(productId))
                .findFirst()
                .ifPresent(item -> item.setQuantity(quantity));

        cart.setUpdatedAt(LocalDateTime.now());
        return cartRepository.save(cart);
    }

    public Cart removeItemFromCart(String userId, String productId) {
        Cart cart = getCartByUserId(userId);
        cart.getItems().removeIf(item -> item.getProductId().equals(productId));
        cart.setUpdatedAt(LocalDateTime.now());
        return cartRepository.save(cart);
    }

    public Cart moveToSavedForLater(String userId, String productId) {
        Cart cart = getCartByUserId(userId);
        cart.getItems().stream()
                .filter(item -> item.getProductId().equals(productId))
                .findFirst()
                .ifPresent(item -> {
                    cart.getItems().remove(item);
                    cart.getSavedForLater().add(item);
                });
        cart.setUpdatedAt(LocalDateTime.now());
        return cartRepository.save(cart);
    }

    public Cart moveToCart(String userId, String productId) {
        Cart cart = getCartByUserId(userId);
        cart.getSavedForLater().stream()
                .filter(item -> item.getProductId().equals(productId))
                .findFirst()
                .ifPresent(item -> {
                    cart.getSavedForLater().remove(item);
                    cart.getItems().add(item);
                });
        cart.setUpdatedAt(LocalDateTime.now());
        return cartRepository.save(cart);
    }

    public void clearCart(String userId) {
        Cart cart = getCartByUserId(userId);
        cart.getItems().clear();
        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);
    }
}
