package com.friseursalon.backend.controller;

import com.friseursalon.backend.model.Service;
import com.friseursalon.backend.service.ServiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus; // Für HTTP-Statuscodes
import org.springframework.http.ResponseEntity; // Für detailliertere HTTP-Antworten
import org.springframework.web.bind.annotation.*; // Für alle Web-Annotationen

import java.util.List;

@RestController // Markiert die Klasse als REST Controller
@RequestMapping("/api/services") // Basis-Pfad für alle Endpunkte in diesem Controller
@CrossOrigin(origins = "http://localhost:3000") // Erlaubt Anfragen von deinem React Frontend
public class ServiceController {

    private final ServiceService serviceService;

    @Autowired
    public ServiceController(ServiceService serviceService) {
        this.serviceService = serviceService;
    }

    // Endpunkt zum Abrufen aller Dienstleistungen
    // GET http://localhost:8080/api/services
    @GetMapping
    public List<Service> getAllServices() {
        return serviceService.getAllServices();
    }

    // Endpunkt zum Abrufen einer einzelnen Dienstleistung nach ID
    // GET http://localhost:8080/api/services/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Service> getServiceById(@PathVariable Long id) {
        return serviceService.getServiceById(id)
                .map(service -> new ResponseEntity<>(service, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    // Endpunkt zum Erstellen einer neuen Dienstleistung
    // POST http://localhost:8080/api/services
    @PostMapping
    public ResponseEntity<Service> createService(@RequestBody Service service) {
        Service createdService = serviceService.createService(service);
        return new ResponseEntity<>(createdService, HttpStatus.CREATED);
    }

    // Endpunkt zum Aktualisieren einer bestehenden Dienstleistung
    // PUT http://localhost:8080/api/services/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Service> updateService(@PathVariable Long id, @RequestBody Service serviceDetails) {
        try {
            Service updatedService = serviceService.updateService(id, serviceDetails);
            return new ResponseEntity<>(updatedService, HttpStatus.OK);
        } catch (RuntimeException ex) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // Endpunkt zum Löschen einer Dienstleistung
    // DELETE http://localhost:8080/api/services/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<HttpStatus> deleteService(@PathVariable Long id) {
        try {
            serviceService.deleteService(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT); // 204 No Content
        } catch (RuntimeException ex) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}