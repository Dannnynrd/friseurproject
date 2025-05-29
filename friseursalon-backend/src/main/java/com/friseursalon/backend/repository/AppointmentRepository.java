// Datei: friseursalon-backend/src/main/java/com/friseursalon/backend/repository/AppointmentRepository.java
package com.friseursalon.backend.repository;

import com.friseursalon.backend.model.Appointment;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal; // NEU
import java.time.DayOfWeek;
import java.time.LocalDate; // NEU
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

    @Query(value = "SELECT DAY_OF_WEEK(a.start_time) as dayOfWeek, COUNT(a.id) as count " +
            "FROM Appointment a " +
            "WHERE a.start_time >= :start AND a.start_time <= :end " +
            "GROUP BY DAY_OF_WEEK(a.start_time) " +
            "ORDER BY DAY_OF_WEEK(a.start_time) ASC", nativeQuery = true)
    List<Map<String, Object>> countAppointmentsPerDayOfWeekBetweenNative(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);


    @Query("SELECT s.name as serviceName, COUNT(a.id) as count " +
            "FROM Appointment a JOIN a.service s " +
            "WHERE a.startTime >= :start AND a.startTime <= :end " +
            "GROUP BY s.name " +
            "ORDER BY count DESC")
    List<Map<String, Object>> countAppointmentsPerServiceBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    List<Appointment> findByOrderByIdDesc(Pageable pageable);

    // NEU: Query für Umsatz pro Tag im Zeitraum
    @Query(value = "SELECT CAST(a.start_time AS DATE) AS appointment_date, SUM(s.price) AS daily_revenue " +
            "FROM Appointment a JOIN Service s ON a.service_id = s.id " +
            "WHERE a.start_time >= :startDateTime AND a.start_time <= :endDateTime " +
            "GROUP BY CAST(a.start_time AS DATE) " +
            "ORDER BY appointment_date ASC", nativeQuery = true)
    List<Map<String, Object>> findRevenuePerDayBetween(@Param("startDateTime") LocalDateTime startDateTime, @Param("endDateTime") LocalDateTime endDateTime);
}