package com.friseursalon.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users",
        uniqueConstraints = {
                // @UniqueConstraint(columnNames = "username"), // DIESE ZEILE ENTFERNEN!
                @UniqueConstraint(columnNames = "email") // E-Mail muss eindeutig sein
        })
@Data
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // private String username; // DIESE ZEILE ENTFERNEN! Wir verwenden die E-Mail als "Benutzername" für Login.
    private String email;
    private String password;

    // NEUE FELDER HINZUFÜGEN
    private String firstName;
    private String lastName;
    private String phoneNumber;


    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();

    // Konstruktor für die Registrierung anpassen
    public User(String email, String password, String firstName, String lastName, String phoneNumber) {
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
    }
    // Optional: Einen Konstruktor nur für E-Mail/Passwort, falls benötigt
    public User(String email, String password) {
        this.email = email;
        this.password = password;
    }
}