package com.friseursalon.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkingHours {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(unique = true, nullable = false) // Jeder Wochentag kann nur einmal vorkommen
    private DayOfWeek dayOfWeek;

    @Column(nullable = true) // Erlaubt null, wenn an diesem Tag geschlossen ist
    private LocalTime startTime;

    @Column(nullable = true) // Erlaubt null, wenn an diesem Tag geschlossen ist
    private LocalTime endTime;

    @Column(nullable = false)
    private boolean isClosed; // True, wenn der Salon an diesem Tag geschlossen ist

    public WorkingHours(DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime, boolean isClosed) {
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.isClosed = isClosed;
    }
}