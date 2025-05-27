package com.friseursalon.backend.service;

import com.friseursalon.backend.model.Appointment;
import com.friseursalon.backend.payload.response.ReportResponseDto;
import com.friseursalon.backend.payload.response.ServiceReportDto;
import com.friseursalon.backend.repository.AppointmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private static final Logger logger = LoggerFactory.getLogger(ReportService.class);

    private final AppointmentRepository appointmentRepository;

    @Autowired
    public ReportService(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    @Transactional(readOnly = true)
    public ReportResponseDto generateReport(LocalDate startDate, LocalDate endDate) {
        logger.info("Generating report from {} to {}", startDate, endDate);

        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Start date and end date must be provided.");
        }
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException("Start date cannot be after end date.");
        }

        LocalDateTime startDateTime = startDate.atStartOfDay();
        // To include all appointments on the endDate, we need to go up to the end of that day.
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);


        // For V1, we fetch all appointments and process in Java.
        // For V2 or if performance becomes an issue, more specific aggregate queries would be better.
        List<Appointment> appointments = appointmentRepository.findByStartTimeBetween(startDateTime, endDateTime);

        long totalAppointments = appointments.size();
        BigDecimal totalRevenue = BigDecimal.ZERO;

        for (Appointment appointment : appointments) {
            if (appointment.getService() != null && appointment.getService().getPrice() != null) {
                // V1: Assume all appointments contribute to revenue.
                // Consider appointment status in future versions (e.g., only 'COMPLETED').
                totalRevenue = totalRevenue.add(appointment.getService().getPrice());
            }
        }
        
        // Using the new repository method for service breakdown
        List<ServiceReportDto> serviceBreakdown = appointmentRepository.getServiceReportData(startDateTime, endDateTime);

        // If getServiceReportData already sums revenue, the manual calculation of totalRevenue above
        // could be replaced by summing revenues from serviceBreakdown for consistency,
        // or ensure both calculations align. For now, let's assume getServiceReportData is the source for breakdown.
        // And the manual loop is for overall totalRevenue.
        // Let's re-calculate totalRevenue from the breakdown to ensure consistency if the query is optimized for it.
        // totalRevenue = serviceBreakdown.stream()
        //                            .map(ServiceReportDto::getRevenue)
        //                            .reduce(BigDecimal.ZERO, BigDecimal::add);


        // Sort for "most popular services" (can be done client-side too)
        // The query in repository can also handle this with ORDER BY.
        // If not, sort here:
        // serviceBreakdown.sort((s1, s2) -> Long.compare(s2.getAppointmentCount(), s1.getAppointmentCount()));


        ReportResponseDto report = new ReportResponseDto();
        report.setReportStartDate(startDate);
        report.setReportEndDate(endDate);
        report.setTotalAppointments(totalAppointments);
        report.setTotalRevenue(totalRevenue); // Using the manually calculated total revenue for now
        report.setServiceBreakdown(serviceBreakdown);

        logger.info("Report generated successfully: Total Appointments={}, Total Revenue={}", totalAppointments, totalRevenue);
        return report;
    }
}
