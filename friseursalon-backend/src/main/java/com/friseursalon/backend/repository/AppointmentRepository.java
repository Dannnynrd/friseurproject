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

    // Native Query für H2, da DAY_OF_WEEK in JPQL nicht standardmäßig unterstützt wird oder je nach DB variiert.
    // MySQL: DAYOFWEEK(date) -> 1=So, 2=Mo... H2: DAY_OF_WEEK(date) -> 1=So, 2=Mo...
    // Anpassung der Logik im Service ist nötig, um dies auf java.time.DayOfWeek zu mappen.
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

    List<Appointment> findByOrderByIdDesc(Pageable pageable); // Für Paging, falls benötigt

    @Query(value = "SELECT CAST(a.start_time AS DATE) AS appointment_date, SUM(s.price) AS daily_revenue " +
            "FROM Appointment a JOIN Service s ON a.service_id = s.id " +
            "WHERE a.start_time >= :startDateTime AND a.start_time <= :endDateTime " +
            "GROUP BY CAST(a.start_time AS DATE) " +
            "ORDER BY appointment_date ASC", nativeQuery = true)
    List<Map<String, Object>> findRevenuePerDayBetween(@Param("startDateTime") LocalDateTime startDateTime, @Param("endDateTime") LocalDateTime endDateTime);

    // --- NEUE QUERIES für erweiterte Statistiken ---

    /**
     * Zählt die Anzahl der einzigartigen Kunden, die Termine im angegebenen Zeitraum hatten.
     * @param start Beginn des Zeitraums (inklusive).
     * @param end Ende des Zeitraums (inklusive).
     * @return Anzahl der einzigartigen Kunden.
     */
    @Query("SELECT COUNT(DISTINCT a.customer.id) FROM Appointment a WHERE a.startTime >= :start AND a.startTime <= :end")
    Long countDistinctCustomersByStartTimeBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * Summiert die Dauer (in Minuten) aller gebuchten Services für Termine im angegebenen Zeitraum.
     * @param start Beginn des Zeitraums (inklusive).
     * @param end Ende des Zeitraums (inklusive).
     * @return Gesamtdauer aller Termine in Minuten oder null, wenn keine Termine gefunden wurden.
     */
    @Query("SELECT SUM(a.service.durationMinutes) FROM Appointment a WHERE a.startTime >= :start AND a.startTime <= :end")
    Long sumDurationMinutesByStartTimeBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // --- Konzeptionelle Queries (benötigen Datenmodell-Erweiterungen) ---

    /**
     * Zählt neu erstellte Termine innerhalb eines Zeitfensters.
     * Benötigt ein Feld `createdAt` (oder ähnlich mit Annotation @CreationTimestamp) in der `Appointment`-Entität.
     * @param startOfDay Beginn des Tages.
     * @param endOfDayPlusOne Ende des Tages (exklusive des nächsten Tagesanfangs).
     * @return Anzahl der neu erstellten Termine.
     */
    // @Query("SELECT COUNT(a.id) FROM Appointment a WHERE a.createdAt >= :startOfDay AND a.createdAt < :endOfDayPlusOne")
    // Long countNewAppointmentsCreatedBetween(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDayPlusOne") LocalDateTime endOfDayPlusOne);

    /**
     * Zählt stornierte Termine im angegebenen Zeitraum.
     * Benötigt ein Feld `status` (z.B. Enum `AppointmentStatus.CANCELLED`) in der `Appointment`-Entität.
     * @param start Beginn des Zeitraums.
     * @param end Ende des Zeitraums.
     * @return Anzahl der stornierten Termine.
     */
    // @Query("SELECT COUNT(a.id) FROM Appointment a WHERE a.startTime >= :start AND a.startTime <= :end AND a.status = com.friseursalon.backend.model.AppointmentStatus.CANCELLED")
    // Long countCancelledAppointmentsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * Berechnet die durchschnittliche Vorlaufzeit von Buchungen in Tagen.
     * Benötigt ein Feld `createdAt` (Erstellungsdatum des Termins) in der `Appointment`-Entität.
     * @param start Beginn des Zeitraums für Termin-Startzeiten.
     * @param end Ende des Zeitraums für Termin-Startzeiten.
     * @return Durchschnittliche Vorlaufzeit in Tagen oder null.
     */
    // @Query("SELECT AVG(FUNCTION('DATEDIFF', DAY, a.createdAt, a.startTime)) FROM Appointment a WHERE a.startTime >= :start AND a.startTime <= :end AND a.createdAt IS NOT NULL AND a.startTime > a.createdAt")
    // Double getAverageBookingLeadTimeInDays(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * Findet alle Kunden-IDs, die Termine im angegebenen Zeitraum hatten.
     * Wird benötigt, um den Neukundenanteil zu berechnen.
     * @param start Beginn des Zeitraums.
     * @param end Ende des Zeitraums.
     * @return Liste der einzigartigen Kunden-IDs.
     */
    @Query("SELECT DISTINCT a.customer.id FROM Appointment a WHERE a.startTime >= :start AND a.startTime <= :end")
    List<Long> findDistinctCustomerIdsWithAppointmentsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
