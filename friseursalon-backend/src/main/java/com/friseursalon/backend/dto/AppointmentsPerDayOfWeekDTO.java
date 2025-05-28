package com.friseursalon.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.DayOfWeek;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentsPerDayOfWeekDTO {
    private DayOfWeek dayOfWeek;
    private String dayName; // z.B. "Montag"
    private long appointmentCount;
}