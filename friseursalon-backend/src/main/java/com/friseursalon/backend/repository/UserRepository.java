// friseursalon-backend/src/main/java/com/friseursalon/backend/repository/UserRepository.java
package com.friseursalon.backend.repository;

import com.friseursalon.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    // NEU: Methode, um User via Reset-Token zu finden
    Optional<User> findByResetToken(String resetToken);

    Boolean existsByEmail(String email);
}