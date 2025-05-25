package com.friseursalon.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration // Markiert diese Klasse als eine Spring-Konfigurationsklasse
public class PasswordEncoderConfig {

    @Bean // Markiert diese Methode als Bean-Definition
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // Verwendet BCrypt für sicheres Passwort-Hashing
    }
}