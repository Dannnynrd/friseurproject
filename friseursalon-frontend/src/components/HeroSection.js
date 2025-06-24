// src/components/HeroSection.js
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HeroSection.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCalendarAlt, faChevronDown } from '@fortawesome/free-solid-svg-icons';

function HeroSection() {
    const navigate = useNavigate();
    const sectionRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(styles.visible);
                        observer.unobserve(entry.target);
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

    const scrollToNextSection = (e) => {
        e.preventDefault();
        const nextSection = sectionRef.current.nextElementSibling;
        if (nextSection) {
            nextSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section ref={sectionRef} className={styles.heroSection}>
            <div className={styles.heroBackground}></div>
            <div className={styles.heroOverlay}></div>

            <div className={styles.heroContent}>
                <h1 className={styles.heroHeadline}>
                    Die Kunst des <br /> perfekten Schnitts
                </h1>
                <p className={styles.heroSubtitle}>
                    Wir verbinden zeitlose Eleganz mit modernen Techniken, um einen Look zu kreieren, der Ihre Persönlichkeit unterstreicht.
                </p>
                <div className={styles.ctaContainer}>
                    <button onClick={() => navigate('/buchen')} className={`${styles.ctaButton} ${styles.ctaButtonPrimary}`}>
                        <FontAwesomeIcon icon={faCalendarAlt} className={styles.ctaIcon} />
                        Termin buchen
                    </button>
                    <button onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })} className={`${styles.ctaButton} ${styles.ctaButtonSecondary}`}>
                        Unsere Services
                        <FontAwesomeIcon icon={faArrowRight} className={`${styles.ctaIcon} ${styles.ctaIconRight}`} />
                    </button>
                </div>
            </div>

            <a href="#trust-bar" onClick={scrollToNextSection} className={styles.scrollDownIndicator} aria-label="Zum nächsten Abschnitt scrollen">
                <FontAwesomeIcon icon={faChevronDown} />
            </a>
        </section>
    );
}

export default HeroSection;