package com.friseursalon.backend.service;

import com.friseursalon.backend.model.Appointment;
import com.friseursalon.backend.repository.AppointmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;

    @Autowired
    public AppointmentService(AppointmentRepository appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public List<Appointment> getAppointmentsForDateRange(LocalDateTime start, LocalDateTime end) {
        return appointmentRepository.findByStartTimeBetween(start, end);
    }

    public Optional<Appointment> getAppointmentById(Long id) {
        return appointmentRepository.findById(id);
    }

    public Appointment createAppointment(Appointment appointment) {
        // Hier könnte man noch Logik einfügen, um zu prüfen, ob der Termin verfügbar ist.
        return appointmentRepository.save(appointment);
    }

    public Appointment updateAppointment(Long id, Appointment appointmentDetails) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Termin nicht gefunden für diese ID :: " + id));

        appointment.setStartTime(appointmentDetails.getStartTime());
        // appointment.setEndTime(appointmentDetails.getEndTime()); // Wenn du endTime hättest
        appointment.setService(appointmentDetails.getService());
        appointment.setCustomer(appointmentDetails.getCustomer());
        appointment.setNotes(appointmentDetails.getNotes());

        return appointmentRepository.save(appointment);
    }

    public void deleteAppointment(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Termin nicht gefunden für diese ID :: " + id));
        appointmentRepository.delete(appointment);
    }
}