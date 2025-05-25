package com.friseursalon.backend.repository;

import com.friseursalon.backend.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional; // Neu: Optional importieren, da findByEmail ein Optional zurückgibt

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    // Findet einen Kunden anhand seiner E-Mail-Adresse
    Optional<Customer> findByEmail(String email);
}