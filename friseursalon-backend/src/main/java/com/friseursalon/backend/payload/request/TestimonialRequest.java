package com.friseursalon.backend.payload.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TestimonialRequest {

    private String customerName; // Für Gäste oder wenn Admin manuell eingibt

    @NotNull(message = "Bewertung (Rating) darf nicht leer sein.")
    @Min(value = 1, message = "Bewertung muss zwischen 1 und 5 liegen.")
    @Max(value = 5, message = "Bewertung muss zwischen 1 und 5 liegen.")
    private Integer rating;

    @NotBlank(message = "Kommentar darf nicht leer sein.")
    @Size(min = 10, max = 1000, message = "Kommentar muss zwischen 10 und 1000 Zeichen lang sein.")
    private String comment;

    private Long serviceId; // Optional: ID der bewerteten Dienstleistung
}