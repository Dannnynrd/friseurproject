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
                }, 400); // Passt zur CSS-Animationsdauer
            }, 5000);
            return () => clearInterval(intervalId);
        }
    }, [services]);

    const navigateToBooking = (service) => {
        if (service && typeof service.name === 'string') {
            navigate(`/buchen?service=${encodeURIComponent(service.name)}`);
        } else {
            navigate('/buchen');
        }
    };

    const currentService = services[currentServiceIndex];

    const getServiceIcon = (serviceName) => {
        if (typeof serviceName !== 'string') return faCut;
        const nameLower = serviceName.toLowerCase();
        if (nameLower.includes('schneiden') || nameLower.includes('cut')) return faCut;
        if (nameLower.includes('färben') || nameLower.includes('color')) return faPalette;
        if (nameLower.includes('pflege') || nameLower.includes('spa')) return faSpa;
        return faCut;
    };

    return (
        <section className={`relative flex items-center justify-center text-center text-white min-h-[550px] md:min-h-[650px] lg:min-h-screen px-4 ${styles.heroBackground}`}>
            <div className="absolute inset-0 bg-black/40 z-0"></div>
            <div className="relative z-10 max-w-3xl animate-up visible">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-medium leading-tight tracking-tight text-shadow">
                    Eine vollendete Erfahrung
                </h1>
                <p className="mt-5 text-base sm:text-lg md:text-xl max-w-xl mx-auto text-gray-200 text-shadow-sm leading-relaxed">
                    Ihr Experte für exzellentes Haarstyling und entspannende Pflege. Entdecken Sie Handwerkskunst in ihrer schönsten Form.
                </p>

                {services.length > 0 && currentService && (
                    <div className={`mt-8 transition-opacity duration-300 ease-in-out ${fade ? 'opacity-100' : 'opacity-0'}`}>
                        <div className={`inline-flex items-center bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full border border-white/20 text-sm ${styles.dynamicServiceInfo}`}>
                            <FontAwesomeIcon icon={getServiceIcon(currentService.name)} className="mr-2 text-white/80" />
                            <span>
                                Empfehlung: <strong>{currentService.name}</strong> - {currentService.durationMinutes} Min.
                            </span>
                        </div>
                    </div>
                )}

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button onClick={() => navigateToBooking(currentService)} className={`w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-md text-dark-text bg-white hover:bg-gray-100 transition-transform duration-150 ease-in-out hover:scale-105 active:scale-100 ${styles.ctaButtonPrimary}`}>
                        <FontAwesomeIcon icon={faCalendarCheck} className="mr-2" /> Termin buchen
                    </button>
                    <a href="#services-section" onClick={(e) => { e.preventDefault(); document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' }); }} className={`w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-white/80 text-base font-medium rounded-md text-white hover:bg-white/10 transition ${styles.ctaButtonSecondary}`}>
                        Unsere Services
                    </a>
                </div>
            </div>
        </section>
    );
}

export default HeroSection;