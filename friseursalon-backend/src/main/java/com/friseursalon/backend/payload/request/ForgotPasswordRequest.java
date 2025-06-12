// friseursalon-backend/src/main/java/com/friseursalon/backend/payload/request/ForgotPasswordRequest.java
package com.friseursalon.backend.payload.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @NotBlank
    @Email
    private String email;
}