import React, { useState, useEffect, useRef, useCallback } from 'react';
import ServiceForm from './ServiceForm';
import ServiceList from './ServiceList';
import api from '../services/api.service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// KORREKTUR: faMinusCircle und faPlusCircle importieren
import { faSpinner, faExclamationCircle, faMinusCircle, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import './ServicesSection.css';

function ServicesSection({ currentUser, onServiceAdded, refreshServicesList, openBookingModal }) {
    const sectionRef = useRef(null);
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [error, setError] = useState(null);

    const fetchPublicServices = useCallback(async () => {
        setLoadingServices(true);
        setError(null);
        try {
            const response = await api.get('/services');
            setServices(response.data || []);
        } catch (err) {
            console.error("Fehler beim Laden der öffentlichen Dienstleistungen:", err);
            setError("Dienstleistungen konnten nicht geladen werden.");
            setServices([]);
        } finally {
            setLoadingServices(false);
        }
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        let currentSectionRef = sectionRef.current; // Kopie für Cleanup

        if (currentSectionRef) {
            observer.observe(currentSectionRef);
        }

        if (!currentUser || !currentUser.roles?.includes("ROLE_ADMIN")) {
            fetchPublicServices();
        }

        return () => {
            if (currentSectionRef) {
                observer.unobserve(currentSectionRef);
            }
        };
    }, [fetchPublicServices, currentUser]);

    useEffect(() => {
        if (currentUser && currentUser.roles?.includes("ROLE_ADMIN")) {
            // Die ServiceList-Komponente handhabt ihren eigenen Fetch basierend auf refreshServicesList
            // Hier ist kein expliziter fetchServices Aufruf mehr nötig, da ServiceList das übernimmt.
            // Wenn Sie die `services` State-Variable hier auch für den Admin aktuell halten wollen,
            // müssten Sie fetchPublicServices auch hier aufrufen oder die Logik anpassen.
            // Für die aktuelle Struktur mit getrennter Admin-Ansicht (ServiceList) ist es okay.
        }
    }, [refreshServicesList, currentUser]);


    const isAdmin = currentUser && currentUser.roles?.includes("ROLE_ADMIN");
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [isSubmittingService, setIsSubmittingService] = useState(false);

    const handleServiceAddedCallback = () => {
        if (onServiceAdded) {
            onServiceAdded();
        }
        setShowServiceForm(false);
        setIsSubmittingService(false);
    };

    return (
        <section id="services-dynamic" ref={sectionRef}>
            <div className="container">
                <div className="section-header animate-up">
                    <span className="subtitle">Meine Expertise</span>
                    <h2>Services & Preise</h2>
                    <p>Ich biete eine kuratierte Auswahl an Dienstleistungen, die auf Präzision, Qualität und Nachhaltigkeit ausgelegt sind. Alle Preise sind Richtwerte und können je nach Aufwand variieren.</p>
                </div>

                {isAdmin ? (
                    <>
                        <div className="dashboard-section-header-controls" style={{marginBottom: '1.5rem'}}>
                            <h3 style={{fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--dark-text)', margin: 0}}>Dienstleistungsverwaltung</h3>
                            <button
                                onClick={() => setShowServiceForm(!showServiceForm)}
                                className="button-link-outline toggle-service-form-button"
                                aria-expanded={showServiceForm}
                            >
                                <FontAwesomeIcon icon={showServiceForm ? faMinusCircle : faPlusCircle} />
                                {showServiceForm ? 'Formular schließen' : 'Neuen Service hinzufügen'}
                            </button>
                        </div>
                        {showServiceForm && (
                            <div className="service-form-wrapper" style={{padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', marginBottom: '1.5rem', backgroundColor: 'var(--light-grey-bg)'}}>
                                <ServiceForm
                                    onServiceAdded={handleServiceAddedCallback}
                                    setIsSubmitting={setIsSubmittingService}
                                    isSubmitting={isSubmittingService}
                                />
                            </div>
                        )}
                        <hr className="dashboard-section-hr" style={{margin: '1.5rem 0'}} />
                        {/* ServiceList wird hier für den Admin gerendert und lädt seine eigenen Daten */}
                        <ServiceList key={refreshServicesList} currentUser={currentUser} />
                    </>
                ) : (
                    loadingServices ? (
                        <p className="loading-message"><FontAwesomeIcon icon={faSpinner} spin /> Dienstleistungen werden geladen...</p>
                    ) : error ? (
                        <p className="form-message error"><FontAwesomeIcon icon={faExclamationCircle} /> {error}</p>
                    ) : services.length > 0 ? (
                        <div className="services-display-grid animate-up">
                            {services.map(service => (
                                <div key={service.id} className="service-display-card">
                                    <div className="service-info">
                                        <h4>{service.name}</h4>
                                        <p className="description">{service.description}</p>
                                    </div>
                                    <div className="service-action">
                                        <div className="price-duration">
                                            <span className="price">{typeof service.price === 'number' ? service.price.toFixed(2) : 'N/A'} €</span>
                                            <span className="duration"> / {service.durationMinutes || '-'} Min</span>
                                        </div>
                                        <button
                                            className="button-link book-service-btn interactive small-button"
                                            onClick={(e) => { e.preventDefault(); openBookingModal(service.name); }}
                                        >
                                            Buchen
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-600 py-4">Derzeit sind keine Dienstleistungen online verfügbar.</p>
                    )
                )}
            </div>
        </section>
    );
}

export default ServicesSection;