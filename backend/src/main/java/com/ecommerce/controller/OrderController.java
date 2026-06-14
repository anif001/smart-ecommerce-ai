package com.ecommerce.controller;

import com.ecommerce.dto.CancelOrderRequest;
import com.ecommerce.dto.OrderRequest;
import com.ecommerce.dto.ReturnOrderRequest;
import com.ecommerce.model.Order;
import com.ecommerce.model.User;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null) return null;
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    @PostMapping
    public ResponseEntity<?> placeOrder(@RequestBody OrderRequest request, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);

        try {
            Order order = orderService.placeOrder(user.getId(), request);
            return new ResponseEntity<>(order, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping
    public ResponseEntity<?> getOrderHistory(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);

        List<Order> orders = orderService.getOrdersByUserId(user.getId());
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable String id, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);

        Order order = orderService.getOrderById(id);

        if (!order.getUserId().equals(user.getId()) && !user.getRole().equals("ROLE_ADMIN")) {
            return new ResponseEntity<>("Forbidden", HttpStatus.FORBIDDEN);
        }

        return ResponseEntity.ok(order);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable String id, @RequestBody CancelOrderRequest request, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);

        try {
            Order order = orderService.cancelOrder(id, user.getId(), request.getReason());
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/{id}/return")
    public ResponseEntity<?> requestReturn(@PathVariable String id, @RequestBody ReturnOrderRequest request, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);

        try {
            Order order = orderService.requestReturn(id, user.getId(), request.getReason());
            return ResponseEntity.ok(order);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}
