package com.ecommerce.controller;

import com.ecommerce.model.*;
import com.ecommerce.repository.*;
import com.ecommerce.service.OrderService;
import com.ecommerce.service.ProductService;
import com.ecommerce.service.RecommendService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private ProductService productService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private RecommendService recommendService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final java.util.concurrent.ExecutorService retrainExecutor = java.util.concurrent.Executors.newSingleThreadExecutor();

    // --- PRODUCT CRUD ---

    @PostMapping("/products")
    public ResponseEntity<Product> addProduct(@RequestBody Product product) {
        Product created = productService.createProduct(product);
        retrainExecutor.submit(() -> recommendService.triggerRetrain());
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable String id, @RequestBody Product productDetails) {
        Product updated = productService.updateProduct(id, productDetails);
        retrainExecutor.submit(() -> recommendService.triggerRetrain());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable String id) {
        productService.deleteProduct(id);
        retrainExecutor.submit(() -> recommendService.triggerRetrain());
        return ResponseEntity.noContent().build();
    }

    // --- ORDERS MANAGEMENT ---

    @GetMapping("/orders")
    public ResponseEntity<Page<Order>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status
    ) {
        Pageable pageable = PageRequest.of(page, size);
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(orderRepository.findByStatus(status, pageable));
        }
        return ResponseEntity.ok(orderRepository.findAllByOrderByCreatedAtDesc(pageable));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable String id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null) throw new IllegalArgumentException("Status field is required");
        Order updated = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/orders/{id}/approve-return")
    public ResponseEntity<Order> approveReturn(@PathVariable String id) {
        return ResponseEntity.ok(orderService.processReturn(id, true));
    }

    @PostMapping("/orders/{id}/reject-return")
    public ResponseEntity<Order> rejectReturn(@PathVariable String id) {
        return ResponseEntity.ok(orderService.processReturn(id, false));
    }

    // --- USERS MANAGEMENT ---

    @GetMapping("/users")
    public ResponseEntity<Page<User>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> users = userRepository.findAll(pageable);
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(users);
    }

    public static class CreateAdminRequest {
        @NotBlank(message = "Name is required")
        private String name;
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;
        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    @PostMapping("/users/admin")
    public ResponseEntity<?> createAdmin(@Valid @RequestBody CreateAdminRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return new ResponseEntity<>("Email already in use!", HttpStatus.BAD_REQUEST);
        }
        User admin = User.builder()
                .name(request.getName().trim())
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("ROLE_ADMIN")
                .build();
        userRepository.save(admin);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Admin account created successfully");
        response.put("email", admin.getEmail());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/products/retrain")
    public ResponseEntity<Map<String, String>> retrainProducts() {
        retrainExecutor.submit(() -> recommendService.triggerRetrain());
        Map<String, String> response = new HashMap<>();
        response.put("message", "Retrain triggered successfully");
        return ResponseEntity.ok(response);
    }

    // --- COUPON MANAGEMENT ---

    @GetMapping("/coupons")
    public ResponseEntity<List<Coupon>> getAllCoupons() {
        return ResponseEntity.ok(couponRepository.findAll());
    }

    // --- ANALYTICS DASHBOARD ---

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        Map<String, Object> analytics = new HashMap<>();

        List<Order> orders = orderRepository.findAll();
        List<User> users = userRepository.findAll();
        List<Product> products = productRepository.findAll();
        List<Review> reviews = reviewRepository.findAll();
        List<Payment> payments = paymentRepository.findAll();

        // 1. General Metrics
        long totalOrders = orders.size();
        long totalUsers = users.size();
        long totalProducts = products.size();
        long totalReviews = reviews.size();

        double totalRevenue = orders.stream()
                .filter(o -> "DELIVERED".equalsIgnoreCase(o.getStatus()) || "SHIPPED".equalsIgnoreCase(o.getStatus()) || "CONFIRMED".equalsIgnoreCase(o.getStatus()))
                .mapToDouble(Order::getTotalAmount)
                .sum();

        double totalSales = orders.stream()
                .mapToDouble(Order::getTotalAmount)
                .sum();

        analytics.put("totalOrders", totalOrders);
        analytics.put("totalUsers", totalUsers);
        analytics.put("totalProducts", totalProducts);
        analytics.put("totalReviews", totalReviews);
        analytics.put("totalRevenue", Math.round(totalRevenue * 100.0) / 100.0);
        analytics.put("totalSales", Math.round(totalSales * 100.0) / 100.0);

        // 2. Orders by status
        Map<String, Long> ordersByStatus = orders.stream()
                .collect(Collectors.groupingBy(Order::getStatus, Collectors.counting()));
        analytics.put("ordersByStatus", ordersByStatus);

        // 3. Sentiment distribution
        Map<String, Long> sentimentMap = new HashMap<>();
        sentimentMap.put("POSITIVE", reviews.stream().filter(r -> "POSITIVE".equalsIgnoreCase(r.getSentiment())).count());
        sentimentMap.put("NEUTRAL", reviews.stream().filter(r -> "NEUTRAL".equalsIgnoreCase(r.getSentiment())).count());
        sentimentMap.put("NEGATIVE", reviews.stream().filter(r -> "NEGATIVE".equalsIgnoreCase(r.getSentiment())).count());
        analytics.put("reviewSentimentDistribution", sentimentMap);

        // 4. Low stock inventory warnings
        List<Product> lowStock = products.stream()
                .filter(p -> p.getInventory() != null && p.getInventory() < 10)
                .sorted(Comparator.comparing(Product::getInventory))
                .collect(Collectors.toList());
        analytics.put("lowStockProducts", lowStock);

        // 5. Top popular products
        List<Map<String, Object>> topPopular = products.stream()
                .sorted((p1, p2) -> Integer.compare(p2.getPopularityScore(), p1.getPopularityScore()))
                .limit(5)
                .map(p -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", p.getId());
                    m.put("title", p.getTitle());
                    m.put("popularityScore", p.getPopularityScore());
                    m.put("price", p.getPrice());
                    return m;
                })
                .collect(Collectors.toList());
        analytics.put("popularProducts", topPopular);

        // 6. Sales by Category
        Map<String, Double> salesByCategory = new HashMap<>();
        for (Order o : orders) {
            for (Order.OrderItem item : o.getItems()) {
                Product p = products.stream().filter(pr -> pr.getId().equals(item.getProductId())).findFirst().orElse(null);
                if (p != null) {
                    salesByCategory.merge(p.getCategory(), item.getPrice() * item.getQuantity(), Double::sum);
                }
            }
        }
        analytics.put("salesByCategory", salesByCategory);

        // 7. Monthly sales (last 6 months)
        Map<String, Double> monthlySales = new LinkedHashMap<>();
        java.time.LocalDate now = java.time.LocalDate.now();
        for (int i = 5; i >= 0; i--) {
            java.time.LocalDate monthStart = now.minusMonths(i).withDayOfMonth(1);
            java.time.LocalDate monthEnd = monthStart.plusMonths(1).minusDays(1);
            String monthKey = monthStart.getMonth().toString() + " " + monthStart.getYear();
            double monthTotal = orders.stream()
                    .filter(o -> {
                        java.time.LocalDate od = o.getCreatedAt().toLocalDate();
                        return (od.isEqual(monthStart) || od.isAfter(monthStart)) && (od.isEqual(monthEnd) || od.isBefore(monthEnd));
                    })
                    .mapToDouble(Order::getTotalAmount)
                    .sum();
            monthlySales.put(monthKey, Math.round(monthTotal * 100.0) / 100.0);
        }
        analytics.put("monthlySales", monthlySales);

        // 8. Revenue by payment method
        Map<String, Double> revenueByMethod = orders.stream()
                .filter(o -> o.getPaymentMethod() != null)
                .collect(Collectors.groupingBy(
                    o -> o.getPaymentMethod().equals("COD") ? "COD" : "ONLINE",
                    Collectors.summingDouble(Order::getTotalAmount)
                ));
        analytics.put("revenueByPaymentMethod", revenueByMethod);

        return ResponseEntity.ok(analytics);
    }
}
