package com.friseursalon.backend.controller;

import com.friseursalon.backend.payload.response.ReportResponseDto;
import com.friseursalon.backend.service.ReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "http://localhost:3000") // Adjust as needed for production
public class ReportController {

    private static final Logger logger = LoggerFactory.getLogger(ReportController.class);

    private final ReportService reportService;

    @Autowired
    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReportResponseDto> getReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        logger.info("Received report request for period: {} to {}", startDate, endDate);
        
        // Basic validation handled by @DateTimeFormat and potentially ReportService
        // More complex validation (e.g. endDate before startDate) is in ReportService.
        
        ReportResponseDto report = reportService.generateReport(startDate, endDate);
        return ResponseEntity.ok(report);
    }
}
