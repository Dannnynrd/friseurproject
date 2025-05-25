package com.friseursalon.backend.payload.request;

import jakarta.validation.constraints.NotBlank; // Für Validierung (später optional nutzbar)
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    @NotBlank // Stellt sicher, dass das Feld nicht leer ist
    private String username;

    @NotBlank
    private String password;
}