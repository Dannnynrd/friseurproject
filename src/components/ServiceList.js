import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service'; // WICHTIG: Hier api importieren
import ServiceEditModal from './ServiceEditModal';

function ServiceList({ refreshTrigger }) {
    const [services, setServices] = useState([]);
    const [error, setError] = useState(null);
    const [selectedService, setSelectedService] = useState(null);

    const fetchServices = useCallback(async () => {
        try {
            // NUTZE 'api' STATT 'axios' FÜR ALLE AUFRUFE AN DEIN BACKEND
            const response = await api.get('services'); // Pfad ist jetzt relativ zur baseURL
            setServices(response.data);
            setError(null);
        } catch (err) {
            console.error("Fehler beim Abrufen der Dienstleistungen:", err);
            setError("Dienstleistungen konnten nicht geladen werden. Bitte versuchen Sie es später erneut.");
        }
    }, []);

    useEffect(() => {
        fetchServices();
    }, [fetchServices, refreshTrigger]);

    const handleDelete = async (id) => {
        if (window.confirm('Sind Sie sicher, dass Sie diese Dienstleistung löschen möchten?')) {
            try {
                // NUTZE 'api' STATT 'axios'
                await api.delete(`services/${id}`);
                fetchServices();
            } catch (err) {
                console.error("Fehler beim Löschen der Dienstleistung:", err);
                setError("Fehler beim Löschen der Dienstleistung.");
            }
        }
    };

    const handleEditClick = (service) => {
        setSelectedService(service);
    };

    const handleCloseModal = () => {
        setSelectedService(null);
    };

    const handleServiceUpdated = () => {
        handleCloseModal();
        fetchServices();
    };

    return (
        <div className="service-list-container">
            <h2>Unsere Dienstleistungen</h2>
            {error && <p className="error-message">{error}</p>}
            {services.length === 0 && !error ? (
                <p>Keine Dienstleistungen verfügbar. Bitte fügen Sie welche im Backend hinzu.</p>
            ) : (
                <ul className="service-list">
                    {services.map(service => (
                        <li key={service.id} className="service-item">
                            <div className="service-info">
                                <h3>{service.name}</h3>
                                <p>{service.description}</p>
                                <p>Preis: {service.price.toFixed(2)} €</p>
                                <p>Dauer: {service.durationMinutes} Minuten</p>
                            </div>
                            <div className="service-actions">
                                <button onClick={() => handleEditClick(service)} className="edit-button">Bearbeiten</button>
                                <button onClick={() => handleDelete(service.id)} className="delete-button">Löschen</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {selectedService && (
                <ServiceEditModal
                    service={selectedService}
                    onClose={handleCloseModal}
                    onServiceUpdated={handleServiceUpdated}
                />
            )}
        </div>
    );
}

export default ServiceList;