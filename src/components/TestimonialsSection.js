import React, { useState, useEffect, useRef } from 'react';

function TestimonialsSection() {
    const sectionRef = useRef(null); // Für scroll animation
    const slidesRef = useRef(null); // Für den Slider-Container

    const [currentIndex, setCurrentIndex] = useState(0);
    const [totalSlides, setTotalSlides] = useState(0);

    // IntersectionObserver für die "animate-up" Klasse
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, []);

    // Logik für den Testimonial-Slider
    useEffect(() => {
        if (slidesRef.current) {
            const testimonialSlides = slidesRef.current.querySelectorAll('.testimonial-slide');
            setTotalSlides(testimonialSlides.length);
        }
    }, []); // Nur einmal beim Mount

    useEffect(() => {
        if (slidesRef.current) {
            slidesRef.current.style.transform = `translateX(-${currentIndex * 100}%)`;
        }
    }, [currentIndex]); // Aktualisiere den Slider, wenn sich currentIndex ändert

    const handleNext = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
    };

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + totalSlides) % totalSlides);
    };

    return (
        <section id="testimonials" ref={sectionRef}>
            <div className="container">
                <div className="section-header animate-up">
                    <span className="subtitle">Was meine Kunden sagen</span>
                    <h2>Vertrauen & Ergebnisse</h2>
                </div>
                <div className="testimonial-slider animate-up">
                    <div className="testimonial-slides" ref={slidesRef}>
                        <div className="testimonial-slide">
                            <div className="stars"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></div>
                            <blockquote>"Der beste Haarschnitt meines Lebens. Julia hat meine Erwartungen übertroffen. Eine Oase der Ruhe mitten in der Stadt."</blockquote>
                            <cite>– Maria S.</cite>
                        </div>
                        <div className="testimonial-slide">
                            <div className="stars"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></div>
                            <blockquote>"Julia ist eine wahre Künstlerin! Meine Balayage sieht so natürlich aus. Ich wurde noch nie so gut beraten."</blockquote>
                            <cite>– Lena K.</cite>
                        </div>
                        <div className="testimonial-slide">
                            <div className="stars"><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i></div>
                            <blockquote>"Absolut professionell von Anfang bis Ende. Julia hat sich Zeit genommen und das Ergebnis ist fantastisch. Ich komme wieder!"</blockquote>
                            <cite>– Thomas R.</cite>
                        </div>
                    </div>
                    <div className="slider-nav">
                        <button id="prev-testimonial" className="interactive" onClick={handlePrev}><i className="fas fa-arrow-left"></i></button>
                        <button id="next-testimonial" className="interactive" onClick={handleNext}><i className="fas fa-arrow-right"></i></button>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default TestimonialsSection;