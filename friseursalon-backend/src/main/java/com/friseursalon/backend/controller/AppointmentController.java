package com.friseursalon.backend.controller;

import com.friseursalon.backend.model.Appointment;
import com.friseursalon.backend.model.Customer;
import com.friseursalon.backend.model.Service;
import com.friseursalon.backend.payload.response.MessageResponse;
import com.friseursalon.backend.service.AppointmentService;
import com.friseursalon.backend.service.CustomerService;
import com.friseursalon.backend.service.ServiceService;
import com.friseursalon.backend.exception.AppointmentConflictException; // Korrekter Import, wenn Exception im 'exception'-Paket liegt
import com.friseursalon.backend.security.details.UserDetailsImpl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "http://localhost:3000")
public class AppointmentController {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentController.class);

    private final AppointmentService appointmentService;
    private final CustomerService customerService;
    private final ServiceService serviceService;

    @Autowired
    public AppointmentController(AppointmentService appointmentService, CustomerService customerService, ServiceService serviceService) {
        this.appointmentService = appointmentService;
        this.customerService = customerService;
        this.serviceService = serviceService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')") // Nur Admins sollten alle Termine sehen
    public List<Appointment> getAllAppointments() {
        logger.info("GET /api/appointments - getAllAppointments called by admin");
        return appointmentService.getAllAppointments();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable Long id) {
        logger.info("GET /api/appointments/{} called", id);
        Optional<Appointment> appointmentOptional = appointmentService.getAppointmentById(id);
        if (appointmentOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        Appointment appointment = appointmentOptional.get();

        // Sicherheitscheck: User darf nur eigenen Termin sehen, Admin jeden
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin || (appointment.getCustomer() != null && appointment.getCustomer().getEmail().equals(userDetails.getEmail()))) {
            return new ResponseEntity<>(appointment, HttpStatus.OK);
        } else {
            logger.warn("User {} attempted to access unauthorized appointment {}", userDetails.getEmail(), id);
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping("/by-date-range") // Dieser Endpunkt könnte für Admins nützlich sein
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAppointmentsByDateRange(
            @RequestParam String start,
            @RequestParam String end) {
        logger.info("GET /api/appointments/by-date-range called with start: {}, end: {}", start, end);
        try {
            LocalDateTime startTime = LocalDateTime.parse(start);
            LocalDateTime endTime = LocalDateTime.parse(end);
            List<Appointment> appointments = appointmentService.getAppointmentsForDateRange(startTime, endTime);
            return new ResponseEntity<>(appointments, HttpStatus.OK);
        } catch (DateTimeParseException e) {
            logger.warn("Error parsing date range for /by-date-range: {}", e.getMessage());
            return new ResponseEntity<>(new MessageResponse("Ungültiges Datumsformat für Datumsbereich: " + e.getMessage()), HttpStatus.BAD_REQUEST);
        }
        // Andere Exceptions werden vom GlobalExceptionHandler gefangen
    }

    @GetMapping("/available-slots") // Öffentlich, da vor der Buchung benötigt
    public ResponseEntity<?> getAvailableSlots(
            @RequestParam Long serviceId,
            @RequestParam String date) {
        logger.info("GET /api/appointments/available-slots called with serviceId: {}, date: {}", serviceId, date);
        // Validierung des serviceId ist im Service, DateTimeParseException wird vom GlobalHandler gefangen
        LocalDate localDate = LocalDate.parse(date); // Kann DateTimeParseException werfen
        List<String> availableTimes = appointmentService.getAvailableSlotsForServiceOnDate(serviceId, localDate);
        return new ResponseEntity<>(availableTimes, HttpStatus.OK);
    }

    @GetMapping("/my-appointments")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getMyAppointments() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            logger.warn("Attempt to access /my-appointments without authentication");
            return new ResponseEntity<>(new MessageResponse("Benutzer nicht authentifiziert."), HttpStatus.UNAUTHORIZED);
        }

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String userEmail = userDetails.getEmail();
        logger.info("GET /api/appointments/my-appointments called by user: {}", userEmail);

        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            logger.info("Admin {} fetching all appointments via /my-appointments", userEmail);
            return ResponseEntity.ok(appointmentService.getAllAppointmentsSorted()); // Eigene Methode für sortierte Termine
        } else {
            List<Appointment> userAppointments = appointmentService.getAppointmentsByCustomerEmail(userEmail);
            return ResponseEntity.ok(userAppointments);
        }
    }

    @PostMapping
    public ResponseEntity<?> createAppointment(@RequestBody Appointment appointment) {
        logger.info("POST /api/appointments called with appointment for customer email: {}", (appointment.getCustomer() != null ? appointment.getCustomer().getEmail() : "N/A"));
        // Die Validierung der Eingabefelder und das Laden der Entitäten
        // sowie das Werfen von Exceptions (IllegalArgumentException, AppointmentConflictException)
        // geschieht nun primär im AppointmentService oder wird vom GlobalExceptionHandler abgefangen.

        if (appointment.getService() == null || appointment.getService().getId() == null) {
            return new ResponseEntity<>(new MessageResponse("Dienstleistungs-ID fehlt."), HttpStatus.BAD_REQUEST);
        }
        if (appointment.getCustomer() == null || appointment.getCustomer().getEmail() == null ||
                appointment.getCustomer().getFirstName() == null || appointment.getCustomer().getLastName() == null ) {
            return new ResponseEntity<>(new MessageResponse("Unvollständige Kundeninformationen (E-Mail, Vorname, Nachname benötigt)."), HttpStatus.BAD_REQUEST);
        }

        // Service laden
        Service serviceFromDb = serviceService.getServiceById(appointment.getService().getId())
                .orElseThrow(() -> new RuntimeException("Dienstleistung mit ID " + appointment.getService().getId() + " nicht gefunden."));
        appointment.setService(serviceFromDb);

        // Kunden behandeln
        Customer customerToSave = new Customer();
        customerToSave.setEmail(appointment.getCustomer().getEmail().trim());
        customerToSave.setFirstName(appointment.getCustomer().getFirstName().trim());
        customerToSave.setLastName(appointment.getCustomer().getLastName().trim());
        customerToSave.setPhoneNumber(appointment.getCustomer().getPhoneNumber() != null ? appointment.getCustomer().getPhoneNumber().trim() : null);

        Customer managedCustomer = customerService.findOrCreateCustomer(customerToSave);
        appointment.setCustomer(managedCustomer);

        Appointment createdAppointment = appointmentService.createAppointment(appointment);
        return new ResponseEntity<>(createdAppointment, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // Nur Admins dürfen Termine direkt bearbeiten
    public ResponseEntity<?> updateAppointment(@PathVariable Long id, @RequestBody Appointment appointmentDetails) {
        logger.info("PUT /api/appointments/{} called by admin with details: {}", id, appointmentDetails);

        if (appointmentDetails.getService() == null || appointmentDetails.getService().getId() == null) {
            return new ResponseEntity<>(new MessageResponse("Dienstleistungs-ID für Update fehlt."), HttpStatus.BAD_REQUEST);
        }
        Service serviceFromDb = serviceService.getServiceById(appointmentDetails.getService().getId())
                .orElseThrow(() -> new RuntimeException("Dienstleistung mit ID " + appointmentDetails.getService().getId() + " nicht gefunden."));
        appointmentDetails.setService(serviceFromDb);

        if (appointmentDetails.getCustomer() != null && appointmentDetails.getCustomer().getId() != null) {
            Customer customer = customerService.getCustomerById(appointmentDetails.getCustomer().getId())
                    .orElseThrow(() -> new RuntimeException("Kunde nicht gefunden für ID: " + appointmentDetails.getCustomer().getId()));
            appointmentDetails.setCustomer(customer);
        } else {
            return new ResponseEntity<>(new MessageResponse("Kunden-ID für Update fehlt."), HttpStatus.BAD_REQUEST);
        }

        Appointment updatedAppointment = appointmentService.updateAppointment(id, appointmentDetails);
        return new ResponseEntity<>(updatedAppointment, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteAppointment(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String userEmail = userDetails.getEmail();
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
        logger.info("DELETE /api/appointments/{} called by user: {} (isAdmin: {})", id, userEmail, isAdmin);

        boolean success = appointmentService.deleteUserAppointment(id, userEmail, isAdmin);
        if (success) {
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            // Der Service sollte hier idealerweise eine spezifischere Exception werfen
            // (z.B. ResourceNotFound oder UnauthorizedAccess), die dann vom GlobalExceptionHandler gefangen wird.
            // Wenn der Service nur 'false' zurückgibt, müssen wir hier reagieren.
            return new ResponseEntity<>(new MessageResponse("Termin konnte nicht storniert werden. Entweder nicht gefunden oder keine Berechtigung."), HttpStatus.FORBIDDEN);
        }
    }
}