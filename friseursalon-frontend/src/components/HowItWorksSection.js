// src/components/HowItWorksSection.js
import React, { useEffect, useRef } from 'react';
import styles from './HowItWorksSection.module.css';
import { FiCalendar, FiCoffee, FiGift, FiArrowRight } from 'react-icons/fi';

const steps = [
    {
        number: '01',
        icon: <FiCalendar size={28} />,
        title: 'Einfach Online Buchen',
        description: 'Wählen Sie Ihren Wunschtermin und Ihre Dienstleistung bequem von zu Hause aus. In wenigen Klicks ist Ihr Platz bei uns gesichert.',
        showButton: true // NEU: Zeigt den Button im ersten Schritt
    },
    {
        number: '02',
        icon: <FiCoffee size={28} />,
        title: 'Ankommen & Entspannen',
        description: 'Genießen Sie eine Tasse Kaffee oder Tee in unserer modernen und ruhigen Atmosphäre. Ihr persönlicher Stylist bespricht mit Ihnen Ihre Wünsche.'
    },
    {
        number: '03',
        icon: <FiGift size={28} />,
        title: 'Verwöhnt & Begeistert',
        description: 'Erleben Sie meisterhaftes Handwerk und verlassen Sie unseren Salon mit einem perfekten Look, der Ihr Selbstbewusstsein unterstreicht.'
    }
];

function HowItWorksSection() {
    const sectionRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(styles.visible);
                    }
                });
            },
            { threshold: 0.15 }
        );

        const elements = sectionRef.current?.querySelectorAll(`.${styles.step}`);
        if (elements) {
            elements.forEach(el => observer.observe(el));
        }

        return () => {
            if (elements) {
                elements.forEach(el => observer.unobserve(el));
            }
        };
    }, []);


    return (
        <section className={styles.howItWorksSection}>
            <div className={styles.container}>
                <header className={styles.sectionHeader}>
                    <p className={styles.subtitle}>So einfach geht's</p>
                    <h2 className={styles.title}>Ihr Weg zum perfekten Look</h2>
                </header>

                <div ref={sectionRef} className={styles.timeline}>
                    {steps.map((step, index) => (
                        <div key={index} className={styles.step}>
                            <div className={styles.stepContent}>
                                <span className={styles.stepNumber}>{step.number}</span>
                                <div className={styles.iconWrapper}>{step.icon}</div>
                                <h3 className={styles.stepTitle}>{step.title}</h3>
                                <p className={styles.stepDescription}>{step.description}</p>
                                {step.showButton && (
                                    <button className={`${styles.button} ${styles.buttonInCard}`}>
                                        Jetzt Buchen <FiArrowRight />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* NEU: Der finale Button am Ende der Sektion */}
                <div className={styles.bottomButtonContainer}>
                    <button className={`${styles.button} ${styles.buttonBottom}`}>
                        Jetzt Wunschtermin sichern
                    </button>
                </div>
            </div>
        </section>
    );
}

export default HowItWorksSection;