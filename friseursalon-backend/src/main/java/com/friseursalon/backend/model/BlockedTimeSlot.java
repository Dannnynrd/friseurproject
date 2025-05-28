package com.friseursalon.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlockedTimeSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String description;

    @Column(nullable = true)
    private LocalDate specificDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private DayOfWeek recurringDayOfWeek;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private boolean repeating; // <<<--- UM BENANNT VON isRecurring

    // Lombok @Data generiert getRepeating() und setRepeating()

    // Konstruktor für einmalige Blockaden
    public BlockedTimeSlot(String description, LocalDate specificDate, LocalTime startTime, LocalTime endTime) {
        this.description = description;
        this.specificDate = specificDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.repeating = false; // <<<--- Angepasst
    }

    // Konstruktor für wiederkehrende Blockaden
    public BlockedTimeSlot(String description, DayOfWeek recurringDayOfWeek, LocalTime startTime, LocalTime endTime) {
        this.description = description;
        this.recurringDayOfWeek = recurringDayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.repeating = true; // <<<--- Angepasst
    }
}