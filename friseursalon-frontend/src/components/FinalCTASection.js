// friseursalon-frontend/src/components/FinalCTASection.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FinalCTASection.module.css';
import { FiArrowRight } from 'react-icons/fi';

function FinalCTASection() {
    const navigate = useNavigate();

    return (
        <section className={styles.ctaSection}>
            <div className={styles.ctaContent}>
                <h2 className={styles.ctaHeadline}>
                    Bereit für den nächsten Schritt?
                </h2>
                <button
                    onClick={() => navigate('/buchen')}
                    className={styles.ctaButton}
                    aria-label="Termin buchen"
                >
                    <span className={styles.buttonIcon}>
                        <FiArrowRight />
                    </span>
                </button>
            </div>
        </section>
    );
}

export default FinalCTASection;