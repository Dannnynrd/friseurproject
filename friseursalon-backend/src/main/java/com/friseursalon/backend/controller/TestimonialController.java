package com.friseursalon.backend.controller;

import com.friseursalon.backend.model.Customer; // NEU
import com.friseursalon.backend.model.Testimonial;
import com.friseursalon.backend.payload.request.TestimonialRequest;
import com.friseursalon.backend.payload.response.MessageResponse;
import com.friseursalon.backend.repository.CustomerRepository; // NEU
import com.friseursalon.backend.service.TestimonialService;
import com.friseursalon.backend.security.details.UserDetailsImpl;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/testimonials")
@CrossOrigin(origins = "http://localhost:3000")
public class TestimonialController {

    private static final Logger logger = LoggerFactory.getLogger(TestimonialController.class);

    private final TestimonialService testimonialService;
    private final CustomerRepository customerRepository; // NEU injizieren

    @Autowired
    public TestimonialController(TestimonialService testimonialService, CustomerRepository customerRepository) { // NEU: CustomerRepository im Konstruktor
        this.testimonialService = testimonialService;
        this.customerRepository = customerRepository; // NEU
    }

    @PostMapping("/submit")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> submitTestimonial(@Valid @RequestBody TestimonialRequest testimonialRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String userEmail = userDetails.getEmail();

        // Den Customer anhand der E-Mail des Users finden, um die korrekte Customer-ID zu erhalten
        Customer customer = customerRepository.findByEmail(userEmail)
                .orElseThrow(() -> {
                    logger.error("Kunde für Testimonial-Einreichung nicht gefunden. User-Email: {}", userEmail);
                    return new RuntimeException("Zugehöriger Kunde für Benutzer nicht gefunden.");
                });
        Long customerIdForTestimonial = customer.getId();


        if (!testimonialService.canCustomerSubmitTestimonial(customerIdForTestimonial)) { // Hier die korrekte customerId verwenden
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Sie müssen Kunde sein, um eine Bewertung abzugeben oder haben kürzlich keinen Service genutzt."));
        }

        Testimonial newTestimonial = new Testimonial();
        // Name wird nun im Service gesetzt basierend auf dem Customer-Objekt
        newTestimonial.setRating(testimonialRequest.getRating());
        newTestimonial.setComment(testimonialRequest.getComment());
        Long serviceId = testimonialRequest.getServiceId();


        try {
            // customerIdForTestimonial wird jetzt an den Service übergeben
            Testimonial savedTestimonial = testimonialService.submitTestimonial(newTestimonial, customerIdForTestimonial, serviceId);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedTestimonial);
        } catch (RuntimeException e) {
            logger.error("Fehler beim Einreichen des Testimonials durch User ID {}: {}", userDetails.getId(), e.getMessage()); // Logge ursprüngliche User ID für Kontext
            return ResponseEntity.badRequest().body(new MessageResponse("Fehler beim Einreichen: " + e.getMessage()));
        }
    }

    // Endpunkt zum Einreichen eines "anonymen" Testimonials (Name wird im Request mitgeschickt)
    @PostMapping("/submit-guest")
    public ResponseEntity<?> submitGuestTestimonial(@Valid @RequestBody TestimonialRequest testimonialRequest) {
        if (testimonialRequest.getCustomerName() == null || testimonialRequest.getCustomerName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Kundenname ist erforderlich."));
        }
        Testimonial newTestimonial = new Testimonial();
        newTestimonial.setCustomerName(testimonialRequest.getCustomerName());
        newTestimonial.setRating(testimonialRequest.getRating());
        newTestimonial.setComment(testimonialRequest.getComment());
        Long serviceId = testimonialRequest.getServiceId();

        try {
            Testimonial savedTestimonial = testimonialService.submitAnonymousTestimonial(newTestimonial, serviceId);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedTestimonial);
        } catch (RuntimeException e) {
            logger.error("Fehler beim Einreichen des Gast-Testimonials: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new MessageResponse("Fehler beim Einreichen: " + e.getMessage()));
        }
    }


    // Endpunkt zum Abrufen aller genehmigten Testimonials (öffentlich)
    @GetMapping
    public ResponseEntity<List<Testimonial>> getApprovedTestimonials() {
        List<Testimonial> testimonials = testimonialService.getApprovedTestimonials();
        return ResponseEntity.ok(testimonials);
    }

    // ---- Admin Endpunkte ----

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Testimonial>> getAllTestimonialsForAdmin() {
        List<Testimonial> testimonials = testimonialService.getAllTestimonialsForAdmin();
        return ResponseEntity.ok(testimonials);
    }

    @PutMapping("/admin/approve/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveTestimonial(@PathVariable Long id) {
        logger.info("Admin versucht, Testimonial ID {} zu genehmigen.", id);
        return testimonialService.approveTestimonial(id)
                .map(testimonial -> ResponseEntity.ok(new MessageResponse("Testimonial erfolgreich genehmigt.")))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Testimonial nicht gefunden.")));
    }

    @PutMapping("/admin/unapprove/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> unapproveTestimonial(@PathVariable Long id) {
        logger.info("Admin versucht, Genehmigung für Testimonial ID {} zurückzuziehen.", id);
        return testimonialService.unapproveTestimonial(id)
                .map(testimonial -> ResponseEntity.ok(new MessageResponse("Testimonial-Genehmigung erfolgreich zurückgezogen.")))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Testimonial nicht gefunden.")));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteTestimonial(@PathVariable Long id) {
        logger.info("Admin versucht, Testimonial ID {} zu löschen.", id);
        if (testimonialService.deleteTestimonial(id)) {
            return ResponseEntity.ok(new MessageResponse("Testimonial erfolgreich gelöscht."));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse("Testimonial nicht gefunden."));
        }
    }
}