package com.friseursalon.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentsByHourDTO {
    private int hour; // Stunde des Tages (0-23)
    private long appointmentCount; // Anzahl der Termine in dieser Stunde
}
