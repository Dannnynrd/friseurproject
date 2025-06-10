// friseursalon-frontend/src/components/ServicesSection.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // useNavigate statt Link für programmatische Navigation
import styles from './ServicesSection.module.css';
import api from '../services/api.service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';

function ServicesSection({ maxServicesToShow = 0 }) {
    const [fetchedServices, setFetchedServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const sectionRef = useRef(null);
    const navigate = useNavigate();

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

    useEffect(() => {
        setIsLoading(true);
        api.get('services')
            .then(response => {
                setFetchedServices(response.data || []);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Error fetching services for ServicesSection:", err);
                setError("Dienstleistungen konnten nicht geladen werden.");
                setIsLoading(false);
            });
    }, []);

    const servicesToDisplay = maxServicesToShow > 0 && fetchedServices.length > maxServicesToShow
        ? fetchedServices.slice(0, maxServicesToShow)
        : fetchedServices;

    const handleBookClick = (service) => {
        // Navigiere zur Buchungsseite und übergebe den Servicenamen als URL-Parameter
        if (service && typeof service.name === 'string') {
            navigate(`/buchen?service=${encodeURIComponent(service.name)}`);
        } else {
            console.error("Service-Name ist ungültig, Navigation zur allgemeinen Buchungsseite.");
            navigate('/buchen');
        }
    };


    if (isLoading) {
        return (
            <section id="services-section" className="py-16 md:py-24 bg-white">
                <div className="container mx-auto px-6 text-center">
                    <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-indigo-500" />
                    <p className="mt-2 text-medium-grey-text">Dienstleistungen werden geladen...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return <div className="py-16 text-center text-red-600">{error}</div>;
    }

    if (servicesToDisplay.length === 0) {
        return null; // Keine Sektion anzeigen, wenn keine Services da sind
    }

    return (
        <section id="services-section" ref={sectionRef} className="py-16 md:py-24 bg-white">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16 animate-up">
                    <h2 className="font-serif text-3xl md:text-4xl font-medium text-dark-text mb-4">
                        Unsere Dienstleistungen
                    </h2>
                    <p className="text-base text-medium-grey-text leading-relaxed">
                        Entdecken Sie unser Angebot an exklusiven Behandlungen – von klassischen Schnitten bis hin zu kreativen Farbtechniken.
                    </p>
                </div>
                <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-8 ${styles.servicesGrid}`}>
                    {servicesToDisplay.map((service, index) => (
                        <div
                            key={service.id}
                            className={`animate-up bg-light-bg border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 ${styles.serviceCard}`}
                            style={{ transitionDelay: `${index * 0.1}s` }}
                        >
                            <div className="p-6 flex flex-col flex-grow">
                                <h3 className={`font-serif text-xl font-medium text-dark-text mb-2 ${styles.serviceName}`}>{service.name}</h3>
                                <p className={`text-sm text-medium-grey-text mb-4 flex-grow ${styles.serviceDescription}`}>{service.description}</p>
                                <div className={`flex justify-between items-center text-sm text-dark-text pt-4 border-t border-gray-100 ${styles.serviceDetails}`}>
                                    <span>Dauer: <strong>{service.durationMinutes} Min.</strong></span>
                                    <span>Preis: <strong>{service.price?.toFixed(2).replace('.', ',')} €</strong></span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleBookClick(service)}
                                className={`w-full mt-auto bg-dark-text text-white px-6 py-3 text-sm font-medium hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center ${styles.bookButton}`}
                            >
                                Jetzt buchen <FontAwesomeIcon icon={faCalendarCheck} className="ml-2"/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default ServicesSection;