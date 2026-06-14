package com.ecommerce.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "addresses")
public class Address {
    @Id
    private String id;

    @Indexed
    private String userId;

    private String fullName;
    private String phone;
    private String street;
    private String city;
    private String state;
    private String zipCode;
    private String country;

    @Builder.Default
    private boolean isDefault = false;

    private String label; // HOME, WORK, OTHER
}
