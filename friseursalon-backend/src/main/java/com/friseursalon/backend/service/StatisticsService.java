// src/main/java/com/friseursalon/backend/service/StatisticsService.java
package com.friseursalon.backend.service;

import com.friseursalon.backend.dto.*;
import com.friseursalon.backend.model.Appointment;
import com.friseursalon.backend.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.TextStyle;
import java.time.temporal.TemporalAdjusters;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class StatisticsService {

    private final AppointmentRepository appointmentRepository;

    @Autowired
    public StatisticsService(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    public DetailedAppointmentStatsDTO getDetailedAppointmentStats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();

        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime endOfToday = today.atTime(LocalTime.MAX);

        // Ensure week starts on Monday for Germany
        WeekFields weekFields = WeekFields.of(Locale.GERMANY);
        LocalDateTime startOfWeek = today.with(weekFields.dayOfWeek(), 1).atStartOfDay(); // Monday
        LocalDateTime endOfWeek = today.with(weekFields.dayOfWeek(), 7).atTime(LocalTime.MAX);   // Sunday

        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = today.with(TemporalAdjusters.lastDayOfMonth()).atTime(LocalTime.MAX);

        // Existing counts
        long todayCount = appointmentRepository.countByStartTimeBetween(startOfToday, endOfToday);
        long thisWeekCount = appointmentRepository.countByStartTimeBetween(startOfWeek, endOfWeek);
        long thisMonthCount = appointmentRepository.countByStartTimeBetween(startOfMonth, endOfMonth);
        long totalUpcomingCount = appointmentRepository.countByStartTimeAfter(now);

        // Revenue calculations
        BigDecimal revenueToday = calculateRevenueForPeriod(startOfToday, endOfToday);
        BigDecimal revenueThisWeek = calculateRevenueForPeriod(startOfWeek, endOfWeek);
        BigDecimal revenueThisMonth = calculateRevenueForPeriod(startOfMonth, endOfMonth);

        return new DetailedAppointmentStatsDTO(
                todayCount, thisWeekCount, thisMonthCount, totalUpcomingCount,
                revenueToday, revenueThisWeek, revenueThisMonth
        );
    }

    private BigDecimal calculateRevenueForPeriod(LocalDateTime start, LocalDateTime end) {
        List<Appointment> appointmentsInPeriod = appointmentRepository.findByStartTimeBetween(start, end);
        return appointmentsInPeriod.stream()
                .filter(appointment -> appointment.getService() != null) // Ensure service exists
                .map(appointment -> BigDecimal.valueOf(appointment.getService().getPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public List<DailyAppointmentsDTO> getTodayAndUpcomingAppointments() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalDateTime todayStart = today.atStartOfDay();
        // Appointments for today and the next 2 days
        LocalDateTime upcomingEndRange = today.plusDays(2).atTime(LocalTime.MAX);

        List<Appointment> appointments = appointmentRepository.findUpcomingAppointmentsForNextDays(todayStart, upcomingEndRange);

        return appointments.stream()
                .map(apt -> {
                    String status;
                    LocalDate appointmentDate = apt.getStartTime().toLocalDate();
                    if (appointmentDate.isEqual(today)) {
                        status = "Heute";
                    } else if (appointmentDate.isEqual(today.plusDays(1))) {
                        status = "Morgen";
                    } else {
                        // Format for other upcoming dates within the range
                        status = appointmentDate.format(java.time.format.DateTimeFormatter.ofPattern("dd.MM."));
                    }
                    return new DailyAppointmentsDTO(
                            apt.getId(),
                            appointmentDate, // Pass the actual date of the appointment
                            apt.getStartTime().toLocalTime(),
                            apt.getService() != null ? apt.getService().getName() : "N/A",
                            apt.getCustomer() != null ? apt.getCustomer().getFirstName() : "N/A",
                            apt.getCustomer() != null ? apt.getCustomer().getLastName() : "",
                            status
                    );
                })
                .collect(Collectors.toList());
    }

    public List<AppointmentsPerDayOfWeekDTO> getAppointmentsPerDayOfWeek(LocalDate forDate) {
        // Statistics for the week containing `forDate`
        WeekFields weekFields = WeekFields.of(Locale.GERMANY);
        LocalDateTime startOfWeek = forDate.with(weekFields.dayOfWeek(), 1).atStartOfDay(); // Monday
        LocalDateTime endOfWeek = forDate.with(weekFields.dayOfWeek(), 7).atTime(LocalTime.MAX);   // Sunday

        List<Map<String, Object>> results = appointmentRepository.countAppointmentsPerDayOfWeekBetweenNative(startOfWeek, endOfWeek);

        // Initialize a list for all weekdays with 0 appointments
        List<AppointmentsPerDayOfWeekDTO> dailyStats = new ArrayList<>();
        // Ensure correct order: Monday to Sunday
        DayOfWeek[] daysInGermanOrder = {
                DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY,
                DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY
        };

        for (DayOfWeek day : daysInGermanOrder) {
            dailyStats.add(new AppointmentsPerDayOfWeekDTO(day, day.getDisplayName(TextStyle.FULL, Locale.GERMAN), 0L));
        }

        // Update counts based on query results
        results.forEach(result -> {
            Object dayOfWeekFromDbObj = result.get("DAYOFWEEK"); // Or "dayOfWeek", depending on DB alias
            if (dayOfWeekFromDbObj == null) return;

            int dayOfWeekFromDb;
            if (dayOfWeekFromDbObj instanceof Number) { // H2 might return Byte, Short, Integer, Long, etc.
                dayOfWeekFromDb = ((Number) dayOfWeekFromDbObj).intValue();
            } else {
                System.err.println("Unerwarteter Typ für DAYOFWEEK aus DB: " + dayOfWeekFromDbObj.getClass().getName() + " Wert: " + dayOfWeekFromDbObj);
                return; // Skip this entry if type is unexpected
            }

            // H2's DAY_OF_WEEK: 1 (Sunday) to 7 (Saturday).
            // java.time.DayOfWeek: 1 (Monday) to 7 (Sunday).
            // We need to map H2's value to java.time.DayOfWeek
            DayOfWeek actualDayOfWeek;
            if (dayOfWeekFromDb == 1) { // H2 Sunday
                actualDayOfWeek = DayOfWeek.SUNDAY;
            } else { // H2 Monday (2) to Saturday (7)
                actualDayOfWeek = DayOfWeek.of(dayOfWeekFromDb - 1);
            }

            long count = ((Number) result.get("COUNT")).longValue();

            dailyStats.stream()
                    .filter(dto -> dto.getDayOfWeek() == actualDayOfWeek)
                    .findFirst()
                    .ifPresent(dto -> dto.setAppointmentCount(count));
        });

        // The list is already in German order (Mo-So) due to initialization.
        // No extra sort needed if `daysInGermanOrder` is used for initialization.

        return dailyStats;
    }


    public List<AppointmentsPerServiceDTO> getAppointmentsPerService(LocalDate forDate, int topN) {
        LocalDateTime startOfMonth = forDate.withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = forDate.with(TemporalAdjusters.lastDayOfMonth()).atTime(LocalTime.MAX);

        List<Map<String, Object>> results = appointmentRepository.countAppointmentsPerServiceBetween(startOfMonth, endOfMonth);

        long totalAppointmentsInPeriod = results.stream().mapToLong(r -> {
            Object countObj = r.get("COUNT"); // Or "count"
            if (countObj instanceof Number) {
                return ((Number) countObj).longValue();
            }
            System.err.println("Unerwarteter Typ für COUNT in getAppointmentsPerService: " + (countObj != null ? countObj.getClass().getName() : "null"));
            return 0L;
        }).sum();


        return results.stream()
                .limit(topN)
                .map(result -> {
                    String serviceName = (String) result.get("SERVICENAME"); // Or "serviceName"
                    Object countObj = result.get("COUNT"); // Or "count"
                    long count = 0L;
                    if (countObj instanceof Number) {
                        count = ((Number) countObj).longValue();
                    } else {
                        System.err.println("Unerwarteter Typ für COUNT (Detail) in getAppointmentsPerService: " + (countObj != null ? countObj.getClass().getName() : "null") + " für Service: " + serviceName);
                    }

                    double percentage = totalAppointmentsInPeriod > 0 ? ( (double) count / totalAppointmentsInPeriod) * 100 : 0;
                    return new AppointmentsPerServiceDTO(serviceName, count, Math.round(percentage * 100.0) / 100.0); // Runde auf 2 Nachkommastellen
                })
                .collect(Collectors.toList());
    }
}
