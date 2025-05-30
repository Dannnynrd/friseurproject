// friseursalon-frontend/src/components/LocationSection.js
import React, { useEffect, useRef } from 'react';
// Importiere das CSS-Modul
import styles from './LocationSection.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faPhone, faEnvelope, faClock } from '@fortawesome/free-solid-svg-icons';

function LocationSection() {
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

    return (
        <section id="location" ref={sectionRef} className="py-16 md:py-24 bg-gray-50"> {/* Hellerer Hintergrund */}
            <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16 animate-up">
                    <span className="block text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
                        Ihr Weg zu uns
                    </span>
                    <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-medium text-dark-text mb-4">
                        Standort & Kontakt
                    </h2>
                    <p className="text-base md:text-lg text-medium-grey-text leading-relaxed">
                        Finden Sie uns einfach und nehmen Sie Kontakt auf. Wir freuen uns auf Ihren Besuch!
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
                    {/* Linke Spalte: Karte */}
                    <div className={`animate-up ${styles.mapContainer}`}>
                        {/* Normalerweise würde hier eine interaktive Karte (Google Maps, Leaflet etc.) eingebunden */}
                        {/* Als Platzhalter dient hier ein Bild oder ein Iframe */}
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2427.9067200881046!2d13.404953615670896!3d52.51627497981399!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47a851dff0a9a145%3A0x318a759420569052!2sBrandenburg%20Gate!5e0!3m2!1sen!2sde!4v1620300000000!5m2!1sen!2sde"
                            width="100%"
                            height="450"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            title="Kartenansicht des Salons"
                            className="rounded-lg shadow-lg w-full"
                        ></iframe>
                    </div>

                    {/* Rechte Spalte: Kontaktinformationen */}
                    <div className={`animate-up md:pt-4 ${styles.contactInfoContainer}`} style={{ transitionDelay: '0.1s' }}>
                        <h3 className="font-serif text-2xl font-semibold text-dark-text mb-6">
                            IMW Friseure
                        </h3>
                        <address className="not-italic space-y-4">
                            <div className="flex items-start">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className={`w-5 h-5 mt-1 mr-4 text-indigo-600 ${styles.contactIcon}`} />
                                <div>
                                    <strong className="block text-dark-text">Adresse</strong>
                                    <span className="text-medium-grey-text">Musterstraße 123, 10115 Berlin</span>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <FontAwesomeIcon icon={faPhone} className={`w-5 h-5 mt-1 mr-4 text-indigo-600 ${styles.contactIcon}`} />
                                <div>
                                    <strong className="block text-dark-text">Telefon</strong>
                                    <a href="tel:+49301234567" className="text-indigo-600 hover:text-indigo-800 hover:underline">
                                        +49 (0)30 123 456 78
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <FontAwesomeIcon icon={faEnvelope} className={`w-5 h-5 mt-1 mr-4 text-indigo-600 ${styles.contactIcon}`} />
                                <div>
                                    <strong className="block text-dark-text">E-Mail</strong>
                                    <a href="mailto:hallo@imw-friseure.de" className="text-indigo-600 hover:text-indigo-800 hover:underline">
                                        hallo@imw-friseure.de
                                    </a>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <FontAwesomeIcon icon={faClock} className={`w-5 h-5 mt-1 mr-4 text-indigo-600 ${styles.contactIcon}`} />
                                <div>
                                    <strong className="block text-dark-text">Öffnungszeiten</strong>
                                    <span className="text-medium-grey-text">Di - Fr: 09:00 - 18:00 Uhr</span><br />
                                    <span className="text-medium-grey-text">Sa: 09:00 - 14:00 Uhr</span><br />
                                    <span className="text-medium-grey-text">So, Mo: Geschlossen</span>
                                </div>
                            </div>
                        </address>
                        <a
                            href="https://www.google.com/maps/dir/?api=1&destination=Musterstra%C3%9Fe+123,+10115+Berlin" // Zieladresse anpassen
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-8 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Route planen
                            <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default LocationSection;
