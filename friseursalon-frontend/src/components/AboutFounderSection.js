// friseursalon-frontend/src/components/AboutFounderSection.js
import React, { useEffect, useRef } from 'react';
import styles from './AboutFounderSection.module.css';

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

    const founderImageUrl = "https://images.pexels.com/photos/3760695/pexels-photo-3760695.jpeg?auto=compress&cs=tinysrgb&w=800";


    return (
        <section
            id="about-founder"
            ref={sectionRef}
            className="py-16 md:py-24 bg-white"
        >
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
                    <div className={`animate-up ${styles.founderImageContainer}`}>
                        <img
                            src={founderImageUrl}
                            alt="Inhaber des Salons, Ibrahim"
                            className={`w-full h-auto object-cover rounded-lg shadow-lg ${styles.founderImage}`}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://placehold.co/600x800/e2e8f0/94a3b8?text=Bild+nicht+gefunden";
                            }}
                        />
                    </div>

                    <div className={`animate-up ${styles.founderTextContainer}`} style={{ transitionDelay: '0.1s' }}>
                        <span className="text-xs font-semibold text-color-text-light uppercase tracking-wider mb-2 block">
                            Der Gründer
                        </span>
                        <h2 className="font-serif text-3xl md:text-4xl font-medium text-color-text-dark mb-6">
                            Ibrahim
                        </h2>
                        <p className={`text-color-text-medium mb-4 ${styles.founderBio}`}>
                            Seit über einem Jahrzehnt widme ich mich der Kunst des Haares. Meine Philosophie basiert auf der Überzeugung, dass wahre Schönheit in der Harmonie von Schnitt, Farbe und der Persönlichkeit meiner Kundinnen und Kunden liegt.
                        </p>
                        <p className={`text-color-text-medium mb-6 ${styles.founderBio}`}>
                            Nach meiner Ausbildung in renommierten Salons und stetigen Weiterbildungen bei internationalen Top-Stylisten, habe ich mir mit meinem Salon den Traum eines eigenen Ateliers erfüllt – ein Ort, an dem Präzision auf Kreativität und Entspannung trifft.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default AboutFounderSection;