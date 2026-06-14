package com.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponResponse {
    private String code;
    private String description;
    private String discountType;
    private Double discountValue;
    private Double maxDiscountAmount;
    private Double discountedAmount;
    private Double finalAmount;
}
