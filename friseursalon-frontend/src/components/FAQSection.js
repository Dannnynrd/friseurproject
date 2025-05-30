// friseursalon-frontend/src/components/FAQSection.js
import React, { useState, useEffect, useRef } from 'react';
// HIER den Import ändern:
import styles from './FAQSection.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

function FAQSection() {
    const sectionRef = useRef(null);
    const [openFAQ, setOpenFAQ] = useState(null); // Hält den Index des offenen FAQ-Items

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
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

    const faqData = [
        {
            question: "Wie lange dauert ein typischer Haarschnitt bei Ihnen?",
            answer: "Ein Damenhaarschnitt inklusive Waschen, Schneiden und Föhnen dauert in der Regel 60-75 Minuten. Bei Herren planen wir etwa 45-60 Minuten ein. Bei aufwendigeren Stylings oder Farbveränderungen kann es natürlich länger dauern."
        },
        {
            question: "Welche Produkte verwenden Sie im Salon?",
            answer: "Wir setzen auf hochwertige, professionelle Friseurprodukte, die sowohl effektiv als auch schonend für Haar und Kopfhaut sind. Viele unserer Produkte sind sulfatfrei, parabenfrei und basieren auf natürlichen Inhaltsstoffen. Gerne beraten wir Sie individuell zu den passenden Produkten für Ihren Haartyp."
        },
        {
            question: "Muss ich einen Termin vereinbaren oder kann ich spontan vorbeikommen?",
            answer: "Um Wartezeiten zu vermeiden und sicherzustellen, dass wir uns ausreichend Zeit für Sie nehmen können, empfehlen wir dringend eine vorherige Terminvereinbarung. Sie können Termine telefonisch oder über unser Online-Buchungssystem vereinbaren."
        },
        {
            question: "Bieten Sie auch Farbberatung an?",
            answer: "Ja, eine individuelle Farbberatung ist ein wichtiger Bestandteil unseres Services. Wir berücksichtigen Ihren Hautton, Ihre Augenfarbe und Ihren persönlichen Stil, um die perfekte Haarfarbe für Sie zu finden – von natürlichen Nuancen bis hin zu kreativen Farbtechniken."
        },
        {
            question: "Was passiert, wenn ich mit meinem Haarschnitt nicht zufrieden bin?",
            answer: "Ihre Zufriedenheit ist unser oberstes Ziel. Sollten Sie mit dem Ergebnis nicht vollkommen glücklich sein, kontaktieren Sie uns bitte innerhalb einer Woche. Wir finden dann gemeinsam eine Lösung, sei es eine kostenlose Nachbesserung oder eine andere passende Maßnahme."
        }
    ];

    const toggleFAQ = (index) => {
        if (openFAQ === index) {
            setOpenFAQ(null); // Schließt das bereits offene Item
        } else {
            setOpenFAQ(index); // Öffnet das neue Item
        }
    };

    return (
        <section id="faq" ref={sectionRef} className="py-16 md:py-24 bg-light-grey-bg">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16 animate-up">
                    <span className="text-xs font-semibold text-medium-grey-text uppercase tracking-wider mb-1">
                        Häufige Fragen
                    </span>
                    <h2 className="font-serif text-3xl md:text-4xl font-medium text-dark-text mb-2">
                        Gut zu wissen
                    </h2>
                    <p className="text-base text-medium-grey-text">
                        Antworten auf Ihre Fragen rund um Ihren Besuch und unsere Dienstleistungen.
                    </p>
                </div>

                <div className={`max-w-3xl mx-auto ${styles.faqContainer}`}>
                    {faqData.map((item, index) => (
                        <div
                            key={index}
                            className={`border-b border-border-color-light animate-up ${styles.faqItem}`}
                            style={{ transitionDelay: `${index * 0.05}s` }}
                        >
                            <button
                                onClick={() => toggleFAQ(index)}
                                aria-expanded={openFAQ === index}
                                aria-controls={`faq-answer-${index}`}
                                className="w-full flex justify-between items-center text-left py-5 px-1 md:px-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-light-grey-bg rounded-sm"
                            >
                                <h3 className={`text-base md:text-lg font-medium text-dark-text group-hover:text-indigo-600 ${styles.faqQuestion}`}>
                                    {item.question}
                                </h3>
                                <FontAwesomeIcon
                                    icon={openFAQ === index ? faChevronUp : faChevronDown}
                                    className={`text-indigo-600 transition-transform duration-300 ${openFAQ === index ? 'transform rotate-180' : ''} ${styles.faqIcon}`}
                                />
                            </button>
                            <div
                                id={`faq-answer-${index}`}
                                role="region"
                                aria-labelledby={`faq-question-${index}`}
                                className={`overflow-hidden transition-all duration-500 ease-in-out ${openFAQ === index ? 'max-h-screen opacity-100 pb-5' : 'max-h-0 opacity-0'} ${styles.faqAnswerContainer}`}
                            >
                                <p className={`text-sm md:text-base text-medium-grey-text leading-relaxed px-1 md:px-2 ${styles.faqAnswer}`}>
                                    {item.answer}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default FAQSection;
