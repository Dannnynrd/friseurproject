// src/components/ServiceModal.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.service';
import styles from './ServiceModal.module.css';
import { FiX, FiClock, FiArrowRight, FiSearch } from 'react-icons/fi';
import { FaEuroSign } from 'react-icons/fa';

// Diese Komponente lädt und zeigt die komplette Service-Liste
const FullServiceList = () => {
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAllServices = async () => {
            try {
                const response = await api.get('/services');
                setServices(response.data || []);
                setFilteredServices(response.data || []);
            } catch (err) {
                setError("Dienstleistungen konnten nicht geladen werden.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllServices();
    }, []);

    const handleSearch = (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const filtered = services.filter(service =>
            service.name.toLowerCase().includes(searchTerm) ||
            service.description.toLowerCase().includes(searchTerm)
        );
        setFilteredServices(filtered);
    };

    if (loading) return <div className={styles.statusMessage}>Lade...</div>;
    if (error) return <div className={`${styles.statusMessage} ${styles.error}`}>{error}</div>;

    return (
        <>
            <div className={styles.searchBar}>
                <FiSearch className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Dienstleistung suchen..."
                    onChange={handleSearch}
                    className={styles.searchInput}
                />
            </div>
            <ul className={styles.serviceList}>
                {filteredServices.length > 0 ? filteredServices.map(service => (
                    <li key={service.id} className={styles.serviceListItem}>
                        <div className={styles.serviceInfo}>
                            <h4 className={styles.serviceName}>{service.name}</h4>
                            <p className={styles.serviceDescription}>{service.description}</p>
                        </div>
                        <div className={styles.serviceDetails}>
                            <span className={styles.detailItem}><FiClock /> {service.durationMinutes} min</span>
                            <span className={styles.detailItem}><FaEuroSign /> {service.price.toFixed(2)}</span>
                            <button
                                className={styles.bookButton}
                                onClick={() => navigate(`/buchen?service=${service.id}`)}
                            >
                                Buchen
                            </button>
                        </div>
                    </li>
                )) : <p className={styles.statusMessage}>Keine passenden Dienstleistungen gefunden.</p>}
            </ul>
        </>
    );
};

// Die Haupt-Modal-Komponente
const ServiceModal = ({ onClose }) => {
    const modalRef = useRef();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        const handleEsc = (event) => {
            if (event.keyCode === 27) onClose();
        };
        window.addEventListener("keydown", handleEsc);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("keydown", handleEsc);
        };
    }, [onClose]);

    return (
        <div className={styles.modalOverlay}>
            <div ref={modalRef} className={styles.modalContent}>
                <header className={styles.modalHeader}>
                    <h2>Alle Leistungen</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <FiX size={24} />
                    </button>
                </header>
                <div className={styles.listContainer}>
                    <FullServiceList />
                </div>
            </div>
        </div>
    );
};

export default ServiceModal;