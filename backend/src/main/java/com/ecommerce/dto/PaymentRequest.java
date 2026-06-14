package com.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {
    private String orderId;
    private String razorpayPaymentId;
    private String razorpayOrderId;
    private String razorpaySignature;
}
