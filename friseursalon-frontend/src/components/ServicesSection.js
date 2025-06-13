import React, { useEffect, useState, useRef } from 'react';
import styles from './ServicesSection.module.css';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api.service';

function ServiceCard({ service }) {
    const navigate = useNavigate();

    const handleBookingClick = () => {
        navigate('/buchen', { state: { serviceId: service.id } });
    };

    // Placeholder image logic
    const getPlaceholderImage = (serviceName) => {
        const keywords = {
            'schnitt': 'https://images.pexels.com/photos/3992874/pexels-photo-3992874.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            'farbe': 'https://images.pexels.com/photos/705255/pexels-photo-705255.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            'strähnen': 'https://images.pexels.com/photos/4137275/pexels-photo-4137275.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            'styling': 'https://images.pexels.com/photos/2068478/pexels-photo-2068478.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        };
        const lowerCaseName = serviceName.toLowerCase();
        for (const key in keywords) {
            if (lowerCaseName.includes(key)) {
                return keywords[key];
            }
        }
        return 'https://images.pexels.com/photos/1926620/pexels-photo-1926620.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'; // Fallback
    };

    const imageUrl = getPlaceholderImage(service.name);

    return (
        <div className={styles.serviceCard}>
            <div className={styles.imageWrapper}>
                <img src={imageUrl} alt={service.name} className={styles.serviceImage} />
            </div>
            <div className={styles.cardContent}>
                <h3 className={styles.serviceName}>{service.name}</h3>
                <p className={styles.serviceDescription}>{service.description}</p>
                <div className={styles.serviceMeta}>
                    <span className={styles.duration}>{service.duration} Min.</span>
                    <span className={styles.price}>{service.price.toFixed(2)} €</span>
                </div>
                <button onClick={handleBookingClick} className={styles.bookButton}>
                    Jetzt buchen
                </button>
            </div>
        </div>
    );
}


function ServicesSection({ maxServicesToShow }) {
    const [services, setServices] = useState([]);
    const [error, setError] = useState(null);
    const sectionRef = useRef(null);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await apiService.get('/services');
                setServices(response.data);
            } catch (err) {
                setError('Dienstleistungen konnten nicht geladen werden.');
                console.error(err);
            }
        };
        fetchServices();
    }, []);

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

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, []);

    const servicesToDisplay = maxServicesToShow ? services.slice(0, maxServicesToShow) : services;

    if (error) {
        return <div className={styles.error}>{error}</div>;
    }

    return (
        <section ref={sectionRef} className={styles.servicesSection}>
            <div className={styles.container}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.headline}>Unsere Leistungen</h2>
                    <p className={styles.subheadline}>
                        Entdecken Sie eine Auswahl unserer exklusiven Dienstleistungen, die darauf ausgelegt sind, Ihre natürliche Schönheit zu betonen.
                    </p>
                </div>
                <div className={styles.servicesGrid}>
                    {servicesToDisplay.map(service => (
                        <ServiceCard key={service.id} service={service} />
                    ))}
                </div>
            </div>
        </section>
    );
}

export default ServicesSection;
