// friseursalon-backend/src/main/java/com/friseursalon/backend/payload/request/ResetPasswordRequest.java
package com.friseursalon.backend.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank
    private String token;

    @NotBlank
    @Size(min = 6, max = 40)
    private String newPassword;
}