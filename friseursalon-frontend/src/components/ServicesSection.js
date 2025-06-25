// src/components/ServicesSection.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.service';
import styles from './ServicesSection.module.css';
import { FiClock, FiArrowRight } from 'react-icons/fi';
import { FaEuroSign } from 'react-icons/fa';
import ServiceModal from './ServiceModal'; // NEU: Importiere die Modal-Komponente

// Die ServiceCard-Komponente bleibt unverändert wie in der letzten korrigierten Version
const ServiceCard = ({ service }) => {
    const cardRef = useRef(null);
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
            { threshold: 0.1 }
        );

        const currentRef = cardRef.current;
        if (currentRef) observer.observe(currentRef);
        return () => { if (currentRef) observer.unobserve(currentRef); };
    }, []);

    const imageUrl = `https://images.pexels.com/photos/399344${service.id}/pexels-photo-399344${service.id}.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2`;
    const fallbackUrl = 'https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';

    return (
        <div ref={cardRef} className={styles.serviceCard}>
            <div className={styles.imageWrapper}>
                <img src={imageUrl} onError={(e) => { e.target.onerror = null; e.target.src=fallbackUrl; }} alt={service.name} className={styles.serviceImage} loading="lazy" />
            </div>
            <div className={styles.contentWrapper}>
                <h3 className={styles.serviceName}>{service.name}</h3>
                <p className={styles.serviceDescription}>{service.description}</p>
                <div className={styles.detailsList}>
                    <span className={styles.detailItem}><FiClock className={styles.icon} />{service.durationMinutes} min</span>
                    <span className={styles.detailItem}><FaEuroSign className={styles.icon} />{service.price.toFixed(2)}</span>
                </div>
            </div>
            <button onClick={() => navigate(`/buchen?service=${service.id}`)} className={styles.ctaButton}>Termin buchen <FiArrowRight /></button>
        </div>
    );
};

// Die Hauptkomponente mit der neuen Modal-Logik
function ServicesSection() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // NEU: State für die Sichtbarkeit des Modals
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await api.get('/services');
                setServices(response.data ? response.data.slice(0, 3) : []);
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
        <>
            <section id="services-section" className={styles.servicesSection}>
                <div className={styles.container}>
                    <header className={styles.header}>
                        <p className={styles.subtitle}>Handwerk & Präzision</p>
                        <h2 className={styles.title}>Unsere Top-Leistungen</h2>
                    </header>

                    {loading && <div className={styles.statusMessage}>Lade Dienstleistungen...</div>}
                    {error && <div className={`${styles.statusMessage} ${styles.error}`}>{error}</div>}

                    <div className={styles.servicesGrid}>
                        {!loading && !error && services.map((service) => (
                            <ServiceCard key={service.id} service={service} />
                        ))}
                    </div>

                    <div className={styles.fullListButtonContainer}>
                        {/* NEU: Dieser Button öffnet jetzt das Modal */}
                        <button onClick={() => setIsModalOpen(true)} className={styles.fullListButton}>
                            Alle Leistungen entdecken
                        </button>
                    </div>
                </div>
            </section>

            {/* NEU: Das Modal wird nur gerendert, wenn isModalOpen true ist */}
            {isModalOpen && <ServiceModal onClose={() => setIsModalOpen(false)} />}
        </>
    );
}

export default ServicesSection;