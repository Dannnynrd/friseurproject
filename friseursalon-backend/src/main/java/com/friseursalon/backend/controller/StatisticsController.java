// src/main/java/com/friseursalon/backend/controller/StatisticsController.java
package com.friseursalon.backend.controller;

import com.friseursalon.backend.dto.AppointmentsPerDayOfWeekDTO;
import com.friseursalon.backend.dto.AppointmentsPerServiceDTO;
import com.friseursalon.backend.dto.DailyAppointmentsDTO;
import com.friseursalon.backend.dto.DetailedAppointmentStatsDTO;
import com.friseursalon.backend.service.StatisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters; // KORREKTUR: Fehlender Import hinzugefügt
import java.util.List;

@RestController
@RequestMapping("/api/statistics")
@CrossOrigin(origins = "http://localhost:3000") // Für lokale Entwicklung
@PreAuthorize("hasRole('ADMIN')")
public class StatisticsController {

    private final StatisticsService statisticsService;

    @Autowired
    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/detailed-counts")
    public ResponseEntity<DetailedAppointmentStatsDTO> getDetailedAppointmentCounts(
            @RequestParam(name = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        if (startDate != null && endDate != null) {
            if (startDate.isAfter(endDate)) {
                return ResponseEntity.badRequest().build();
            }
            return ResponseEntity.ok(statisticsService.getDetailedAppointmentStats(startDate, endDate));
        } else {
            // Ruft die überladene Methode im Service auf, die Standardwerte (z.B. aktueller Monat) verwendet
            return ResponseEntity.ok(statisticsService.getDetailedAppointmentStats());
        }
    }

    @GetMapping("/today-upcoming-appointments")
    public ResponseEntity<List<DailyAppointmentsDTO>> getTodayAndUpcomingAppointments() {
        return ResponseEntity.ok(statisticsService.getTodayAndUpcomingAppointments());
    }

    // ANGEPASST: Akzeptiert startDate und endDate
    @GetMapping("/by-day-of-week")
    public ResponseEntity<List<AppointmentsPerDayOfWeekDTO>> getAppointmentsPerDayOfWeek(
            @RequestParam(name = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDate sDate = (startDate == null) ? LocalDate.now().with(TemporalAdjusters.firstDayOfMonth()) : startDate;
        LocalDate eDate = (endDate == null) ? LocalDate.now().with(TemporalAdjusters.lastDayOfMonth()) : endDate;
        if (sDate.isAfter(eDate)) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(statisticsService.getAppointmentsPerDayOfWeek(sDate, eDate));
    }

    // ANGEPASST: Akzeptiert startDate und endDate
    @GetMapping("/by-service")
    public ResponseEntity<List<AppointmentsPerServiceDTO>> getAppointmentsPerService(
            @RequestParam(name = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(name = "topN", defaultValue = "5") int topN
    ) {
        LocalDate sDate = (startDate == null) ? LocalDate.now().with(TemporalAdjusters.firstDayOfMonth()) : startDate;
        LocalDate eDate = (endDate == null) ? LocalDate.now().with(TemporalAdjusters.lastDayOfMonth()) : endDate;
        if (sDate.isAfter(eDate)) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(statisticsService.getAppointmentsPerService(sDate, eDate, topN));
    }
}
