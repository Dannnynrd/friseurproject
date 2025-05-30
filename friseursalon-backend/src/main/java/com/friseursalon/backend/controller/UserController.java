// src/main/java/com/friseursalon/backend/controller/UserController.java
package com.friseursalon.backend.controller;

import com.friseursalon.backend.model.User;
import com.friseursalon.backend.payload.request.PasswordChangeRequest;
import com.friseursalon.backend.payload.request.ProfileUpdateRequest;
import com.friseursalon.backend.payload.response.MessageResponse;
import com.friseursalon.backend.service.UserService;
import com.friseursalon.backend.security.details.UserDetailsImpl; // Import für UserDetailsImpl
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    // Hilfsmethode, um die ID des authentifizierten Benutzers zu erhalten
    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userDetails.getId();
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateUserProfile(@Valid @RequestBody ProfileUpdateRequest profileUpdateRequest) {
        Long userId = getAuthenticatedUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(new MessageResponse("Benutzer nicht authentifiziert."));
        }

        logger.info("PUT /api/users/profile - Update-Anfrage für Benutzer-ID: {} mit Daten: {}", userId, profileUpdateRequest);

        try {
            User updatedUser = userService.updateUserProfile(userId, profileUpdateRequest);
            // Wichtig: Wir wollen nicht das Passwort oder andere sensible Daten zurückgeben.
            // Erstelle eine UserResponse DTO oder mappe die Felder manuell, wenn nötig.
            // Fürs Erste geben wir eine Erfolgsmeldung und die aktualisierten Felder zurück.
            // Die JWTResponse aus dem Login ist hier nicht passend.
            // Wir könnten auch das UserDetailsImpl Objekt neu bauen und zurückgeben (ohne Passwort).
            UserDetailsImpl userDetails = UserDetailsImpl.build(updatedUser); // Erstellt UserDetails ohne Passwort

            return ResponseEntity.ok(new MessageResponse("Profil erfolgreich aktualisiert."));
            // Besser wäre, nur die aktualisierten, nicht-sensitiven Daten zurückzugeben.
            // return ResponseEntity.ok(new ProfileUpdateResponse(userDetails.getId(), userDetails.getEmail(), userDetails.getFirstName(), userDetails.getLastName(), userDetails.getPhoneNumber()));

        } catch (RuntimeException e) {
            logger.error("Fehler beim Aktualisieren des Profils für Benutzer-ID {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changeUserPassword(@Valid @RequestBody PasswordChangeRequest passwordChangeRequest) {
        Long userId = getAuthenticatedUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(new MessageResponse("Benutzer nicht authentifiziert."));
        }

        logger.info("POST /api/users/change-password - Passwortänderungsanfrage für Benutzer-ID: {}", userId);

        try {
            userService.changeUserPassword(userId, passwordChangeRequest.getCurrentPassword(), passwordChangeRequest.getNewPassword());
            return ResponseEntity.ok(new MessageResponse("Passwort erfolgreich geändert."));
        } catch (RuntimeException e) {
            logger.error("Fehler beim Ändern des Passworts für Benutzer-ID {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }
}