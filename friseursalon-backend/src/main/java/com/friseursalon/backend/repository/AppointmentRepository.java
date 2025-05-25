package com.friseursalon.backend.repository;

import com.friseursalon.backend.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    // Hier können wir spezifische Abfragen hinzufügen, um Terminkonflikte zu finden oder Termine für einen bestimmten Zeitraum abzurufen.

    // Beispiel: Findet alle Termine, die sich mit einem gegebenen Zeitraum überschneiden
    List<Appointment> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);

    // Findet alle Termine nach einem bestimmten Startzeitpunkt
    List<Appointment> findByStartTimeAfterOrderByStartTimeAsc(LocalDateTime startTime);
}