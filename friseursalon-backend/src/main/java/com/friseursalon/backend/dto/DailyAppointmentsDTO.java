package com.friseursalon.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate; // Hinzugefügt
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyAppointmentsDTO {
    private Long appointmentId;
    private LocalDate appointmentDate; // NEU
    private LocalTime startTime;
    private String serviceName;
    private String customerFirstName;
    private String customerLastName;
    private String status;
}