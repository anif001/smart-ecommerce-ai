package com.ecommerce.service;

import com.ecommerce.dto.ApplyCouponRequest;
import com.ecommerce.dto.CouponResponse;
import com.ecommerce.model.Coupon;
import com.ecommerce.repository.CouponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CouponService {

    @Autowired
    private CouponRepository couponRepository;

    public Coupon createCoupon(Coupon coupon) {
        if (couponRepository.existsByCodeIgnoreCase(coupon.getCode())) {
            throw new IllegalArgumentException("Coupon code already exists");
        }
        coupon.setCode(coupon.getCode().toUpperCase());
        coupon.setUsedCount(0);
        coupon.setCreatedAt(LocalDateTime.now());
        return couponRepository.save(coupon);
    }

    public Coupon updateCoupon(String id, Coupon couponDetails) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Coupon not found"));

        coupon.setDescription(couponDetails.getDescription());
        coupon.setDiscountType(couponDetails.getDiscountType());
        coupon.setDiscountValue(couponDetails.getDiscountValue());
        coupon.setMinimumOrderAmount(couponDetails.getMinimumOrderAmount());
        coupon.setMaxDiscountAmount(couponDetails.getMaxDiscountAmount());
        coupon.setUsageLimit(couponDetails.getUsageLimit());
        coupon.setValidFrom(couponDetails.getValidFrom());
        coupon.setValidUntil(couponDetails.getValidUntil());
        coupon.setActive(couponDetails.isActive());
        coupon.setCategory(couponDetails.getCategory());

        return couponRepository.save(coupon);
    }

    public void deleteCoupon(String id) {
        couponRepository.deleteById(id);
    }

    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    public CouponResponse applyCoupon(ApplyCouponRequest request) {
        Coupon coupon = couponRepository.findByCodeIgnoreCase(request.getCode())
                .orElseThrow(() -> new IllegalArgumentException("Invalid coupon code"));

        if (!coupon.isActive()) {
            throw new IllegalArgumentException("This coupon is no longer active");
        }

        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(coupon.getValidFrom()) || now.isAfter(coupon.getValidUntil())) {
            throw new IllegalArgumentException("This coupon has expired");
        }

        if (coupon.getUsageLimit() != null && coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new IllegalArgumentException("This coupon has reached its usage limit");
        }

        if (request.getOrderAmount() < coupon.getMinimumOrderAmount()) {
            throw new IllegalArgumentException("Minimum order amount of " + coupon.getMinimumOrderAmount() + " required");
        }

        double discount;
        if ("PERCENTAGE".equalsIgnoreCase(coupon.getDiscountType())) {
            discount = request.getOrderAmount() * coupon.getDiscountValue() / 100.0;
            if (coupon.getMaxDiscountAmount() != null && discount > coupon.getMaxDiscountAmount()) {
                discount = coupon.getMaxDiscountAmount();
            }
        } else {
            discount = coupon.getDiscountValue();
        }

        double finalAmount = Math.max(0, request.getOrderAmount() - discount);

        return CouponResponse.builder()
                .code(coupon.getCode())
                .description(coupon.getDescription())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .maxDiscountAmount(coupon.getMaxDiscountAmount())
                .discountedAmount(Math.round(discount * 100.0) / 100.0)
                .finalAmount(Math.round(finalAmount * 100.0) / 100.0)
                .build();
    }

    public void incrementUsage(String code) {
        couponRepository.findByCodeIgnoreCase(code).ifPresent(c -> {
            c.setUsedCount(c.getUsedCount() + 1);
            couponRepository.save(c);
        });
    }
}
