package com.friseursalon.backend.service;

import com.friseursalon.backend.exception.AppointmentConflictException;
import com.friseursalon.backend.model.Appointment;
import com.friseursalon.backend.model.Service;
import com.friseursalon.backend.repository.AppointmentRepository;
import com.friseursalon.backend.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.stereotype.Service; // already there

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
// import java.util.stream.Collectors; // Not strictly needed for this method

@org.springframework.stereotype.Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ServiceRepository serviceRepository;

    @Autowired
    public AppointmentService(AppointmentRepository appointmentRepository, ServiceRepository serviceRepository) {
        this.appointmentRepository = appointmentRepository;
        this.serviceRepository = serviceRepository;
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

    private LocalDateTime calculateEndTime(LocalDateTime startTime, int durationMinutes) {
        if (startTime == null) {
            throw new IllegalArgumentException("Startzeit darf nicht null sein für die Endzeitberechnung.");
        }
        return startTime.plusMinutes(durationMinutes);
    }

    private boolean hasConflict(Appointment appointmentToCheck, Service serviceDetails) {
        if (appointmentToCheck.getStartTime() == null || serviceDetails == null) {
            throw new IllegalArgumentException("Startzeit und Service-Details dürfen für die Konfliktprüfung nicht null sein.");
        }

        int duration = serviceDetails.getDurationMinutes();
        LocalDateTime proposedStartTime = appointmentToCheck.getStartTime();
        LocalDateTime proposedEndTime = calculateEndTime(proposedStartTime, duration);
        Long excludeId = appointmentToCheck.getId();

        List<Appointment> conflictingAppointments = appointmentRepository.findConflictingAppointments(
                proposedStartTime, proposedEndTime, excludeId
        );
        return !conflictingAppointments.isEmpty();
    }

    public Appointment createAppointment(Appointment appointment) {
        if (appointment.getService() == null || appointment.getService().getId() == null) {
            throw new IllegalArgumentException("Service-ID darf nicht null sein, um einen Termin zu erstellen.");
        }
        Service serviceDetails = serviceRepository.findById(appointment.getService().getId())
                .orElseThrow(() -> new RuntimeException("Dienstleistung nicht gefunden für ID: " + appointment.getService().getId()));
        appointment.setService(serviceDetails);

        if (hasConflict(appointment, serviceDetails)) {
            throw new AppointmentConflictException("Terminkonflikt: Der gewählte Zeitpunkt ist bereits belegt.");
        }
        return appointmentRepository.save(appointment);
    }

    public Appointment updateAppointment(Long id, Appointment appointmentDetails) {
        Appointment appointmentToUpdate = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Termin nicht gefunden für diese ID :: " + id));

        if (appointmentDetails.getService() == null || appointmentDetails.getService().getId() == null) {
            throw new IllegalArgumentException("Service-ID darf nicht null sein, um einen Termin zu aktualisieren.");
        }
        Service serviceDetails = serviceRepository.findById(appointmentDetails.getService().getId())
                .orElseThrow(() -> new RuntimeException("Dienstleistung nicht gefunden für ID: " + appointmentDetails.getService().getId()));

        appointmentDetails.setId(id); // Wichtig für die Konfliktprüfung beim Update

        if (hasConflict(appointmentDetails, serviceDetails)) {
            throw new AppointmentConflictException("Terminkonflikt: Der gewählte Zeitpunkt für die Aktualisierung ist bereits belegt.");
        }

        appointmentToUpdate.setStartTime(appointmentDetails.getStartTime());
        appointmentToUpdate.setService(serviceDetails);
        appointmentToUpdate.setCustomer(appointmentDetails.getCustomer());
        appointmentToUpdate.setNotes(appointmentDetails.getNotes());

        return appointmentRepository.save(appointmentToUpdate);
    }

    public void deleteAppointment(Long id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Termin nicht gefunden für diese ID :: " + id));
        appointmentRepository.delete(appointment);
    }

    public List<String> getAvailableSlotsForServiceOnDate(Long serviceId, LocalDate date) {
        System.out.println("Service: getAvailableSlotsForServiceOnDate called with serviceId: " + serviceId + ", date: " + date);

        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Dienstleistung nicht gefunden für ID: " + serviceId));
        int duration = service.getDurationMinutes();

        if (duration <= 0) {
            throw new IllegalArgumentException("Die Dauer der Dienstleistung muss positiv sein.");
        }

        // Annahme: Feste Öffnungszeiten (könnte später konfigurierbar gemacht werden)
        LocalTime openingTime = LocalTime.of(9, 0);
        LocalTime closingTime = LocalTime.of(18, 0); // Letzter möglicher Start, sodass der Termin um 18:00 endet
        int slotInterval = 30; // Intervall für mögliche Startzeiten in Minuten

        List<String> availableSlots = new ArrayList<>();

        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.atTime(LocalTime.MAX); // Ende des Tages
        List<Appointment> appointmentsOnDate = appointmentRepository.findByStartTimeBetween(dayStart, dayEnd);
        System.out.println("Found " + appointmentsOnDate.size() + " appointments for date " + date);


        LocalTime currentTimeSlot = openingTime;
        // Der letzte mögliche Startslot muss so sein, dass der Termin (currentTimeSlot + duration) nicht nach closingTime endet.
        while (currentTimeSlot.plusMinutes(duration).isBefore(closingTime) || currentTimeSlot.plusMinutes(duration).equals(closingTime)) {
            LocalDateTime proposedStartTime = date.atTime(currentTimeSlot);
            LocalDateTime proposedEndTime = proposedStartTime.plusMinutes(duration);

            // Prüfen, ob der Slot in der Vergangenheit liegt (nur für den aktuellen Tag relevant)
            if (date.isEqual(LocalDate.now()) && proposedStartTime.isBefore(LocalDateTime.now().plusMinutes(1))) { // +1 Minute Puffer
                System.out.println("Skipping past slot: " + proposedStartTime);
                currentTimeSlot = currentTimeSlot.plusMinutes(slotInterval);
                continue;
            }

            boolean conflict = false;
            for (Appointment existingAppointment : appointmentsOnDate) {
                LocalDateTime existingStartTime = existingAppointment.getStartTime();
                Service existingService = existingAppointment.getService(); // Annahme: Service ist hier geladen
                if(existingService == null || existingService.getId() == null) { // Fallback, falls Service nicht voll geladen
                    existingService = serviceRepository.findById(existingAppointment.getService().getId())
                            .orElseThrow(() -> new RuntimeException("Service für bestehenden Termin nicht gefunden."));
                }
                LocalDateTime existingEndTime = existingStartTime.plusMinutes(existingService.getDurationMinutes());

                if (proposedStartTime.isBefore(existingEndTime) && proposedEndTime.isAfter(existingStartTime)) {
                    System.out.println("Conflict for slot " + proposedStartTime + " with existing appointment " + existingAppointment.getId() + " (" + existingStartTime + " - " + existingEndTime + ")");
                    conflict = true;
                    break;
                }
            }

            if (!conflict) {
                availableSlots.add(String.format("%02d:%02d", currentTimeSlot.getHour(), currentTimeSlot.getMinute()));
            } else {
                System.out.println("Slot " + String.format("%02d:%02d", currentTimeSlot.getHour(), currentTimeSlot.getMinute()) + " on " + date + " is conflicting.");
            }
            currentTimeSlot = currentTimeSlot.plusMinutes(slotInterval);
        }
        System.out.println("Returning available slots for " + date + ": " + availableSlots);
        return availableSlots;
    }
}