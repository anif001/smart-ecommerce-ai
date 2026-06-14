package com.ecommerce.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "orders")
public class Order {
    @Id
    private String id;

    @Indexed
    private String userId;

    private String orderNumber;

    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    private Double subtotal;
    private Double shippingCost;
    private Double taxAmount;
    private Double discountAmount;
    private String couponCode;
    private Double totalAmount;

    private String status; // PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURN_REQUESTED, RETURNED, REFUNDED

    private String shippingAddressId;
    private String shippingAddress;

    private String paymentMethod; // RAZORPAY, COD
    private String paymentStatus; // PAID, UNPAID, REFUNDED

    // Cancellation
    private String cancellationReason;
    private LocalDateTime cancelledAt;

    // Return
    private String returnReason;
    private String returnStatus; // REQUESTED, APPROVED, REJECTED, ITEM_RECEIVED
    private LocalDateTime returnRequestedAt;

    @Builder.Default
    private List<TrackingEvent> tracking = new ArrayList<>();

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt;
    private LocalDateTime deliveredAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItem {
        private String productId;
        private String title;
        private String imageUrl;
        private Double price;
        private Integer quantity;
        private String variant; // e.g., "Size: M, Color: Black"
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrackingEvent {
        private String status;
        private String description;
        private String location;
        @Builder.Default
        private LocalDateTime timestamp = LocalDateTime.now();
    }
}
