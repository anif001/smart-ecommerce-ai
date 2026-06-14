package com.ecommerce.controller;

import com.ecommerce.model.Product;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.ProductService;
import com.ecommerce.service.ReviewService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductControllerTest {

    @Mock
    private ProductService productService;

    @Mock
    private ReviewService reviewService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProductController productController;

    @Test
    void getProducts_ShouldReturnPage() {
        Page<Product> page = new PageImpl<>(List.of(new Product()));
        when(productService.getAllProducts(any(PageRequest.class))).thenReturn(page);

        ResponseEntity<Page<Product>> response = productController.getProducts(null, null, 0, 12, "id", "desc");

        assertEquals(200, response.getStatusCodeValue());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getTotalElements());
    }
}
