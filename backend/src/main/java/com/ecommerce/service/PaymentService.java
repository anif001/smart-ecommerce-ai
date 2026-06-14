package com.ecommerce.service;

import com.ecommerce.dto.PaymentRequest;
import com.ecommerce.model.Order;
import com.ecommerce.model.Payment;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.PaymentRepository;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.SignatureException;
import java.time.LocalDateTime;
import java.util.Map;

@Service
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private NotificationService notificationService;

    @Value("${razorpay.key}")
    private String razorpayKey;

    @Value("${razorpay.secret}")
    private String razorpaySecret;

    private com.razorpay.RazorpayClient razorpayClient;

    private com.razorpay.RazorpayClient getClient() {
        if (razorpayClient == null) {
            try {
                razorpayClient = new com.razorpay.RazorpayClient(razorpayKey, razorpaySecret);
            } catch (Exception e) {
                logger.error("Failed to create Razorpay client: {}", e.getMessage());
            }
        }
        return razorpayClient;
    }

    public Map<String, Object> createRazorpayOrder(String orderId, Double amount) {
        try {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", (int) (amount * 100));
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", orderId);

            com.razorpay.Order razorpayOrder = getClient().orders.create(orderRequest);

            Payment payment = Payment.builder()
                    .orderId(orderId)
                    .razorpayOrderId(razorpayOrder.get("id"))
                    .amount(amount)
                    .currency("INR")
                    .status("CREATED")
                    .createdAt(LocalDateTime.now())
                    .build();
            paymentRepository.save(payment);

            return Map.of(
                "razorpayOrderId", razorpayOrder.get("id"),
                "amount", amount,
                "currency", "INR",
                "key", razorpayKey
            );
        } catch (Exception e) {
            logger.error("Failed to create Razorpay order: {}", e.getMessage());
            throw new RuntimeException("Payment initialization failed: " + e.getMessage());
        }
    }

    public Payment verifyAndSavePayment(PaymentRequest request) {
        Payment payment = paymentRepository.findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        try {
            String generatedSignature = HmacSHA256(
                request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId(),
                razorpaySecret
            );

            if (!generatedSignature.equals(request.getRazorpaySignature())) {
                payment.setStatus("FAILED");
                paymentRepository.save(payment);
                throw new IllegalArgumentException("Payment signature verification failed");
            }

            payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
            payment.setRazorpaySignature(request.getRazorpaySignature());
            payment.setStatus("PAID");
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            orderService.updatePaymentStatus(payment.getOrderId(), "PAID");

            Order order = orderRepository.findById(payment.getOrderId()).orElse(null);
            if (order != null) {
                notificationService.sendPaymentConfirmation(order.getUserId(), order.getOrderNumber(), payment.getAmount());
            }

            return payment;
        } catch (Exception e) {
            logger.error("Payment verification failed: {}", e.getMessage());
            throw new IllegalArgumentException("Payment verification failed");
        }
    }

    public void processRefund(String orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found for order"));

        payment.setStatus("REFUNDED");
        payment.setUpdatedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        orderService.updatePaymentStatus(orderId, "REFUNDED");
    }

    private String HmacSHA256(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] bytes = mac.doFinal(data.getBytes());
        StringBuilder hash = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xFF & b);
            if (hex.length() == 1) hash.append('0');
            hash.append(hex);
        }
        return hash.toString();
    }
}
