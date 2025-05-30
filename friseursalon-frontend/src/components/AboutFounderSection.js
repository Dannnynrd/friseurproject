// friseursalon-frontend/src/components/AboutFounderSection.js
import React, { useEffect, useRef } from 'react';
// HIER den Import ändern:
import styles from './AboutFounderSection.module.css'; // Importiert als CSS-Modul
// Stelle sicher, dass das Bild im public-Ordner oder einem zugänglichen Pfad liegt
// oder importiere es, wenn dein Setup das unterstützt (z.B. mit Webpack)
// import founderImage from '../assets/images/founder-image.jpg'; // Beispielhafter Import

function AboutFounderSection() {
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

    // Beispiel-URL für das Bild. Ersetze dies durch deinen tatsächlichen Bildpfad.
    const founderImageUrl = "https://images.pexels.com/photos/3760695/pexels-photo-3760695.jpeg?auto=compress&cs=tinysrgb&w=800";


    return (
        <section
            id="about-founder"
            ref={sectionRef}
            className="py-16 md:py-24 bg-white" // Hintergrundfarbe anpassen, falls nötig
        >
            <div className="container mx-auto px-6">
                {/* Tailwind-Grid für ein zweispaltiges Layout, das auf Mobilgeräten untereinander dargestellt wird */}
                <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
                    {/* Bild-Spalte */}
                    <div className={`animate-up ${styles.founderImageContainer}`}>
                        <img
                            src={founderImageUrl} // Verwende die Variable hier
                            alt="Inhaberin des Salons"
                            className={`w-full h-auto object-cover rounded-lg shadow-lg ${styles.founderImage}`}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://placehold.co/600x800/e2e8f0/94a3b8?text=Bild+nicht+gefunden";
                            }}
                        />
                    </div>

                    {/* Text-Spalte */}
                    <div className={`animate-up ${styles.founderTextContainer}`} style={{ transitionDelay: '0.1s' }}>
                        <span className="text-xs font-semibold text-medium-grey-text uppercase tracking-wider mb-2 block">
                            Die Gründerin
                        </span>
                        <h2 className="font-serif text-3xl md:text-4xl font-medium text-dark-text mb-6">
                            Isabelle Müller-Weber
                        </h2>
                        <p className={`text-medium-grey-text mb-4 ${styles.founderBio}`}>
                            Seit über einem Jahrzehnt widme ich mich der Kunst des Haares. Meine Philosophie basiert auf der Überzeugung, dass wahre Schönheit in der Harmonie von Schnitt, Farbe und der Persönlichkeit meiner Kundinnen und Kunden liegt.
                        </p>
                        <p className={`text-medium-grey-text mb-6 ${styles.founderBio}`}>
                            Nach meiner Ausbildung in renommierten Salons und stetigen Weiterbildungen bei internationalen Top-Stylisten, habe ich mir mit "IMW Friseure" den Traum eines eigenen Ateliers erfüllt – ein Ort, an dem Präzision auf Kreativität und Entspannung trifft.
                        </p>
                        {/* Optional: Button für mehr Infos oder Link zur "Über Uns"-Seite */}
                        {/*
                        <a
                            href="/ueber-uns"
                            className="inline-block bg-dark-text text-light-bg px-6 py-3 rounded font-medium text-sm hover:bg-gray-700 transition-colors duration-200"
                        >
                            Mehr über meine Philosophie
                        </a>
                        */}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default AboutFounderSection;
