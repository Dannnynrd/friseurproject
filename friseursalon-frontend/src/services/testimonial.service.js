// friseursalon-frontend/src/services/testimonial.service.js
import api from './api.service';

const API_PATH = 'testimonials';

class TestimonialService {
    getApprovedTestimonials() {
        return api.get(`${API_PATH}/approved`); // Korrekt: sollte GET /api/testimonials sein, wenn approved Standard ist oder eigener Endpoint. Aktuell /api/testimonials/approved.
    }

    submitTestimonial(data) {
        return api.post(`${API_PATH}/submit`, data);
    }

    submitGuestTestimonial(data) {
        return api.post(`${API_PATH}/submit-guest`, data);
    }

    getAllTestimonials() {
        return api.get(`${API_PATH}/admin/all`);
    }

    approveTestimonial(testimonialId) {
        return api.put(`${API_PATH}/admin/approve/${testimonialId}`); // Korrigiert mit Backticks
    }

    unapproveTestimonial(testimonialId) {
        return api.put(`${API_PATH}/admin/unapprove/${testimonialId}`); // Korrigiert mit Backticks
    }

    deleteTestimonial(testimonialId) {
        return api.delete(`${API_PATH}/admin/${testimonialId}`); // Korrigiert mit Backticks
    }
}

export default new TestimonialService();