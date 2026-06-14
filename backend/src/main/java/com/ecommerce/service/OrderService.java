package com.ecommerce.service;

import com.ecommerce.dto.OrderRequest;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.model.*;
import com.ecommerce.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CartService cartService;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private CouponService couponService;

    @Autowired
    private NotificationService notificationService;

    @Value("${app.tax.percentage}")
    private double taxPercentage;

    @Value("${app.shipping.free-threshold}")
    private double freeShippingThreshold;

    @Value("${app.shipping.cost}")
    private double shippingCost;

    public Order placeOrder(String userId, OrderRequest request) {
        Cart cart = cartService.getCartByUserId(userId);
        if (cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cannot place order with empty cart");
        }

        List<Order.OrderItem> orderItems = new ArrayList<>();
        double subtotal = 0.0;

        for (Cart.CartItem cartItem : cart.getItems()) {
            Product product = productRepository.findById(cartItem.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + cartItem.getProductId()));

            if (product.getInventory() < cartItem.getQuantity()) {
                throw new IllegalArgumentException("Insufficient inventory for product: " + product.getTitle());
            }

            product.setInventory(product.getInventory() - cartItem.getQuantity());
            productRepository.save(product);

            Order.OrderItem orderItem = Order.OrderItem.builder()
                    .productId(product.getId())
                    .title(product.getTitle())
                    .imageUrl(product.getImages() != null && !product.getImages().isEmpty() ? product.getImages().get(0) : null)
                    .price(product.getPrice())
                    .quantity(cartItem.getQuantity())
                    .variant(cartItem.getVariant())
                    .build();

            orderItems.add(orderItem);
            subtotal += product.getPrice() * cartItem.getQuantity();
        }

        subtotal = Math.round(subtotal * 100.0) / 100.0;

        // Calculate shipping
        double shipping = subtotal >= freeShippingThreshold ? 0.0 : shippingCost;

        // Calculate tax
        double tax = Math.round(subtotal * taxPercentage / 100.0 * 100.0) / 100.0;

        // Apply coupon if provided
        double discount = 0.0;
        String couponCode = null;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            try {
                var couponResponse = couponService.applyCoupon(
                    new com.ecommerce.dto.ApplyCouponRequest(request.getCouponCode(), subtotal + shipping + tax)
                );
                discount = couponResponse.getDiscountedAmount();
                couponCode = request.getCouponCode();
                couponService.incrementUsage(request.getCouponCode());
            } catch (Exception e) {
                throw new IllegalArgumentException("Coupon error: " + e.getMessage());
            }
        }

        double totalAmount = Math.round((subtotal + shipping + tax - discount) * 100.0) / 100.0;

        // Get shipping address
        String shippingAddressStr;
        if (request.getShippingAddressId() != null) {
            Address addr = addressRepository.findByIdAndUserId(request.getShippingAddressId(), userId)
                    .orElseThrow(() -> new IllegalArgumentException("Address not found"));
            shippingAddressStr = addr.getFullName() + ", " + addr.getStreet() + ", " +
                    addr.getCity() + ", " + addr.getState() + " - " + addr.getZipCode() +
                    ", Phone: " + addr.getPhone();
        } else if (request.getShippingAddress() != null) {
            shippingAddressStr = request.getShippingAddress();
        } else {
            throw new IllegalArgumentException("Shipping address is required");
        }

        String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Order order = Order.builder()
                .userId(userId)
                .orderNumber(orderNumber)
                .items(orderItems)
                .subtotal(subtotal)
                .shippingCost(shipping)
                .taxAmount(tax)
                .discountAmount(discount)
                .couponCode(couponCode)
                .totalAmount(totalAmount)
                .status("PENDING")
                .shippingAddress(shippingAddressStr)
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "RAZORPAY")
                .paymentStatus("UNPAID")
                .createdAt(LocalDateTime.now())
                .build();

        order.getTracking().add(Order.TrackingEvent.builder()
                .status("PENDING")
                .description("Order placed successfully")
                .timestamp(LocalDateTime.now())
                .build());

        Order savedOrder = orderRepository.save(order);

        // Clear cart after checkout
        cartService.clearCart(userId);

        // Send notification
        notificationService.sendOrderConfirmation(userId, savedOrder.getId(), orderNumber);

        return savedOrder;
    }

    public Order getOrderById(String orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
    }

    public List<Order> getOrdersByUserId(String userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    public Order updateOrderStatus(String orderId, String status) {
        Order order = getOrderById(orderId);
        order.setStatus(status);
        order.setUpdatedAt(LocalDateTime.now());

        String description;
        switch (status) {
            case "CONFIRMED":
                description = "Order has been confirmed";
                break;
            case "PROCESSING":
                description = "Order is being processed";
                break;
            case "SHIPPED":
                description = "Order has been shipped";
                order.setUpdatedAt(LocalDateTime.now());
                notificationService.sendOrderShipped(order.getUserId(), orderId, order.getOrderNumber());
                break;
            case "DELIVERED":
                description = "Order has been delivered successfully";
                order.setDeliveredAt(LocalDateTime.now());
                notificationService.sendOrderDelivered(order.getUserId(), orderId, order.getOrderNumber());
                break;
            default:
                description = "Status updated to " + status;
        }

        order.getTracking().add(Order.TrackingEvent.builder()
                .status(status)
                .description(description)
                .timestamp(LocalDateTime.now())
                .build());

        return orderRepository.save(order);
    }

    public void updatePaymentStatus(String orderId, String paymentStatus) {
        Order order = getOrderById(orderId);
        order.setPaymentStatus(paymentStatus);
        if ("PAID".equals(paymentStatus)) {
            order.setStatus("CONFIRMED");
            order.getTracking().add(Order.TrackingEvent.builder()
                    .status("CONFIRMED")
                    .description("Payment received, order confirmed")
                    .timestamp(LocalDateTime.now())
                    .build());
        }
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
    }

    public Order cancelOrder(String orderId, String userId, String reason) {
        Order order = getOrderById(orderId);

        if (!order.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized to cancel this order");
        }

        if (!List.of("PENDING", "CONFIRMED", "PROCESSING").contains(order.getStatus())) {
            throw new IllegalArgumentException("Order cannot be cancelled at current status: " + order.getStatus());
        }

        // Restore inventory
        for (Order.OrderItem item : order.getItems()) {
            productRepository.findById(item.getProductId()).ifPresent(product -> {
                product.setInventory(product.getInventory() + item.getQuantity());
                productRepository.save(product);
            });
        }

        order.setStatus("CANCELLED");
        order.setCancellationReason(reason);
        order.setCancelledAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        order.getTracking().add(Order.TrackingEvent.builder()
                .status("CANCELLED")
                .description("Order cancelled: " + reason)
                .timestamp(LocalDateTime.now())
                .build());

        return orderRepository.save(order);
    }

    public Order requestReturn(String orderId, String userId, String reason) {
        Order order = getOrderById(orderId);

        if (!order.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized to return this order");
        }

        if (!"DELIVERED".equals(order.getStatus())) {
            throw new IllegalArgumentException("Only delivered orders can be returned");
        }

        order.setStatus("RETURN_REQUESTED");
        order.setReturnReason(reason);
        order.setReturnStatus("REQUESTED");
        order.setReturnRequestedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        order.getTracking().add(Order.TrackingEvent.builder()
                .status("RETURN_REQUESTED")
                .description("Return requested: " + reason)
                .timestamp(LocalDateTime.now())
                .build());

        return orderRepository.save(order);
    }

    public Order processReturn(String orderId, boolean approve) {
        Order order = getOrderById(orderId);

        if (approve) {
            order.setReturnStatus("APPROVED");
            order.getTracking().add(Order.TrackingEvent.builder()
                    .status("RETURN_APPROVED")
                    .description("Return request approved")
                    .timestamp(LocalDateTime.now())
                    .build());
        } else {
            order.setReturnStatus("REJECTED");
            order.setStatus("DELIVERED");
            order.getTracking().add(Order.TrackingEvent.builder()
                    .status("RETURN_REJECTED")
                    .description("Return request rejected")
                    .timestamp(LocalDateTime.now())
                    .build());
        }

        order.setUpdatedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }
}
