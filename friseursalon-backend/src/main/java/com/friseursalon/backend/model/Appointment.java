package com.friseursalon.backend.model;

import jakarta.persistence.*; // Für alle JPA-Annotationen
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

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

    // Endzeitpunkt des Termins (wird oft aus startTime + Service.durationMinutes berechnet)
    // private LocalDateTime endTime; // Könnte hinzugefügt werden, wenn nötig

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
}