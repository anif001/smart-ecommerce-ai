package com.ecommerce.repository;

import com.ecommerce.model.Coupon;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface CouponRepository extends MongoRepository<Coupon, String> {
    Optional<Coupon> findByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCase(String code);
}
