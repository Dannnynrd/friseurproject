// src/components/FAQSection.js
import React, { useState, useEffect, useRef } from 'react';
import styles from './FAQSection.module.css';
import { FiPlus, FiMinus } from 'react-icons/fi';

// NEU: Beispieldaten für die FAQs
const faqs = [
    {
        question: 'Wie lange dauert ein klassischer Herrenschnitt?',
        answer: 'Ein klassischer Herrenschnitt bei uns dauert in der Regel etwa 30-45 Minuten, inklusive Waschen, Schneiden und Stylen. Wir nehmen uns Zeit für eine ausführliche Beratung, um den perfekten Look für Sie zu finden.'
    },
    {
        question: 'Welche Produkte verwenden Sie für die Haarpflege?',
        answer: 'Wir setzen ausschließlich auf hochwertige, salon-exklusive Marken wie Kerastase, Redken und Olaplex. Diese Produkte garantieren nicht nur exzellente Ergebnisse, sondern auch die bestmögliche Pflege für Ihr Haar.'
    },
    {
        question: 'Kann ich meinen Termin online verschieben oder stornieren?',
        answer: 'Ja, Sie können Ihren Termin bis zu 24 Stunden im Voraus ganz einfach über den Link in Ihrer Bestätigungs-E-Mail verschieben oder stornieren. Bei kurzfristigeren Änderungen bitten wir um einen kurzen Anruf.'
    },
    {
        question: 'Bieten Sie auch Bartpflege an?',
        answer: 'Selbstverständlich! Wir bieten eine professionelle Bartrasur und -pflege an. Vom Trimmen und Formen bis hin zur klassischen Nassrasur mit warmen Kompressen – wir sorgen für einen perfekt gepflegten Bart.'
    }
];

// Eigene Komponente für ein einzelnes FAQ-Item
const FAQItem = ({ faq, index, isActive, onToggle }) => {
    const contentRef = useRef(null);

    return (
        <div className={`${styles.faqItem} ${isActive ? styles.isActive : ''}`}>
            <button className={styles.faqQuestion} onClick={() => onToggle(index)}>
                <span>{faq.question}</span>
                <div className={styles.iconWrapper}>
                    {isActive ? <FiMinus /> : <FiPlus />}
                </div>
            </button>
            <div
                ref={contentRef}
                className={styles.faqAnswerWrapper}
                style={{ maxHeight: isActive ? `${contentRef.current.scrollHeight}px` : '0px' }}
            >
                <p className={styles.faqAnswer}>{faq.answer}</p>
            </div>
        </div>
    );
};


function FAQSection() {
    const sectionRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [activeIndex, setActiveIndex] = useState(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setIsVisible(true);
                observer.unobserve(entries[0].target);
            }
        }, { threshold: 0.1 });

        const currentRef = sectionRef.current;
        if (currentRef) observer.observe(currentRef);
        return () => { if (currentRef) observer.unobserve(currentRef); };
    }, []);

    const handleToggle = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    return (
        <section
            ref={sectionRef}
            className={`${styles.faqSection} ${isVisible ? styles.visible : ''}`}
        >
            <div className={styles.container}>
                <header className={styles.sectionHeader}>
                    <p className={styles.subtitle}>Häufig gestellte Fragen</p>
                    <h2 className={styles.title}>Antworten auf Ihre Fragen</h2>
                </header>

                <div className={styles.faqList}>
                    {faqs.map((faq, index) => (
                        <FAQItem
                            key={index}
                            faq={faq}
                            index={index}
                            isActive={activeIndex === index}
                            onToggle={handleToggle}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

export default FAQSection;