// friseursalon-frontend/src/components/ExperienceSection.js
import React, { useEffect, useRef } from 'react';
// Korrekter Import für CSS-Module
import styles from './ExperienceSection.module.css';

function ExperienceSection() {
    const sectionRef = useRef(null);

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

    const experienceSteps = [
        {
            number: "01",
            title: "Ankommen",
            description: "Beginnen Sie Ihre Auszeit mit einem Getränk Ihrer Wahl in meiner ruhigen, minimalistischen Atmosphäre.",
            delay: "0.1s"
        },
        {
            number: "02",
            title: "Beratung",
            description: "In einem persönlichen Gespräch analysiere ich Ihre Haarstruktur und Wünsche, um die perfekte Behandlung zu definieren.",
            delay: "0.2s"
        },
        {
            number: "03",
            title: "Vollendung",
            description: "Genießen Sie das Ergebnis und erhalten Sie wertvolle Tipps, um Ihren neuen Look auch zu Hause perfekt zu pflegen.",
            delay: "0.3s"
        }
    ];

    return (
        <section
            id="experience"
            ref={sectionRef}
            // Tailwind-Klassen für Sektions-Padding und Hintergrund.
            className="py-16 md:py-24 bg-white" // Hintergrund bei Bedarf anpassen (z.B. bg-gray-50)
        >
            <div className="container mx-auto px-6">
                {/* Section Header: Tailwind-Klassen für Zentrierung, max. Breite und Abstände */}
                <div className="text-center max-w-2xl mx-auto mb-12 md:mb-20 animate-up"> {/* Mehr Abstand nach unten */}
                    <span className="block text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2"> {/* Akzentfarbe für Subtitle */}
                        Mein Versprechen
                    </span>
                    <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-dark-text mb-4"> {/* Größere Überschrift */}
                        Die Erfahrung
                    </h2>
                    <p className="text-base md:text-lg text-medium-grey-text leading-relaxed">
                        Ein Besuch bei IMW ist mehr als ein Termin. Es ist ein Ritual, das der Ruhe und Ihrer individuellen Schönheit gewidmet ist.
                    </p>
                </div>

                {/* Experience Grid: Tailwind-Klassen für responsives Grid-Layout */}
                <div className={`grid md:grid-cols-3 gap-8 lg:gap-10 ${styles.experienceGrid}`}>
                    {experienceSteps.map((step, index) => (
                        <div
                            key={index}
                            // Tailwind-Klassen für Karten-Styling und Animation
                            className={`text-center p-6 md:p-8 bg-light-bg border border-gray-200 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out animate-up hover:-translate-y-2 ${styles.experienceStep}`}
                            style={{ transitionDelay: step.delay }}
                        >
                            <span className={`block text-2xl font-bold text-indigo-500 mb-4 ${styles.stepNumber}`}> {/* Größere, farbige Nummer */}
                                {step.number}
                            </span>
                            <h3 className={`font-serif text-xl md:text-2xl font-semibold text-dark-text mb-3 ${styles.stepTitle}`}>
                                {step.title}
                            </h3>
                            <p className={`text-sm md:text-base text-medium-grey-text leading-relaxed ${styles.stepDescription}`}>
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default ExperienceSection;
