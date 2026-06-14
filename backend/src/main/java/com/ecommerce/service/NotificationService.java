package com.ecommerce.service;

import com.ecommerce.model.Notification;
import com.ecommerce.model.User;
import com.ecommerce.repository.NotificationRepository;
import com.ecommerce.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public Notification createNotification(String userId, String title, String message, String type, String referenceId, String referenceType) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .build();
        return notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public void markAsRead(String notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        unread.stream()
            .filter(n -> !n.isRead())
            .forEach(n -> {
                n.setRead(true);
                notificationRepository.save(n);
            });
    }

    public void sendOrderConfirmation(String userId, String orderId, String orderNumber) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        String title = "Order Confirmed - #" + orderNumber;
        String message = "Your order #" + orderNumber + " has been placed successfully. Track your order here.";
        createNotification(userId, title, message, "ORDER", orderId, "ORDER");

        sendEmail(user.getEmail(), "Order Confirmed - SmartCart AI",
            "Dear " + user.getName() + ",\n\n" +
            "Your order #" + orderNumber + " has been placed successfully!\n\n" +
            "Track your order: " + frontendUrl + "/orders/track/" + orderId + "\n\n" +
            "Thank you for shopping with SmartCart AI!\n\nBest regards,\nSmartCart AI Team");
    }

    public void sendOrderShipped(String userId, String orderId, String orderNumber) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        String title = "Order Shipped - #" + orderNumber;
        String message = "Your order #" + orderNumber + " has been shipped! Track your delivery.";
        createNotification(userId, title, message, "ORDER", orderId, "ORDER");

        sendEmail(user.getEmail(), "Order Shipped - SmartCart AI",
            "Dear " + user.getName() + ",\n\n" +
            "Your order #" + orderNumber + " has been shipped!\n\n" +
            "Track your delivery: " + frontendUrl + "/orders/track/" + orderId + "\n\n" +
            "Thank you for shopping with SmartCart AI!\n\nBest regards,\nSmartCart AI Team");
    }

    public void sendOrderDelivered(String userId, String orderId, String orderNumber) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        String title = "Order Delivered - #" + orderNumber;
        String message = "Your order #" + orderNumber + " has been delivered. Enjoy your purchase!";
        createNotification(userId, title, message, "ORDER", orderId, "ORDER");
    }

    public void sendPaymentConfirmation(String userId, String orderId, Double amount) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        String title = "Payment Successful";
        String message = "Payment of " + amount + " for order #" + orderId + " was successful.";
        createNotification(userId, title, message, "PAYMENT", orderId, "ORDER");

        sendEmail(user.getEmail(), "Payment Confirmed - SmartCart AI",
            "Dear " + user.getName() + ",\n\n" +
            "Your payment of " + amount + " for order #" + orderId + " was successful.\n\n" +
            "Thank you for shopping with SmartCart AI!\n\nBest regards,\nSmartCart AI Team");
    }

    private void sendEmail(String to, String subject, String text) {
        if (mailSender == null) {
            logger.info("Mail sender not configured. Skipping email to: {}", to);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            logger.info("Email sent to: {}", to);
        } catch (Exception e) {
            logger.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
