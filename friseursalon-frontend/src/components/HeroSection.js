// friseursalon-frontend/src/components/HeroSection.js
import React, { useEffect, useRef } from 'react';
// HIER den Import ändern:
import styles from './HeroSection.module.css'; // Importiert als CSS-Modul

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
        // Tailwind-Klassen für Basis-Layout und einige Stile.
        // CSS-Modul-Klassen für spezifischere oder komplexere Stile.
        <section
            id="hero" // ID bleibt für interne Links und ggf. globale Stile, die wir noch nicht migriert haben
            ref={sectionRef}
            // Hier kombinieren wir Tailwind-Klassen mit der CSS-Modul-Klasse für das Hintergrundbild und Overlay
            className={`flex items-center relative min-h-[calc(100vh-var(--header-height-desktop))] md:min-h-[calc(100vh-var(--header-height-mobile))] ${styles.heroBackground}`}
        >
            <div className={`container mx-auto px-6 relative z-10 max-w-3xl ${styles.heroContent}`}>
                {/*
                  Tailwind-Klassen für Typografie, Abstände etc.
                  'animate-up' wird weiterhin über JavaScript und globale CSS-Klasse 'visible' gesteuert.
                  Die Schriftart 'font-serif' und 'font-sans' kommt aus der tailwind.config.js.
                */}
                <h1
                    className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight font-medium text-dark-text animate-up ${styles.heroTitle}`}
                >
                    Die Kunst der Reduktion.
                </h1>
                <p
                    className={`text-base sm:text-lg md:text-xl mt-5 max-w-md text-medium-grey-text animate-up ${styles.heroSubtitle}`}
                    style={{ transitionDelay: '0.1s' }}
                >
                    Wir gestalten nicht nur Frisuren. Wir kreieren Balance, Form und ein Gefühl von müheloser Eleganz.
                </p>
            </div>
        </section>
    );
}

export default HeroSection;
