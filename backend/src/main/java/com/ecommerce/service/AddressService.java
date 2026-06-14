package com.ecommerce.service;

import com.ecommerce.dto.AddressRequest;
import com.ecommerce.model.Address;
import com.ecommerce.repository.AddressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AddressService {

    @Autowired
    private AddressRepository addressRepository;

    public List<Address> getUserAddresses(String userId) {
        return addressRepository.findByUserIdOrderByIsDefaultDesc(userId);
    }

    public Address addAddress(String userId, AddressRequest request) {
        if (request.getCountry() == null || request.getCountry().isBlank()) {
            request.setCountry("India");
        }
        if (request.getLabel() == null || request.getLabel().isBlank()) {
            request.setLabel("HOME");
        }

        if (request.isDefault() || addressRepository.countByUserId(userId) == 0) {
            addressRepository.findByUserIdAndIsDefaultTrue(userId)
                .ifPresent(a -> {
                    a.setDefault(false);
                    addressRepository.save(a);
                });
        }

        Address address = Address.builder()
                .userId(userId)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .street(request.getStreet())
                .city(request.getCity())
                .state(request.getState())
                .zipCode(request.getZipCode())
                .country(request.getCountry())
                .isDefault(request.isDefault() || addressRepository.countByUserId(userId) == 0)
                .label(request.getLabel())
                .build();

        return addressRepository.save(address);
    }

    public Address updateAddress(String userId, String addressId, AddressRequest request) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));

        if (request.isDefault()) {
            addressRepository.findByUserIdAndIsDefaultTrue(userId)
                .ifPresent(a -> {
                    a.setDefault(false);
                    addressRepository.save(a);
                });
        }

        address.setFullName(request.getFullName());
        address.setPhone(request.getPhone());
        address.setStreet(request.getStreet());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setZipCode(request.getZipCode());
        address.setCountry(request.getCountry());
        address.setDefault(request.isDefault());
        address.setLabel(request.getLabel());

        return addressRepository.save(address);
    }

    public void deleteAddress(String userId, String addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found"));
        addressRepository.delete(address);
    }
}
