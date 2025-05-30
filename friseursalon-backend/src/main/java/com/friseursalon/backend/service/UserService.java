// src/main/java/com/friseursalon/backend/service/UserService.java
package com.friseursalon.backend.service;

import com.friseursalon.backend.model.Customer; // Import für Customer hinzufügen
import com.friseursalon.backend.model.ERole;
import com.friseursalon.backend.model.Role;
import com.friseursalon.backend.model.User;
import com.friseursalon.backend.payload.request.ProfileUpdateRequest; // NEU
import com.friseursalon.backend.repository.RoleRepository;
import com.friseursalon.backend.repository.UserRepository;
import com.friseursalon.backend.repository.CustomerRepository; // NEU
import org.slf4j.Logger; // NEU
import org.slf4j.LoggerFactory; // NEU
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.friseursalon.backend.security.details.UserDetailsImpl;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
public class UserService implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class); // NEU

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final CustomerService customerService;
    private final CustomerRepository customerRepository; // NEU hinzugefügt für direkten Zugriff

    @Autowired
    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       CustomerService customerService,
                       CustomerRepository customerRepository) { // NEU: customerRepository
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.customerService = customerService;
        this.customerRepository = customerRepository; // NEU
    }

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.warn("Benutzer nicht gefunden mit E-Mail: {}", email);
                    return new UsernameNotFoundException("Benutzer nicht gefunden mit E-Mail: " + email);
                });
        return UserDetailsImpl.build(user);
    }

    @Transactional
    public User registerNewUser(String firstName, String lastName, String email, String password, String phoneNumber, Set<String> strRoles) {
        logger.info("Registriere neuen Benutzer mit E-Mail: {}", email);
        if (userRepository.existsByEmail(email)) {
            logger.warn("Registrierungsversuch für bereits existierende E-Mail: {}", email);
            throw new RuntimeException("Fehler: E-Mail ist bereits vergeben!");
        }

        User user = new User(email, passwordEncoder.encode(password), firstName, lastName, phoneNumber);

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
                    case "user": // Fallback auf USER, falls nicht spezifiziert
                    default:
                        Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                                .orElseThrow(() -> new RuntimeException("Fehler: Rolle ROLE_USER nicht gefunden."));
                        roles.add(userRole);
                        break;
                }
            });
        }
        user.setRoles(roles);
        User savedUser = userRepository.save(user);
        logger.info("Benutzer {} erfolgreich gespeichert mit ID: {}", email, savedUser.getId());

        // Customer-Eintrag erstellen oder finden
        Customer customerDetailsForService = new Customer();
        customerDetailsForService.setFirstName(savedUser.getFirstName());
        customerDetailsForService.setLastName(savedUser.getLastName());
        customerDetailsForService.setEmail(savedUser.getEmail());
        customerDetailsForService.setPhoneNumber(savedUser.getPhoneNumber());
        customerService.findOrCreateCustomer(customerDetailsForService);
        logger.info("Customer-Eintrag für {} sichergestellt.", email);

        return savedUser;
    }

    public Boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Transactional
    public User updateUserProfile(Long userId, ProfileUpdateRequest profileUpdateRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.warn("Benutzer für Profilupdate nicht gefunden. ID: {}", userId);
                    return new RuntimeException("Benutzer nicht gefunden.");
                });

        user.setFirstName(profileUpdateRequest.getFirstName());
        user.setLastName(profileUpdateRequest.getLastName());
        user.setPhoneNumber(profileUpdateRequest.getPhoneNumber());
        User updatedUser = userRepository.save(user);
        logger.info("Benutzerprofil für ID {} aktualisiert.", userId);

        // Auch den Customer-Eintrag aktualisieren
        Optional<Customer> customerOpt = customerRepository.findByEmail(user.getEmail());
        if (customerOpt.isPresent()) {
            Customer customer = customerOpt.get();
            customer.setFirstName(updatedUser.getFirstName());
            customer.setLastName(updatedUser.getLastName());
            customer.setPhoneNumber(updatedUser.getPhoneNumber());
            customerRepository.save(customer);
            logger.info("Zugehöriger Customer-Eintrag für E-Mail {} aktualisiert.", user.getEmail());
        } else {
            // Sollte nicht passieren, wenn Customer bei User-Registrierung erstellt wird, aber als Fallback:
            logger.warn("Kein zugehöriger Customer-Eintrag für E-Mail {} bei Profilupdate gefunden. Erstelle neuen.", user.getEmail());
            Customer newCustomer = new Customer();
            newCustomer.setFirstName(updatedUser.getFirstName());
            newCustomer.setLastName(updatedUser.getLastName());
            newCustomer.setEmail(updatedUser.getEmail());
            newCustomer.setPhoneNumber(updatedUser.getPhoneNumber());
            customerRepository.save(newCustomer);
        }
        return updatedUser;
    }

    @Transactional
    public void changeUserPassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.warn("Benutzer für Passwortänderung nicht gefunden. ID: {}", userId);
                    return new RuntimeException("Benutzer nicht gefunden.");
                });

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            logger.warn("Ungültiges aktuelles Passwort für Benutzer-ID {}.", userId);
            throw new RuntimeException("Ungültiges aktuelles Passwort.");
        }
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            logger.warn("Neues Passwort ist identisch mit dem alten Passwort für Benutzer-ID {}.", userId);
            throw new RuntimeException("Das neue Passwort darf nicht mit dem alten Passwort identisch sein.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        logger.info("Passwort für Benutzer-ID {} erfolgreich geändert.", userId);
    }
}