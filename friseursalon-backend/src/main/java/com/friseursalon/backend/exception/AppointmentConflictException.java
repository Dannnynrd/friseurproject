package com.friseursalon.backend.exception; // Geändert

public class AppointmentConflictException extends RuntimeException {
    public AppointmentConflictException(String message) {
        super(message);
    }
}