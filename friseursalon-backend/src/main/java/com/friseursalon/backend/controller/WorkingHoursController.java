package com.friseursalon.backend.controller;

import com.friseursalon.backend.model.WorkingHours;
import com.friseursalon.backend.service.WorkingHoursService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workinghours")
@CrossOrigin(origins = "http://localhost:3000")
public class WorkingHoursController {

    private final WorkingHoursService workingHoursService;

    @Autowired
    public WorkingHoursController(WorkingHoursService workingHoursService) {
        this.workingHoursService = workingHoursService;
    }

    // Payload-Klasse für das Setzen von Arbeitszeiten
    public static class WorkingHoursPayload {
        public DayOfWeek dayOfWeek;
        public String startTime; // Als String empfangen: "HH:mm"
        public String endTime;   // Als String empfangen: "HH:mm"
        public boolean isClosed;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<WorkingHours> setWorkingHours(@RequestBody WorkingHoursPayload payload) {
        java.time.LocalTime startTime = payload.startTime != null ? java.time.LocalTime.parse(payload.startTime) : null;
        java.time.LocalTime endTime = payload.endTime != null ? java.time.LocalTime.parse(payload.endTime) : null;

        WorkingHours workingHours = workingHoursService.setWorkingHours(
                payload.dayOfWeek,
                startTime,
                endTime,
                payload.isClosed
        );
        return ResponseEntity.ok(workingHours);
    }

    @GetMapping("/{dayOfWeek}")
    @PreAuthorize("permitAll()") // Jeder kann die Öffnungszeiten für einen Tag sehen
    public ResponseEntity<WorkingHours> getWorkingHours(@PathVariable DayOfWeek dayOfWeek) {
        return workingHoursService.getWorkingHoursForDay(dayOfWeek)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    @PreAuthorize("permitAll()") // Jeder kann alle Öffnungszeiten sehen
    public ResponseEntity<List<WorkingHours>> getAllWorkingHours() {
        return ResponseEntity.ok(workingHoursService.getAllWorkingHours());
    }
}