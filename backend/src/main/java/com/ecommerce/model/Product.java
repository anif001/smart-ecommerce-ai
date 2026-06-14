package com.ecommerce.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "products")
public class Product {
    @Id
    private String id;

    private String title;
    private String category;
    private String brand;
    private String description;

    private Double price;
    private Double compareAtPrice; // Original price for showing discount

    @Builder.Default
    private List<String> images = new ArrayList<>();

    private Integer inventory;

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Builder.Default
    private Double averageRating = 0.0;

    @Builder.Default
    private Integer reviewCount = 0;

    @Builder.Default
    private Integer popularityScore = 0;

    @Builder.Default
    private List<Variant> variants = new ArrayList<>();

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Variant {
        private String type; // SIZE, COLOR
        private String value;
        private Integer inventory;
        private Double priceAdjustment;
    }
}
