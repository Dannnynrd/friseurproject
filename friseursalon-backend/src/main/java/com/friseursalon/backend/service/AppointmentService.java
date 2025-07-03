// Datei: friseursalon-backend/src/main/java/com/friseursalon/backend/service/AppointmentService.java
package com.friseursalon.backend.service;

import com.friseursalon.backend.dto.DailyAppointmentsDTO;
import com.friseursalon.backend.model.Appointment;
import com.friseursalon.backend.model.AppointmentStatus;
import com.friseursalon.backend.model.BlockedTimeSlot;
import com.friseursalon.backend.model.Service;
import com.friseursalon.backend.model.WorkingHours;
import com.friseursalon.backend.repository.AppointmentRepository;
import com.friseursalon.backend.repository.ServiceRepository;
import com.friseursalon.backend.exception.AppointmentConflictException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional; // HINZUGEFÜGT: Fehlender Import

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class AppointmentService {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentService.class);

    private final AppointmentRepository appointmentRepository;
    private final ServiceRepository serviceRepository;
    private final WorkingHoursService workingHoursService;
    private final BlockedTimeSlotService blockedTimeSlotService;

    @Autowired
    public AppointmentService(AppointmentRepository appointmentRepository,
                              ServiceRepository serviceRepository,
                              WorkingHoursService workingHoursService,
                              BlockedTimeSlotService blockedTimeSlotService) {
        this.appointmentRepository = appointmentRepository;
        this.serviceRepository = serviceRepository;
        this.workingHoursService = workingHoursService;
        this.blockedTimeSlotService = blockedTimeSlotService;
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public List<Appointment> getAllAppointmentsSorted() {
        return appointmentRepository.findAll().stream()
                .sorted(Comparator.comparing(Appointment::getStartTime))
                .collect(Collectors.toList());
    }


    public List<Appointment> getAppointmentsForDateRange(LocalDateTime start, LocalDateTime end) {
        return appointmentRepository.findByStartTimeBetween(start, end);
    }

    public Optional<Appointment> getAppointmentById(Long id) {
        return appointmentRepository.findById(id);
    }

    public List<Appointment> getAppointmentsByCustomerEmail(String email) {
        return appointmentRepository.findByCustomerEmailOrderByStartTimeAsc(email);
    }


    private LocalDateTime calculateEndTime(LocalDateTime startTime, int durationMinutes) {
        if (startTime == null) {
            logger.error("calculateEndTime: Startzeit ist null.");
            throw new IllegalArgumentException("Startzeit darf nicht null sein für die Endzeitberechnung.");
        }
        if (durationMinutes <= 0) {
            logger.error("calculateEndTime: Ungültige Dauer: {}", durationMinutes);
            throw new IllegalArgumentException("Dauer der Dienstleistung muss positiv sein.");
        }
        return startTime.plusMinutes(durationMinutes);
    }

    private boolean isSlotBlocked(LocalDateTime proposedStartTime, LocalDateTime proposedEndTime, List<BlockedTimeSlot> blocksOnDate) {
        for (BlockedTimeSlot block : blocksOnDate) {
            LocalDateTime blockStart = proposedStartTime.toLocalDate().atTime(block.getStartTime());
            LocalDateTime blockEnd = proposedStartTime.toLocalDate().atTime(block.getEndTime());

            if (proposedStartTime.isBefore(blockEnd) && proposedEndTime.isAfter(blockStart)) {
                logger.debug("Slot von {} bis {} kollidiert mit Blockade: {} ({} - {})", proposedStartTime, proposedEndTime, block.getDescription(), blockStart, blockEnd);
                return true;
            }
        }
        return false;
    }


    private boolean hasConflict(Appointment appointmentToCheck, Service serviceDetails) {
        if (appointmentToCheck.getStartTime() == null || serviceDetails == null) {
            logger.error("hasConflict: Startzeit oder Service-Details sind null. StartTime: {}, ServiceDetails: {}", appointmentToCheck.getStartTime(), serviceDetails);
            throw new IllegalArgumentException("Startzeit und Service-Details dürfen für die Konfliktprüfung nicht null sein.");
        }

        int duration = serviceDetails.getDurationMinutes();
        LocalDateTime proposedStartTime = appointmentToCheck.getStartTime();
        LocalDateTime proposedEndTime = calculateEndTime(proposedStartTime, duration);
        Long excludeId = appointmentToCheck.getId();

        logger.debug("Konfliktprüfung für: Start={}, Ende={}, ExcludeId={}", proposedStartTime, proposedEndTime, excludeId);

        List<Appointment> conflictingAppointments = appointmentRepository.findConflictingAppointments(
                proposedStartTime, proposedEndTime, excludeId
        );
        if (!conflictingAppointments.isEmpty()) {
            logger.warn("Terminkonflikt gefunden für vorgeschlagenen Termin {}-{}. Kollidierende Termine: {}", proposedStartTime, proposedEndTime, conflictingAppointments.stream().map(Appointment::getId).collect(Collectors.toList()));
            return true;
        }

        List<BlockedTimeSlot> blocksOnDate = blockedTimeSlotService.getBlocksForDate(proposedStartTime.toLocalDate());
        if (isSlotBlocked(proposedStartTime, proposedEndTime, blocksOnDate)) {
            throw new AppointmentConflictException("Der gewählte Zeitpunkt ist durch eine Pause oder Abwesenheit blockiert.");
        }

        return false;
    }


    public Appointment createAppointment(Appointment appointment) {
        logger.info("Erstelle Termin: ServiceId={}, StartZeit={}", appointment.getService().getId(), appointment.getStartTime());
        Service serviceDetails = appointment.getService();

        DayOfWeek dayOfWeek = appointment.getStartTime().getDayOfWeek();
        WorkingHours hoursForDay = workingHoursService.getWorkingHoursForDay(dayOfWeek)
                .orElseThrow(() -> new IllegalArgumentException("Für den gewählten Tag (" + dayOfWeek + ") sind keine Arbeitszeiten definiert."));

        if (hoursForDay.isClosed() ||
                appointment.getStartTime().toLocalTime().isBefore(hoursForDay.getStartTime()) ||
                calculateEndTime(appointment.getStartTime(), serviceDetails.getDurationMinutes()).toLocalTime().isAfter(hoursForDay.getEndTime())) {
            throw new AppointmentConflictException("Der gewählte Zeitpunkt liegt außerhalb der Öffnungszeiten.");
        }

        if (hasConflict(appointment, serviceDetails)) {
            // Exception wird bereits in hasConflict geworfen
        }
        return appointmentRepository.save(appointment);
    }

    public Appointment updateAppointment(Long id, Appointment appointmentDetails) {
        logger.info("Aktualisiere Termin mit ID {}: ServiceId={}, StartZeit={}", id, appointmentDetails.getService().getId(), appointmentDetails.getStartTime());
        Appointment appointmentToUpdate = appointmentRepository.findById(id)
                .orElseThrow(() -> {
                    logger.warn("Termin nicht gefunden für Update mit ID: {}", id);
                    return new RuntimeException("Termin nicht gefunden für diese ID :: " + id);
                });

        Service serviceDetails = appointmentDetails.getService();
        appointmentDetails.setId(id);

        DayOfWeek dayOfWeek = appointmentDetails.getStartTime().getDayOfWeek();
        WorkingHours hoursForDay = workingHoursService.getWorkingHoursForDay(dayOfWeek)
                .orElseThrow(() -> new IllegalArgumentException("Für den gewählten Tag (" + dayOfWeek + ") sind keine Arbeitszeiten definiert."));

        if (hoursForDay.isClosed() ||
                appointmentDetails.getStartTime().toLocalTime().isBefore(hoursForDay.getStartTime()) ||
                calculateEndTime(appointmentDetails.getStartTime(), serviceDetails.getDurationMinutes()).toLocalTime().isAfter(hoursForDay.getEndTime())) {
            throw new AppointmentConflictException("Der gewählte Zeitpunkt für die Aktualisierung liegt außerhalb der Öffnungszeiten.");
        }

        if (hasConflict(appointmentDetails, serviceDetails)) {
            // Exception wird in hasConflict geworfen
        }

        appointmentToUpdate.setStartTime(appointmentDetails.getStartTime());
        appointmentToUpdate.setService(serviceDetails);
        appointmentToUpdate.setCustomer(appointmentDetails.getCustomer());
        appointmentToUpdate.setNotes(appointmentDetails.getNotes());

        return appointmentRepository.save(appointmentToUpdate);
    }

    @Transactional
    public Appointment updateAppointmentStatus(Long appointmentId, AppointmentStatus newStatus) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Termin nicht gefunden für ID: " + appointmentId));

        logger.info("Aktualisiere Status für Termin ID {} von {} zu {}", appointmentId, appointment.getStatus(), newStatus);
        appointment.setStatus(newStatus);
        return appointmentRepository.save(appointment);
    }

    public boolean deleteUserAppointment(Long appointmentId, String userEmail, boolean isAdmin) {
        logger.info("Versuch, Termin {} durch User {} (isAdmin: {}) zu löschen.", appointmentId, userEmail, isAdmin);
        Optional<Appointment> appointmentOpt = appointmentRepository.findById(appointmentId);
        if (appointmentOpt.isEmpty()) {
            logger.warn("Termin {} zum Löschen nicht gefunden.", appointmentId);
            throw new RuntimeException("Termin nicht gefunden für diese ID :: " + appointmentId);
        }
        Appointment appointment = appointmentOpt.get();

        if (isAdmin) {
            appointmentRepository.delete(appointment);
            logger.info("Admin hat Termin {} gelöscht.", appointmentId);
            return true;
        }

        if (appointment.getCustomer() != null && appointment.getCustomer().getEmail().equals(userEmail)) {
            appointmentRepository.delete(appointment);
            logger.info("User {} hat eigenen Termin {} gelöscht.", userEmail, appointmentId);
            return true;
        }
        logger.warn("User {} nicht berechtigt, Termin {} zu löschen oder Kunde nicht zugeordnet.", userEmail, appointmentId);
        return false;
    }


    public List<String> getAvailableSlotsForServiceOnDate(Long serviceId, LocalDate date) {
        logger.debug("getAvailableSlotsForServiceOnDate aufgerufen für Service ID: {} und Datum: {}", serviceId, date);
        Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> {
                    logger.warn("Dienstleistung nicht gefunden für ID {} bei getAvailableSlots", serviceId);
                    return new RuntimeException("Dienstleistung nicht gefunden für ID: " + serviceId);
                });
        int duration = service.getDurationMinutes();

        if (duration <= 0) {
            logger.warn("Ungültige Dauer ({}) für Service ID {} bei getAvailableSlots", duration, serviceId);
            throw new IllegalArgumentException("Die Dauer der Dienstleistung muss positiv sein.");
        }

        DayOfWeek dayOfWeek = date.getDayOfWeek();
        Optional<WorkingHours> workingHoursOpt = workingHoursService.getWorkingHoursForDay(dayOfWeek);

        if (workingHoursOpt.isEmpty() || workingHoursOpt.get().isClosed()) {
            logger.info("Salon ist am {} geschlossen oder keine Arbeitszeiten definiert.", date);
            return new ArrayList<>();
        }
        WorkingHours workingHours = workingHoursOpt.get();
        LocalTime openingTime = workingHours.getStartTime();
        LocalTime closingTime = workingHours.getEndTime();

        final int slotInterval = 30;

        List<String> availableSlots = new ArrayList<>();
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.atTime(LocalTime.MAX);

        List<Appointment> appointmentsOnDate = appointmentRepository.findByStartTimeBetween(dayStart, dayEnd);
        logger.debug("Anzahl gebuchter Termine an {}: {}", date, appointmentsOnDate.size());

        List<BlockedTimeSlot> blocksOnDate = blockedTimeSlotService.getBlocksForDate(date);
        logger.debug("Anzahl Blockaden an {}: {}", date, blocksOnDate.size());


        LocalTime currentTimeSlot = openingTime;
        while (currentTimeSlot != null && (currentTimeSlot.plusMinutes(duration).isBefore(closingTime) || currentTimeSlot.plusMinutes(duration).equals(closingTime))) {
            LocalDateTime proposedStartTime = date.atTime(currentTimeSlot);
            LocalDateTime proposedEndTime = proposedStartTime.plusMinutes(duration);

            if (proposedStartTime.isBefore(LocalDateTime.now().plusMinutes(15))) {
                currentTimeSlot = currentTimeSlot.plusMinutes(slotInterval);
                continue;
            }

            boolean conflictWithAppointment = false;
            for (Appointment existingAppointment : appointmentsOnDate) {
                LocalDateTime existingStartTime = existingAppointment.getStartTime();
                Service existingService = existingAppointment.getService();
                if(existingService == null || existingService.getId() == null) {
                    existingService = serviceRepository.findById(existingAppointment.getService().getId())
                            .orElseThrow(() -> new RuntimeException("Service für bestehenden Termin nicht gefunden."));
                }
                LocalDateTime existingEndTime = calculateEndTime(existingStartTime, existingService.getDurationMinutes());

                if (proposedStartTime.isBefore(existingEndTime) && proposedEndTime.isAfter(existingStartTime)) {
                    conflictWithAppointment = true;
                    break;
                }
            }

            boolean conflictWithBlock = isSlotBlocked(proposedStartTime, proposedEndTime, blocksOnDate);

            if (!conflictWithAppointment && !conflictWithBlock) {
                availableSlots.add(String.format("%02d:%02d", currentTimeSlot.getHour(), currentTimeSlot.getMinute()));
            }
            currentTimeSlot = currentTimeSlot.plusMinutes(slotInterval);
        }
        logger.info("Verfügbare Slots für Service {} an {} (Öffnungszeit {} - {}), unter Berücksichtigung von Blockaden: {}", serviceId, date, openingTime, closingTime, availableSlots);
        return availableSlots;
    }

    public List<DailyAppointmentsDTO> getRecentAppointments(int count) {
        Pageable limit = PageRequest.of(0, count);
        List<Appointment> appointments = appointmentRepository.findByOrderByIdDesc(limit);
        return appointments.stream()
                .map(apt -> {
                    LocalDate appointmentDate = apt.getStartTime().toLocalDate();
                    String status = "Neu";
                    if (appointmentDate.isEqual(LocalDate.now())) {
                        status = "Heute erstellt";
                    } else if (appointmentDate.isBefore(LocalDate.now())) {
                        status = "Vergangen (neu)";
                    } else {
                        status = "Zukünftig (neu)";
                    }

                    return new DailyAppointmentsDTO(
                            apt.getId(),
                            appointmentDate,
                            apt.getStartTime().toLocalTime(),
                            apt.getService() != null ? apt.getService().getName() : "N/A",
                            apt.getCustomer() != null ? apt.getCustomer().getFirstName() : "N/A",
                            apt.getCustomer() != null ? apt.getCustomer().getLastName() : "",
                            status
                    );
                })
                .collect(Collectors.toList());
    }
}
