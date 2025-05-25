package com.friseursalon.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users", // Wichtig: "user" ist ein reserviertes Wort in einigen Datenbanken
        uniqueConstraints = {
                @UniqueConstraint(columnNames = "username"), // Benutzername muss eindeutig sein
                @UniqueConstraint(columnNames = "email") // E-Mail muss eindeutig sein
        })
@Data
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String email;
    private String password; // Passwort (gehasht)

    @ManyToMany(fetch = FetchType.LAZY) // Lazy-Laden der Rollen
    @JoinTable(name = "user_roles", // Name der Join-Tabelle für die Many-to-Many-Beziehung
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>(); // Menge von Rollen für diesen Benutzer

    // Konstruktor für die Registrierung (ohne ID und Rollen)
    public User(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
    }
}