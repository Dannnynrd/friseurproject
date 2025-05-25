package com.friseursalon.backend.service;

import com.friseursalon.backend.model.Service;
import com.friseursalon.backend.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired; // Für Dependency Injection
 // Markiert diese Klasse als Spring Service

import java.util.List;
import java.util.Optional;

@org.springframework.stereotype.Service // Markiert diese Klasse als eine Spring Service-Komponente
public class ServiceService {

    private final ServiceRepository serviceRepository;// Hier wird unser Repository injiziert

    @Autowired // Spring injiziert das ServiceRepository automatisch
    public ServiceService(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    // Alle Dienstleistungen abrufen
    public List<Service> getAllServices() {
        return serviceRepository.findAll();
    }

    // Eine Dienstleistung anhand der ID abrufen
    public Optional<Service> getServiceById(Long id) {
        return serviceRepository.findById(id);
    }

    // Eine neue Dienstleistung erstellen/speichern
    public Service createService(Service service) {
        return serviceRepository.save(service);
    }

    // Eine bestehende Dienstleistung aktualisieren
    public Service updateService(Long id, Service serviceDetails) {
        // Zuerst prüfen, ob die Dienstleistung existiert
        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dienstleistung nicht gefunden für diese ID :: " + id));

        // Details aktualisieren
        service.setName(serviceDetails.getName());
        service.setDescription(serviceDetails.getDescription());
        service.setPrice(serviceDetails.getPrice());
        service.setDurationMinutes(serviceDetails.getDurationMinutes());

        // Aktualisierte Dienstleistung speichern
        return serviceRepository.save(service);
    }

    // Eine Dienstleistung löschen
    public void deleteService(Long id) {
        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dienstleistung nicht gefunden für diese ID :: " + id));
        serviceRepository.delete(service);
    }
}