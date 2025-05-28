// src/main/java/com/friseursalon/backend/dto/AppointmentStatsDTO.java
package com.friseursalon.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentStatsDTO {
    private long todayCount;
    private long thisWeekCount;
    private long thisMonthCount;
    private long totalUpcomingCount;
}