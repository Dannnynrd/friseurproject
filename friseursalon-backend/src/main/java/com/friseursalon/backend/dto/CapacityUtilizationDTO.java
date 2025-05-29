// Datei: friseursalon-backend/src/main/java/com/friseursalon/backend/dto/CapacityUtilizationDTO.java
package com.friseursalon.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CapacityUtilizationDTO {
    private double utilizationPercentage; // Auslastung in Prozent
    private long totalAvailableMinutes;   // Gesamt verfügbare Minuten im Zeitraum
    private long totalBookedMinutes;      // Gesamt gebuchte Minuten im Zeitraum
    private String periodStartDate;       // Formatiertes Startdatum des Zeitraums
    private String periodEndDate;         // Formatiertes Enddatum des Zeitraums
}