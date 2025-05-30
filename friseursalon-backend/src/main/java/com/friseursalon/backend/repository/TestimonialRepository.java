package com.friseursalon.backend.repository;

import com.friseursalon.backend.model.Testimonial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestimonialRepository extends JpaRepository<Testimonial, Long> {

    // Findet alle genehmigten Testimonials, sortiert nach dem Genehmigungsdatum (neueste zuerst)
    List<Testimonial> findByIsApprovedTrueOrderByApprovalDateDesc();

    // Findet alle Testimonials, sortiert nach Einreichungsdatum (neueste zuerst) - für Admin-Ansicht
    List<Testimonial> findAllByOrderBySubmissionDateDesc();

    // Findet alle Testimonials eines bestimmten Kunden
    List<Testimonial> findByCustomerIdOrderBySubmissionDateDesc(Long customerId);
}