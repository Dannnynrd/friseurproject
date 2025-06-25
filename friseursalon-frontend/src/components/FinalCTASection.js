// friseursalon-frontend/src/components/FinalCTASection.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FinalCTASection.module.css';
import { FiArrowRight } from 'react-icons/fi';

function FinalCTASection() {
    const navigate = useNavigate();
    const sectionRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setIsVisible(true);
                observer.unobserve(entries[0].target);
            }
        }, { threshold: 0.2 });

        const currentRef = sectionRef.current;
        if (currentRef) observer.observe(currentRef);
        return () => { if (currentRef) observer.unobserve(currentRef); };
    }, []);

    return (
        <section ref={sectionRef} className={`${styles.ctaSection} ${isVisible ? styles.visible : ''}`}>
            <div className={styles.container}>
                <div className={styles.ctaCard}>
                    <div className={styles.textWrapper}>
                        <h2 className={styles.ctaHeadline}>
                            Beginnen Sie Ihre Verwandlung.
                        </h2>
                        <p className={styles.ctaSubline}>
                            Ihr nächster Lieblings-Look ist nur einen Klick entfernt.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/buchen')}
                        className={styles.ctaButton}
                        aria-label="Termin buchen"
                    >
                        Jetzt Termin buchen <FiArrowRight />
                    </button>
                </div>
            </div>
        </section>
    );
}

export default FinalCTASection;