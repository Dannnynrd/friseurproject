package com.friseursalon.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp; // Import für CreationTimestamp

import java.time.LocalDateTime; // Import für LocalDateTime

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String lastName;

    @Column(unique = true) // E-Mail sollte eindeutig sein für Kunden
    private String email;
    private String phoneNumber; // Optional

    @Column(columnDefinition = "TEXT")
    private String notes;

    // NEU: Registrierungsdatum des Kunden
    @CreationTimestamp // Wird automatisch beim Erstellen gesetzt
    @Column(nullable = false, updatable = false)
    private LocalDateTime registrationDate;
}
