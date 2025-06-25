// friseursalon-frontend/src/components/AboutFounderSection.js
import React, { useState, useEffect, useRef } from 'react';
import styles from './AboutFounderSection.module.css';

function AboutFounderSection() {
    const sectionRef = useRef(null);
    // NEU: Ein State, der die Sichtbarkeit steuert. Das ist die robuste Lösung.
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // Wenn die Sektion ins Bild kommt, setzen wir den State auf true.
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target); // Die Animation muss nur einmal ausgelöst werden.
                }
            });
        }, { threshold: 0.1 });

        const currentSectionRef = sectionRef.current;
        if (currentSectionRef) {
            observer.observe(currentSectionRef);
        }
        return () => {
            if (currentSectionRef) {
                observer.unobserve(currentSectionRef);
            }
        };
    }, []);

    const founderImageUrl = "https://images.pexels.com/photos/3760695/pexels-photo-3760695.jpeg?auto=compress&cs=tinysrgb&w=800";

    return (
        // NEU: Die 'visible'-Klasse wird jetzt basierend auf dem State hinzugefügt.
        <section
            id="about-founder"
            ref={sectionRef}
            className={`${styles.aboutSection} ${isVisible ? styles.visible : ''}`}
        >
            <div className={styles.container}>
                <div className={styles.layoutGrid}>
                    <div className={styles.imageWrapper}>
                        <img
                            src={founderImageUrl}
                            alt="Inhaber des Salons, Ibrahim"
                            className={styles.founderImage}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://placehold.co/600x800/e2e8f0/94a3b8?text=Bild+nicht+gefunden";
                            }}
                        />
                    </div>

                    <div className={styles.textWrapper}>
                        <span className={styles.signature}>I</span>

                        <div className={styles.textContent}>
                            <p className={styles.subtitle}>Der Gründer</p>
                            <h2 className={styles.title}>Ibrahim</h2>
                            <p className={styles.founderBio}>
                                Seit über einem Jahrzehnt widme ich mich der Kunst des Haares. Meine Philosophie basiert auf der Überzeugung, dass wahre Schönheit in der Harmonie von Schnitt, Farbe und der Persönlichkeit meiner Kundinnen und Kunden liegt.
                            </p>
                            <p className={styles.founderBio}>
                                Nach meiner Ausbildung in renommierten Salons und stetigen Weiterbildungen bei internationalen Top-Stylisten, habe ich mir mit meinem Salon den Traum eines eigenen Ateliers erfüllt – ein Ort, an dem Präzision auf Kreativität und Entspannung trifft.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default AboutFounderSection;