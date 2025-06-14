package com.friseursalon.backend.config;

import com.friseursalon.backend.service.UserService;
import com.friseursalon.backend.security.jwt.AuthEntryPointJwt;
import com.friseursalon.backend.security.jwt.AuthTokenFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final AuthEntryPointJwt unauthorizedHandler;
    private final AuthTokenFilter authTokenFilter;

    @Autowired
    public SecurityConfig(UserService userService, PasswordEncoder passwordEncoder,
                          AuthEntryPointJwt unauthorizedHandler, AuthTokenFilter authTokenFilter) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.unauthorizedHandler = unauthorizedHandler;
        this.authTokenFilter = authTokenFilter;
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    // KORREKTUR: AuthenticationManager als Bean bereitstellen.
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://localhost:3001")); // Frontend-URLs
        config.addAllowedHeader("*");
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Öffentliche Endpunkte
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/hello").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/services/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/workinghours/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/appointments/available-slots").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/appointments").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/testimonials/approved").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/testimonials/submit-guest").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()

                        // Benutzer-spezifische Endpunkte
                        .requestMatchers(HttpMethod.GET, "/api/users/me").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/appointments/my-appointments").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/testimonials/submit").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/users/profile").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/users/change-password").hasAnyRole("USER", "ADMIN")

                        // Admin-spezifische Endpunkte
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/statistics/**").hasRole("ADMIN")
                        .requestMatchers("/api/customers/**").hasRole("ADMIN")
                        .requestMatchers("/api/users/**").hasRole("ADMIN")
                        .requestMatchers("/api/blockedtimeslots/**").hasRole("ADMIN")
                        .requestMatchers("/api/testimonials/admin/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/services").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/services/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/services/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/workinghours").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/workinghours/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/appointments").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/appointments/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/appointments/**").hasRole("ADMIN")

                        .anyRequest().authenticated()
                );

        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(authTokenFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
