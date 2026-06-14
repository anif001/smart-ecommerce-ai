package com.ecommerce.controller;

import com.ecommerce.model.Notification;
import com.ecommerce.model.User;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    private User getAuthenticatedUser(Authentication authentication) {
        if (authentication == null) return null;
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    @GetMapping
    public ResponseEntity<?> getNotifications(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);

        List<Notification> notifications = notificationService.getUserNotifications(user.getId());
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);

        long count = notificationService.getUnreadCount(user.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id, Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);

        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        if (user == null) return new ResponseEntity<>("Unauthorized", HttpStatus.UNAUTHORIZED);

        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok().build();
    }
}
