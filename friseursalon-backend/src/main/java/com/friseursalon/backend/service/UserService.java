package com.friseursalon.backend.service;

import com.friseursalon.backend.model.ERole;
import com.friseursalon.backend.model.Role;
import com.friseursalon.backend.model.User;
import com.friseursalon.backend.repository.RoleRepository;
import com.friseursalon.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.friseursalon.backend.security.details.UserDetailsImpl; // Wichtiger Import für deine Custom UserDetails

import java.util.HashSet;
import java.util.Set;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Benutzer nicht gefunden mit Benutzername: " + username));

        // Hier wird ausschließlich dein benutzerdefiniertes UserDetails-Objekt zurückgegeben.
        return UserDetailsImpl.build(user);
    }

    @Transactional
    public User registerNewUser(String username, String email, String password, Set<String> strRoles) {
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Fehler: Benutzername ist bereits vergeben!");
        }

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Fehler: E-Mail ist bereits vergeben!");
        }

        // DIESE ZEILE SOLLTE ZEILE 41 SEIN, WENN DIE KOMMENTARE KORREKT SIND
        User user = new User(username, email, passwordEncoder.encode(password));

        Set<Role> roles = new HashSet<>();

        if (strRoles == null || strRoles.isEmpty()) {
            Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                    .orElseThrow(() -> new RuntimeException("Fehler: Rolle ROLE_USER nicht gefunden."));
            roles.add(userRole);
        } else {
            strRoles.forEach(role -> {
                switch (role) {
                    case "admin":
                        Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                                .orElseThrow(() -> new RuntimeException("Fehler: Rolle ROLE_ADMIN nicht gefunden."));
                        roles.add(adminRole);
                        break;
                    case "user":
                        Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                                .orElseThrow(() -> new RuntimeException("Fehler: Rolle ROLE_USER nicht gefunden."));
                        roles.add(userRole);
                        break;
                    default:
                        throw new RuntimeException("Fehler: Rolle " + role + " nicht gefunden.");
                }
            });
        }

        user.setRoles(roles);
        return userRepository.save(user);
    }

    public Boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    public Boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}