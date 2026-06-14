package com.ecommerce.controller;

import com.ecommerce.dto.AddressRequest;
import com.ecommerce.model.Address;
import com.ecommerce.model.User;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.AddressService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    @Autowired
    private AddressService addressService;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null) return null;
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> getUserAddresses(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);

        List<Address> addresses = addressService.getUserAddresses(user.getId());
        return ResponseEntity.ok(addresses);
    }

    @PostMapping
    public ResponseEntity<?> addAddress(@Valid @RequestBody AddressRequest request, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);

        Address address = addressService.addAddress(user.getId(), request);
        return new ResponseEntity<>(address, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAddress(@PathVariable String id, @Valid @RequestBody AddressRequest request, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);

        Address address = addressService.updateAddress(user.getId(), id, request);
        return ResponseEntity.ok(address);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAddress(@PathVariable String id, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);

        addressService.deleteAddress(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
