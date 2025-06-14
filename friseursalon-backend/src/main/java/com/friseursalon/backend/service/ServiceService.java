package com.friseursalon.backend.service;

import com.friseursalon.backend.model.Service;
import com.friseursalon.backend.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Optional;

@Component
public class ServiceService {

    private final ServiceRepository serviceRepository;

    @Autowired
    public ServiceService(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    public Service createService(Service service) {
        // Stellt sicher, dass beim Erstellen keine ID vorhanden ist.
        service.setId(null);
        return serviceRepository.save(service);
    }

    public List<Service> getAllServices() {
        return serviceRepository.findAll();
    }

    public Optional<Service> getServiceById(Long id) {
        return serviceRepository.findById(id);
    }

    // KORREKTUR: Dies ist die korrekte Logik, um eine Dienstleistung zu aktualisieren.
    public Service updateService(Long id, Service serviceDetails) {
        // Finde den existierenden Service in der Datenbank.
        Service existingService = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dienstleistung mit ID " + id + " nicht gefunden."));

        // Aktualisiere die Felder des existierenden Services mit den neuen Daten.
        existingService.setName(serviceDetails.getName());
        existingService.setDescription(serviceDetails.getDescription());
        existingService.setPrice(serviceDetails.getPrice());
        existingService.setDurationMinutes(serviceDetails.getDurationMinutes());

        // Speichere die aktualisierte Entität.
        return serviceRepository.save(existingService);
    }

    public void deleteService(Long id) {
        if (!serviceRepository.existsById(id)) {
            throw new RuntimeException("Dienstleistung mit ID " + id + " nicht gefunden.");
        }
        serviceRepository.deleteById(id);
    }
}
