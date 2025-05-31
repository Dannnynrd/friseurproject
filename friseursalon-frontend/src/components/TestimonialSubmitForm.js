// src/components/TestimonialSubmitForm.js
import React, { useState, useEffect } from 'react';
import api from '../services/api.service';
import AuthService from '../services/auth.service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faPaperPlane, faSpinner, faExclamationCircle, faCheckCircle, faConciergeBell } from '@fortawesome/free-solid-svg-icons';
import './TestimonialSubmitForm.module.css';

const MAX_COMMENT_LENGTH = 1000;

const StarRating = ({ rating, onRatingChange, disabled }) => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
        <div className="star-rating-input">
            {[1, 2, 3, 4, 5].map((star) => (
                <FontAwesomeIcon
                    key={star}
                    icon={faStar}
                    className={`star-icon ${hoverRating >= star ? 'hover' : ''} ${rating >= star ? 'selected' : ''} ${disabled ? 'disabled': ''}`}
                    onMouseEnter={() => !disabled && setHoverRating(star)}
                    onMouseLeave={() => !disabled && setHoverRating(0)}
                    onClick={() => !disabled && onRatingChange(star)}
                    tabIndex={disabled ? -1 : 0}
                    onKeyPress={(e) => !disabled && (e.key === 'Enter' || e.key === ' ') && onRatingChange(star)}
                />
            ))}
        </div>
    );
};

const TestimonialSubmitForm = ({ serviceIdProp, onTestimonialSubmitted }) => {
    const currentUser = AuthService.getCurrentUser();
    const [customerName, setCustomerName] = useState('');
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [serviceId, setServiceId] = useState(serviceIdProp || '');
    const [availableServices, setAvailableServices] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (currentUser) {
            setCustomerName(`${currentUser.firstName} ${currentUser.lastName?.charAt(0) || ''}.`);
        }
    }, [currentUser]);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                // KORREKTUR HIER:
                const response = await api.get('services'); // Relativer Pfad
                setAvailableServices(response.data || []);
            } catch (err) {
                console.error("Fehler beim Laden der Services für Testimonial-Formular:", err);
            }
        };
        if (!serviceIdProp) {
            fetchServices();
        }
    }, [serviceIdProp]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (rating === 0) {
            setError('Bitte geben Sie eine Sternebewertung ab.');
            return;
        }
        if (!comment.trim()) {
            setError('Bitte geben Sie einen Kommentar ein.');
            return;
        }
        if (comment.trim().length < 10) {
            setError('Ihr Kommentar sollte mindestens 10 Zeichen lang sein.');
            return;
        }
        if (!currentUser && !customerName.trim()) {
            setError('Bitte geben Sie Ihren Namen an.');
            return;
        }

        setIsLoading(true);

        const testimonialData = {
            customerName: customerName.trim(),
            rating,
            comment: comment.trim(),
            serviceId: serviceId ? parseInt(serviceId) : null,
        };

        try {
            let response;
            if (currentUser) {
                const loggedInTestimonialData = { rating, comment: comment.trim(), serviceId: serviceId ? parseInt(serviceId) : null, customerName: undefined };
                // KORREKTUR HIER:
                response = await api.post('testimonials/submit', loggedInTestimonialData); // Relativer Pfad
            } else {
                // KORREKTUR HIER:
                response = await api.post('testimonials/submit-guest', testimonialData); // Relativer Pfad
            }

            setSuccessMessage('Vielen Dank! Ihre Bewertung wurde erfolgreich übermittelt und wird bald geprüft.');
            setRating(0);
            setComment('');
            setServiceId('');
            if (!currentUser) setCustomerName('');

            if (onTestimonialSubmitted) {
                onTestimonialSubmitted(response.data);
            }
        } catch (err) {
            console.error("Fehler beim Senden des Testimonials:", err.response?.data || err);
            setError(err.response?.data?.message || 'Fehler beim Senden Ihrer Bewertung.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="testimonial-submit-form-container">
            <h3>Ihre Meinung ist uns wichtig!</h3>
            <p className="form-subheading">Teilen Sie Ihre Erfahrung mit dem IMW Salon.</p>

            {successMessage && (
                <p className="form-message success slide-in-down">
                    <FontAwesomeIcon icon={faCheckCircle} /> {successMessage}
                </p>
            )}
            {error && (
                <p className="form-message error slide-in-down">
                    <FontAwesomeIcon icon={faExclamationCircle} /> {error}
                </p>
            )}

            {!successMessage && (
                <form onSubmit={handleSubmit} className="testimonial-form">
                    {!currentUser && (
                        <div className="form-group">
                            <label htmlFor="customerName">Ihr Name*</label>
                            <input
                                type="text"
                                id="customerName"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Max M."
                                required={!currentUser}
                                disabled={isLoading}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Ihre Bewertung*</label>
                        <StarRating rating={rating} onRatingChange={setRating} disabled={isLoading} />
                    </div>

                    {availableServices.length > 0 && !serviceIdProp && (
                        <div className="form-group">
                            <label htmlFor="serviceId"><FontAwesomeIcon icon={faConciergeBell} /> Welche Dienstleistung bewerten Sie? (Optional)</label>
                            <select
                                id="serviceId"
                                value={serviceId}
                                onChange={(e) => setServiceId(e.target.value)}
                                disabled={isLoading}
                                className="form-control"
                            >
                                <option value="">Allgemeines Feedback</option>
                                {availableServices.map(service => (
                                    <option key={service.id} value={service.id}>
                                        {service.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="comment">Ihr Kommentar* ({comment.length}/{MAX_COMMENT_LENGTH})</label>
                        <textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
                            rows="5"
                            placeholder="Erzählen Sie uns von Ihrer Erfahrung..."
                            required
                            minLength="10"
                            maxLength={MAX_COMMENT_LENGTH}
                            disabled={isLoading}
                        />
                        <small className="char-counter">{MAX_COMMENT_LENGTH - comment.length} Zeichen übrig</small>
                    </div>

                    <button type="submit" className="button-link submit-testimonial-btn" disabled={isLoading}>
                        {isLoading ? (
                            <><FontAwesomeIcon icon={faSpinner} spin /> Wird gesendet...</>
                        ) : (
                            <><FontAwesomeIcon icon={faPaperPlane} /> Bewertung absenden</>
                        )}
                    </button>
                </form>
            )}
        </div>
    );
};

export default TestimonialSubmitForm;