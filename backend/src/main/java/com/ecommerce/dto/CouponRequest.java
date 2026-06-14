package com.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CouponRequest {
    @NotBlank(message = "Coupon code is required")
    private String code;

    private String description;

    @NotBlank(message = "Discount type is required")
    private String discountType;

    @NotNull(message = "Discount value is required")
    private Double discountValue;

    private Double minimumOrderAmount;
    private Double maxDiscountAmount;
    private Integer usageLimit;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private boolean isActive;
    private String category;
}
