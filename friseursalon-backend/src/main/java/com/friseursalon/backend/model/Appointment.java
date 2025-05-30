package com.friseursalon.backend.model;

import jakarta.persistence.*; // Für alle JPA-Annotationen
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp; // Import für CreationTimestamp

import java.time.LocalDateTime; // Für Datum und Uhrzeit

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Startzeitpunkt des Termins (Datum und Uhrzeit)
    private LocalDateTime startTime;

    // Verknüpfung zur gebuchten Dienstleistung
    @ManyToOne // Viele Termine können zu einer Dienstleistung gehören
    @JoinColumn(name = "service_id") // Name der Fremdschlüsselspalte in der Appointment-Tabelle
    private Service service;

    // Verknüpfung zum buchenden Kunden
    @ManyToOne // Viele Termine können von einem Kunden gebucht werden
    @JoinColumn(name = "customer_id") // Name der Fremdschlüsselspalte
    private Customer customer;

    // Zusätzliche Notizen zum Termin (optional)
    private String notes;

    // NEU: Zeitpunkt der Terminerstellung
    @CreationTimestamp // Wird automatisch beim Erstellen gesetzt
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // NEU: Status des Termins
    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = true) // Nullable, falls ein Standardstatus beim Erstellen gesetzt wird oder noch nicht relevant ist
    private AppointmentStatus status;
}
