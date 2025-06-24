// src/components/ServicesSection.js

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.service';
import styles from './ServicesSection.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faEuroSign, faArrowRight } from '@fortawesome/free-solid-svg-icons';

// Hilfskomponente für einen einzelnen Service-Block
const ServiceBlock = ({ service, index }) => {
    const blockRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(styles.visible);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.2 }
        );

        const currentRef = blockRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, []);

    return (
        <div ref={blockRef} className={styles.serviceBlock}>
            <div className={styles.imageWrapper}>
                {/* Dynamisches Bild basierend auf Service, oder Platzhalter */}
                <img
                    src={`https://images.pexels.com/photos/399344${index + 1}/pexels-photo-399344${index + 1}.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2`}
                    alt={service.name}
                    className={styles.serviceImage}
                    loading="lazy"
                />
            </div>
            <div className={styles.contentWrapper}>
                <p className={styles.serviceCategory}>Service 0{index + 1}</p>
                <h3 className={styles.serviceName}>{service.name}</h3>
                <p className={styles.serviceDescription}>{service.description}</p>
                <ul className={styles.detailsList}>
                    <li className={styles.detailItem}>
                        <FontAwesomeIcon icon={faClock} className={styles.icon} />
                        {service.durationMinutes} Minuten
                    </li>
                    <li className={styles.detailItem}>
                        <FontAwesomeIcon icon={faEuroSign} className={styles.icon} />
                        {service.price.toFixed(2)}
                    </li>
                </ul>
                <button onClick={() => navigate(`/buchen?service=${service.id}`)} className={styles.ctaButton}>
                    Termin buchen <FontAwesomeIcon icon={faArrowRight} />
                </button>
            </div>
        </div>
    );
};


function ServicesSection() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await api.get('/services');
                setServices(response.data || []);
            } catch (err) {
                console.error("Fehler beim Laden der Dienstleistungen:", err);
                setError("Dienstleistungen konnten nicht geladen werden.");
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    return (
        <section id="services-section" className={styles.servicesSection}>
            <header className={styles.header}>
                <p className={styles.subtitle}>Handwerk & Präzision</p>
                <h2 className={styles.title}>Unsere Leistungen</h2>
            </header>

            {loading && <div className={styles.statusMessage}>Lade Dienstleistungen...</div>}
            {error && <div className={`${styles.statusMessage} ${styles.error}`}>{error}</div>}

            {!loading && !error && services.map((service, index) => (
                <ServiceBlock key={service.id} service={service} index={index} />
            ))}
        </section>
    );
}

export default ServicesSection;