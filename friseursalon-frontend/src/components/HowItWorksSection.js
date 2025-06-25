// src/components/HowItWorksSection.js
import React, { useEffect, useRef } from 'react';
import styles from './HowItWorksSection.module.css';
import { FiCalendar, FiCoffee, FiGift, FiArrowRight } from 'react-icons/fi';

const steps = [
    { number: 'I', icon: <FiCalendar size={28} />, title: 'Einfach Online Buchen', description: 'Wählen Sie Ihren Wunschtermin und Ihre Dienstleistung bequem von zu Hause aus. In wenigen Klicks ist Ihr Platz bei uns gesichert.', showButton: true },
    { number: 'II', icon: <FiCoffee size={28} />, title: 'Ankommen & Entspannen', description: 'Genießen Sie eine Tasse Kaffee oder Tee in unserer modernen und ruhigen Atmosphäre. Ihr persönlicher Stylist bespricht mit Ihnen Ihre Wünsche.' },
    { number: 'III', icon: <FiGift size={28} />, title: 'Verwöhnt & Begeistert', description: 'Erleben Sie meisterhaftes Handwerk und verlassen Sie unseren Salon mit einem perfekten Look, der Ihr Selbstbewusstsein unterstreicht.' }
];

function HowItWorksSection() {
    const sectionRef = useRef(null);
    const timelineRef = useRef(null);

    // Observer für das Ein- und Ausblenden der einzelnen Schritte
    useEffect(() => {
        const steps = sectionRef.current?.querySelectorAll(`.${styles.step}`);
        if (!steps) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    entry.target.classList.toggle(styles.visible, entry.isIntersecting);
                });
            },
            {
                threshold: 0.4,
                rootMargin: "0px 0px -100px 0px"
            }
        );

        steps.forEach(step => observer.observe(step));
        return () => steps.forEach(step => observer.unobserve(step));
    }, []);

    // Scroll-Listener für die pixelgenaue Linien-Animation
    useEffect(() => {
        const handleScroll = () => {
            const timeline = timelineRef.current;
            if (!timeline) return;

            const { top, height } = timeline.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            const scrollPercent = Math.max(0, Math.min(1, (viewportHeight - top) / height));

            timeline.style.setProperty('--timeline-progress', `${scrollPercent}`);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initialer Check

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <section ref={sectionRef} className={styles.howItWorksSection}>
            <div className={styles.container}>
                <header className={styles.sectionHeader}>
                    <p className={styles.subtitle}>So einfach geht's</p>
                    <h2 className={styles.title}>Ihr Weg zum perfekten Look</h2>
                </header>

                <div ref={timelineRef} className={styles.timeline}>
                    {steps.map((step, index) => (
                        <div key={index} className={styles.step}>
                            <div className={styles.stepContent}>
                                <span className={styles.stepNumber}>{step.number}</span>
                                {/* NEU: Delay für gestaffelte Animation wird hier im Style-Attribut gesetzt */}
                                <div className={styles.iconWrapper} style={{'--delay': '0.1s'}}>{step.icon}</div>
                                <h3 className={styles.stepTitle} style={{'--delay': '0.2s'}}>{step.title}</h3>
                                <p className={styles.stepDescription} style={{'--delay': '0.3s'}}>{step.description}</p>
                                {step.showButton && (
                                    <button className={`${styles.button} ${styles.buttonInCard}`} style={{'--delay': '0.4s'}}>
                                        Jetzt Buchen <FiArrowRight />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

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