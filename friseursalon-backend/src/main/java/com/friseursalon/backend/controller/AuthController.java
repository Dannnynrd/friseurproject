package com.friseursalon.backend.controller;

import com.friseursalon.backend.model.User; // Dennoch benötigt, falls User-Modell an anderer Stelle genutzt wird
import com.friseursalon.backend.payload.request.LoginRequest;
import com.friseursalon.backend.payload.request.SignupRequest;
import com.friseursalon.backend.payload.response.JwtResponse;
import com.friseursalon.backend.payload.response.MessageResponse;
import com.friseursalon.backend.security.jwt.JwtUtils;
import com.friseursalon.backend.service.UserService;
import com.friseursalon.backend.security.details.UserDetailsImpl; // WICHTIG: DIESEN IMPORT HINZUFÜGEN
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails; // Dennoch benötigt, da authentication.getPrincipal() UserDetails zurückgibt
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

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // HIER DIE KORREKTUR
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal(); // HIER IN UserDetailsImpl CASTEN

        String jwt = jwtUtils.generateJwtToken(userDetails);

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        // JETZT DIREKT AUF DIE GETTER VON USERDETAILSIMPL ZUGREIFEN
        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(), // Direkt auf getId() zugreifen
                userDetails.getUsername(), // Auch hier, direkt auf getUsername() zugreifen
                userDetails.getEmail(), // Direkt auf getEmail() zugreifen
                roles));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signupRequest) {
        if (userService.existsByUsername(signupRequest.getUsername())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Fehler: Benutzername ist bereits vergeben!"));
        }

        if (userService.existsByEmail(signupRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Fehler: E-Mail ist bereits vergeben!"));
        }

        userService.registerNewUser(
                signupRequest.getUsername(),
                signupRequest.getEmail(),
                signupRequest.getPassword(),
                signupRequest.getRole()
        );

        return ResponseEntity.ok(new MessageResponse("Benutzer erfolgreich registriert!"));
    }
}