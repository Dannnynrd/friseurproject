// src/main/java/com/friseursalon/backend/dto/DetailedAppointmentStatsDTO.java
package com.friseursalon.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetailedAppointmentStatsDTO {
    // KPIs für den ausgewählten Zeitraum
    private long totalAppointmentsInPeriod;
    private BigDecimal totalRevenueInPeriod;

    // Formatierte Daten für die Anzeige des aktuellen Zeitraums
    private String periodStartDateFormatted;
    private String periodEndDateFormatted;

    // Vergleichsdaten für die Vorperiode
    private Long previousPeriodTotalAppointments;
    private BigDecimal previousPeriodTotalRevenue;
    private Long previousPeriodUniqueCustomers;
    private Double previousPeriodCancellationRate;
    private Double previousPeriodNewCustomerShare;

    // Prozentuale Änderungen
    private Double appointmentCountChangePercentage;
    private Double revenueChangePercentage;
    private Double customerGrowthPercentage;
    private Double cancellationRateChangePercentage;
    private Double newCustomerShareChangePercentage;


    // Bestehende Zählungen für nicht-filterbare Bereiche
    private long todayCount;
    private long thisWeekCount;
    private long thisMonthCount;
    private long totalUpcomingCount;

    private BigDecimal revenueToday;
    private BigDecimal revenueThisWeek;
    private BigDecimal revenueThisMonth;

    // Erweiterte KPIs
    private Long uniqueCustomersInPeriod;
    private Double averageAppointmentDurationInPeriod;
    private Double avgBookingsPerCustomer;
    private Long newBookingsToday;
    private Long newBookingsYesterday;
    private Long totalActiveServices;
    private Double cancellationRate;
    private Double newCustomerShare;
    private Integer avgBookingLeadTime;
    private BigDecimal projectedRevenueNext30Days;

    // Konstruktor für Basiszahlen
    public DetailedAppointmentStatsDTO(
            long totalAppointmentsInPeriod, BigDecimal totalRevenueInPeriod,
            String periodStartDateFormatted, String periodEndDateFormatted,
            long todayCount, long thisWeekCount, long thisMonthCount,
            long totalUpcomingCount, BigDecimal revenueToday,
            BigDecimal revenueThisWeek, BigDecimal revenueThisMonth) {
        this.totalAppointmentsInPeriod = totalAppointmentsInPeriod;
        this.totalRevenueInPeriod = totalRevenueInPeriod;
        this.periodStartDateFormatted = periodStartDateFormatted;
        this.periodEndDateFormatted = periodEndDateFormatted;
        this.todayCount = todayCount;
        this.thisWeekCount = thisWeekCount;
        this.thisMonthCount = thisMonthCount;
        this.totalUpcomingCount = totalUpcomingCount;
        this.revenueToday = revenueToday;
        this.revenueThisWeek = revenueThisWeek;
        this.revenueThisMonth = revenueThisMonth;
    }
}
