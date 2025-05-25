package com.friseursalon.backend.payload.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SignupRequest {
    // @NotBlank // DIESE ZEILE ENTFERNEN
    // @Size(min = 3, max = 20) // DIESE ZEILE ENTFERNEN
    // private String username; // DIESE ZEILE ENTFERNEN

    @NotBlank
    @Size(max = 50)
    @Email
    private String email; // Bleibt bestehen

    @NotBlank
    @Size(min = 6, max = 40)
    private String password; // Bleibt bestehen

    // NEUE FELDER HINZUFÜGEN
    @NotBlank
    private String firstName;
    @NotBlank
    private String lastName;
    private String phoneNumber; // Optional, kein @NotBlank

    private Set<String> role;
}