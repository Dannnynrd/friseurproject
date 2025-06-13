import React, { useEffect, useRef } from 'react';
import styles from './ExperienceSection.module.css';
import { FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function ExperienceSection() {
    const sectionRef = useRef(null);
    const navigate = useNavigate();

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
            { threshold: 0.2 } // Startet die Animation, wenn 20% sichtbar sind
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

    const handleNavigation = () => {
        // Später könnte dies zu einer dedizierten "Über Uns" Seite führen
        document.getElementById('about-founder')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section ref={sectionRef} className={styles.experienceSection}>
            <div className={styles.container}>
                <div className={styles.imageWrapper}>
                    {/* Das Bild wird über CSS als Hintergrund geladen */}
                </div>
                <div className={styles.contentWrapper}>
                    <h2 className={styles.headline}>
                        Ihr Stil, <br />
                        perfektioniert.
                    </h2>
                    <p className={styles.description}>
                        Wir verbinden meisterhaftes Handwerk mit einem tiefen Verständnis für Ästhetik, um einen Look zu kreieren, der exklusiv für Sie ist.
                    </p>
                    <button onClick={handleNavigation} className={styles.ctaButton}>
                        Unsere Philosophie
                        <FiArrowRight className={styles.ctaIcon} />
                    </button>
                </div>
            </div>
        </section>
    );
}

export default ExperienceSection;
