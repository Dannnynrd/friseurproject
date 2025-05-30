package com.friseursalon.backend.service;

import com.friseursalon.backend.model.Customer;
import com.friseursalon.backend.model.Service;
import com.friseursalon.backend.model.Testimonial;
import com.friseursalon.backend.repository.CustomerRepository;
import com.friseursalon.backend.repository.ServiceRepository;
import com.friseursalon.backend.repository.TestimonialRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.friseursalon.backend.security.details.UserDetailsImpl; // Import für UserDetailsImpl


import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@org.springframework.stereotype.Service
public class TestimonialService {

    private static final Logger logger = LoggerFactory.getLogger(TestimonialService.class);

    private final TestimonialRepository testimonialRepository;
    private final CustomerRepository customerRepository; // Um Customer zu verknüpfen
    private final ServiceRepository serviceRepository;   // Um Service zu verknüpfen

    @Autowired
    public TestimonialService(TestimonialRepository testimonialRepository,
                              CustomerRepository customerRepository,
                              ServiceRepository serviceRepository) {
        this.testimonialRepository = testimonialRepository;
        this.customerRepository = customerRepository;
        this.serviceRepository = serviceRepository;
    }

    // Testimonial einreichen (für eingeloggte Kunden)
    public Testimonial submitTestimonial(Testimonial testimonial, Long customerId, Long serviceId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Kunde nicht gefunden für Testimonial."));
        testimonial.setCustomer(customer);
        testimonial.setCustomerName(customer.getFirstName() + " " + customer.getLastName().charAt(0) + "."); // Format: Max M.

        if (serviceId != null) {
            Service service = serviceRepository.findById(serviceId)
                    .orElseThrow(() -> new RuntimeException("Dienstleistung nicht gefunden für Testimonial."));
            testimonial.setService(service);
        }

        testimonial.setApproved(false); // Muss vom Admin genehmigt werden
        testimonial.setSubmissionDate(LocalDateTime.now());
        logger.info("Neues Testimonial eingereicht von Kunde ID {}: {}", customerId, testimonial.getComment());
        return testimonialRepository.save(testimonial);
    }

    // Testimonial einreichen (für Gast oder manuell eingegebenen Namen)
    public Testimonial submitAnonymousTestimonial(Testimonial testimonial, Long serviceId) {
        if (testimonial.getCustomerName() == null || testimonial.getCustomerName().trim().isEmpty()) {
            throw new IllegalArgumentException("Kundenname muss für eine anonyme Bewertung angegeben werden.");
        }
        if (serviceId != null) {
            Service service = serviceRepository.findById(serviceId)
                    .orElseThrow(() -> new RuntimeException("Dienstleistung nicht gefunden für Testimonial."));
            testimonial.setService(service);
        }
        testimonial.setCustomer(null); // Keine direkte Verknüpfung
        testimonial.setApproved(false);
        testimonial.setSubmissionDate(LocalDateTime.now());
        logger.info("Neues anonymes Testimonial eingereicht von {}: {}", testimonial.getCustomerName(), testimonial.getComment());
        return testimonialRepository.save(testimonial);
    }


    // Alle genehmigten Testimonials abrufen
    public List<Testimonial> getApprovedTestimonials() {
        return testimonialRepository.findByIsApprovedTrueOrderByApprovalDateDesc();
    }

    // Alle Testimonials abrufen (für Admin)
    public List<Testimonial> getAllTestimonialsForAdmin() {
        return testimonialRepository.findAllByOrderBySubmissionDateDesc();
    }

    // Testimonial genehmigen (für Admin)
    public Optional<Testimonial> approveTestimonial(Long id) {
        Optional<Testimonial> testimonialOpt = testimonialRepository.findById(id);
        if (testimonialOpt.isPresent()) {
            Testimonial testimonial = testimonialOpt.get();
            testimonial.setApproved(true);
            testimonial.setApprovalDate(LocalDateTime.now());
            logger.info("Testimonial ID {} genehmigt.", id);
            return Optional.of(testimonialRepository.save(testimonial));
        }
        logger.warn("Testimonial ID {} zur Genehmigung nicht gefunden.", id);
        return Optional.empty();
    }

    // Testimonial-Genehmigung zurückziehen (für Admin)
    public Optional<Testimonial> unapproveTestimonial(Long id) {
        Optional<Testimonial> testimonialOpt = testimonialRepository.findById(id);
        if (testimonialOpt.isPresent()) {
            Testimonial testimonial = testimonialOpt.get();
            testimonial.setApproved(false);
            testimonial.setApprovalDate(null); // Genehmigungsdatum zurücksetzen
            logger.info("Genehmigung für Testimonial ID {} zurückgezogen.", id);
            return Optional.of(testimonialRepository.save(testimonial));
        }
        logger.warn("Testimonial ID {} zum Zurückziehen der Genehmigung nicht gefunden.", id);
        return Optional.empty();
    }

    // Testimonial löschen (für Admin)
    public boolean deleteTestimonial(Long id) {
        if (testimonialRepository.existsById(id)) {
            testimonialRepository.deleteById(id);
            logger.info("Testimonial ID {} gelöscht.", id);
            return true;
        }
        logger.warn("Testimonial ID {} zum Löschen nicht gefunden.", id);
        return false;
    }

    // Methode, um zu prüfen, ob ein Kunde bereits ein Testimonial für einen bestimmten Termin abgegeben hat
    // (Dies würde erfordern, dass Testimonials mit Appointments verknüpft werden, was aktuell nicht der Fall ist.
    // Alternativ könnte man prüfen, ob ein Kunde kürzlich einen Service hatte und dafür bewerten darf.)
    // Fürs Erste lassen wir dies einfacher und prüfen nur, ob der Kunde kürzlich überhaupt einen Termin hatte.
    public boolean canCustomerSubmitTestimonial(Long customerId) {
        // Dummy-Logik: Erlaube, wenn der Kunde existiert.
        // Später: Prüfe, ob der Kunde kürzlich einen abgeschlossenen Termin hatte.
        return customerRepository.existsById(customerId);
    }
}