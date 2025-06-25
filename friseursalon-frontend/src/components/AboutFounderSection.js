// friseursalon-frontend/src/components/AboutFounderSection.js
import React, { useState, useEffect, useRef } from 'react';
import styles from './AboutFounderSection.module.css';

function AboutFounderSection() {
    const sectionRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setIsVisible(true);
                observer.unobserve(entries[0].target);
            }
        }, { threshold: 0.15 });

        const currentSectionRef = sectionRef.current;
        if (currentSectionRef) observer.observe(currentSectionRef);
        return () => { if (currentSectionRef) observer.unobserve(currentSectionRef); };
    }, []);

    const founderImageUrl = "https://images.pexels.com/photos/3760695/pexels-photo-3760695.jpeg?auto=compress&cs=tinysrgb&w=800";

    return (
        <section
            id="about-founder"
            ref={sectionRef}
            className={`${styles.aboutSection} ${isVisible ? styles.visible : ''}`}
        >
            <div className={styles.container}>
                {/* Die Struktur ist jetzt einfacher, das meiste passiert im CSS */}
                <div className={styles.imageWrapper}>
                    <img
                        src={founderImageUrl}
                        alt="Inhaber des Salons, Ibrahim"
                        className={styles.founderImage}
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x800/e2e8f0/94a3b8?text=Bild+nicht+gefunden"; }}
                    />
                </div>

                <div className={styles.textWrapper}>
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
        </section>
    );
}

export default AboutFounderSection;