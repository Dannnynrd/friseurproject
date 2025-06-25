// src/components/TestimonialsSection.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './TestimonialsSection.module.css';
import { FaStar, FaQuoteLeft } from 'react-icons/fa';
import TestimonialModal from './TestimonialModal';

const testimonials = [
    { id: 1, author: 'Julia S.', text: 'Der beste Haarschnitt, den ich je hatte! Ibrahim hat meine Wünsche perfekt verstanden und umgesetzt. Ich fühle mich wie ein neuer Mensch. Das Ambiente ist modern, sauber und man fühlt sich sofort wohl. Absolut jeden Cent wert!', rating: 5 },
    { id: 2, author: 'Markus T.', text: 'Absolute Professionalität und ein Ergebnis, das einfach überzeugt.', rating: 5 },
    { id: 3, author: 'Elena R.', text: 'Ich war unsicher wegen einer neuen Haarfarbe, aber die Beratung war fantastisch. Das Balayage sieht so natürlich und wunderschön aus. Tausend Dank! Ich komme auf jeden Fall wieder und kann den Salon nur wärmstens empfehlen.', rating: 5 },
    { id: 4, author: 'David B.', text: 'Ein Salon, der sein Handwerk wirklich versteht. Präzise und mit einem tollen Auge für Details. Ich komme definitiv wieder.', rating: 4 }
];

const StarRating = ({ rating }) => (
    <div className={styles.starRating}>
        {[...Array(5)].map((_, index) => (
            <FaStar key={index} color={index < rating ? '#ffc107' : '#e4e5e9'} />
        ))}
    </div>
);

const TestimonialCard = ({ testimonial, onReadMore }) => {
    const [needsExpansion, setNeedsExpansion] = useState(false);
    const textRef = useRef(null);

    useEffect(() => {
        if (textRef.current && textRef.current.scrollHeight > textRef.current.clientHeight) {
            setNeedsExpansion(true);
        }
    }, [testimonial.text]);

    return (
        <div className={styles.testimonialCard}>
            <FaQuoteLeft className={styles.quoteIcon} />
            <div className={styles.cardContent}>
                <StarRating rating={testimonial.rating} />
                <p ref={textRef} className={styles.testimonialText}>
                    {testimonial.text}
                </p>
                {needsExpansion && (
                    <button onClick={() => onReadMore(testimonial)} className={styles.readMoreButton}>
                        Mehr lesen...
                    </button>
                )}
                <p className={styles.testimonialAuthor}>- {testimonial.author}</p>
            </div>
        </div>
    );
};

function TestimonialsSection() {
    const sectionRef = useRef(null);
    const trackRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [selectedTestimonial, setSelectedTestimonial] = useState(null);

    // Observer für die Sichtbarkeit der Sektion
    useEffect(() => {
        const sectionObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setIsVisible(true);
                sectionObserver.unobserve(entries[0].target);
            }
        }, { threshold: 0.1 });
        const currentSectionRef = sectionRef.current;
        if (currentSectionRef) sectionObserver.observe(currentSectionRef);
        return () => { if (currentSectionRef) sectionObserver.unobserve(currentSectionRef); };
    }, []);

    // Observer für den Fokus-Effekt
    useEffect(() => {
        const track = trackRef.current;
        if (!track || !isVisible) return;

        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                entry.target.classList.toggle(styles.isActive, entry.isIntersecting);
            });
        }, { root: track, threshold: 0.6 });

        const cards = track.querySelectorAll(`.${styles.testimonialCard}`);
        cards.forEach(card => cardObserver.observe(card));
        return () => cards.forEach(card => cardObserver.unobserve(card));
    }, [isVisible]);

    // NEU: Logik für "Click and Drag" auf dem Desktop
    useEffect(() => {
        const slider = trackRef.current;
        if (!slider) return;

        let isDown = false;
        let startX;
        let scrollLeft;

        const handleMouseDown = (e) => {
            isDown = true;
            slider.classList.add(styles.isDragging);
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        };

        const handleMouseLeave = () => {
            isDown = false;
            slider.classList.remove(styles.isDragging);
        };

        const handleMouseUp = () => {
            isDown = false;
            slider.classList.remove(styles.isDragging);
        };

        const handleMouseMove = (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2; // Multiplikator für schnellere Bewegung
            slider.scrollLeft = scrollLeft - walk;
        };

        slider.addEventListener('mousedown', handleMouseDown);
        slider.addEventListener('mouseleave', handleMouseLeave);
        slider.addEventListener('mouseup', handleMouseUp);
        slider.addEventListener('mousemove', handleMouseMove);

        return () => {
            slider.removeEventListener('mousedown', handleMouseDown);
            slider.removeEventListener('mouseleave', handleMouseLeave);
            slider.removeEventListener('mouseup', handleMouseUp);
            slider.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <>
            <section
                ref={sectionRef}
                className={`${styles.testimonialSection} ${isVisible ? styles.visible : ''}`}
            >
                <div className={styles.container}>
                    <header className={styles.sectionHeader}>
                        <p className={styles.subtitle}>Echte Stimmen, Echte Begeisterung</p>
                        <h2 className={styles.title}>Was unsere Kunden sagen</h2>
                    </header>

                    <div ref={trackRef} className={styles.testimonialsContainer}>
                        {testimonials.map((testimonial) => (
                            <TestimonialCard
                                key={testimonial.id}
                                testimonial={testimonial}
                                onReadMore={setSelectedTestimonial}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <TestimonialModal
                testimonial={selectedTestimonial}
                onClose={() => setSelectedTestimonial(null)}
            />
        </>
    );
}

export default TestimonialsSection;