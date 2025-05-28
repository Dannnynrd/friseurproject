// src/main/java/com/friseursalon/backend/dto/DetailedAppointmentStatsDTO.java
package com.friseursalon.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
// import java.util.List; // Nicht mehr direkt hier benötigt

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetailedAppointmentStatsDTO {
    // KPIs für den ausgewählten Zeitraum
    private long totalAppointmentsInPeriod;
    private BigDecimal totalRevenueInPeriod;

    // Formattierte Daten für die Anzeige des aktuellen Zeitraums
    private String periodStartDateFormatted;
    private String periodEndDateFormatted;

    // Vergleichsdaten für die Vorperiode
    private Long previousPeriodTotalAppointments; // Long, um null zu erlauben, falls keine Vorperiode vorhanden/berechnet
    private BigDecimal previousPeriodTotalRevenue; // BigDecimal, um null zu erlauben

    // Prozentuale Änderungen
    private Double appointmentCountChangePercentage; // Double für Prozentwerte
    private Double revenueChangePercentage;

    // Bestehende Zählungen für nicht-filterbare Bereiche (z.B. "Alle Bevorstehenden")
    // Diese könnten auch in ein separates DTO ausgelagert werden, wenn die Übersicht zu komplex wird.
    // Fürs Erste behalten wir sie hier, falls sie noch global auf dem Dashboard angezeigt werden sollen.
    private long todayCount; // Könnte auch aus totalAppointmentsInPeriod abgeleitet werden, wenn Periode "heute" ist
    private long thisWeekCount;
    private long thisMonthCount;
    private long totalUpcomingCount; // Bleibt relevant und unabhängig vom Filter

    private BigDecimal revenueToday; // Könnte auch aus totalRevenueInPeriod abgeleitet werden
    private BigDecimal revenueThisWeek;
    private BigDecimal revenueThisMonth;

    // Konstruktor für den Fall, dass keine Vergleichsdaten vorhanden sind
    public DetailedAppointmentStatsDTO(long totalAppointmentsInPeriod, BigDecimal totalRevenueInPeriod,
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
        // Vergleichswerte und Prozentzahlen bleiben null/Standard
    }
}
