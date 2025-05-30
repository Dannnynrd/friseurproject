package com.friseursalon.backend.model;

public enum AppointmentStatus {
    PENDING,    // Termin angefragt, noch nicht bestätigt (optional)
    CONFIRMED,  // Termin bestätigt
    CANCELLED,  // Termin storniert
    COMPLETED   // Termin abgeschlossen
}
