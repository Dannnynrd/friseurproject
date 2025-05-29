// Datei: friseursalon-backend/src/main/java/com/friseursalon/backend/repository/CustomerRepository.java
package com.friseursalon.backend.repository;

import com.friseursalon.backend.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByEmail(String email);

    // --- Konzeptionelle Queries (benötigen Datenmodell-Erweiterungen) ---

    /**
     * Zählt die Anzahl der Kunden, die innerhalb eines bestimmten Zeitraums registriert wurden
     * UND in der übergebenen Liste von Kunden-IDs enthalten sind.
     * Benötigt ein Feld `registrationDate` (oder `createdAt` mit @CreationTimestamp) in der `Customer`-Entität.
     * @param start Beginn des Registrierungszeitraums.
     * @param end Ende des Registrierungszeitraums.
     * @param customerIds Liste der Kunden-IDs, auf die die Zählung beschränkt werden soll.
     * @return Anzahl der Neukunden, die auch in der customerIds Liste sind.
     */
    // @Query("SELECT COUNT(c.id) FROM Customer c WHERE c.registrationDate >= :start AND c.registrationDate <= :end AND c.id IN :customerIds")
    // Long countNewCustomersRegisteredBetweenAndInIdList(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, @Param("customerIds") List<Long> customerIds);
}
