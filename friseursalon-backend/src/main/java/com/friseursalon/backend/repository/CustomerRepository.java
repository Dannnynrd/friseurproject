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

    // NEUE METHODE für Neukunden-KPI
    @Query("SELECT COUNT(c.id) FROM Customer c WHERE c.registrationDate >= :start AND c.registrationDate <= :end AND c.id IN :customerIds")
    Long countNewCustomersRegisteredBetweenAndInIdList(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, @Param("customerIds") List<Long> customerIds);
}
