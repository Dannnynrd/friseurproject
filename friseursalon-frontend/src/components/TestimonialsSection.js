// src/components/TestimonialsSection.js
import React, { useState, useEffect, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import styles from './TestimonialsSection.module.css';
import { FaStar, FaQuoteLeft } from 'react-icons/fa';
import TestimonialModal from './TestimonialModal';

const testimonials = [
    { id: 1, author: 'Julia S.', text: 'Der beste Haarschnitt, den ich je hatte! Ibrahim hat meine Wünsche perfekt verstanden und umgesetzt. Ich fühle mich wie ein neuer Mensch. Das Ambiente ist modern, sauber und man fühlt sich sofort wohl. Absolut jeden Cent wert!', rating: 5 },
    { id: 2, author: 'Markus T.', text: 'Absolute Professionalität und ein Ergebnis, das einfach überzeugt.', rating: 5 },
    { id: 3, author: 'Elena R.', text: 'Ich war unsicher wegen einer neuen Haarfarbe, aber die Beratung war fantastisch. Das Balayage sieht so natürlich und wunderschön aus. Tausend Dank! Ich komme auf jeden Fall wieder und kann den Salon nur wärmstens empfehlen.', rating: 5 },
    { id: 4, author: 'David B.', text: 'Ein Salon, der sein Handwerk wirklich versteht. Präzise und mit einem tollen Auge für Details. Ich komme definitiv wieder.', rating: 4 },
    { id: 5, author: 'Sophie K.', text: 'Endlich ein Friseur, der zuhört. Ich bin mehr als zufrieden!', rating: 5 }
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
        const checkExpansion = () => {
            if (textRef.current && textRef.current.scrollHeight > textRef.current.clientHeight) {
                setNeedsExpansion(true);
            } else {
                setNeedsExpansion(false);
            }
        };
        setTimeout(checkExpansion, 200);
        window.addEventListener('resize', checkExpansion);
        return () => window.removeEventListener('resize', checkExpansion);
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
    const [isVisible, setIsVisible] = useState(false);
    const [selectedTestimonial, setSelectedTestimonial] = useState(null);
    // NEU: Embla Carousel Hook
    const [emblaRef] = useEmblaCarousel({
        align: 'start',
        containScroll: 'trimSnaps',
        dragFree: true, // Ermöglicht das "Werfen" des Karussells
    });

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

                    {/* NEU: Embla Carousel Struktur */}
                    <div className={styles.embla} ref={emblaRef}>
                        <div className={styles.embla__container}>
                            {testimonials.map((testimonial, index) => (
                                <div className={styles.embla__slide} key={testimonial.id}>
                                    <TestimonialCard
                                        testimonial={testimonial}
                                        onReadMore={setSelectedTestimonial}
                                    />
                                </div>
                            ))}
                        </div>
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