// friseursalon-frontend/src/services/testimonial.service.js
import api from './api.service'; // Importiert die konfigurierte Axios-Instanz

const API_URL = '/api/testimonials';

class TestimonialService {
    // Für die TestimonialsSection auf der Homepage
    getApprovedTestimonials() {
        return api.get(`${API_URL}/approved`);
    }

    // Für das TestimonialSubmitForm (eingeloggte Benutzer)
    // Die Daten sollten { customerName: string, comment: string, rating: number, (optional) userId: number } enthalten
    submitTestimonial(data) {
        return api.post(`${API_URL}/submit`, data);
    }

    // Für das TestimonialSubmitForm (Gäste)
    // Die Daten sollten { customerName: string, email: string, comment: string, rating: number } enthalten
    submitGuestTestimonial(data) {
        return api.post(`${API_URL}/submit-guest`, data);
    }

    // --- Methoden für Admin-Bereich ---

    // Alle Testimonials für das Admin-Dashboard abrufen
    getAllTestimonials() {
        return api.get(API_URL);
    }

    // Ein Testimonial genehmigen (Admin)
    approveTestimonial(testimonialId) {
        return api.put(`${API_URL}/${testimonialId}/approve`);
    }

    // Genehmigung eines Testimonials zurückziehen (Admin)
    unapproveTestimonial(testimonialId) {
        return api.put(`${API_URL}/${testimonialId}/unapprove`);
    }

    // Ein Testimonial löschen (Admin)
    deleteTestimonial(testimonialId) {
        return api.delete(`${API_URL}/${testimonialId}`);
    }
}

export default new TestimonialService();
