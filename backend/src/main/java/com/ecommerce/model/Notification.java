package com.ecommerce.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;

    @Indexed
    private String userId;

    private String title;
    private String message;
    private String type; // ORDER, PAYMENT, PROMOTION, SYSTEM
    private String referenceId; // orderId, etc.
    private String referenceType; // ORDER, PAYMENT, COUPON

    @Builder.Default
    private boolean isRead = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
