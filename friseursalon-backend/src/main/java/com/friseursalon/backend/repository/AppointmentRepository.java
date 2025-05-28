// src/main/java/com/friseursalon/backend/repository/AppointmentRepository.java
package com.friseursalon.backend.repository;

import com.friseursalon.backend.model.Appointment;
import com.friseursalon.backend.model.Service; // Import Service if not already present
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.DayOfWeek; // Import DayOfWeek if not already present
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);

    List<Appointment> findByStartTimeAfterOrderByStartTimeAsc(LocalDateTime startTime);

    List<Appointment> findByCustomerEmailOrderByStartTimeAsc(String email);

    @Query("SELECT a FROM Appointment a WHERE " +
            "(:excludeId IS NULL OR a.id <> :excludeId) AND " +
            "a.startTime < :proposedEnd AND " +
            "FUNCTION('TIMESTAMPADD', MINUTE, a.service.durationMinutes, a.startTime) > :proposedStart")
    List<Appointment> findConflictingAppointments(
            @Param("proposedStart") LocalDateTime proposedStart,
            @Param("proposedEnd") LocalDateTime proposedEnd,
            @Param("excludeId") Long excludeId
    );

    Long countByStartTimeBetween(LocalDateTime start, LocalDateTime end);
    Long countByStartTimeAfter(LocalDateTime start);

    @Query("SELECT a FROM Appointment a WHERE a.startTime >= :startOfDay AND a.startTime < :endOfDayPlusBuffer ORDER BY a.startTime ASC")
    List<Appointment> findUpcomingAppointmentsForNextDays(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDayPlusBuffer") LocalDateTime endOfDayPlusBuffer);

    // NEUE METHODEN FÜR ERWEITERTE STATISTIKEN
    // Anpassung für H2: DAY_OF_WEEK gibt Sonntag=1 bis Samstag=7 zurück.
    // Wir müssen dies später im Service anpassen, um Montag=1 zu bekommen, falls nötig.
    @Query(value = "SELECT DAY_OF_WEEK(a.start_time) as dayOfWeek, COUNT(a.id) as count " +
            "FROM Appointment a " +
            "WHERE a.start_time >= :start AND a.start_time <= :end " +
            "GROUP BY DAY_OF_WEEK(a.start_time) " +
            "ORDER BY DAY_OF_WEEK(a.start_time) ASC", nativeQuery = true)
    List<Map<String, Object>> countAppointmentsPerDayOfWeekBetweenNative(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);


    @Query("SELECT s.name as serviceName, COUNT(a.id) as count " + // Verwende a.id für count
            "FROM Appointment a JOIN a.service s " +
            "WHERE a.startTime >= :start AND a.startTime <= :end " +
            "GROUP BY s.name " +
            "ORDER BY count DESC")
    List<Map<String, Object>> countAppointmentsPerServiceBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

}