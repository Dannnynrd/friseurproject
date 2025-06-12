// friseursalon-backend/src/main/java/com/friseursalon/backend/controller/AuthController.java
package com.friseursalon.backend.controller;

import com.friseursalon.backend.model.User;
import com.friseursalon.backend.payload.request.ForgotPasswordRequest;
import com.friseursalon.backend.payload.request.LoginRequest;
import com.friseursalon.backend.payload.request.ResetPasswordRequest;
import com.friseursalon.backend.payload.request.SignupRequest;
import com.friseursalon.backend.payload.response.JwtResponse;
import com.friseursalon.backend.payload.response.MessageResponse;
import com.friseursalon.backend.security.jwt.JwtUtils;
import com.friseursalon.backend.service.EmailService;
import com.friseursalon.backend.service.UserService;
import com.friseursalon.backend.security.details.UserDetailsImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final EmailService emailService;
    private final JwtUtils jwtUtils;

    @Value("${frontend.base-url}")
    private String frontendBaseUrl;

    @Autowired
    public AuthController(AuthenticationManager authenticationManager, UserService userService, JwtUtils jwtUtils, EmailService emailService) {
        this.authenticationManager = authenticationManager;
        this.userService = userService;
        this.jwtUtils = jwtUtils;
        this.emailService = emailService;
    }

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String jwt = jwtUtils.generateJwtToken(userDetails);

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getEmail(),
                userDetails.getFirstName(),
                userDetails.getLastName(),
                userDetails.getPhoneNumber(),
                roles));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signupRequest) {
        if (userService.existsByEmail(signupRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Fehler: E-Mail ist bereits vergeben!"));
        }

        userService.registerNewUser(
                signupRequest.getFirstName(),
                signupRequest.getLastName(),
                signupRequest.getEmail(),
                signupRequest.getPassword(),
                signupRequest.getPhoneNumber(),
                signupRequest.getRole()
        );

        return ResponseEntity.ok(new MessageResponse("Benutzer erfolgreich registriert!"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest forgotPasswordRequest) {
        String token = userService.createPasswordResetTokenForUser(forgotPasswordRequest.getEmail());
        if (token != null) {
            try {
                emailService.sendPasswordResetEmail(forgotPasswordRequest.getEmail(), token, frontendBaseUrl);
            } catch (Exception e) {
                logger.error("Fehler beim Senden der Passwort-Reset E-Mail an {}: {}", forgotPasswordRequest.getEmail(), e.getMessage());
                // Wir senden trotzdem eine Erfolgsmeldung, um keine Informationen über die User-Existenz preiszugeben
            }
        }
        return ResponseEntity.ok(new MessageResponse("Wenn Ihre E-Mail-Adresse in unserem System existiert, haben Sie eine E-Mail zum Zurücksetzen Ihres Passworts erhalten."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest resetPasswordRequest) {
        Optional<User> userOptional = userService.getUserByPasswordResetToken(resetPasswordRequest.getToken());

        if (userOptional.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Ungültiger oder abgelaufener Link zum Zurücksetzen des Passworts."));
        }

        User user = userOptional.get();
        if (user.getResetTokenExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Der Link zum Zurücksetzen des Passworts ist abgelaufen. Bitte fordern Sie einen neuen an."));
        }

        userService.changeUserPasswordByToken(user, resetPasswordRequest.getNewPassword());
        return ResponseEntity.ok(new MessageResponse("Ihr Passwort wurde erfolgreich zurückgesetzt."));
    }
}