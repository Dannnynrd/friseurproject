// src/main/java/com/friseursalon/backend/service/StatisticsService.java
package com.friseursalon.backend.service;

import com.friseursalon.backend.dto.*;
import com.friseursalon.backend.model.Appointment;
import com.friseursalon.backend.repository.AppointmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class StatisticsService {

    private static final Logger logger = LoggerFactory.getLogger(StatisticsService.class);
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

        WeekFields weekFields = WeekFields.of(Locale.GERMANY);
        LocalDateTime startOfWeek = today.with(weekFields.dayOfWeek(), 1).atStartOfDay();
        LocalDateTime endOfWeek = today.with(weekFields.dayOfWeek(), 7).atTime(LocalTime.MAX);

        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = today.with(TemporalAdjusters.lastDayOfMonth()).atTime(LocalTime.MAX);

        long todayCount = appointmentRepository.countByStartTimeBetween(startOfToday, endOfToday);
        long thisWeekCount = appointmentRepository.countByStartTimeBetween(startOfWeek, endOfWeek);
        long thisMonthCount = appointmentRepository.countByStartTimeBetween(startOfMonth, endOfMonth);
        long totalUpcomingCount = appointmentRepository.countByStartTimeAfter(now);

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
                .filter(appointment -> appointment.getService() != null && appointment.getService().getPrice() > 0)
                .map(appointment -> BigDecimal.valueOf(appointment.getService().getPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public List<DailyAppointmentsDTO> getTodayAndUpcomingAppointments() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime upcomingEndRange = today.plusDays(2).atTime(LocalTime.MAX); // Termine für heute und die nächsten 2 Tage

        logger.info("Suche tägliche Termine von {} bis {}", todayStart, upcomingEndRange);
        List<Appointment> appointments = appointmentRepository.findUpcomingAppointmentsForNextDays(todayStart, upcomingEndRange);
        logger.info("{} tägliche Termine gefunden.", appointments.size());
        if (appointments.isEmpty()) {
            logger.info("Keine Termine im Bereich {} bis {} in der Datenbank gefunden.", todayStart, upcomingEndRange);
        } else {
            appointments.forEach(apt -> logger.debug("Gefundener Termin: ID {}, Startzeit {}, Service: {}", apt.getId(), apt.getStartTime(), (apt.getService() != null ? apt.getService().getName() : "KEIN SERVICE")));
        }


        return appointments.stream()
                .map(apt -> {
                    String status;
                    LocalDate appointmentDate = apt.getStartTime().toLocalDate();
                    if (appointmentDate.isEqual(today)) {
                        status = "Heute";
                    } else if (appointmentDate.isEqual(today.plusDays(1))) {
                        status = "Morgen";
                    } else {
                        status = appointmentDate.format(java.time.format.DateTimeFormatter.ofPattern("dd.MM."));
                    }
                    return new DailyAppointmentsDTO(
                            apt.getId(),
                            appointmentDate, // Das tatsächliche Datum des Termins
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
        WeekFields weekFields = WeekFields.of(Locale.GERMANY);
        LocalDateTime startOfWeek = forDate.with(weekFields.dayOfWeek(), 1).atStartOfDay();
        LocalDateTime endOfWeek = forDate.with(weekFields.dayOfWeek(), 7).atTime(LocalTime.MAX);

        logger.info("Suche Termine pro Wochentag von {} bis {}", startOfWeek, endOfWeek);
        List<Map<String, Object>> results = appointmentRepository.countAppointmentsPerDayOfWeekBetweenNative(startOfWeek, endOfWeek);
        logger.info("Ergebnis für Termine pro Wochentag (roh aus DB): {}", results);

        List<AppointmentsPerDayOfWeekDTO> dailyStats = new ArrayList<>();
        DayOfWeek[] daysInGermanOrder = {
                DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY,
                DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY
        };

        for (DayOfWeek day : daysInGermanOrder) {
            dailyStats.add(new AppointmentsPerDayOfWeekDTO(day, day.getDisplayName(TextStyle.FULL, Locale.GERMAN), 0L));
        }

        results.forEach(result -> {
            Object dayOfWeekFromDbObj = result.get("DAYOFWEEK");
            if (dayOfWeekFromDbObj == null) dayOfWeekFromDbObj = result.get("dayofweek");

            Object countFromDbObj = result.get("COUNT");
            if (countFromDbObj == null) countFromDbObj = result.get("count");


            if (dayOfWeekFromDbObj == null || countFromDbObj == null) {
                logger.warn("Eintrag in Wochentagsstatistik übersprungen, da Schlüssel 'DAYOFWEEK' oder 'COUNT' fehlen. Vorhandene Schlüssel: {}", result.keySet());
                return;
            }

            int dayOfWeekFromDb;
            if (dayOfWeekFromDbObj instanceof Number) {
                dayOfWeekFromDb = ((Number) dayOfWeekFromDbObj).intValue();
            } else {
                logger.warn("Unerwarteter Typ für DAYOFWEEK aus DB: {} Wert: {}. Vorhandene Schlüssel: {}", dayOfWeekFromDbObj.getClass().getName(), dayOfWeekFromDbObj, result.keySet());
                return;
            }

            DayOfWeek actualDayOfWeek;
            if (dayOfWeekFromDb == 1) {
                actualDayOfWeek = DayOfWeek.SUNDAY;
            } else {
                actualDayOfWeek = DayOfWeek.of(dayOfWeekFromDb - 1);
            }

            long count = ((Number) countFromDbObj).longValue();

            dailyStats.stream()
                    .filter(dto -> dto.getDayOfWeek() == actualDayOfWeek)
                    .findFirst()
                    .ifPresent(dto -> dto.setAppointmentCount(count));
        });

        logger.info("Verarbeitete Termine pro Wochentag: {}", dailyStats);
        return dailyStats;
    }


    public List<AppointmentsPerServiceDTO> getAppointmentsPerService(LocalDate forDate, int topN) {
        LocalDateTime startOfMonth = forDate.withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = forDate.with(TemporalAdjusters.lastDayOfMonth()).atTime(LocalTime.MAX);

        logger.info("Suche Termine pro Service von {} bis {}", startOfMonth, endOfMonth);
        List<Map<String, Object>> results = appointmentRepository.countAppointmentsPerServiceBetween(startOfMonth, endOfMonth);
        logger.info("Ergebnis für Termine pro Service (roh aus DB): {}", results);

        if (results == null || results.isEmpty()) {
            logger.info("Keine Termine für Service-Statistik im Zeitraum gefunden.");
            return Collections.emptyList();
        }

        long totalAppointmentsInPeriod = results.stream().mapToLong(r -> {
            Object countObj = r.get("COUNT");
            if (countObj == null) countObj = r.get("count");

            if (countObj instanceof Number) {
                return ((Number) countObj).longValue();
            }
            logger.warn("Unerwarteter Typ oder fehlender Wert für COUNT in getAppointmentsPerService (Summe): {} für Ergebnis-Map: {}. Vorhandene Schlüssel: {}",
                    (countObj != null ? countObj.getClass().getName() : "null"), r, r.keySet());
            return 0L;
        }).sum();
        logger.info("Gesamtzahl Termine im Zeitraum für Service-Statistik: {}", totalAppointmentsInPeriod);

        return results.stream()
                .limit(topN)
                .map(result -> {
                    Object serviceNameObj = result.get("SERVICENAME");
                    if (serviceNameObj == null) serviceNameObj = result.get("serviceName");
                    if (serviceNameObj == null) serviceNameObj = result.get("NAME"); // Weiterer Fallback für s.name

                    Object countObj = result.get("COUNT");
                    if (countObj == null) countObj = result.get("count");

                    String serviceName = "Unbekannt";
                    if (serviceNameObj instanceof String) {
                        serviceName = (String) serviceNameObj;
                    } else if (serviceNameObj != null) {
                        logger.warn("Unerwarteter Typ für SERVICENAME: {} in Ergebnis-Map: {}. Vorhandene Schlüssel: {}", serviceNameObj.getClass().getName(), result, result.keySet());
                    } else {
                        logger.warn("SERVICENAME nicht gefunden in Ergebnis-Map: {}. Vorhandene Schlüssel: {}", result, result.keySet());
                    }


                    long count = 0L;
                    if (countObj instanceof Number) {
                        count = ((Number) countObj).longValue();
                    } else {
                        logger.warn("Unerwarteter Typ oder fehlender Wert für COUNT (Detail) in getAppointmentsPerService: {} für Service: {} in Ergebnis-Map: {}. Vorhandene Schlüssel: {}",
                                (countObj != null ? countObj.getClass().getName() : "null"), serviceName, result, result.keySet());
                    }

                    double percentage = totalAppointmentsInPeriod > 0 ? ( (double) count / totalAppointmentsInPeriod) * 100 : 0;
                    return new AppointmentsPerServiceDTO(serviceName, count, Math.round(percentage * 100.0) / 100.0);
                })
                .collect(Collectors.toList());
    }
}
