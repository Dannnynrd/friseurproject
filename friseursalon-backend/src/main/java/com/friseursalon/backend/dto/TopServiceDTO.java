package com.friseursalon.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TopServiceDTO {
    private Long serviceId;
    private String name;
    private String description;
    private long totalBookings;
    private BigDecimal totalRevenue;
}