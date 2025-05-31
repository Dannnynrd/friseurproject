package com.friseursalon.backend.controller;

import com.friseursalon.backend.model.WorkingHours;
import com.friseursalon.backend.service.WorkingHoursService;
import org.slf4j.Logger; // Import für SLF4J Logger
import org.slf4j.LoggerFactory; // Import für SLF4J Logger
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/workinghours")
@CrossOrigin(origins = "http://localhost:3000")
public class WorkingHoursController {

    private static final Logger logger = LoggerFactory.getLogger(WorkingHoursController.class); // Logger Instanz

    private final WorkingHoursService workingHoursService;

    @Autowired
    public WorkingHoursController(WorkingHoursService workingHoursService) {
        this.workingHoursService = workingHoursService;
    }

    public static class WorkingHoursPayload {
        public DayOfWeek dayOfWeek;
        public String startTime;
        public String endTime;
        public boolean isClosed;
    }

    @PostMapping("/day")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> setSingleDayWorkingHours(@RequestBody WorkingHoursPayload payload) {
        logger.info("Received request to set single day working hours: Day: {}, Start: {}, End: {}, Closed: {}",
                payload.dayOfWeek, payload.startTime, payload.endTime, payload.isClosed);
        LocalTime startTime = null;
        LocalTime endTime = null;

        try {
            if (payload.startTime != null && !payload.startTime.isEmpty()) {
                startTime = LocalTime.parse(payload.startTime);
            }
            if (payload.endTime != null && !payload.endTime.isEmpty()) {
                endTime = LocalTime.parse(payload.endTime);
            }
        } catch (java.time.format.DateTimeParseException e) {
            logger.error("Error parsing time for single day update: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Ungültiges Zeitformat. Bitte HH:mm verwenden.");
        }

        if (!payload.isClosed && (startTime == null || endTime == null)) {
            return ResponseEntity.badRequest().body("Start- und Endzeit sind erforderlich, wenn der Tag nicht geschlossen ist.");
        }
        if (!payload.isClosed && startTime != null && endTime != null && endTime.isBefore(startTime)) {
            return ResponseEntity.badRequest().body("Endzeit muss nach der Startzeit liegen.");
        }

        WorkingHours workingHours = workingHoursService.setWorkingHours(
                payload.dayOfWeek,
                startTime,
                endTime,
                payload.isClosed
        );
        return ResponseEntity.ok(workingHours);
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> saveAllWorkingHours(@RequestBody List<WorkingHours> workingHoursList) {
        logger.info("Received PUT request to save all working hours. List size: {}", workingHoursList.size());
        for (WorkingHours wh : workingHoursList) {
            logger.info("Received in Controller - Day: {}, StartTime: {}, EndTime: {}, isClosed: {}, ID: {}",
                    wh.getDayOfWeek(), wh.getStartTime(), wh.getEndTime(), wh.isClosed(), wh.getId());
        }

        try {
            List<WorkingHours> savedWorkingHours = workingHoursService.saveAllWorkingHours(workingHoursList);
            logger.info("Successfully saved all working hours in controller. Returning {} entities.", savedWorkingHours.size());
            return ResponseEntity.ok(savedWorkingHours);
        } catch (IllegalArgumentException e) {
            logger.error("IllegalArgumentException while saving all working hours: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("Generic exception while saving all working hours: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Ein interner Fehler ist beim Speichern der Öffnungszeiten aufgetreten: " + e.getMessage());
        }
    }

    @GetMapping("/{dayOfWeek}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<WorkingHours> getWorkingHours(@PathVariable DayOfWeek dayOfWeek) {
        logger.debug("GET request for working hours of day: {}", dayOfWeek);
        return workingHoursService.getWorkingHoursForDay(dayOfWeek)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<WorkingHours>> getAllWorkingHours() {
        logger.debug("GET request for all working hours.");
        return ResponseEntity.ok(workingHoursService.getAllWorkingHours());
    }
}
