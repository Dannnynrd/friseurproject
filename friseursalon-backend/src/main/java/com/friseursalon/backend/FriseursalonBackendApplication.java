package com.friseursalon.backend;

import com.friseursalon.backend.model.ERole;
import com.friseursalon.backend.model.Role;
import com.friseursalon.backend.repository.RoleRepository;
import com.friseursalon.backend.service.UserService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
// Import für DayOfWeek und LocalTime, falls noch nicht vorhanden
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;
// Import für WorkingHoursService
import com.friseursalon.backend.service.WorkingHoursService;


@SpringBootApplication
public class FriseursalonBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(FriseursalonBackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(RoleRepository roleRepository, UserService userService, WorkingHoursService workingHoursService) {
        return args -> {
            // Rollen erstellen, falls sie noch nicht existieren
            if (roleRepository.findByName(ERole.ROLE_USER).isEmpty()) {
                roleRepository.save(new Role(null, ERole.ROLE_USER));
                System.out.println("Rolle ROLE_USER erstellt.");
            }
            if (roleRepository.findByName(ERole.ROLE_ADMIN).isEmpty()) {
                roleRepository.save(new Role(null, ERole.ROLE_ADMIN));
                System.out.println("Rolle ROLE_ADMIN erstellt.");
            }

            // Admin-Benutzer erstellen, falls er noch nicht existiert
            if (!userService.existsByEmail("admin@friseursalon.com")) {
                Set<String> roles = new HashSet<>();
                roles.add("admin");
                userService.registerNewUser("Admin", "User", "admin@friseursalon.com", "adminpass", "0123456789", roles);
                System.out.println("Initialer Admin-Benutzer erstellt: admin@friseursalon.com / adminpass");
            } else {
                System.out.println("Admin-Benutzer existiert bereits.");
            }

            // Standard-Arbeitszeiten initialisieren, falls noch nicht vorhanden
            System.out.println("Prüfe und initialisiere Standard-Arbeitszeiten...");
            for (DayOfWeek day : DayOfWeek.values()) {
                if (workingHoursService.getWorkingHoursForDay(day).isEmpty()) {
                    boolean isClosed = (day == DayOfWeek.SUNDAY || day == DayOfWeek.MONDAY);
                    LocalTime startTime = isClosed ? null : LocalTime.of(9, 0);
                    LocalTime endTime = isClosed ? null : LocalTime.of(18, 0);
                    workingHoursService.setWorkingHours(day, startTime, endTime, isClosed);
                    System.out.println("Standard-Arbeitszeit für " + day + " erstellt: " +
                            (isClosed ? "Geschlossen" : startTime + " - " + endTime));
                }
            }
            System.out.println("Initialisierung der Arbeitszeiten abgeschlossen.");
        };
    }
    // Die Methode testPasswordEncoder wurde entfernt, falls sie nicht mehr benötigt wird.
    // Falls doch, kann sie hier wieder eingefügt werden.
} // Diese schließende Klammer beendet die Klasse FriseursalonBackendApplication