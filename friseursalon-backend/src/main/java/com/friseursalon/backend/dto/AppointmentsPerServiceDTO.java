package com.friseursalon.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentsPerServiceDTO {
    private String serviceName;
    private long appointmentCount;
    private double percentage; // Optional: Prozentualer Anteil
}