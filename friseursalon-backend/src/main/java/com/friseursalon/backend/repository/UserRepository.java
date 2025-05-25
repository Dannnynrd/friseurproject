package com.friseursalon.backend.repository;

import com.friseursalon.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    // Findet einen Benutzer anhand seines Benutzernamens
    Optional<User> findByUsername(String username);

    // Prüft, ob ein Benutzer mit diesem Benutzernamen existiert
    Boolean existsByUsername(String username);

    // Prüft, ob ein Benutzer mit dieser E-Mail-Adresse existiert
    Boolean existsByEmail(String email);
}