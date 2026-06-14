package com.ecommerce.controller;

import com.ecommerce.dto.PaymentRequest;
import com.ecommerce.model.Order;
import com.ecommerce.model.Payment;
import com.ecommerce.model.User;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null) return null;
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    @PostMapping("/create-order")
    public ResponseEntity<?> createPaymentOrder(@RequestBody Map<String, String> request, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);

        String orderId = request.get("orderId");
        if (orderId == null) return new ResponseEntity<>("Order ID required", HttpStatus.BAD_REQUEST);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getUserId().equals(user.getId())) {
            return new ResponseEntity<>("Forbidden", HttpStatus.FORBIDDEN);
        }

        Map<String, Object> paymentOrder = paymentService.createRazorpayOrder(orderId, order.getTotalAmount());
        return ResponseEntity.ok(paymentOrder);
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody PaymentRequest request, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);

        try {
            Payment payment = paymentService.verifyAndSavePayment(request);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}
