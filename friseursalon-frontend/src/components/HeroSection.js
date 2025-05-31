// friseursalon-frontend/src/components/HeroSection.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HeroSection.module.css';
import api from '../services/api.service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faCut, faPalette, faSpa } from '@fortawesome/free-solid-svg-icons';


function HeroSection() {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [currentServiceIndex, setCurrentServiceIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        api.get('services')
            .then(response => {
                // ***** DEBUGGING START *****
                console.log('HeroSection fetched services:', response.data);
                if (response.data && response.data.length > 0) {
                    response.data.forEach(service => {
                        console.log(`HeroSection - Service: ID=<span class="math-inline">\{service\.id\}, Name\=</span>{JSON.stringify(service.name)}, Typeof Name=<span class="math-inline">\{typeof service\.name\}, Duration\=</span>{service.durationMinutes}`);
                    });
                }
                // ***** DEBUGGING END *****
                setServices(response.data || []);
            })
            .catch(error => {
                console.error("Error fetching services for HeroSection:", error);
            });
    }, []);

    useEffect(() => {
        if (services.length > 1) {
            const intervalId = setInterval(() => {
                setFade(false);
                setTimeout(() => {
                    setCurrentServiceIndex(prevIndex => (prevIndex + 1) % services.length);
                    setFade(true);
                }, 500); // Duration of fade-out animation
            }, 5000); // Change service every 5 seconds
            return () => clearInterval(intervalId);
        }
    }, [services]);


    const navigateToBooking = (service) => {
        // ***** DEBUGGING START *****
        console.log('HeroSection navigateToBooking - service:', service);
        if (service) {
            console.log('HeroSection navigateToBooking - service.name:', service.name, 'typeof service.name:', typeof service.name);
        }
        // ***** DEBUGGING END *****
        if (service && typeof service.name === 'string') {
            navigate(`/booking/${encodeURIComponent(service.name)}`);
        } else {
            // Fallback or error handling if service name is not a string
            console.warn('HeroSection: Service name is not a string or service is undefined. Navigating to generic booking.');
            navigate('/booking');
        }
    };

    const currentService = services[currentServiceIndex];

    const getServiceIcon = (serviceName) => {
        if (typeof serviceName !== 'string') return faCut; // Default icon
        const nameLower = serviceName.toLowerCase();
        if (nameLower.includes('schneiden') || nameLower.includes('cut')) return faCut;
        if (nameLower.includes('färben') || nameLower.includes('color')) return faPalette;
        if (nameLower.includes('pflege') || nameLower.includes('spa')) return faSpa;
        return faCut; // Default icon
    };

    return (
        <div className={styles.heroBackground}>
            <div className={styles.heroOverlay}></div>
            <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>Willkommen bei IMW Salon</h1>
                <p className={styles.heroSubtitle}>Ihr Experte für exzellentes Haarstyling und entspannende Pflege.</p>
                {services.length > 0 && currentService && (
                    <div className={`${styles.dynamicServiceInfo} ${fade ? styles.fadeIn : styles.fadeOut}`}>
                        <FontAwesomeIcon icon={getServiceIcon(currentService.name)} className={styles.serviceIcon} />
                        <span className={styles.serviceText}>
                            Empfehlung: <strong>{currentService.name}</strong> - {currentService.durationMinutes} Min. nur {typeof currentService.price === 'number' ? currentService.price.toFixed(2) : currentService.price}€
                        </span>
                    </div>
                )}
                <div className={styles.ctaButtons}>
                    <button onClick={() => navigateToBooking(services.length > 0 ? currentService : null)} className={styles.ctaButtonPrimary}>
                        <FontAwesomeIcon icon={faCalendarCheck} /> Termin buchen {services.length > 0 && currentService ? `(${currentService.name})` : ''}
                    </button>
                    <button onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })} className={styles.ctaButtonSecondary}>
                        Unsere Services
                    </button>
                </div>
            </div>
        </div>
    );
}

export default HeroSection;