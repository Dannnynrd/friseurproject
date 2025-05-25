package com.friseursalon.backend;

import com.friseursalon.backend.model.ERole;
import com.friseursalon.backend.model.Role;
import com.friseursalon.backend.repository.RoleRepository;
import com.friseursalon.backend.service.UserService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder; // DIESEN IMPORT HINZUFÜGEN!

import java.util.HashSet;
import java.util.Set;

@SpringBootApplication
public class FriseursalonBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(FriseursalonBackendApplication.class, args);
    }

    // CommandLineRunner zum Initialisieren von Rollen und einem Admin-Benutzer
    @Bean
    public CommandLineRunner initData(RoleRepository roleRepository, UserService userService) {
        return args -> {
            if (roleRepository.findByName(ERole.ROLE_USER).isEmpty()) {
                roleRepository.save(new Role(null, ERole.ROLE_USER));
                System.out.println("Rolle ROLE_USER erstellt.");
            }
            if (roleRepository.findByName(ERole.ROLE_ADMIN).isEmpty()) {
                roleRepository.save(new Role(null, ERole.ROLE_ADMIN));
                System.out.println("Rolle ROLE_ADMIN erstellt.");
            }

            if (!userService.existsByUsername("admin")) {
                Set<String> roles = new HashSet<>();
                roles.add("admin");
                userService.registerNewUser("admin", "admin@friseursalon.com", "adminpass", roles);
                System.out.println("Initialer Admin-Benutzer erstellt: admin / adminpass");
            } else {
                System.out.println("Admin-Benutzer existiert bereits.");
            }
        };
    }

    // DIESE TESTMETHODE HINZUFÜGEN ODER AKTIVIEREN!
    @Bean
    public CommandLineRunner testPasswordEncoder(PasswordEncoder passwordEncoder) {
        return args -> {
            String rawPassword = "adminpass";
            String hashedPasswordFromDb = "$2a$10$OgeQqSRlrlatcGNce1KqLuqc6kv/0SXZQH3OfM4um3rp2z6RAG9WC"; // Dein Hash aus der H2-Konsole

            System.out.println("--- PasswordEncoder Test ---");
            System.out.println("Raw Password provided: " + rawPassword);
            System.out.println("Hashed Password from DB: " + hashedPasswordFromDb);
            System.out.println("Does raw password match DB hash? " + passwordEncoder.matches(rawPassword, hashedPasswordFromDb));
            System.out.println("--- End PasswordEncoder Test ---");
        };
    }
}