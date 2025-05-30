package com.friseursalon.backend.controller;

import com.friseursalon.backend.model.Testimonial;
import com.friseursalon.backend.payload.request.TestimonialRequest; // Wird noch erstellt
import com.friseursalon.backend.payload.response.MessageResponse;
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

    @Autowired
    public TestimonialController(TestimonialService testimonialService) {
        this.testimonialService = testimonialService;
    }

    // Endpunkt zum Einreichen eines Testimonials (für eingeloggte User)
    @PostMapping("/submit")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> submitTestimonial(@Valid @RequestBody TestimonialRequest testimonialRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Long customerId = userDetails.getId(); // Annahme: User ID ist Customer ID oder es gibt eine Verknüpfung

        // Hier könntest du prüfen, ob der User berechtigt ist, ein Testimonial abzugeben
        // (z.B. kürzlich einen Termin gehabt)
        if (!testimonialService.canCustomerSubmitTestimonial(customerId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Sie müssen Kunde sein, um eine Bewertung abzugeben oder haben kürzlich keinen Service genutzt."));
        }

        Testimonial newTestimonial = new Testimonial();
        newTestimonial.setCustomerName(userDetails.getFirstName() + " " + userDetails.getLastName().charAt(0) + "."); // Vornamen + Initial
        newTestimonial.setRating(testimonialRequest.getRating());
        newTestimonial.setComment(testimonialRequest.getComment());
        // serviceId wird aus dem Request Body genommen, wenn vorhanden
        Long serviceId = testimonialRequest.getServiceId();


        try {
            Testimonial savedTestimonial = testimonialService.submitTestimonial(newTestimonial, customerId, serviceId);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedTestimonial);
        } catch (RuntimeException e) {
            logger.error("Fehler beim Einreichen des Testimonials durch User ID {}: {}", customerId, e.getMessage());
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