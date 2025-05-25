package com.friseursalon.backend.repository;

import com.friseursalon.backend.model.Service; // Import der Entität
import org.springframework.data.jpa.repository.JpaRepository; // Die Basis-Schnittstelle

public interface ServiceRepository extends JpaRepository<Service, Long> {
    // Diese Schnittstelle erbt bereits alle grundlegenden CRUD-Operationen:
    // - save(Service entity): Speichert eine Dienstleistung
    // - findById(Long id): Findet eine Dienstleistung anhand der ID
    // - findAll(): Holt alle Dienstleistungen
    // - deleteById(Long id): Löscht eine Dienstleistung anhand der ID
    // ... und viele mehr!

    // Du könntest hier auch eigene, komplexere Abfragen definieren, z.B.:
    // List<Service> findByNameContaining(String name);
}