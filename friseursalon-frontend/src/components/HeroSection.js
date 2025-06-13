import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HeroSection.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faArrowRight } from '@fortawesome/free-solid-svg-icons';

function HeroSection() {
    const navigate = useNavigate();
    const sectionRef = useRef(null);

    // Intersection Observer für die Einblend-Animation
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(styles.visible);
                    }
                });
            },
            { threshold: 0.1 }
        );

        const currentRef = sectionRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, []);

    // Funktion zum sanften Scrollen zu einer Sektion
    const scrollToSection = (e, sectionId) => {
        e.preventDefault();
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section ref={sectionRef} className={styles.heroSection}>
            <div className={styles.heroBackground}></div>
            <div className={styles.heroOverlay}></div>

            <div className={styles.heroContent}>
                <h1 className={styles.heroHeadline}>
                    Ihr Moment der Eleganz
                </h1>

                {/* Neuer, dezenter Untertitel */}
                <p className={styles.heroSubtitle}>
                    Exklusives Haarstyling und persönliche Beratung in Kiel.
                </p>

                <div className={styles.ctaContainer}>
                    <button onClick={() => navigate('/buchen')} className={`${styles.ctaButton} ${styles.ctaButtonPrimary}`}>
                        Termin buchen
                    </button>
                    <a href="#services-section" onClick={(e) => scrollToSection(e, 'services-section')} className={`${styles.ctaButton} ${styles.ctaButtonSecondary}`}>
                        Unsere Services
                    </a>
                </div>
            </div>
        </section>
    );
}

export default HeroSection;
