package com.friseursalon.backend.controller;

import com.friseursalon.backend.model.User; // Immer noch benötigt, falls User-Modell an anderer Stelle genutzt wird
import com.friseursalon.backend.payload.request.LoginRequest;
import com.friseursalon.backend.payload.request.SignupRequest;
import com.friseursalon.backend.payload.response.JwtResponse;
import com.friseursalon.backend.payload.response.MessageResponse;
import com.friseursalon.backend.security.jwt.JwtUtils;
import com.friseursalon.backend.service.UserService;
import com.friseursalon.backend.security.details.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtUtils jwtUtils;

    @Autowired
    public AuthController(AuthenticationManager authenticationManager, UserService userService, JwtUtils jwtUtils) {
        this.authenticationManager = authenticationManager;
        this.userService = userService;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/signin") // POST http://localhost:8080/api/auth/signin
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        // Authentifiziere den Benutzer mit Spring Security (Email ist jetzt der 'username')
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())); // Hier email statt username nutzen

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal(); // Cast zu UserDetailsImpl

        String jwt = jwtUtils.generateJwtToken(userDetails);

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        // JwtResponse mit neuen Feldern füllen
        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getEmail(),
                userDetails.getFirstName(), // NEUES FELD
                userDetails.getLastName(),  // NEUES FELD
                userDetails.getPhoneNumber(), // NEUES FELD
                roles));
    }

    @PostMapping("/signup") // POST http://localhost:8080/api/auth/signup
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signupRequest) {
        // Prüfe auf E-Mail-Eindeutigkeit
        if (userService.existsByEmail(signupRequest.getEmail())) { // Prüfen mit existsByEmail
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Fehler: E-Mail ist bereits vergeben!"));
        }

        // Neuen Benutzer registrieren (mit neuen Feldern)
        userService.registerNewUser(
                signupRequest.getFirstName(), // NEUES FELD
                signupRequest.getLastName(),  // NEUES FELD
                signupRequest.getEmail(),
                signupRequest.getPassword(),
                signupRequest.getPhoneNumber(), // NEUES FELD
                signupRequest.getRole()
        );

        return ResponseEntity.ok(new MessageResponse("Benutzer erfolgreich registriert!"));
    }
}