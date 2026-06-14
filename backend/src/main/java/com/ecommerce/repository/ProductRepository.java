package com.ecommerce.repository;

import com.ecommerce.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface ProductRepository extends MongoRepository<Product, String> {
    Page<Product> findByCategoryIgnoreCase(String category, Pageable pageable);
    
    @Query("{ '$or': [ { 'title': { '$regex': ?0, '$options': 'i' } }, { 'category': { '$regex': ?0, '$options': 'i' } }, { 'description': { '$regex': ?0, '$options': 'i' } } ] }")
    Page<Product> searchProducts(String keyword, Pageable pageable);
    
    List<Product> findTop5ByOrderByPopularityScoreDesc();
}
