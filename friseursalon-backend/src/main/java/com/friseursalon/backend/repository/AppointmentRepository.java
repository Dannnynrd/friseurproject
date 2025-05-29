// Datei: friseursalon-backend/src/main/java/com/friseursalon/backend/repository/AppointmentRepository.java
package com.friseursalon.backend.repository;

import com.friseursalon.backend.model.Appointment;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
// import java.time.DayOfWeek; // Nicht direkt hier verwendet, aber im Service
import java.time.LocalDate;
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

    @Query(value = "SELECT CAST(a.start_time AS DATE) AS appointment_date, SUM(s.price) AS daily_revenue " +
            "FROM Appointment a JOIN Service s ON a.service_id = s.id " +
            "WHERE a.start_time >= :startDateTime AND a.start_time <= :endDateTime " +
            "GROUP BY CAST(a.start_time AS DATE) " +
            "ORDER BY appointment_date ASC", nativeQuery = true)
    List<Map<String, Object>> findRevenuePerDayBetween(@Param("startDateTime") LocalDateTime startDateTime, @Param("endDateTime") LocalDateTime endDateTime);

    @Query("SELECT COUNT(DISTINCT a.customer.id) FROM Appointment a WHERE a.startTime >= :start AND a.startTime <= :end")
    Long countDistinctCustomersByStartTimeBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT SUM(a.service.durationMinutes) FROM Appointment a WHERE a.startTime >= :start AND a.startTime <= :end")
    Long sumDurationMinutesByStartTimeBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // @Query("SELECT COUNT(a.id) FROM Appointment a WHERE a.createdAt >= :startOfDay AND a.createdAt < :endOfDayPlusOne")
    // Long countNewAppointmentsCreatedBetween(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDayPlusOne") LocalDateTime endOfDayPlusOne);

    // @Query("SELECT COUNT(a.id) FROM Appointment a WHERE a.startTime >= :start AND a.startTime <= :end AND a.status = com.friseursalon.backend.model.AppointmentStatus.CANCELLED")
    // Long countCancelledAppointmentsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // @Query("SELECT AVG(FUNCTION('DATEDIFF', DAY, a.createdAt, a.startTime)) FROM Appointment a WHERE a.startTime >= :start AND a.startTime <= :end AND a.createdAt IS NOT NULL AND a.startTime > a.createdAt")
    // Double getAverageBookingLeadTimeInDays(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT DISTINCT a.customer.id FROM Appointment a WHERE a.startTime >= :start AND a.startTime <= :end")
    List<Long> findDistinctCustomerIdsWithAppointmentsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
