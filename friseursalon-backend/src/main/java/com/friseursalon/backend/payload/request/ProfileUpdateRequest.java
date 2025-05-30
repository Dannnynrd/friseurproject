// src/main/java/com/friseursalon/backend/payload/request/ProfileUpdateRequest.java
package com.friseursalon.backend.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProfileUpdateRequest {

    @NotBlank
    @Size(min = 1, max = 50)
    private String firstName;

    @NotBlank
    @Size(min = 1, max = 50)
    private String lastName;

    @Size(max = 20)
    private String phoneNumber; // Optional
}