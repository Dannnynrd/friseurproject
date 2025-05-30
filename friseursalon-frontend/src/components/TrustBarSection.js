// friseursalon-frontend/src/components/TrustBarSection.js
import React, { useEffect, useRef } from 'react';
// HIER den Import ändern:
import styles from './TrustBarSection.module.css'; // Importiert als CSS-Modul

function TrustBarSection() {
    const sectionRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        const currentSectionRef = sectionRef.current; // Kopie für Cleanup

        if (currentSectionRef) {
            observer.observe(currentSectionRef);
        }

        return () => {
            if (currentSectionRef) {
                observer.unobserve(currentSectionRef);
            }
        };
    }, []);

    return (
        <section
            id="trust-bar" // ID für interne Links beibehalten
            ref={sectionRef}
            // Tailwind-Klassen für Hintergrund und Padding.
            // Die 'visible' Klasse für Animationen wird von App.js (global) gesteuert.
            className="bg-light-grey-bg py-10 sm:py-16"
        >
            <div className="container mx-auto px-6">
                {/*
                  Tailwind-Grid für responsive Spalten.
                  'animate-up' wird weiterhin über JavaScript und globale CSS-Klasse 'visible' gesteuert.
                */}
                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center ${styles.trustGrid}`}>
                    <div className={`animate-up ${styles.trustItem}`}>
                        <h3 className={`font-serif text-3xl sm:text-4xl font-semibold text-dark-text mb-1 ${styles.trustItemValue}`}>
                            1.500+
                        </h3>
                        <p className={`text-sm text-medium-grey-text ${styles.trustItemLabel}`}>
                            5-Sterne Bewertungen
                        </p>
                    </div>
                    <div className={`animate-up ${styles.trustItem}`} style={{ transitionDelay: '0.1s' }}>
                        <h3 className={`font-serif text-3xl sm:text-4xl font-semibold text-dark-text mb-1 ${styles.trustItemValue}`}>
                            10+
                        </h3>
                        <p className={`text-sm text-medium-grey-text ${styles.trustItemLabel}`}>
                            Jahre Erfahrung
                        </p>
                    </div>
                    <div className={`animate-up ${styles.trustItem}`} style={{ transitionDelay: '0.2s' }}>
                        <h3 className={`font-serif text-3xl sm:text-4xl font-semibold text-dark-text mb-1 ${styles.trustItemValue}`}>
                            100%
                        </h3>
                        <p className={`text-sm text-medium-grey-text ${styles.trustItemLabel}`}>
                            Nachhaltige Produkte
                        </p>
                    </div>
                    <div className={`animate-up ${styles.trustItem}`} style={{ transitionDelay: '0.3s' }}>
                        <h3 className={`font-serif text-3xl sm:text-4xl font-semibold text-dark-text mb-1 ${styles.trustItemValue}`}>
                            Top 10
                        </h3>
                        <p className={`text-sm text-medium-grey-text ${styles.trustItemLabel}`}>
                            Salon in Berlin (Vogue)
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default TrustBarSection;
