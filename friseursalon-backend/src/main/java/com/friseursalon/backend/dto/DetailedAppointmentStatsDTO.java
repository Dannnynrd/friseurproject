package com.friseursalon.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetailedAppointmentStatsDTO {
    // Bestehende Zählungen
    private long todayCount;
    private long thisWeekCount;
    private long thisMonthCount;
    private long totalUpcomingCount;

    // Neue Umsatzstatistiken
    private BigDecimal revenueToday;
    private BigDecimal revenueThisWeek;
    private BigDecimal revenueThisMonth;

    // Optional: Weitere detaillierte Statistiken
    // private long newCustomersThisMonth; // Beispiel für zukünftige Erweiterung
}