package com.friseursalon.backend.controller;

import com.friseursalon.backend.model.Appointment;
import com.friseursalon.backend.model.Customer;
import com.friseursalon.backend.model.Service;
import com.friseursalon.backend.payload.response.MessageResponse;
import com.friseursalon.backend.service.AppointmentService;
import com.friseursalon.backend.service.CustomerService;
import com.friseursalon.backend.service.ServiceService;
import com.friseursalon.backend.exception.AppointmentConflictException; // Sicherstellen, dass der Pfad korrekt ist, falls Sie die Exception verschoben haben

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public List<Appointment> getAllAppointments() {
        return appointmentService.getAllAppointments();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable Long id) {
        return appointmentService.getAppointmentById(id)
                .map(appointment -> new ResponseEntity<>(appointment, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/by-date-range")
    public ResponseEntity<?> getAppointmentsByDateRange(
            @RequestParam String start,
            @RequestParam String end) {
        try {
            LocalDateTime startTime = LocalDateTime.parse(start);
            LocalDateTime endTime = LocalDateTime.parse(end);
            List<Appointment> appointments = appointmentService.getAppointmentsForDateRange(startTime, endTime);
            return new ResponseEntity<>(appointments, HttpStatus.OK);
        } catch (DateTimeParseException ex) { // Variable 'ex' hier
            System.err.println("Error parsing date range: " + ex.getMessage());
            return new ResponseEntity<>(new MessageResponse("Ungültiges Datumsformat für Datumsbereich: " + ex.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (Exception ex) { // Variable 'ex' hier
            System.err.println("Error in getAppointmentsByDateRange: " + ex.getMessage());
            ex.printStackTrace();
            return new ResponseEntity<>(new MessageResponse("Interner Serverfehler beim Abrufen der Termine: " + ex.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/available-slots")
    public ResponseEntity<?> getAvailableSlots(
            @RequestParam Long serviceId,
            @RequestParam String date) {
        System.out.println("Backend GET /available-slots called with serviceId: " + serviceId + ", date: " + date);
        try {
            if (serviceId == null) {
                System.err.println("Error in /available-slots: Service-ID ist null.");
                return new ResponseEntity<>(new MessageResponse("Service-ID fehlt."), HttpStatus.BAD_REQUEST);
            }
            LocalDate localDate = LocalDate.parse(date);
            List<String> availableTimes = appointmentService.getAvailableSlotsForServiceOnDate(serviceId, localDate);
            return new ResponseEntity<>(availableTimes, HttpStatus.OK);
        } catch (DateTimeParseException ex) { // Variable 'ex' hier
            System.err.println("Error parsing date in /available-slots: " + date + " - " + ex.getMessage());
            return new ResponseEntity<>(new MessageResponse("Ungültiges Datumsformat. Bitte YYYY-MM-DD verwenden. Details: " + ex.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException ex) { // Variable 'ex' hier
            System.err.println("Error in getAvailableSlots (RuntimeException): " + ex.getMessage());
            ex.printStackTrace(); // Korrigiert zu 'ex'
            return new ResponseEntity<>(new MessageResponse("Fehler beim Abrufen der verfügbaren Zeiten: " + ex.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping
    public ResponseEntity<?> createAppointment(@RequestBody Appointment appointment) {
        System.out.println("Backend POST /appointments called with: " + appointment);
        try {
            if (appointment.getService() == null || appointment.getService().getId() == null) {
                return new ResponseEntity<>(new MessageResponse("Dienstleistungs-ID fehlt."), HttpStatus.BAD_REQUEST);
            }
            if (appointment.getCustomer() == null || appointment.getCustomer().getEmail() == null) {
                return new ResponseEntity<>(new MessageResponse("Kunden-E-Mail fehlt."), HttpStatus.BAD_REQUEST);
            }

            Service serviceFromDb = serviceService.getServiceById(appointment.getService().getId())
                    .orElse(null);

            if (serviceFromDb == null) {
                return new ResponseEntity<>(new MessageResponse("Dienstleistung mit ID " + appointment.getService().getId() + " nicht gefunden."), HttpStatus.BAD_REQUEST);
            }
            appointment.setService(serviceFromDb);

            Customer customer;
            Optional<Customer> existingCustomerOpt = customerService.findCustomerByEmail(appointment.getCustomer().getEmail());

            if (existingCustomerOpt.isPresent()) {
                customer = existingCustomerOpt.get();
                customer.setFirstName(appointment.getCustomer().getFirstName());
                customer.setLastName(appointment.getCustomer().getLastName());
                customer.setPhoneNumber(appointment.getCustomer().getPhoneNumber());
                customer = customerService.createCustomer(customer);
            } else {
                customer = customerService.createCustomer(appointment.getCustomer());
            }
            appointment.setCustomer(customer);

            Appointment createdAppointment = appointmentService.createAppointment(appointment);
            return new ResponseEntity<>(createdAppointment, HttpStatus.CREATED);
        } catch (AppointmentConflictException ex) {
            System.err.println("Appointment conflict in POST /appointments: " + ex.getMessage());
            return new ResponseEntity<>(new MessageResponse(ex.getMessage()), HttpStatus.CONFLICT);
        } catch (IllegalArgumentException ex) {
            System.err.println("Illegal argument in POST /appointments: " + ex.getMessage());
            return new ResponseEntity<>(new MessageResponse(ex.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException ex) { // Variable 'ex' hier
            System.err.println("Runtime error in POST /appointments: " + ex.getMessage());
            ex.printStackTrace(); // KORRIGIERT
            return new ResponseEntity<>(new MessageResponse("Fehler beim Erstellen des Termins: " + ex.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAppointment(@PathVariable Long id, @RequestBody Appointment appointmentDetails) {
        System.out.println("Backend PUT /appointments/" + id + " called with: " + appointmentDetails);
        try {
            if (appointmentDetails.getService() == null || appointmentDetails.getService().getId() == null) {
                return new ResponseEntity<>(new MessageResponse("Dienstleistungs-ID für Update fehlt."), HttpStatus.BAD_REQUEST);
            }
            Service serviceFromDb = serviceService.getServiceById(appointmentDetails.getService().getId())
                    .orElse(null);
            if (serviceFromDb == null) {
                return new ResponseEntity<>(new MessageResponse("Dienstleistung mit ID " + appointmentDetails.getService().getId() + " nicht gefunden."), HttpStatus.BAD_REQUEST);
            }
            appointmentDetails.setService(serviceFromDb);

            if (appointmentDetails.getCustomer() != null && appointmentDetails.getCustomer().getId() != null) {
                Customer customer = customerService.getCustomerById(appointmentDetails.getCustomer().getId())
                        .orElseThrow(() -> new RuntimeException("Kunde nicht gefunden für ID: " + appointmentDetails.getCustomer().getId()));
                appointmentDetails.setCustomer(customer);
            } else {
                return new ResponseEntity<>(new MessageResponse("Kundeninformationen für Update unvollständig oder ID fehlt."), HttpStatus.BAD_REQUEST);
            }

            Appointment updatedAppointment = appointmentService.updateAppointment(id, appointmentDetails);
            return new ResponseEntity<>(updatedAppointment, HttpStatus.OK);
        } catch (AppointmentConflictException ex) {
            System.err.println("Appointment conflict in PUT /appointments/" + id + ": " + ex.getMessage());
            return new ResponseEntity<>(new MessageResponse(ex.getMessage()), HttpStatus.CONFLICT);
        } catch (IllegalArgumentException ex) {
            System.err.println("Illegal argument in PUT /appointments/" + id + ": " + ex.getMessage());
            return new ResponseEntity<>(new MessageResponse(ex.getMessage()), HttpStatus.BAD_REQUEST);
        } catch (RuntimeException ex) { // Variable 'ex' hier
            System.err.println("Runtime error in PUT /appointments/" + id + ": " + ex.getMessage());
            ex.printStackTrace(); // KORRIGIERT
            if (ex.getMessage() != null && ex.getMessage().contains("nicht gefunden")) {
                return new ResponseEntity<>(new MessageResponse(ex.getMessage()), HttpStatus.NOT_FOUND);
            }
            return new ResponseEntity<>(new MessageResponse("Fehler beim Aktualisieren des Termins: " + ex.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<HttpStatus> deleteAppointment(@PathVariable Long id) {
        System.out.println("Backend DELETE /appointments/" + id + " called.");
        try {
            appointmentService.deleteAppointment(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (RuntimeException ex) { // Variable 'ex' hier
            System.err.println("Error in DELETE /appointments/" + id + ": " + ex.getMessage());
            ex.printStackTrace(); // KORRIGIERT
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}