// src/main/java/com/friseursalon/backend/service/StatisticsService.java
package com.friseursalon.backend.service;

import com.friseursalon.backend.dto.AppointmentStatsDTO;
import com.friseursalon.backend.dto.DailyAppointmentsDTO;
import com.friseursalon.backend.model.Appointment;
import com.friseursalon.backend.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StatisticsService {

    private final AppointmentRepository appointmentRepository;

    @Autowired
    public StatisticsService(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    public AppointmentStatsDTO getAppointmentCounts() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();

        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime endOfToday = today.atTime(LocalTime.MAX);

        LocalDateTime startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay();
        LocalDateTime endOfWeek = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY)).atTime(LocalTime.MAX);

        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = today.with(TemporalAdjusters.lastDayOfMonth()).atTime(LocalTime.MAX);

        long todayCount = appointmentRepository.countByStartTimeBetween(startOfToday, endOfToday);
        long thisWeekCount = appointmentRepository.countByStartTimeBetween(startOfWeek, endOfWeek);
        long thisMonthCount = appointmentRepository.countByStartTimeBetween(startOfMonth, endOfMonth);
        long totalUpcomingCount = appointmentRepository.countByStartTimeAfter(now);

        return new AppointmentStatsDTO(todayCount, thisWeekCount, thisMonthCount, totalUpcomingCount);
    }

    public List<DailyAppointmentsDTO> getTodayAndUpcomingAppointments() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
        // Wir wollen Termine für heute und die nächsten paar Tage (z.B. 2 Tage + heute)
        LocalDateTime upcomingEndRange = now.toLocalDate().plusDays(2).atTime(LocalTime.MAX);

        List<Appointment> appointments = appointmentRepository.findUpcomingAppointmentsForNextDays(todayStart, upcomingEndRange);

        return appointments.stream()
                .map(apt -> {
                    String status;
                    LocalDate appointmentDate = apt.getStartTime().toLocalDate();
                    if (appointmentDate.isEqual(now.toLocalDate())) {
                        status = "Heute";
                    } else if (appointmentDate.isEqual(now.toLocalDate().plusDays(1))) {
                        status = "Morgen";
                    } else {
                        status = appointmentDate.format(java.time.format.DateTimeFormatter.ofPattern("dd.MM."));
                    }
                    return new DailyAppointmentsDTO(
                            apt.getId(),
                            apt.getStartTime().toLocalTime(),
                            apt.getService() != null ? apt.getService().getName() : "N/A",
                            apt.getCustomer() != null ? apt.getCustomer().getFirstName() : "N/A",
                            apt.getCustomer() != null ? apt.getCustomer().getLastName() : "",
                            status
                    );
                })
                .collect(Collectors.toList());
    }
}