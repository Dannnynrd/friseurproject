import React, { useEffect, useRef } from 'react';
import styles from './TrustBarSection.module.css';
import { FiAward, FiScissors, FiHeart, FiSmile } from 'react-icons/fi';

// Die Kernwerte – jetzt mit Icon, Titel und kurzer Beschreibung.
const trustElements = [
    {
        icon: <FiAward size={24} />,
        title: 'Zertifizierte Qualität',
        text: 'Wir setzen auf preisgekrönte Produkte und höchste Standards.'
    },
    {
        icon: <FiScissors size={24} />,
        title: 'Meisterhaftes Handwerk',
        text: 'Jeder Schnitt ist ein Kunstwerk, präzise und typgerecht.'
    },
    {
        icon: <FiHeart size={24} />,
        title: 'Passionierte Pflege',
        text: 'Ihr Wohlbefinden steht für uns an erster Stelle.'
    },
    {
        icon: <FiSmile size={24} />,
        title: 'Ihre Zufriedenheit',
        text: 'Unser Ziel ist es, Sie mit einem Lächeln zu verabschieden.'
    },
];

function TrustBarSection() {
    const sectionRef = useRef(null);

    // Einblend-Animation
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
            { threshold: 0.15 }
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

    return (
        <section ref={sectionRef} className={styles.trustSection}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    {trustElements.map((element, index) => (
                        <div key={index} className={styles.trustElement}>
                            <div className={styles.iconWrapper}>
                                {element.icon}
                            </div>
                            <div className={styles.textWrapper}>
                                <h3 className={styles.elementTitle}>{element.title}</h3>
                                <p className={styles.elementText}>{element.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default TrustBarSection;
