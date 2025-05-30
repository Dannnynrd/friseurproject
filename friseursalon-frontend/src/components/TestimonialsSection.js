// src/components/TestimonialsSection.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api.service'; // API Service importieren
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faArrowLeft, faArrowRight, faSpinner, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import "./TestimonialsSection.css";

// Hilfskomponente für Sterne-Anzeige
const RenderStars = ({ rating }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        stars.push(
            <FontAwesomeIcon
                key={i}
                icon={faStar}
                className={i <= rating ? 'star-active' : 'star-inactive'}
            />
        );
    }
    return <div className="stars">{stars}</div>;
};


function TestimonialsSection() {
    const sectionRef = useRef(null);
    const slidesRef = useRef(null);

    const [testimonials, setTestimonials] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [totalSlides, setTotalSlides] = useState(0);

    // IntersectionObserver für die "animate-up" Klasse (bleibt bestehen)
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        const currentSectionRef = sectionRef.current;
        if (currentSectionRef) {
            observer.observe(currentSectionRef);
        }

        return () => {
            if (currentSectionRef) {
                observer.unobserve(currentSectionRef);
            }
        };
    }, []);

    // Testimonials laden
    const fetchTestimonials = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/testimonials'); // Öffentlicher Endpunkt für genehmigte Testimonials
            const approvedTestimonials = (response.data || []).filter(t => t.isApproved);
            setTestimonials(approvedTestimonials);
            setTotalSlides(approvedTestimonials.length);
            setCurrentIndex(0); // Reset index when testimonials change
        } catch (err) {
            console.error("Fehler beim Laden der Testimonials:", err);
            setError("Bewertungen konnten nicht geladen werden.");
            setTestimonials([]);
            setTotalSlides(0);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTestimonials();
    }, [fetchTestimonials]);


    // Slider-Logik (angepasst für dynamische Daten)
    useEffect(() => {
        if (slidesRef.current && totalSlides > 0) {
            slidesRef.current.style.transform = `translateX(-${currentIndex * 100}%)`;
        } else if (slidesRef.current && totalSlides === 0) {
            slidesRef.current.style.transform = `translateX(0%)`;
        }
    }, [currentIndex, totalSlides]);

    const handleNext = () => {
        if (totalSlides > 0) {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
        }
    };

    const handlePrev = () => {
        if (totalSlides > 0) {
            setCurrentIndex((prevIndex) => (prevIndex - 1 + totalSlides) % totalSlides);
        }
    };

    return (
        <section id="testimonials" ref={sectionRef}>
            <div className="container">
                <div className="section-header animate-up">
                    <span className="subtitle">Was meine Kunden sagen</span>
                    <h2>Vertrauen & Ergebnisse</h2>
                </div>

                {isLoading && (
                    <div className="testimonial-loading">
                        <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                        <p>Lade Bewertungen...</p>
                    </div>
                )}

                {error && !isLoading && (
                    <div className="testimonial-error form-message error">
                        <FontAwesomeIcon icon={faExclamationCircle} /> {error}
                    </div>
                )}

                {!isLoading && !error && testimonials.length === 0 && (
                    <div className="testimonial-empty">
                        <p>Es gibt noch keine Bewertungen. Seien Sie der Erste!</p>
                    </div>
                )}

                {!isLoading && !error && testimonials.length > 0 && (
                    <div className="testimonial-slider animate-up">
                        <div className="testimonial-slides" ref={slidesRef}>
                            {testimonials.map((testimonial) => (
                                <div key={testimonial.id} className="testimonial-slide">
                                    <RenderStars rating={testimonial.rating} />
                                    <blockquote>"{testimonial.comment}"</blockquote>
                                    <cite>– {testimonial.customerName || 'Ein Kunde'}</cite>
                                    {testimonial.service && testimonial.service.name && (
                                        <p className="testimonial-service-context">
                                            für: {testimonial.service.name}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                        {totalSlides > 1 && ( // Navigation nur anzeigen, wenn mehr als ein Slide
                            <div className="slider-nav">
                                <button id="prev-testimonial" className="interactive" onClick={handlePrev} aria-label="Vorherige Bewertung">
                                    <FontAwesomeIcon icon={faArrowLeft} />
                                </button>
                                <button id="next-testimonial" className="interactive" onClick={handleNext} aria-label="Nächste Bewertung">
                                    <FontAwesomeIcon icon={faArrowRight} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

export default TestimonialsSection;