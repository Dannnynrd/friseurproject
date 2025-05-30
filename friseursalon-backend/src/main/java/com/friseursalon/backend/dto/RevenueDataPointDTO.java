// Datei: friseursalon-backend/src/main/java/com/friseursalon/backend/dto/RevenueDataPointDTO.java
package com.friseursalon.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RevenueDataPointDTO {
    private LocalDate date;
    private BigDecimal revenue;
}