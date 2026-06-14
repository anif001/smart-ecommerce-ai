package com.ecommerce.service;

import com.ecommerce.dto.RegisterRequest;
import com.ecommerce.model.User;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserDetailsService userDetailsService;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = new RegisterRequest();
        validRequest.setName("Test User");
        validRequest.setEmail("test@example.com");
        validRequest.setPassword("password123");
        validRequest.setRole("USER");
    }

    @Test
    void register_ShouldThrowException_WhenEmailAlreadyExists() {
        when(userRepository.existsByEmail(validRequest.getEmail())).thenReturn(true);
        assertThrows(IllegalArgumentException.class, () -> authService.register(validRequest));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_ShouldThrowException_WhenPasswordTooShort() {
        validRequest.setPassword("12345");
        assertThrows(IllegalArgumentException.class, () -> authService.register(validRequest));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_ShouldThrowException_WhenNameIsEmpty() {
        validRequest.setName("");
        assertThrows(IllegalArgumentException.class, () -> authService.register(validRequest));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_ShouldSucceed_WhenValidRequest() {
        when(userRepository.existsByEmail(validRequest.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(validRequest.getPassword())).thenReturn("hashed-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = authService.register(validRequest);

        assertNotNull(result);
        assertEquals("test@example.com", result.getEmail());
        assertEquals("Test User", result.getName());
        assertEquals("hashed-password", result.getPassword());
        assertEquals("ROLE_USER", result.getRole());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_ShouldForceUserRole_IgnoringClientRole() {
        validRequest.setRole("ADMIN");
        when(userRepository.existsByEmail(validRequest.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(validRequest.getPassword())).thenReturn("hashed-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = authService.register(validRequest);

        assertEquals("ROLE_USER", result.getRole());
    }
}
