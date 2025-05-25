import React, { useEffect, useRef } from 'react';

function TrustBarSection() {
    const sectionRef = useRef(null);

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

    return (
        <section id="trust-bar" ref={sectionRef}>
            <div className="container">
                <div className="trust-grid">
                    <div className="trust-item animate-up">
                        <h3>1.500+</h3>
                        <p>5-Sterne Bewertungen</p>
                    </div>
                    <div className="trust-item animate-up" style={{ transitionDelay: '0.1s' }}>
                        <h3>10+</h3>
                        <p>Jahre Erfahrung</p>
                    </div>
                    <div className="trust-item animate-up" style={{ transitionDelay: '0.2s' }}>
                        <h3>100%</h3>
                        <p>Nachhaltige Produkte</p>
                    </div>
                    <div className="trust-item animate-up" style={{ transitionDelay: '0.3s' }}>
                        <h3>Top 10</h3>
                        <p>Salon in Berlin (Vogue)</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default TrustBarSection;