import React, { useEffect, useRef } from 'react';
import './HeroSection.css'; // HIER den Import hinzufügen

function HeroSection() {
    const sectionRef = useRef(null);

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
                observer.unobserve(sectionRef.current); // Korrektur: unobserve
            }
        };
    }, []);

    return (
        <section id="hero" ref={sectionRef}>
            <div className="container hero-content">
                <h1 className="hero-title animate-up">Die Kunst der Reduktion.</h1>
                <p className="hero-subtitle animate-up" style={{ transitionDelay: '0.1s' }}>Wir gestalten nicht nur Frisuren. Wir kreieren Balance, Form und ein Gefühl von müheloser Eleganz.</p>
            </div>
        </section>
    );
}

export default HeroSection;