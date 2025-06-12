import api from './api.service';

const API_PATH = 'testimonials';

class TestimonialService {
    getApprovedTestimonials() {
        // Korrigiert: Ruft GET /api/testimonials auf
        return api.get(API_PATH);
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
        return api.put(`${API_PATH}/admin/approve/${testimonialId}`);
    }

    unapproveTestimonial(testimonialId) {
        return api.put(`${API_PATH}/admin/unapprove/${testimonialId}`);
    }

    deleteTestimonial(testimonialId) {
        return api.delete(`${API_PATH}/admin/${testimonialId}`);
    }
}

export default new TestimonialService();