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
@Document(collection = "coupons")
public class Coupon {
    @Id
    private String id;

    @Indexed(unique = true)
    private String code;

    private String description;
    private String discountType; // PERCENTAGE, FIXED
    private Double discountValue;
    private Double minimumOrderAmount;
    private Double maxDiscountAmount;
    private Integer usageLimit;
    private Integer usedCount;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private boolean isActive;
    private String category; // ALL, ELECTRONICS, FASHION, HOME

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
