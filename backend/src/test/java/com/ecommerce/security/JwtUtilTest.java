package com.ecommerce.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "dGhpcy1pcy1hLXRlc3Qtc2VjcmV0LWtleS13aGljaC1pcy1hdC1sZWFzdC0zMi1ieXRlcy1sb25nLg==");
        ReflectionTestUtils.setField(jwtUtil, "expiration", 3600000L);
        userDetails = new User("test@example.com", "password", Collections.emptyList());
    }

    @Test
    void generateToken_ShouldCreateValidToken() {
        String token = jwtUtil.generateToken(userDetails);
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void extractUsername_ShouldReturnCorrectUsername() {
        String token = jwtUtil.generateToken(userDetails);
        String username = jwtUtil.extractUsername(token);
        assertEquals("test@example.com", username);
    }

    @Test
    void validateToken_ShouldReturnTrue_ForValidToken() {
        String token = jwtUtil.generateToken(userDetails);
        assertTrue(jwtUtil.validateToken(token, userDetails));
    }

    @Test
    void validateToken_ShouldReturnFalse_ForWrongUser() {
        String token = jwtUtil.generateToken(userDetails);
        UserDetails wrongUser = new User("wrong@example.com", "password", Collections.emptyList());
        assertFalse(jwtUtil.validateToken(token, wrongUser));
    }
}
