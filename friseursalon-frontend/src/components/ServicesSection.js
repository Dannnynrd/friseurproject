// friseursalon-frontend/src/components/ServicesSection.js
import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api.service';
import styles from './ServicesSection.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons';

// Die Prop openBookingModal kommt von App.js (ist dort navigateToBooking)
// Die Props currentUser, onServiceAdded, refreshServicesList werden hier nicht mehr direkt für die Service-Anzeige benötigt,
// könnten aber für Admin-Funktionen (Bearbeiten/Löschen von Services direkt in dieser Sektion) relevant sein.
// Für die reine Anzeige und den Buchungs-Button sind sie nicht zwingend.
function ServicesSection({ openBookingModal, currentUser, onServiceAdded, refreshServicesList: parentRefreshTrigger }) {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const sectionRef = useRef(null);

    // Lokales State für showBookingModal und selectedServiceForBooking wird entfernt,
    // da die Navigation und das Anzeigen der BookingPage von App.js gehandhabt wird.

    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true);
            setError(null);
            try {
                // Der API-Endpunkt in api.service.js ist bereits /api/, daher hier nur 'services'
                const response = await api.get('services');
                setServices(response.data || []);
            } catch (err) {
                console.error("Error fetching services:", err);
                setError('Dienstleistungen konnten nicht geladen werden.');
                setServices([]);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, [parentRefreshTrigger]); // Reagiert auf den von der Elternkomponente übergebenen Trigger

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

    const formatDuration = (minutes) => {
        if (!minutes || isNaN(minutes)) return ''; // Überprüft auch, ob es eine Zahl ist
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        let durationString = '';
        if (h > 0) durationString += `${h} Std. `;
        if (m > 0) durationString += `${m} Min.`;
        return durationString.trim();
    };

    // Der Handler für den Button-Klick verwendet jetzt die übergebene Prop.
    // Der Service-Name wird an die Funktion übergeben, die dann navigiert.
    const handleBookServiceClick = (service) => {
        if (typeof openBookingModal === 'function') {
            openBookingModal(service.name); // Übergibt den Service-Namen für die URL-Generierung
        } else {
            console.error("ServicesSection: openBookingModal prop is not a function or not provided.");
        }
    };


    return (
        <section
            id="services-dynamic"
            ref={sectionRef}
            className="py-16 md:py-24 bg-white"
        >
            <div className="container mx-auto px-6">
                <div className="section-header text-center max-w-xl mx-auto mb-10 md:mb-16 animate-up">
                    <span className="text-xs font-semibold text-medium-grey-text uppercase tracking-wider mb-1">
                        Unsere Expertise
                    </span>
                    <h2 className="font-serif text-3xl md:text-4xl font-medium text-dark-text mb-2">
                        Dienstleistungen
                    </h2>
                    <p className="text-base text-medium-grey-text">
                        Entdecken Sie unser Angebot für Ihr perfektes Haarerlebnis.
                    </p>
                </div>

                {loading && <p className="text-center text-medium-grey-text">Lade Dienstleistungen...</p>}
                {error && <p className="text-center text-red-600">{error}</p>}

                {!loading && !error && services.length === 0 && (
                    <p className="text-center text-medium-grey-text">
                        Aktuell sind keine Dienstleistungen verfügbar. Bitte versuchen Sie es später erneut.
                    </p>
                )}

                {!loading && !error && services.length > 0 && (
                    <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-8 ${styles.servicesGrid}`}>
                        {services.map((service, index) => (
                            <div
                                key={service.id || index}
                                className={`animate-up bg-light-bg border border-border-color-light rounded-lg shadow-sm overflow-hidden flex flex-col ${styles.serviceCard}`}
                                style={{ transitionDelay: `${index * 0.05}s` }}
                            >
                                {service.imageUrl && ( // Annahme: Services könnten eine imageUrl haben
                                    <div className={styles.serviceImageContainer}>
                                        <img
                                            src={service.imageUrl || 'https://placehold.co/600x400/e2e8f0/94a3b8?text=Service'}
                                            alt={service.name || 'Dienstleistung'}
                                            className={`w-full h-48 object-cover ${styles.serviceImage}`}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "https://placehold.co/600x400/e2e8f0/94a3b8?text=Bild+fehlt";
                                            }}
                                        />
                                    </div>
                                )}
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className={`font-serif text-xl font-medium text-dark-text mb-2 ${styles.serviceName}`}>
                                        {service.name}
                                    </h3>
                                    <p className={`text-sm text-medium-grey-text mb-4 flex-grow ${styles.serviceDescription}`}>
                                        {service.description}
                                    </p>
                                    <div className="flex justify-between items-center text-sm text-dark-text mb-4">
                                        <span className={styles.servicePrice}>
                                            {typeof service.price === 'number' ? `ab ${service.price.toFixed(2)} €` : (service.price || 'Preis auf Anfrage')}
                                        </span>
                                        <span className={styles.serviceDuration}>
                                            {formatDuration(service.durationMinutes)} {/* Korrigiert zu durationMinutes */}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleBookServiceClick(service)} // Ruft den neuen Handler auf
                                        className={`mt-auto w-full inline-flex items-center justify-center bg-dark-text text-light-bg px-6 py-3 rounded font-medium text-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 ${styles.bookButton}`}
                                    >
                                        <FontAwesomeIcon icon={faCalendarCheck} className="mr-2" />
                                        Termin buchen
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Die bedingte Wiedergabe von BookingPage als Modal ist hier entfernt. */}
        </section>
    );
}

export default ServicesSection;