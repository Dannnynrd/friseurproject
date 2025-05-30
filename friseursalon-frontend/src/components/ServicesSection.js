// friseursalon-frontend/src/components/ServicesSection.js
import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api.service'; // Behält vorerst die allgemeine API-Instanz
// HIER den Import ändern:
import styles from './ServicesSection.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck } from '@fortawesome/free-solid-svg-icons';

// Die BookingPage Komponente wird für das Modal benötigt.
// Stelle sicher, dass der Pfad korrekt ist und BookingPage für die Modal-Nutzung angepasst ist.
import BookingPage from '../pages/BookingPage';

function ServicesSection() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const sectionRef = useRef(null);

    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedServiceForBooking, setSelectedServiceForBooking] = useState(null);

    console.log("ServicesSection initial render - showBookingModal:", showBookingModal, "selectedServiceForBooking:", selectedServiceForBooking); // DEBUG

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await api.get('/api/services'); // Dein Backend-Endpunkt für Services
                setServices(response.data || []);
            } catch (err) {
                console.error("Error fetching services:", err);
                setError('Dienstleistungen konnten nicht geladen werden.');
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

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

    const openBookingModal = (service) => {
        console.log("ServicesSection: openBookingModal called with service:", service); // DEBUG
        setSelectedServiceForBooking(service);
        setShowBookingModal(true);
        // React State-Updates sind asynchron. Die folgenden Logs zeigen möglicherweise noch nicht den aktualisierten Wert,
        // aber sie zeigen, dass die Setter aufgerufen wurden.
        // Der nächste Render-Zyklus wird die aktuellen Werte haben.
        console.log("ServicesSection: setSelectedServiceForBooking and setShowBookingModal(true) called."); // DEBUG
        document.body.classList.add('modal-open'); // Verhindert Scrollen des Hintergrunds
    };

    const closeBookingModal = () => {
        console.log("ServicesSection: closeBookingModal called"); // DEBUG
        setShowBookingModal(false);
        setSelectedServiceForBooking(null);
        document.body.classList.remove('modal-open');
    };

    const formatDuration = (minutes) => {
        if (!minutes) return '';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        let durationString = '';
        if (h > 0) durationString += `${h} Std. `;
        if (m > 0) durationString += `${m} Min.`;
        return durationString.trim();
    };

    // Dieser Log wird bei jedem Rendern von ServicesSection ausgeführt.
    console.log("ServicesSection rendering - showBookingModal:", showBookingModal, "selectedServiceForBooking:", selectedServiceForBooking); // DEBUG

    return (
        <section
            id="services-dynamic"
            ref={sectionRef}
            className="py-16 md:py-24 bg-white" // Tailwind: section { padding: 4rem 0; }
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
                                {service.imageUrl && (
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
                                            {formatDuration(service.duration)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => openBookingModal(service)}
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

            {/* Conditional rendering of BookingPage */}
            {(() => {
                // Log a message when React evaluates this conditional rendering block
                console.log("ServicesSection: Evaluating condition to render BookingPage. showBookingModal:", showBookingModal, "selectedServiceForBooking:", !!selectedServiceForBooking); // DEBUG
                if (showBookingModal && selectedServiceForBooking) {
                    console.log("ServicesSection: Rendering BookingPage with isOpen=true"); // DEBUG
                    return (
                        <BookingPage
                            isOpen={showBookingModal} // Sollte hier true sein
                            onClose={closeBookingModal}
                            serviceName={selectedServiceForBooking.name}
                            servicePrice={selectedServiceForBooking.price}
                            serviceDuration={selectedServiceForBooking.duration}
                            // weitere Props, die BookingPage benötigt
                        />
                    );
                }
                console.log("ServicesSection: NOT rendering BookingPage."); // DEBUG
                return null;
            })()}
        </section>
    );
}

export default ServicesSection;