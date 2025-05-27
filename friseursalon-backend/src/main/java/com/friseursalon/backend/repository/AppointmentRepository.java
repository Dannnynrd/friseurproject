package com.friseursalon.backend.repository;

import com.friseursalon.backend.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);

    List<Appointment> findByStartTimeAfterOrderByStartTimeAsc(LocalDateTime startTime);

    // Findet Termine, deren Kunde die angegebene E-Mail-Adresse hat, sortiert nach Startzeit
    List<Appointment> findByCustomerEmailOrderByStartTimeAsc(String email); // NEUE METHODE

    @Query("SELECT a FROM Appointment a WHERE " +
            "(:excludeId IS NULL OR a.id <> :excludeId) AND " +
            "a.startTime < :proposedEnd AND " +
            "FUNCTION('TIMESTAMPADD', MINUTE, a.service.durationMinutes, a.startTime) > :proposedStart")
    List<Appointment> findConflictingAppointments(
            @Param("proposedStart") LocalDateTime proposedStart,
            @Param("proposedEnd") LocalDateTime proposedEnd,
            @Param("excludeId") Long excludeId
    );

    // Custom query for service report data
    @Query("SELECT new com.friseursalon.backend.payload.response.ServiceReportDto(s.id, s.name, COUNT(a.id), SUM(s.price)) " +
           "FROM Appointment a JOIN a.service s " +
           "WHERE a.startTime >= :startDateTime AND a.startTime < :endDateTime " +
           "GROUP BY s.id, s.name " +
           "ORDER BY COUNT(a.id) DESC")
    List<ServiceReportDto> getServiceReportData(@Param("startDateTime") LocalDateTime startDateTime, @Param("endDateTime") LocalDateTime endDateTime);
}