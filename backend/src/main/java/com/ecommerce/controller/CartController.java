package com.ecommerce.controller;

import com.ecommerce.dto.CartItemRequest;
import com.ecommerce.model.Cart;
import com.ecommerce.model.User;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null) return null;
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> getCart(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);
        Cart cart = cartService.getCartByUserId(user.getId());
        return ResponseEntity.ok(cart);
    }

    @PostMapping
    public ResponseEntity<?> addItemToCart(@RequestBody CartItemRequest request, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);
        try {
            Cart cart = cartService.addItemToCart(user.getId(), request.getProductId(), request.getQuantity(), request.getVariant());
            return ResponseEntity.ok(cart);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/add")
    public ResponseEntity<?> addItemToCartV2(@RequestBody CartItemRequest request, Authentication authentication) {
        return addItemToCart(request, authentication);
    }

    @PutMapping("/update")
    public ResponseEntity<?> updateItemQuantity(@RequestBody CartItemRequest request, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);
        Cart cart = cartService.updateItemQuantity(user.getId(), request.getProductId(), request.getQuantity());
        return ResponseEntity.ok(cart);
    }

    @PutMapping("/update/{productId}")
    public ResponseEntity<?> updateItemQuantityPath(@PathVariable String productId, @RequestBody Map<String, Integer> body, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);
        Integer quantity = body.getOrDefault("quantity", 1);
        Cart cart = cartService.updateItemQuantity(user.getId(), productId, quantity);
        return ResponseEntity.ok(cart);
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<?> removeItemFromCart(@PathVariable String productId, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);
        Cart cart = cartService.removeItemFromCart(user.getId(), productId);
        return ResponseEntity.ok(cart);
    }

    @DeleteMapping("/remove/{productId}")
    public ResponseEntity<?> removeItemFromCartV2(@PathVariable String productId, Authentication authentication) {
        return removeItemFromCart(productId, authentication);
    }

    @PostMapping("/save-for-later/{productId}")
    public ResponseEntity<?> moveToSavedForLater(@PathVariable String productId, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);
        Cart cart = cartService.moveToSavedForLater(user.getId(), productId);
        return ResponseEntity.ok(cart);
    }

    @PostMapping("/move-to-cart/{productId}")
    public ResponseEntity<?> moveToCart(@PathVariable String productId, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);
        Cart cart = cartService.moveToCart(user.getId(), productId);
        return ResponseEntity.ok(cart);
    }
}
