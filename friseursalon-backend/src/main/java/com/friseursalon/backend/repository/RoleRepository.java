package com.friseursalon.backend.repository;

import com.friseursalon.backend.model.ERole;
import com.friseursalon.backend.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    // Findet eine Rolle anhand ihres Namens (z.B. ROLE_ADMIN)
    Optional<Role> findByName(ERole name);
}