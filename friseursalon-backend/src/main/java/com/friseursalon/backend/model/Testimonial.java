package com.friseursalon.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Testimonial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "customer_id") // Kann null sein, falls anonyme Bewertung erlaubt oder Name manuell eingegeben wird
    private Customer customer; // Optional: Verknüpfung zum Kunden

    @Column(nullable = true) // Falls kein Customer-Objekt verknüpft ist, wird der Name hier gespeichert
    private String customerName; // Name des Kunden (falls nicht über Customer-Objekt verknüpft oder für Anzeige)

    @NotNull(message = "Bewertung (Rating) darf nicht leer sein.")
    @Min(value = 1, message = "Bewertung muss mindestens 1 sein.")
    @Max(value = 5, message = "Bewertung darf höchstens 5 sein.")
    @Column(nullable = false)
    private Integer rating; // Bewertung von 1 bis 5 Sternen

    @NotBlank(message = "Kommentar darf nicht leer sein.")
    @Column(columnDefinition = "TEXT")
    private String comment;

    @ManyToOne
    @JoinColumn(name = "service_id") // Optional: Für welche Dienstleistung war die Bewertung?
    private Service service;

    private boolean isApproved = false; // Standardmäßig nicht genehmigt

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime submissionDate;

    private LocalDateTime approvalDate; // Wann wurde es genehmigt?
}