// friseursalon-frontend/src/services/testimonial.service.js
import api from './api.service'; // Importiert die konfigurierte Axios-Instanz

// API_URL sollte der Basispfad für Testimonials *nach* /api/ sein.
const API_PATH = 'testimonials'; // Geändert von API_URL und ohne /api/

class TestimonialService {
    // Für die TestimonialsSection auf der Homepage
    getApprovedTestimonials() {
        // Ruft GET http://localhost:8080/api/testimonials/approved auf
        return api.get(`${API_PATH}/approved`);
    }

    // Für das TestimonialSubmitForm (eingeloggte Benutzer)
    submitTestimonial(data) {
        // Ruft POST http://localhost:8080/api/testimonials/submit auf
        return api.post(`${API_PATH}/submit`, data);
    }

    // Für das TestimonialSubmitForm (Gäste)
    submitGuestTestimonial(data) {
        // Ruft POST http://localhost:8080/api/testimonials/submit-guest auf
        return api.post(`${API_PATH}/submit-guest`, data);
    }

    // --- Methoden für Admin-Bereich ---

    // Alle Testimonials für das Admin-Dashboard abrufen
    getAllTestimonials() {
        // Ruft GET http://localhost:8080/api/testimonials/admin/all auf
        return api.get(`${API_PATH}/admin/all`);
    }

    // Ein Testimonial genehmigen (Admin)
    approveTestimonial(testimonialId) {
        // Ruft PUT http://localhost:8080/api/testimonials/admin/approve/{testimonialId} auf
        return api.put(`<span class="math-inline">\{API\_PATH\}/admin/approve/</span>{testimonialId}`);
    }

    // Genehmigung eines Testimonials zurückziehen (Admin)
    unapproveTestimonial(testimonialId) {
        // Ruft PUT http://localhost:8080/api/testimonials/admin/unapprove/{testimonialId} auf
        return api.put(`<span class="math-inline">\{API\_PATH\}/admin/unapprove/</span>{testimonialId}`);
    }

    // Ein Testimonial löschen (Admin)
    deleteTestimonial(testimonialId) {
        // Ruft DELETE http://localhost:8080/api/testimonials/admin/{testimonialId} auf
        return api.delete(`<span class="math-inline">\{API\_PATH\}/admin/</span>{testimonialId}`);
    }
}

export default new TestimonialService();