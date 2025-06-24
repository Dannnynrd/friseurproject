// friseursalon-frontend/src/components/HowItWorksSection.js
import React from 'react';
import styles from './HowItWorksSection.module.css';

const steps = [
    { number: "01", title: "Service & Zeit wählen", description: "Wählen Sie Ihre Wunschleistung und einen passenden Termin." },
    { number: "02", title: "Details angeben", description: "Geben Sie Ihre Kontaktdaten für die Buchungsbestätigung an." },
    { number: "03", title: "Bestätigung erhalten", description: "Sie erhalten sofort eine E-Mail mit allen Details zu Ihrem Termin." },
    { number: "04", title: "Vorbeikommen & Genießen", description: "Freuen Sie sich auf Ihren Moment der Entspannung bei uns." }
];

function HowItWorksSection() {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        So einfach funktioniert's
                    </h2>
                    <p className={styles.subtitle}>
                        In vier klaren Schritten zu Ihrem Wunschtermin.
                    </p>
                </div>
                <div className={styles.grid}>
                    {steps.map((step) => (
                        <div key={step.number} className={styles.step}>
                            <span className={styles.stepNumber}>{step.number}</span>
                            <h3 className={styles.stepTitle}>{step.title}</h3>
                            <p className={styles.stepDescription}>{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default HowItWorksSection;