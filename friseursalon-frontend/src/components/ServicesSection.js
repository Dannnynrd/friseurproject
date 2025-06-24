// src/components/ServicesSection.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.service';
import styles from './ServicesSection.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faChevronRight } from '@fortawesome/free-solid-svg-icons';

// Throttling-Funktion, um Scroll-Events zu optimieren und die Performance zu verbessern
const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

function ServicesSection() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeServiceId, setActiveServiceId] = useState(null);

    const sectionRefs = useRef({});
    const isScrollingProgrammatically = useRef(false);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await api.get('/services');
                const fetchedServices = response.data || [];
                setServices(fetchedServices);
                if (fetchedServices.length > 0) {
                    setActiveServiceId(fetchedServices[0].id);
                }
            } catch (err) {
                console.error("Fehler beim Laden der Dienstleistungen:", err);
                setError("Dienstleistungen konnten nicht geladen werden.");
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    const handleScroll = useCallback(() => {
        if (isScrollingProgrammatically.current) return;

        const viewportCenter = window.innerHeight / 2;
        let bestCandidate = null;
        let smallestDistance = Infinity;

        services.forEach(service => {
            const section = sectionRefs.current[service.id];
            if (section) {
                const rect = section.getBoundingClientRect();
                if (rect.top < viewportCenter && rect.bottom > viewportCenter - rect.height / 2) {
                    const distance = Math.abs(rect.top - viewportCenter);
                    if (distance < smallestDistance) {
                        smallestDistance = distance;
                        bestCandidate = service.id;
                    }
                }
            }
        });

        if (bestCandidate) {
            setActiveServiceId(bestCandidate);
        }
    }, [services]);

    useEffect(() => {
        const throttledScrollHandler = throttle(handleScroll, 100);
        window.addEventListener('scroll', throttledScrollHandler);
        return () => window.removeEventListener('scroll', throttledScrollHandler);
    }, [handleScroll]);

    const handleNavClick = (e, serviceId) => {
        e.preventDefault();
        isScrollingProgrammatically.current = true;
        setActiveServiceId(serviceId);

        sectionRefs.current[serviceId]?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        setTimeout(() => {
            isScrollingProgrammatically.current = false;
        }, 1000); // Setzt das Flag nach der Scroll-Animation zurück
    };

    const renderServiceContent = () => {
        if (loading) return <div className={styles.statusMessage}>Lade Dienstleistungen...</div>;
        if (error) return <div className={`${styles.statusMessage} ${styles.error}`}>{error}</div>;
        if (services.length === 0) return <div className={styles.statusMessage}>Keine Dienstleistungen verfügbar.</div>;

        return (
            <div className={styles.servicesGrid}>
                {services.map((service) => (
                    <div
                        key={service.id}
                        id={`service-${service.id}`}
                        ref={el => sectionRefs.current[service.id] = el}
                        className={`${styles.serviceCard} ${activeServiceId === service.id ? styles.cardActive : ''}`}
                        tabIndex={0} // Macht die Karte fokussierbar für "Tipp"-Effekt
                    >
                        <div className={styles.cardHeader}>
                            <h3 className={styles.serviceName}>{service.name}</h3>
                            <div className={styles.metaInfo}>
                                <span className={styles.price}>{`€${service.price.toFixed(2)}`}</span>
                                <span className={styles.duration}>
                                    <FontAwesomeIcon icon={faClock} className={styles.icon} />
                                    {`${service.durationMinutes} min`}
                                </span>
                            </div>
                        </div>
                        <div className={styles.cardBody}>
                            <p className={styles.serviceDescription}>{service.description}</p>
                            <Link to={`/buchen?service=${service.id}`} className={styles.bookingLink}>
                                Termin Buchen
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <section className={styles.servicesSection}>
            <div className={styles.container}>
                {/* --- Linke, sticky Navigationsspalte für Desktop --- */}
                <aside className={styles.stickyNav}>
                    <header className={styles.sectionHeader}>
                        <p className={styles.subtitle}>Handwerk & Präzision</p>
                        <h2 className={styles.title}>Unsere Leistungen</h2>
                        <p className={styles.description}>
                            Jede Behandlung ist ein Versprechen – für Qualität, Stil und Ihr persönliches Wohlbefinden.
                        </p>
                    </header>
                    <nav className={styles.serviceNavList}>
                        {services.map(service => (
                            <a
                                key={service.id}
                                href={`#service-${service.id}`}
                                className={`${styles.serviceNavItem} ${activeServiceId === service.id ? styles.serviceNavItemActive : ''}`}
                                onClick={(e) => handleNavClick(e, service.id)}
                            >
                                {service.name}
                                <FontAwesomeIcon icon={faChevronRight} className={styles.navArrow} />
                            </a>
                        ))}
                    </nav>
                </aside>

                {/* --- Rechte, scrollbare Inhaltsspalte (Desktop) & Hauptinhalt (Mobile) --- */}
                <main className={styles.scrollableContent}>
                    {/* Header, der nur auf Mobile sichtbar ist */}
                    <header className={styles.mobileSectionHeader}>
                        <p className={styles.subtitle}>Handwerk & Präzision</p>
                        <h2 className={styles.title}>Unsere Leistungen</h2>
                    </header>
                    {renderServiceContent()}
                </main>
            </div>
        </section>
    );
}

export default ServicesSection;