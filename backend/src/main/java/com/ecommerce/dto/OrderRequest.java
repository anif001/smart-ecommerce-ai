package com.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequest {
    private String shippingAddressId;
    private String shippingAddress;
    private String paymentMethod;
    private String couponCode;
}
