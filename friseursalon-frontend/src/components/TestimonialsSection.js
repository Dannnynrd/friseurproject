// friseursalon-frontend/src/components/TestimonialsSection.js
import React, { useEffect, useState, useRef } from 'react';
import TestimonialService from '../services/testimonial.service';
// HIER den Import ändern:
import styles from './TestimonialsSection.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuoteLeft, faChevronLeft, faChevronRight, faStar as fasStar } from '@fortawesome/free-solid-svg-icons'; // fasStar für gefüllten Stern
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons'; // farStar für leeren Stern

function TestimonialsSection() {
    const [testimonials, setTestimonials] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const sectionRef = useRef(null);
    const sliderRef = useRef(null);

    useEffect(() => {
        TestimonialService.getApprovedTestimonials()
            .then(response => {
                setTestimonials(response.data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching testimonials:", err);
                setError('Bewertungen konnten nicht geladen werden.');
                setLoading(false);
            });
    }, []);

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

    useEffect(() => {
        if (sliderRef.current && testimonials.length > 0) {
            const scrollAmount = sliderRef.current.offsetWidth * currentIndex;
            sliderRef.current.scrollTo({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    }, [currentIndex, testimonials.length]);


    const nextTestimonial = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    };

    const prevTestimonial = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <FontAwesomeIcon
                    key={i}
                    icon={i <= rating ? fasStar : farStar}
                    className="text-yellow-400" // Tailwind class for star color
                />
            );
        }
        return stars;
    };


    if (loading) {
        return (
            <section id="testimonials" className="py-16 md:py-24 bg-light-grey-bg">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-medium-grey-text">Lade Bewertungen...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section id="testimonials" className="py-16 md:py-24 bg-light-grey-bg">
                <div className="container mx-auto px-6 text-center">
                    <p className="text-red-600">{error}</p>
                </div>
            </section>
        );
    }

    if (testimonials.length === 0) {
        return null; // Keine Sektion anzeigen, wenn keine Testimonials vorhanden sind
    }

    return (
        <section
            id="testimonials"
            ref={sectionRef}
            className="py-16 md:py-24 bg-light-grey-bg overflow-hidden" // overflow-hidden für den Slider
        >
            <div className="container mx-auto px-6">
                <div className="section-header text-center max-w-xl mx-auto mb-10 md:mb-16 animate-up">
                    <span className="text-xs font-semibold text-medium-grey-text uppercase tracking-wider mb-1">
                        Das sagen meine Kunden
                    </span>
                    <h2 className="font-serif text-3xl md:text-4xl font-medium text-dark-text mb-2">
                        Bewertungen
                    </h2>
                </div>

                <div className={`relative animate-up ${styles.sliderContainer}`}>
                    <div
                        ref={sliderRef}
                        className={`flex transition-transform duration-500 ease-in-out ${styles.testimonialSlider}`}
                    >
                        {testimonials.map((testimonial) => (
                            <div
                                key={testimonial.id}
                                className={`flex-shrink-0 w-full p-2 md:p-4 ${styles.testimonialSlide}`}
                            >
                                <div className={`bg-white p-6 md:p-8 rounded-lg shadow-lg mx-auto max-w-2xl ${styles.testimonialCard}`}>
                                    <FontAwesomeIcon icon={faQuoteLeft} className={`text-3xl text-gray-300 mb-4 ${styles.quoteIcon}`} />
                                    <div className="mb-3 flex items-center justify-center space-x-1">
                                        {renderStars(testimonial.rating)}
                                    </div>
                                    <p className={`text-medium-grey-text italic text-base md:text-lg mb-6 ${styles.testimonialText}`}>
                                        "{testimonial.comment}"
                                    </p>
                                    <p className={`font-semibold text-dark-text text-sm ${styles.testimonialAuthor}`}>
                                        - {testimonial.customerName}
                                    </p>
                                    {/* Optional: Datum anzeigen, wenn vorhanden und gewünscht */}
                                    {/* testimonial.date && (
                                        <p className="text-xs text-light-grey-text mt-1">
                                            {new Date(testimonial.date).toLocaleDateString()}
                                        </p>
                                    )*/}
                                </div>
                            </div>
                        ))}
                    </div>

                    {testimonials.length > 1 && (
                        <>
                            <button
                                onClick={prevTestimonial}
                                aria-label="Vorherige Bewertung"
                                className={`absolute top-1/2 left-0 sm:-left-4 md:-left-6 transform -translate-y-1/2 z-10 p-2 bg-white/70 hover:bg-white rounded-full shadow-md transition-colors duration-200 ${styles.sliderButton} ${styles.prevButton}`}
                            >
                                <FontAwesomeIcon icon={faChevronLeft} className="text-dark-text h-5 w-5" />
                            </button>
                            <button
                                onClick={nextTestimonial}
                                aria-label="Nächste Bewertung"
                                className={`absolute top-1/2 right-0 sm:-right-4 md:-right-6 transform -translate-y-1/2 z-10 p-2 bg-white/70 hover:bg-white rounded-full shadow-md transition-colors duration-200 ${styles.sliderButton} ${styles.nextButton}`}
                            >
                                <FontAwesomeIcon icon={faChevronRight} className="text-dark-text h-5 w-5" />
                            </button>
                        </>
                    )}
                </div>
                {/* Navigation Dots */}
                {testimonials.length > 1 && (
                    <div className="flex justify-center mt-8 space-x-2">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                aria-label={`Gehe zu Bewertung ${index + 1}`}
                                className={`w-3 h-3 rounded-full transition-colors duration-200
                                            ${currentIndex === index ? 'bg-dark-text' : 'bg-gray-300 hover:bg-gray-400'}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default TestimonialsSection;
