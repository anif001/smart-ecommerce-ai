package com.ecommerce.repository;

import com.ecommerce.model.Address;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface AddressRepository extends MongoRepository<Address, String> {
    List<Address> findByUserIdOrderByIsDefaultDesc(String userId);
    Optional<Address> findByUserIdAndIsDefaultTrue(String userId);
    Optional<Address> findByIdAndUserId(String id, String userId);
    long countByUserId(String userId);
}
