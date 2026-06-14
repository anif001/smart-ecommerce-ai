package com.ecommerce.config;

import com.ecommerce.model.Product;
import com.ecommerce.model.Review;
import com.ecommerce.model.User;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ReviewRepository;
import com.ecommerce.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseSeeder.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User adminUser;
    private User normalUser;

    @Override
    public void run(String... args) throws Exception {
        seedUsers();
        seedProducts();
    }

    private void seedUsers() {
        if (userRepository.count() == 0) {
            logger.info("Seeding default users...");

            adminUser = User.builder()
                    .name("System Administrator")
                    .email("admin@ecommerce.com")
                    .password(passwordEncoder.encode("adminpassword"))
                    .role("ROLE_ADMIN")
                    .createdAt(LocalDateTime.now())
                    .build();

            normalUser = User.builder()
                    .name("John Doe")
                    .email("user@ecommerce.com")
                    .password(passwordEncoder.encode("userpassword"))
                    .role("ROLE_USER")
                    .createdAt(LocalDateTime.now())
                    .build();

            userRepository.save(adminUser);
            userRepository.save(normalUser);
            logger.info("Default users seeded: admin@ecommerce.com / adminpassword, user@ecommerce.com / userpassword");
        } else {
            adminUser = userRepository.findByEmail("admin@ecommerce.com").orElse(null);
            normalUser = userRepository.findByEmail("user@ecommerce.com").orElse(null);
        }
    }

    private void seedProducts() {
        if (productRepository.count() == 0) {
            logger.info("Seeding default products catalog...");

            Product p1 = Product.builder()
                    .title("Logitech G502 Hero Gaming Mouse")
                    .category("Electronics")
                    .description("High performance gaming mouse with 25K DPI sensor, customizable weight, and RGB lighting. Perfect for pro gamers.")
                    .price(79.99)
                    .images(java.util.Arrays.asList("https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500"))
                    .inventory(25)
                    .tags(Arrays.asList("gaming", "mouse", "electronics", "logitech", "pc"))
                    .popularityScore(45)
                    .createdAt(LocalDateTime.now().minusDays(10))
                    .build();

            Product p2 = Product.builder()
                    .title("Razer BlackWidow V4 Mechanical Keyboard")
                    .category("Electronics")
                    .description("Tactile green switches, chroma RGB, and dedicated macro keys. High performance gaming keyboard.")
                    .price(169.99)
                    .images(java.util.Arrays.asList("https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500"))
                    .inventory(15)
                    .tags(Arrays.asList("gaming", "keyboard", "razer", "mechanical", "pc"))
                    .popularityScore(32)
                    .createdAt(LocalDateTime.now().minusDays(9))
                    .build();

            Product p3 = Product.builder()
                    .title("Sony WH-1000XM4 Noise Canceling Headphones")
                    .category("Electronics")
                    .description("Over-ear wireless headphones with industry-leading active noise canceling, mic, and Alexa voice control.")
                    .price(348.00)
                    .images(java.util.Arrays.asList("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"))
                    .inventory(30)
                    .tags(Arrays.asList("headphones", "audio", "wireless", "sony", "bluetooth"))
                    .popularityScore(67)
                    .createdAt(LocalDateTime.now().minusDays(8))
                    .build();

            Product p4 = Product.builder()
                    .title("Apple iPad Air (5th Generation)")
                    .category("Electronics")
                    .description("10.9-inch liquid retina display, M1 chip, 64GB storage, Wi-Fi 6, 12MP camera. Thin and light tablet.")
                    .price(599.00)
                    .images(java.util.Arrays.asList("https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500"))
                    .inventory(20)
                    .tags(Arrays.asList("apple", "ipad", "tablet", "ios", "electronics"))
                    .popularityScore(55)
                    .createdAt(LocalDateTime.now().minusDays(7))
                    .build();

            Product p5 = Product.builder()
                    .title("Nike Air Max 270 Men's Running Shoes")
                    .category("Fashion")
                    .description("Comfortable running shoes with breathable mesh upper, signature large air unit, and durable rubber sole.")
                    .price(150.00)
                    .images(java.util.Arrays.asList("https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"))
                    .inventory(40)
                    .tags(Arrays.asList("shoes", "nike", "running", "fashion", "sneakers"))
                    .popularityScore(28)
                    .createdAt(LocalDateTime.now().minusDays(6))
                    .build();

            Product p6 = Product.builder()
                    .title("Adidas Ultraboost Light Running Shoes")
                    .category("Fashion")
                    .description("Lightweight shoes featuring boost cushioning energy return, primeknit upper, and sustainable materials.")
                    .price(190.00)
                    .images(java.util.Arrays.asList("https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500"))
                    .inventory(18)
                    .tags(Arrays.asList("shoes", "adidas", "running", "fashion", "boost"))
                    .popularityScore(12)
                    .createdAt(LocalDateTime.now().minusDays(5))
                    .build();

            Product p7 = Product.builder()
                    .title("Ergonomic Office Chair with Lumbar Support")
                    .category("Home & Kitchen")
                    .description("Mesh desk chair with adjustable 3D armrests, headrest, dynamic tilt mechanism, and wheels. Perfect for home office.")
                    .price(249.99)
                    .images(java.util.Arrays.asList("https://images.unsplash.com/photo-1580481072645-022f9a6dbf27?w=500"))
                    .inventory(8) // Low stock to trigger alert!
                    .tags(Arrays.asList("furniture", "chair", "office", "home", "ergonomic"))
                    .popularityScore(19)
                    .createdAt(LocalDateTime.now().minusDays(4))
                    .build();

            Product p8 = Product.builder()
                    .title("Instant Pot Duo Plus 9-in-1 Cooker")
                    .category("Home & Kitchen")
                    .description("Multi-use electric pressure cooker, slow cooker, rice cooker, steamer, sauté pan, and yogurt maker. 6 Quart capacity.")
                    .price(129.99)
                    .images(java.util.Arrays.asList("https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=500"))
                    .inventory(12)
                    .tags(Arrays.asList("kitchen", "cooker", "appliance", "home", "cooking"))
                    .popularityScore(24)
                    .createdAt(LocalDateTime.now().minusDays(3))
                    .build();

            productRepository.saveAll(Arrays.asList(p1, p2, p3, p4, p5, p6, p7, p8));
            logger.info("Products catalog seeded with 8 initial products.");

            String adminId = adminUser != null ? adminUser.getId() : "unknown";
            String userId = normalUser != null ? normalUser.getId() : "unknown";

            Review r1 = Review.builder()
                    .userId(adminId)
                    .userName("System Administrator")
                    .productId(p1.getId())
                    .rating(5)
                    .comment("Absolutely love this gaming mouse! Extremely responsive, great customizable weight weights and gorgeous RGB. High quality stuff.")
                    .sentiment("POSITIVE")
                    .confidenceScore(0.98)
                    .createdAt(LocalDateTime.now().minusDays(5))
                    .build();

            Review r2 = Review.builder()
                    .userId(userId)
                    .userName("John Doe")
                    .productId(p1.getId())
                    .rating(2)
                    .comment("Terrible software, custom weights keep rattling inside. Very disappointed.")
                    .sentiment("NEGATIVE")
                    .confidenceScore(0.95)
                    .createdAt(LocalDateTime.now().minusDays(4))
                    .build();

            Review r3 = Review.builder()
                    .userId(userId)
                    .userName("John Doe")
                    .productId(p3.getId())
                    .rating(5)
                    .comment("The active noise canceling is fantastic! Very comfortable for long flights. Sony did an amazing job.")
                    .sentiment("POSITIVE")
                    .confidenceScore(0.99)
                    .createdAt(LocalDateTime.now().minusDays(2))
                    .build();

            reviewRepository.saveAll(Arrays.asList(r1, r2, r3));
            logger.info("Initial review logs seeded.");

            // Update average ratings on products
            p1.setAverageRating(3.5);
            p3.setAverageRating(5.0);
            productRepository.save(p1);
            productRepository.save(p3);
        }
    }
}
