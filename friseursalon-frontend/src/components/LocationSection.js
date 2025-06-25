// friseursalon-frontend/src/components/LocationSection.js
import React, { useEffect, useRef, useState } from 'react';
import styles from './LocationSection.module.css';
import { FiMapPin, FiPhone, FiMail, FiClock, FiNavigation } from 'react-icons/fi';

function LocationSection() {
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

    // Platzhalter für eine echte Google Maps URL
    const mapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2368.423983828945!2d10.13233231584749!3d54.32658898019553!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47b25647c3125243%3A0x2bd4439c80f4a8e8!2sHoltenauer%20Str.%2042%2C%2024105%20Kiel!5e0!3m2!1sde!2sde!4v1628520330664!5m2!1sde!2sde";
    const directionsUrl = "https://www.google.com/maps/dir/?api=1&destination=Holtenauer+Str.+42,+24105+Kiel";

    return (
        <section
            id="location"
            ref={sectionRef}
            className={`${styles.locationSection} ${isVisible ? styles.visible : ''}`}
        >
            <div className={styles.mapBackground}>
                <iframe
                    src={mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    title="Kartenansicht des Salons"
                ></iframe>
            </div>

            <div className={styles.container}>
                <div className={styles.infoCard}>
                    <header className={styles.cardHeader}>
                        <p className={styles.subtitle}>Ihr Weg zu uns</p>
                        <h2 className={styles.title}>Standort & Kontakt</h2>
                    </header>
                    <address className={styles.contactList}>
                        <div className={styles.contactItem}>
                            <FiMapPin className={styles.contactIcon} />
                            <div>
                                <strong>Adresse</strong>
                                <span>Musterstraße 123, 10115 Berlin</span>
                            </div>
                        </div>
                        <div className={styles.contactItem}>
                            <FiPhone className={styles.contactIcon} />
                            <div>
                                <strong>Telefon</strong>
                                <a href="tel:+49301234567">+49 (0)30 123 456 78</a>
                            </div>
                        </div>
                        <div className={styles.contactItem}>
                            <FiMail className={styles.contactIcon} />
                            <div>
                                <strong>E-Mail</strong>
                                <a href="mailto:hallo@imw-friseure.de">hallo@imw-friseure.de</a>
                            </div>
                        </div>
                        <div className={styles.contactItem}>
                            <FiClock className={styles.contactIcon} />
                            <div>
                                <strong>Öffnungszeiten</strong>
                                <span>Di - Fr: 09:00 - 18:00 Uhr</span>
                                <span>Sa: 09:00 - 14:00 Uhr</span>
                            </div>
                        </div>
                    </address>
                    <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.ctaButton}
                    >
                        Route planen <FiNavigation />
                    </a>
                </div>
            </div>
        </section>
    );
}

export default LocationSection;