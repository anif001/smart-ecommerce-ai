package com.ecommerce.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "reviews")
public class Review {
    @Id
    private String id;
    
    private String userId;
    
    private String userName;
    
    @Indexed
    private String productId;
    
    private Integer rating; // 1 to 5 stars
    
    private String comment;
    
    private String sentiment; // POSITIVE, NEUTRAL, NEGATIVE (from ML Service)
    
    private Double confidenceScore; // Sentiment classification confidence score
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
