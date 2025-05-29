// Datei: friseursalon-backend/src/main/java/com/friseursalon/backend/service/StatisticsService.java
package com.friseursalon.backend.service;

import com.friseursalon.backend.dto.*;
import com.friseursalon.backend.model.Appointment;
import com.friseursalon.backend.model.BlockedTimeSlot;
import com.friseursalon.backend.model.WorkingHours;
// import com.friseursalon.backend.model.AppointmentStatus; // Importieren, wenn Enum existiert
import com.friseursalon.backend.repository.AppointmentRepository;
import com.friseursalon.backend.repository.CustomerRepository;
import com.friseursalon.backend.repository.ServiceRepository;
import com.friseursalon.backend.repository.WorkingHoursRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class StatisticsService {

    private static final Logger logger = LoggerFactory.getLogger(StatisticsService.class);
    private final AppointmentRepository appointmentRepository;
    private final WorkingHoursRepository workingHoursRepository;
    private final BlockedTimeSlotService blockedTimeSlotService;
    private final CustomerRepository customerRepository;
    private final ServiceRepository serviceRepository;

    private final DateTimeFormatter GERMAN_DATE_FORMATTER = DateTimeFormatter.ofPattern("dd.MM.yyyy", Locale.GERMAN);


    @Autowired
    public StatisticsService(AppointmentRepository appointmentRepository,
                             WorkingHoursRepository workingHoursRepository,
                             BlockedTimeSlotService blockedTimeSlotService,
                             CustomerRepository customerRepository,
                             ServiceRepository serviceRepository) {
        this.appointmentRepository = appointmentRepository;
        this.workingHoursRepository = workingHoursRepository;
        this.blockedTimeSlotService = blockedTimeSlotService;
        this.customerRepository = customerRepository;
        this.serviceRepository = serviceRepository;
    }

    public DetailedAppointmentStatsDTO getDetailedAppointmentStats() {
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        LocalDate endOfMonth = today.with(TemporalAdjusters.lastDayOfMonth());
        return getDetailedAppointmentStats(startOfMonth, endOfMonth);
    }


    public DetailedAppointmentStatsDTO getDetailedAppointmentStats(LocalDate startDate, LocalDate endDate) {
        logger.info("Berechne detaillierte Statistiken für Zeitraum: {} bis {}", startDate, endDate);

        LocalDateTime periodStartDateTime = startDate.atStartOfDay();
        LocalDateTime periodEndDateTime = endDate.atTime(LocalTime.MAX);

        long totalAppointmentsInPeriod = appointmentRepository.countByStartTimeBetween(periodStartDateTime, periodEndDateTime);
        BigDecimal totalRevenueInPeriod = calculateRevenueForPeriod(periodStartDateTime, periodEndDateTime);

        long daysInPeriod = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        if (daysInPeriod <= 0) daysInPeriod = 1;

        LocalDate previousPeriodStartDate = startDate.minusDays(daysInPeriod);
        LocalDate previousPeriodEndDate = startDate.minusDays(1);

        LocalDateTime previousPeriodStartDateTime = previousPeriodStartDate.atStartOfDay();
        LocalDateTime previousPeriodEndDateTime = previousPeriodEndDate.atTime(LocalTime.MAX);

        Long previousPeriodTotalAppointments = appointmentRepository.countByStartTimeBetween(previousPeriodStartDateTime, previousPeriodEndDateTime);
        BigDecimal previousPeriodTotalRevenue = calculateRevenueForPeriod(previousPeriodStartDateTime, previousPeriodEndDateTime);
        Long previousPeriodUniqueCustomers = appointmentRepository.countDistinctCustomersByStartTimeBetween(previousPeriodStartDateTime, previousPeriodEndDateTime);


        Double appointmentCountChangePercentage = calculatePercentageChange(
                BigDecimal.valueOf(totalAppointmentsInPeriod),
                BigDecimal.valueOf(previousPeriodTotalAppointments != null ? previousPeriodTotalAppointments : 0)
        );
        Double revenueChangePercentage = calculatePercentageChange(
                totalRevenueInPeriod,
                previousPeriodTotalRevenue != null ? previousPeriodTotalRevenue : BigDecimal.ZERO
        );

        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();
        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime endOfToday = today.atTime(LocalTime.MAX);
        WeekFields weekFields = WeekFields.of(Locale.GERMANY);
        LocalDateTime startOfWeek = today.with(weekFields.dayOfWeek(), 1).atStartOfDay();
        LocalDateTime endOfWeek = today.with(weekFields.dayOfWeek(), 7).atTime(LocalTime.MAX);

        LocalDateTime startOfMonthLDT = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonthLDT = today.with(TemporalAdjusters.lastDayOfMonth()).atTime(LocalTime.MAX);

        long todayCount = appointmentRepository.countByStartTimeBetween(startOfToday, endOfToday);
        long thisWeekCount = appointmentRepository.countByStartTimeBetween(startOfWeek, endOfWeek);
        long thisMonthCount = appointmentRepository.countByStartTimeBetween(startOfMonthLDT, endOfMonthLDT);
        long totalUpcomingCount = appointmentRepository.countByStartTimeAfter(now);

        BigDecimal revenueToday = calculateRevenueForPeriod(startOfToday, endOfToday);
        BigDecimal revenueThisWeek = calculateRevenueForPeriod(startOfWeek, endOfWeek);
        BigDecimal revenueThisMonth = calculateRevenueForPeriod(startOfMonthLDT, endOfMonthLDT);

        // --- Berechnung der neuen KPIs ---
        Long uniqueCustomersInPeriod = appointmentRepository.countDistinctCustomersByStartTimeBetween(periodStartDateTime, periodEndDateTime);

        Double customerGrowthPercentage = calculatePercentageChange(
                uniqueCustomersInPeriod != null ? BigDecimal.valueOf(uniqueCustomersInPeriod) : BigDecimal.ZERO,
                previousPeriodUniqueCustomers != null ? BigDecimal.valueOf(previousPeriodUniqueCustomers) : BigDecimal.ZERO
        );

        Long totalDurationMinutes = appointmentRepository.sumDurationMinutesByStartTimeBetween(periodStartDateTime, periodEndDateTime);
        Double averageAppointmentDurationInPeriod = (totalAppointmentsInPeriod > 0 && totalDurationMinutes != null && totalDurationMinutes > 0)
                ? (double) totalDurationMinutes / totalAppointmentsInPeriod
                : null;

        Double avgBookingsPerCustomer = (uniqueCustomersInPeriod != null && uniqueCustomersInPeriod > 0 && totalAppointmentsInPeriod > 0)
                ? (double) totalAppointmentsInPeriod / uniqueCustomersInPeriod
                : null;

        long totalActiveServices = serviceRepository.count();

        // --- Platzhalter/Simulationen für KPIs, die Modelländerungen erfordern ---
        // TODO: Diese Logik durch echte Berechnungen ersetzen, sobald Datenmodell erweitert ist.

        // newBookingsToday & newBookingsYesterday
        // Benötigt ein `createdAt` Feld in der Appointment Entität.
        // Beispiel: Long newBookingsTodayCount = appointmentRepository.countNewAppointmentsCreatedBetween(startOfToday, endOfToday.plusDays(1).minusNanos(1));
        Long newBookingsTodayCount = 0L; // Platzhalter
        Long newBookingsYesterdayCount = 0L; // Platzhalter

        // cancellationRate
        // Benötigt ein `status` Feld in der Appointment Entität (z.B. AppointmentStatus.CANCELLED).
        // Beispiel: Long cancelledInPeriod = appointmentRepository.countCancelledAppointmentsBetween(periodStartDateTime, periodEndDateTime);
        // Double cancellationRateValue = (totalAppointmentsInPeriod > 0 && cancelledInPeriod != null) ? ((double) cancelledInPeriod / (totalAppointmentsInPeriod + cancelledInPeriod)) * 100 : null;
        // (Annahme: totalAppointmentsInPeriod zählt nur nicht-stornierte Termine, oder Formel anpassen)
        Double cancellationRateValue = null; // Platzhalter
        Double previousPeriodCancellationRate = null; // Platzhalter für Vergleich
        Double cancellationRateChangePercentage = calculatePercentageChange(
                cancellationRateValue != null ? BigDecimal.valueOf(cancellationRateValue) : null, // Aktueller Wert
                previousPeriodCancellationRate != null ? BigDecimal.valueOf(previousPeriodCancellationRate) : null, // Vorperiodenwert
                false // Höher ist schlechter für Stornoquote
        );


        // newCustomerShare
        // Benötigt ein `registrationDate` Feld in der Customer Entität und eine Methode, um Neukunden im Zeitraum zu identifizieren.
        // List<Long> customerIdsInPeriod = appointmentRepository.findDistinctCustomerIdsWithAppointmentsBetween(periodStartDateTime, periodEndDateTime);
        // Long newCustomersAmongAttendees = 0L;
        // if (customerIdsInPeriod != null && !customerIdsInPeriod.isEmpty()) {
        //    newCustomersAmongAttendees = customerRepository.countNewCustomersRegisteredBetweenAndInIdList(periodStartDateTime, periodEndDateTime, customerIdsInPeriod); // Hypothetische Methode
        // }
        // Double newCustomerShareValue = (uniqueCustomersInPeriod != null && uniqueCustomersInPeriod > 0 && newCustomersAmongAttendees != null)
        //    ? ((double) newCustomersAmongAttendees / uniqueCustomersInPeriod) * 100
        //    : null;
        Double newCustomerShareValue = null; // Platzhalter
        Double previousPeriodNewCustomerShare = null; // Platzhalter für Vergleich
        Double newCustomerShareChangePercentage = calculatePercentageChange(
                newCustomerShareValue != null ? BigDecimal.valueOf(newCustomerShareValue) : null,
                previousPeriodNewCustomerShare != null ? BigDecimal.valueOf(previousPeriodNewCustomerShare) : null
        );


        // avgBookingLeadTime
        // Benötigt ein `createdAt` Feld in der Appointment Entität.
        // Beispiel: Double avgLeadTime = appointmentRepository.getAverageBookingLeadTimeInDays(periodStartDateTime, periodEndDateTime);
        // Integer avgBookingLeadTimeValue = (avgLeadTime != null) ? (int) Math.round(avgLeadTime) : null;
        Integer avgBookingLeadTimeValue = null; // Platzhalter

        BigDecimal projectedRevenueNext30DaysValue = null;
        if (totalRevenueInPeriod != null && daysInPeriod > 0) {
            BigDecimal dailyAvgRevenue = totalRevenueInPeriod.divide(BigDecimal.valueOf(daysInPeriod), 2, RoundingMode.HALF_UP);
            projectedRevenueNext30DaysValue = dailyAvgRevenue.multiply(BigDecimal.valueOf(30));
        }

        // Erstellen des DTO-Objekts
        DetailedAppointmentStatsDTO dto = new DetailedAppointmentStatsDTO(
                totalAppointmentsInPeriod, totalRevenueInPeriod,
                startDate.format(GERMAN_DATE_FORMATTER), endDate.format(GERMAN_DATE_FORMATTER),
                todayCount, thisWeekCount, thisMonthCount, totalUpcomingCount,
                revenueToday, revenueThisWeek, revenueThisMonth
        );

        // Setzen der Vergleichswerte und Prozentänderungen
        dto.setPreviousPeriodTotalAppointments(previousPeriodTotalAppointments);
        dto.setPreviousPeriodTotalRevenue(previousPeriodTotalRevenue);
        dto.setAppointmentCountChangePercentage(appointmentCountChangePercentage);
        dto.setRevenueChangePercentage(revenueChangePercentage);

        // Setzen der neuen KPIs
        dto.setUniqueCustomersInPeriod(uniqueCustomersInPeriod);
        dto.setPreviousPeriodUniqueCustomers(previousPeriodUniqueCustomers);
        dto.setCustomerGrowthPercentage(customerGrowthPercentage);
        dto.setAverageAppointmentDurationInPeriod(averageAppointmentDurationInPeriod);
        dto.setAvgBookingsPerCustomer(avgBookingsPerCustomer);
        dto.setNewBookingsToday(newBookingsTodayCount);
        dto.setNewBookingsYesterday(newBookingsYesterdayCount);
        dto.setTotalActiveServices(totalActiveServices);
        dto.setCancellationRate(cancellationRateValue);
        dto.setPreviousPeriodCancellationRate(previousPeriodCancellationRate); // Für Frontend-Vergleich
        dto.setCancellationRateChangePercentage(cancellationRateChangePercentage);
        dto.setNewCustomerShare(newCustomerShareValue);
        dto.setPreviousPeriodNewCustomerShare(previousPeriodNewCustomerShare); // Für Frontend-Vergleich
        dto.setNewCustomerShareChangePercentage(newCustomerShareChangePercentage);
        dto.setAvgBookingLeadTime(avgBookingLeadTimeValue);
        dto.setProjectedRevenueNext30Days(projectedRevenueNext30DaysValue);

        return dto;
    }

    // Überladene Methode für calculatePercentageChange, um die "isGrowthGood" Logik zu handhaben
    private Double calculatePercentageChange(BigDecimal currentValue, BigDecimal previousValue) {
        return calculatePercentageChange(currentValue, previousValue, true); // Standard: Wachstum ist gut
    }
    private Double calculatePercentageChange(BigDecimal currentValue, BigDecimal previousValue, boolean isGrowthGood) {
        if (currentValue == null) currentValue = BigDecimal.ZERO;
        if (previousValue == null) previousValue = BigDecimal.ZERO;

        if (previousValue.compareTo(BigDecimal.ZERO) == 0) {
            if (currentValue.compareTo(BigDecimal.ZERO) == 0) return 0.0; // Beide 0 -> 0% Änderung
            return null; // Unendlicher Anstieg/Abfall, wenn Vorperiode 0 war und aktuelle Periode nicht
        }
        BigDecimal difference = currentValue.subtract(previousValue);
        return difference.divide(previousValue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue();
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
        LocalDateTime upcomingEndRange = today.plusDays(6).atTime(LocalTime.MAX);

        logger.info("Suche tägliche Termine von {} bis {}", todayStart, upcomingEndRange);
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
                        status = appointmentDate.format(DateTimeFormatter.ofPattern("EE dd.MM.", Locale.GERMAN));
                    }
                    return new DailyAppointmentsDTO(
                            apt.getId(),
                            appointmentDate,
                            apt.getStartTime().toLocalTime(),
                            apt.getService() != null ? apt.getService().getName() : "N/A",
                            apt.getCustomer() != null ? apt.getCustomer().getFirstName() : "N/A",
                            apt.getCustomer() != null ? apt.getCustomer().getLastName() : "",
                            status
                    );
                })
                .collect(Collectors.toList());
    }
    public List<AppointmentsPerDayOfWeekDTO> getAppointmentsPerDayOfWeek(LocalDate startDate, LocalDate endDate) {
        LocalDateTime periodStartDateTime = startDate.atStartOfDay();
        LocalDateTime periodEndDateTime = endDate.atTime(LocalTime.MAX);

        logger.info("Suche Termine pro Wochentag von {} bis {}", periodStartDateTime, periodEndDateTime);
        List<Map<String, Object>> results = appointmentRepository.countAppointmentsPerDayOfWeekBetweenNative(periodStartDateTime, periodEndDateTime);

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
            try {
                dayOfWeekFromDb = ((Number) dayOfWeekFromDbObj).intValue();
            } catch (ClassCastException e) {
                logger.error("Fehler beim Casten von DAYOFWEEK: {} mit Wert: {}", dayOfWeekFromDbObj.getClass(), dayOfWeekFromDbObj, e);
                return;
            }

            DayOfWeek actualDayOfWeek;
            switch (dayOfWeekFromDb) {
                case 1: actualDayOfWeek = DayOfWeek.SUNDAY; break;
                case 2: actualDayOfWeek = DayOfWeek.MONDAY; break;
                case 3: actualDayOfWeek = DayOfWeek.TUESDAY; break;
                case 4: actualDayOfWeek = DayOfWeek.WEDNESDAY; break;
                case 5: actualDayOfWeek = DayOfWeek.THURSDAY; break;
                case 6: actualDayOfWeek = DayOfWeek.FRIDAY; break;
                case 7: actualDayOfWeek = DayOfWeek.SATURDAY; break;
                default:
                    logger.warn("Ungültiger Wochentagswert aus DB: {}", dayOfWeekFromDb);
                    return;
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


    public List<AppointmentsPerServiceDTO> getAppointmentsPerService(LocalDate startDate, LocalDate endDate, int topN) {
        LocalDateTime periodStartDateTime = startDate.atStartOfDay();
        LocalDateTime periodEndDateTime = endDate.atTime(LocalTime.MAX);

        logger.info("Suche Termine pro Service von {} bis {}", periodStartDateTime, periodEndDateTime);
        List<Map<String, Object>> results = appointmentRepository.countAppointmentsPerServiceBetween(periodStartDateTime, periodEndDateTime);

        if (results == null || results.isEmpty()) {
            logger.info("Keine Termine für Service-Statistik im Zeitraum gefunden.");
            return Collections.emptyList();
        }

        long totalAppointmentsInPeriod = results.stream().mapToLong(r -> {
            Object countObj = r.get("COUNT");
            if (countObj == null) countObj = r.get("count");
            if (countObj instanceof Number) return ((Number) countObj).longValue();
            return 0L;
        }).sum();

        return results.stream()
                .sorted((r1, r2) -> {
                    long count1 = ((Number) (r1.get("COUNT") != null ? r1.get("COUNT") : r1.getOrDefault("count", 0L))).longValue();
                    long count2 = ((Number) (r2.get("COUNT") != null ? r2.get("COUNT") : r2.getOrDefault("count", 0L))).longValue();
                    return Long.compare(count2, count1);
                })
                .limit(topN)
                .map(result -> {
                    Object serviceNameObj = result.get("SERVICENAME");
                    if (serviceNameObj == null) serviceNameObj = result.get("serviceName");
                    if (serviceNameObj == null) serviceNameObj = result.get("name");

                    Object countObj = result.get("COUNT");
                    if (countObj == null) countObj = result.get("count");

                    String serviceName = (serviceNameObj instanceof String) ? (String) serviceNameObj : "Unbekannt";
                    long count = (countObj instanceof Number) ? ((Number) countObj).longValue() : 0L;

                    double percentage = totalAppointmentsInPeriod > 0 ? ( (double) count / totalAppointmentsInPeriod) * 100 : 0;
                    return new AppointmentsPerServiceDTO(serviceName, count, Math.round(percentage * 100.0) / 100.0);
                })
                .collect(Collectors.toList());
    }

    public List<RevenueDataPointDTO> getRevenueOverTime(LocalDate startDate, LocalDate endDate) {
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);
        logger.info("Berechne Umsatzentwicklung für Zeitraum: {} bis {}", startDate, endDate);

        List<Map<String, Object>> results = appointmentRepository.findRevenuePerDayBetween(startDateTime, endDateTime);
        List<RevenueDataPointDTO> revenueDataPoints = new ArrayList<>();

        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            final LocalDate finalCurrentDate = currentDate;
            Optional<Map<String, Object>> dayData = results.stream()
                    .filter(r -> {
                        Object dateObj = r.get("APPOINTMENT_DATE");
                        if (dateObj == null) dateObj = r.get("appointment_date");
                        if (dateObj instanceof java.sql.Date) {
                            return ((java.sql.Date) dateObj).toLocalDate().isEqual(finalCurrentDate);
                        } else if (dateObj instanceof LocalDate) {
                            return ((LocalDate)dateObj).isEqual(finalCurrentDate);
                        }
                        logger.warn("Unerwarteter Datumstyp in getRevenueOverTime: {}", dateObj != null ? dateObj.getClass().getName() : "null");
                        return false;
                    })
                    .findFirst();

            BigDecimal revenue = dayData.map(data -> {
                Object revenueObj = data.get("DAILY_REVENUE");
                if (revenueObj == null) revenueObj = data.get("daily_revenue");
                return (revenueObj instanceof Number) ? new BigDecimal(((Number) revenueObj).toString()) : BigDecimal.ZERO;
            }).orElse(BigDecimal.ZERO);

            revenueDataPoints.add(new RevenueDataPointDTO(currentDate, revenue));
            currentDate = currentDate.plusDays(1);
        }
        logger.info("Umsatzentwicklung berechnet: {} Datenpunkte", revenueDataPoints.size());
        return revenueDataPoints;
    }

    public CapacityUtilizationDTO getCapacityUtilization(LocalDate startDate, LocalDate endDate) {
        logger.info("Berechne Kapazitätsauslastung für Zeitraum: {} bis {}", startDate, endDate);
        long totalAvailableMinutes = 0;
        long totalBookedMinutes = 0;

        List<WorkingHours> allWorkingHours = workingHoursRepository.findAll();
        Map<DayOfWeek, WorkingHours> workingHoursMap = allWorkingHours.stream()
                .collect(Collectors.toMap(WorkingHours::getDayOfWeek, wh -> wh));

        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            WorkingHours wh = workingHoursMap.get(currentDate.getDayOfWeek());
            if (wh != null && !wh.isClosed() && wh.getStartTime() != null && wh.getEndTime() != null) {
                long dailyAvailableMinutes = Duration.between(wh.getStartTime(), wh.getEndTime()).toMinutes();

                List<BlockedTimeSlot> blocksOnThisDate = blockedTimeSlotService.getBlocksForDate(currentDate);
                for (BlockedTimeSlot block : blocksOnThisDate) {
                    LocalTime effectiveBlockStart = block.getStartTime().isBefore(wh.getStartTime()) ? wh.getStartTime() : block.getStartTime();
                    LocalTime effectiveBlockEnd = block.getEndTime().isAfter(wh.getEndTime()) ? wh.getEndTime() : block.getEndTime();

                    if (effectiveBlockEnd.isAfter(effectiveBlockStart)) {
                        dailyAvailableMinutes -= Duration.between(effectiveBlockStart, effectiveBlockEnd).toMinutes();
                    }
                }
                totalAvailableMinutes += Math.max(0, dailyAvailableMinutes);
            }

            List<Appointment> appointmentsOnDate = appointmentRepository.findByStartTimeBetween(currentDate.atStartOfDay(), currentDate.atTime(LocalTime.MAX));
            for (Appointment app : appointmentsOnDate) {
                if (app.getService() != null) {
                    totalBookedMinutes += app.getService().getDurationMinutes();
                }
            }
            currentDate = currentDate.plusDays(1);
        }

        double utilizationPercentage = 0;
        if (totalAvailableMinutes > 0) {
            utilizationPercentage = ((double) totalBookedMinutes / totalAvailableMinutes) * 100;
        }

        logger.info("Kapazitätsauslastung: {}% (Gebucht: {} Min, Verfügbar: {} Min)",
                String.format("%.2f", utilizationPercentage), totalBookedMinutes, totalAvailableMinutes);

        return new CapacityUtilizationDTO(
                Math.round(utilizationPercentage * 100.0) / 100.0,
                totalAvailableMinutes,
                totalBookedMinutes,
                startDate.format(GERMAN_DATE_FORMATTER),
                endDate.format(GERMAN_DATE_FORMATTER)
        );
    }
}
