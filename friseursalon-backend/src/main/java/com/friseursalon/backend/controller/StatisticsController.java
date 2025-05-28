// src/main/java/com/friseursalon/backend/controller/StatisticsController.java
package com.friseursalon.backend.controller;

import com.friseursalon.backend.dto.AppointmentsPerDayOfWeekDTO;
import com.friseursalon.backend.dto.AppointmentsPerServiceDTO;
import com.friseursalon.backend.dto.DailyAppointmentsDTO;
import com.friseursalon.backend.dto.DetailedAppointmentStatsDTO; // NEU
import com.friseursalon.backend.service.StatisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/statistics")
@CrossOrigin(origins = "http://localhost:3000")
@PreAuthorize("hasRole('ADMIN')")
public class StatisticsController {

    private final StatisticsService statisticsService;

    @Autowired
    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    // Ersetzt getAppointmentCounts
    @GetMapping("/detailed-counts")
    public ResponseEntity<DetailedAppointmentStatsDTO> getDetailedAppointmentCounts() {
        return ResponseEntity.ok(statisticsService.getDetailedAppointmentStats());
    }

    @GetMapping("/today-upcoming-appointments")
    public ResponseEntity<List<DailyAppointmentsDTO>> getTodayAndUpcomingAppointments() {
        return ResponseEntity.ok(statisticsService.getTodayAndUpcomingAppointments());
    }

    @GetMapping("/by-day-of-week")
    public ResponseEntity<List<AppointmentsPerDayOfWeekDTO>> getAppointmentsPerDayOfWeek(
            @RequestParam(name = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate referenceDate = (date == null) ? LocalDate.now() : date;
        return ResponseEntity.ok(statisticsService.getAppointmentsPerDayOfWeek(referenceDate));
    }

    @GetMapping("/by-service")
    public ResponseEntity<List<AppointmentsPerServiceDTO>> getAppointmentsPerService(
            @RequestParam(name = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(name = "topN", defaultValue = "5") int topN
    ) {
        LocalDate referenceDate = (date == null) ? LocalDate.now() : date;
        return ResponseEntity.ok(statisticsService.getAppointmentsPerService(referenceDate, topN));
    }
}