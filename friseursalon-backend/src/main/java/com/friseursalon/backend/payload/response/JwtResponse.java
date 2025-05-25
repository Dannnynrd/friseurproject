package com.friseursalon.backend.payload.response;

import lombok.Data;

import java.util.List;

@Data
public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    // private String username; // DIESE ZEILE ENTFERNEN, da Email jetzt der Username ist
    private String email;
    private String firstName; // NEUES FELD
    private String lastName;  // NEUES FELD
    private String phoneNumber; // NEUES FELD
    private List<String> roles;

    // Konstruktor anpassen
    public JwtResponse(String accessToken, Long id, String email, String firstName, String lastName, String phoneNumber, List<String> roles) {
        this.token = accessToken;
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.roles = roles;
    }
}