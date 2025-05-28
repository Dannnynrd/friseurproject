package com.friseursalon.backend.service;

import com.friseursalon.backend.model.Customer; // Import für Customer hinzufügen
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
import com.friseursalon.backend.security.details.UserDetailsImpl;

import java.util.HashSet;
import java.util.Set;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final CustomerService customerService; // CustomerService injizieren

    @Autowired
    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       CustomerService customerService) { // CustomerService im Konstruktor hinzufügen
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.customerService = customerService; // CustomerService zuweisen
    }

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Benutzer nicht gefunden mit E-Mail: " + email));

        return UserDetailsImpl.build(user);
    }

    @Transactional
    public User registerNewUser(String firstName, String lastName, String email, String password, String phoneNumber, Set<String> strRoles) {
        if (userRepository.existsByEmail(email)) {
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
        User savedUser = userRepository.save(user);

        // NEU: Customer-Eintrag erstellen oder finden, nachdem der User gespeichert wurde
        Customer customerDetailsForService = new Customer();
        customerDetailsForService.setFirstName(savedUser.getFirstName());
        customerDetailsForService.setLastName(savedUser.getLastName());
        customerDetailsForService.setEmail(savedUser.getEmail());
        customerDetailsForService.setPhoneNumber(savedUser.getPhoneNumber());
        // Notizen bleiben hier erstmal null, da sie primär vom Admin gepflegt werden.
        // findOrCreateCustomer wird den Kunden anlegen, falls er nicht existiert.
        customerService.findOrCreateCustomer(customerDetailsForService);

        return savedUser;
    }

    public Boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}
