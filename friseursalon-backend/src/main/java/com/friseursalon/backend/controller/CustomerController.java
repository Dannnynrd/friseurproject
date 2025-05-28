package com.friseursalon.backend.controller;

import com.friseursalon.backend.model.Customer;
import com.friseursalon.backend.service.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // Import für @PreAuthorize
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "http://localhost:3000")
public class CustomerController {


    private final CustomerService customerService;

    @Autowired
    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    // GET http://localhost:8080/api/customers
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')") // Nur Admins sollen alle Kunden sehen
    public List<Customer> getAllCustomers() {
        return customerService.getAllCustomers();
    }

    // GET http://localhost:8080/api/customers/{id}
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // Nur Admins dürfen spezifische Kundendaten per ID abrufen
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id) {
        return customerService.getCustomerById(id)
                .map(customer -> new ResponseEntity<>(customer, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    // POST http://localhost:8080/api/customers
// Dieser Endpunkt wird momentan eher durch findOrCreateCustomer im AppointmentService abgedeckt.
// Für eine reine Admin-Kundenanlage könnte man ihn spezifischer gestalten oder @PreAuthorize("hasRole('ADMIN')") hinzufügen.
// Fürs Erste lassen wir ihn, wie er ist, da er nicht primär für die Admin-Kundenverwaltung genutzt wird.
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')") // Explizit für Admin-Nutzung
    public ResponseEntity<Customer> createCustomer(@RequestBody Customer customer) {
        Customer createdCustomer = customerService.createCustomer(customer);
        return new ResponseEntity<>(createdCustomer, HttpStatus.CREATED);
    }

    // PUT http://localhost:8080/api/customers/{id}
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // Nur Admins dürfen Kundendaten bearbeiten
    public ResponseEntity<Customer> updateCustomer(@PathVariable Long id, @RequestBody Customer customerDetails) {
        try {
            Customer updatedCustomer = customerService.updateCustomer(id, customerDetails);
            return new ResponseEntity<>(updatedCustomer, HttpStatus.OK);
        } catch (RuntimeException ex) {
            // Hier könnte man spezifischere Fehlerbehandlung für z.B. E-Mail Duplikate einbauen
            return new ResponseEntity<>(HttpStatus.NOT_FOUND); // Oder HttpStatus.BAD_REQUEST bei Validierungsfehlern
        }
    }

    // DELETE http://localhost:8080/api/customers/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // Nur Admins dürfen Kunden löschen
    public ResponseEntity<HttpStatus> deleteCustomer(@PathVariable Long id) {
        try {
            customerService.deleteCustomer(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (RuntimeException ex) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}
