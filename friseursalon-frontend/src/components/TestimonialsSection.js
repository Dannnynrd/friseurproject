// src/components/TestimonialsSection.js
import React, { useState, useEffect, useRef } from 'react';
import styles from './TestimonialsSection.module.css';
import { FaStar, FaQuoteLeft } from 'react-icons/fa';

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

const TestimonialCard = ({ testimonial, index }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [needsExpansion, setNeedsExpansion] = useState(false);
    const textRef = useRef(null);

    useEffect(() => {
        const checkExpansion = () => {
            if (textRef.current && textRef.current.scrollHeight > textRef.current.clientHeight) {
                setNeedsExpansion(true);
            } else {
                setNeedsExpansion(false);
            }
        };
        // Kurze Verzögerung, um sicherzustellen, dass der Browser das Layout berechnet hat
        setTimeout(checkExpansion, 100);
    }, [testimonial.text]);

    return (
        <div className={`${styles.testimonialCard} ${isExpanded ? styles.isExpanded : ''}`} style={{transitionDelay: `${index * 100}ms`}}>
            <FaQuoteLeft className={styles.quoteIcon} />
            <div className={styles.cardContent}>
                <StarRating rating={testimonial.rating} />
                <p ref={textRef} className={styles.testimonialText}>
                    {testimonial.text}
                </p>
                {needsExpansion && (
                    <button onClick={() => setIsExpanded(!isExpanded)} className={styles.readMoreButton}>
                        {isExpanded ? 'Weniger anzeigen' : 'Mehr lesen...'}
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

    // Observer für den Fokus-Effekt NUR auf Mobile
    useEffect(() => {
        const track = trackRef.current;
        if (!track || !isVisible || window.innerWidth >= 1024) return;

        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                entry.target.classList.toggle(styles.isActive, entry.isIntersecting);
            });
        }, { root: track, threshold: 0.6 });

        const cards = track.querySelectorAll(`.${styles.testimonialCard}`);
        cards.forEach(card => cardObserver.observe(card));
        return () => cards.forEach(card => cardObserver.unobserve(card));
    }, [isVisible]);

    return (
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
                    {testimonials.map((testimonial, index) => (
                        <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}

export default TestimonialsSection;