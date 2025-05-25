import React, { useEffect, useRef } from 'react';

function HeroSection() {
    const sectionRef = useRef(null);

    // IntersectionObserver für die "animate-up" Klasse
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                } else {
                    // Optional: remove 'visible' if it scrolls out of view
                    // entry.target.classList.remove('visible');
                }
            });
        }, { threshold: 0.1 }); // Trigger, wenn 10% des Elements sichtbar sind

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        // Cleanup-Funktion: Observer trennen, wenn die Komponente unmounted wird
        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, []); // Leeres Array, damit der Effekt nur einmal beim Mount ausgeführt wird

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