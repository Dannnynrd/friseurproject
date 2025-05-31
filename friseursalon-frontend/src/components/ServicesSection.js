// friseursalon-frontend/src/components/ServicesSection.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './ServicesSection.module.css';
import api from '../services/api.service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';

function ServicesSection({maxServicesToShow = 0}) { // maxServicesToShow = 0 means show all
    const [fetchedServices, setFetchedServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setIsLoading(true);
        api.get('services')
            .then(response => {
                // ***** DEBUGGING START *****
                console.log('ServicesSection fetched services:', response.data);
                if (response.data && response.data.length > 0) {
                    response.data.forEach(service => {
                        console.log(`ServicesSection - Service: ID=<span class="math-inline">\{service\.id\}, Name\=</span>{JSON.stringify(service.name)}, Typeof Name=<span class="math-inline">\{typeof service\.name\}, Duration\=</span>{service.durationMinutes}`);
                    });
                }
                // ***** DEBUGGING END *****
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


    if (isLoading) {
        return <div className={styles.loadingMessage}><FontAwesomeIcon icon={faSpinner} spin /> Services werden geladen...</div>;
    }

    if (error) {
        return <div className={styles.errorMessage}>{error}</div>;
    }

    if (servicesToDisplay.length === 0) {
        return <div className={styles.noServicesMessage}>Keine Dienstleistungen verfügbar.</div>;
    }

    return (
        <section id="services-section" className={styles.servicesSection}>
            <h2 className={styles.sectionTitle}>Unsere Dienstleistungen</h2>
            <div className={styles.servicesGrid}>
                {servicesToDisplay.map(service => (
                    <div key={service.id} className={styles.serviceCard}>
                        <h3 className={styles.serviceName}>{service.name}</h3>
                        <p className={styles.serviceDescription}>{service.description}</p>
                        <div className={styles.serviceDetails}>
                            <span>Dauer: {service.durationMinutes} Min.</span>
                            <span>Preis: {typeof service.price === 'number' ? `${service.price.toFixed(2)} €` : service.price}</span>
                        </div>
                        {/* ***** DEBUGGING START ***** */}
                        {typeof service.name !== 'string' && <p style={{color: 'red'}}>WARNUNG: service.name ist kein String!</p>}
                        {/* ***** DEBUGGING END ***** */}
                        <Link
                            to={`/booking/${typeof service.name === 'string' ? encodeURIComponent(service.name) : '[object Object]'}`} // Sicherheits-Fallback für Link
                            className={styles.serviceCardButton}
                        >
                            Jetzt buchen <FontAwesomeIcon icon={faCalendarCheck} />
                        </Link>
                    </div>
                ))}
            </div>
            {maxServicesToShow > 0 && fetchedServices.length > maxServicesToShow && (
                <div className={styles.showAllButtonContainer}>
                    <Link to="/#services-section" onClick={() => document.getElementById('services-section-fullview')?.scrollIntoView({ behavior: 'smooth' })} className={styles.showAllButton}>
                        Alle Services anzeigen
                    </Link>
                </div>
            )}
        </section>
    );
}
// Helper für die Hauptseite, um alle Services anzuzeigen
export const FullServicesSection = () => <ServicesSection maxServicesToShow={0} />;


export default ServicesSection;