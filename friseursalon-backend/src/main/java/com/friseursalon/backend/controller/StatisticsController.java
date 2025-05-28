// src/main/java/com/friseursalon/backend/controller/StatisticsController.java
package com.friseursalon.backend.controller;

import com.friseursalon.backend.dto.AppointmentStatsDTO;
import com.friseursalon.backend.dto.DailyAppointmentsDTO;
import com.friseursalon.backend.service.StatisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    @GetMapping("/appointment-counts")
    public ResponseEntity<AppointmentStatsDTO> getAppointmentCounts() {
        return ResponseEntity.ok(statisticsService.getAppointmentCounts());
    }

    @GetMapping("/today-upcoming-appointments")
    public ResponseEntity<List<DailyAppointmentsDTO>> getTodayAndUpcomingAppointments() {
        return ResponseEntity.ok(statisticsService.getTodayAndUpcomingAppointments());
    }

}