package com.friseursalon.backend.controller;

import com.friseursalon.backend.model.Appointment;
import com.friseursalon.backend.model.Customer;
import com.friseursalon.backend.model.Service;
import com.friseursalon.backend.service.AppointmentService;
import com.friseursalon.backend.service.CustomerService;
import com.friseursalon.backend.service.ServiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional; // Wichtig: Für Optional importieren

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

    // GET http://localhost:8080/api/appointments
    @GetMapping
    public List<Appointment> getAllAppointments() {
        return appointmentService.getAllAppointments();
    }

    // GET http://localhost:8080/api/appointments/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Appointment> getAppointmentById(@PathVariable Long id) {
        return appointmentService.getAppointmentById(id)
                .map(appointment -> new ResponseEntity<>(appointment, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    // GET http://localhost:8080/api/appointments/by-date-range?start=YYYY-MM-DDTHH:MM:SS&end=YYYY-MM-DDTHH:MM:SS
    @GetMapping("/by-date-range")
    public ResponseEntity<List<Appointment>> getAppointmentsByDateRange(
            @RequestParam String start,
            @RequestParam String end) {
        try {
            LocalDateTime startTime = LocalDateTime.parse(start);
            LocalDateTime endTime = LocalDateTime.parse(end);
            List<Appointment> appointments = appointmentService.getAppointmentsForDateRange(startTime, endTime);
            return new ResponseEntity<>(appointments, HttpStatus.OK);
        } catch (DateTimeParseException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST); // 400 Bad Request bei ungültigem Datumsformat
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR); // 500 Interner Serverfehler
        }
    }


    // POST http://localhost:8080/api/appointments
    @PostMapping
    public ResponseEntity<Appointment> createAppointment(@RequestBody Appointment appointment) {
        // --- Validierung und Service-Behandlung ---
        if (appointment.getService() == null || appointment.getService().getId() == null) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST); // Dienstleistungs-ID fehlt
        }
        // WICHTIG: Frontend sendet jetzt die vollständigen Customer-Details im Appointment-Objekt
        if (appointment.getCustomer() == null || appointment.getCustomer().getEmail() == null) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST); // Kunden-E-Mail fehlt
        }

        // 1. Dienstleistung aus der Datenbank laden
        Service service = serviceService.getServiceById(appointment.getService().getId())
                .orElseThrow(() -> new RuntimeException("Dienstleistung nicht gefunden für ID: " + appointment.getService().getId()));
        appointment.setService(service);

        // 2. Kunden behandeln: Prüfen, ob Kunde mit dieser E-Mail bereits existiert
        Customer customer;
        Optional<Customer> existingCustomer = customerService.findCustomerByEmail(appointment.getCustomer().getEmail());

        if (existingCustomer.isPresent()) {
            customer = existingCustomer.get();
            // Wenn Kunde existiert, optional seine Daten aktualisieren (z.B. Name, Telefon)
            customer.setFirstName(appointment.getCustomer().getFirstName());
            customer.setLastName(appointment.getCustomer().getLastName());
            customer.setPhoneNumber(appointment.getCustomer().getPhoneNumber());
            customer = customerService.createCustomer(customer); // 'save' aktualisiert, wenn ID gesetzt ist
        } else {
            // Wenn Kunde nicht existiert, einen neuen erstellen
            customer = customerService.createCustomer(appointment.getCustomer());
        }
        appointment.setCustomer(customer); // Den (entweder neu erstellten oder aktualisierten) Kunden dem Termin zuweisen

        // 3. Termin speichern
        Appointment createdAppointment = appointmentService.createAppointment(appointment);
        return new ResponseEntity<>(createdAppointment, HttpStatus.CREATED);
    }


    // PUT http://localhost:8080/api/appointments/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Appointment> updateAppointment(@PathVariable Long id, @RequestBody Appointment appointmentDetails) {
        try {
            // Auch hier: Sicherstellen, dass verknüpfte Entitäten vollständig sind
            if (appointmentDetails.getCustomer() != null && appointmentDetails.getCustomer().getId() != null) {
                Customer customer = customerService.getCustomerById(appointmentDetails.getCustomer().getId())
                        .orElseThrow(() -> new RuntimeException("Kunde nicht gefunden für ID: " + appointmentDetails.getCustomer().getId()));
                appointmentDetails.setCustomer(customer);
            }
            if (appointmentDetails.getService() != null && appointmentDetails.getService().getId() != null) {
                Service service = serviceService.getServiceById(appointmentDetails.getService().getId())
                        .orElseThrow(() -> new RuntimeException("Dienstleistung nicht gefunden für ID: " + appointmentDetails.getService().getId()));
                appointmentDetails.setService(service);
            }

            Appointment updatedAppointment = appointmentService.updateAppointment(id, appointmentDetails);
            return new ResponseEntity<>(updatedAppointment, HttpStatus.OK);
        } catch (RuntimeException ex) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // DELETE http://localhost:8080/api/appointments/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<HttpStatus> deleteAppointment(@PathVariable Long id) {
        try {
            appointmentService.deleteAppointment(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (RuntimeException ex) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}