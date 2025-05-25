package com.friseursalon.backend.repository;

import com.friseursalon.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    // Findet einen Benutzer anhand seiner E-Mail-Adresse (die jetzt der "Benutzername" ist)
    Optional<User> findByEmail(String email); // Änderung von findByUsername zu findByEmail

    // Prüft, ob ein Benutzer mit dieser E-Mail-Adresse existiert
    Boolean existsByEmail(String email); // Diese Methode bleibt, ist aber jetzt unser Haupt-Check

    // Entferne existsByUsername, da username nicht mehr im Model ist
    // Boolean existsByUsername(String username); // DIESE ZEILE ENTFERNEN!
}