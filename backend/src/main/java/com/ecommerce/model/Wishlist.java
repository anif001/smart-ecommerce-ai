package com.ecommerce.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "wishlists")
public class Wishlist {
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String userId;
    
    @Builder.Default
    private List<String> productIds = new ArrayList<>();
    
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
