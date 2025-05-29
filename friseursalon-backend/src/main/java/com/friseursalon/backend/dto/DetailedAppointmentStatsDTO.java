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
    private Long previousPeriodUniqueCustomers; // Für Kundenwachstum Vergleich

    // Prozentuale Änderungen
    private Double appointmentCountChangePercentage;
    private Double revenueChangePercentage;
    private Double customerGrowthPercentage;    // z.B. +5.0 (%)

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
    private Double averageAppointmentDurationInPeriod; // in Minuten
    private Double avgBookingsPerCustomer;      // z.B. 1.5
    private Long newBookingsToday;              // Anzahl heute erstellter Termine (benötigt createdAt in Appointment)
    private Long newBookingsYesterday;          // Anzahl gestern erstellter Termine (benötigt createdAt in Appointment)
    private Long totalActiveServices;
    private Double cancellationRate;            // z.B. 5.0 (%) - Benötigt Status im Appointment-Modell
    private Double newCustomerShare;            // z.B. 10.0 (%) - Benötigt Erstellungsdatum für Kunden
    private Integer avgBookingLeadTime;         // in Tagen - Benötigt Erstellungsdatum für Termine vs. Terminstart
    private BigDecimal projectedRevenueNext30Days; // Umsatzprognose

    // Basiskonstruktor, der im Service verwendet wird, um das Objekt zu initialisieren
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
        // Die anderen Felder werden im Service separat gesetzt.
    }
}
