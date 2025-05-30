package com.friseursalon.backend.repository;

import com.friseursalon.backend.model.Appointment;
import com.friseursalon.backend.model.AppointmentStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
            "AND (a.status IS NULL OR a.status <> 'CANCELLED') " +
            "GROUP BY DAY_OF_WEEK(a.start_time) " +
            "ORDER BY DAY_OF_WEEK(a.start_time) ASC", nativeQuery = true)
    List<Map<String, Object>> countAppointmentsPerDayOfWeekBetweenNative(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);


    @Query("SELECT s.name as serviceName, COUNT(a.id) as count " +
            "FROM Appointment a JOIN a.service s " +
            "WHERE a.startTime >= :start AND a.startTime <= :end " +
            "AND (a.status IS NULL OR a.status <> com.friseursalon.backend.model.AppointmentStatus.CANCELLED) " +
            "GROUP BY s.name " +
            "ORDER BY count DESC")
    List<Map<String, Object>> countAppointmentsPerServiceBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    List<Appointment> findByOrderByIdDesc(Pageable pageable);

    @Query(value = "SELECT CAST(a.start_time AS DATE) AS appointment_date, SUM(s.price) AS daily_revenue " +
            "FROM Appointment a JOIN Service s ON a.service_id = s.id " +
            "WHERE a.start_time >= :startDateTime AND a.start_time <= :endDateTime " +
            "AND (a.status IS NULL OR a.status <> 'CANCELLED') " +
            "GROUP BY CAST(a.start_time AS DATE) " +
            "ORDER BY appointment_date ASC", nativeQuery = true)
    List<Map<String, Object>> findRevenuePerDayBetween(@Param("startDateTime") LocalDateTime startDateTime, @Param("endDateTime") LocalDateTime endDateTime);

    @Query("SELECT COUNT(DISTINCT a.customer.id) FROM Appointment a WHERE a.startTime >= :start AND a.startTime <= :end AND (a.status IS NULL OR a.status <> com.friseursalon.backend.model.AppointmentStatus.CANCELLED)")
    Long countDistinctCustomersByStartTimeBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT SUM(a.service.durationMinutes) FROM Appointment a WHERE a.startTime >= :start AND a.startTime <= :end AND (a.status IS NULL OR a.status <> com.friseursalon.backend.model.AppointmentStatus.CANCELLED)")
    Long sumDurationMinutesByStartTimeBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(a.id) FROM Appointment a WHERE a.createdAt >= :startOfDay AND a.createdAt < :endOfDayPlusOne")
    Long countNewAppointmentsCreatedBetween(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDayPlusOne") LocalDateTime endOfDayPlusOne);

    @Query("SELECT COUNT(a.id) FROM Appointment a WHERE a.startTime >= :start AND a.startTime <= :end AND a.status = :status")
    Long countAppointmentsByStatusBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, @Param("status") AppointmentStatus status);

    @Query("SELECT AVG(CAST(FUNCTION('DATEDIFF', DAY, a.createdAt, a.startTime) AS DOUBLE)) FROM Appointment a WHERE a.startTime >= :start AND a.startTime <= :end AND a.createdAt IS NOT NULL AND a.startTime > a.createdAt AND (a.status IS NULL OR a.status <> com.friseursalon.backend.model.AppointmentStatus.CANCELLED)")
    Double getAverageBookingLeadTimeInDays(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT DISTINCT a.customer.id FROM Appointment a WHERE a.startTime >= :start AND a.startTime <= :end AND (a.status IS NULL OR a.status <> com.friseursalon.backend.model.AppointmentStatus.CANCELLED)")
    List<Long> findDistinctCustomerIdsWithAppointmentsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // KORRIGIERTE QUERY für Termine pro Stunde
    @Query(value = "SELECT HOUR(a.start_time) as appointment_hour, COUNT(a.id) as appointment_count " + // Aliase geändert
            "FROM Appointment a " +
            "WHERE a.start_time >= :start AND a.start_time <= :end " +
            "AND (a.status IS NULL OR a.status <> 'CANCELLED') " + // Enum-Pfad durch String-Literal ersetzt
            "GROUP BY HOUR(a.start_time) " +
            "ORDER BY HOUR(a.start_time) ASC", nativeQuery = true)
    List<Map<String, Object>> countAppointmentsPerHourBetweenNative(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
