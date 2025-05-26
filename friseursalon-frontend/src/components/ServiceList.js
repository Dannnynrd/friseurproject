import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import ServiceEditModal from './ServiceEditModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

function ServiceList({ refreshTrigger, currentUser }) {
    console.log('ServiceList.js: Erhaltene currentUser Prop:', currentUser);
    console.log('ServiceList.js: Rollenprüfung (isAdmin):', currentUser?.roles?.includes("ROLE_ADMIN"));

    const [services, setServices] = useState([]);
    const [error, setError] = useState(null);
    const [selectedService, setSelectedService] = useState(null);

    const fetchServices = useCallback(async () => {
        try {
            const response = await api.get('services');
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
            {/* <h2>Unsere Dienstleistungen</h2> */} {/* Überschrift wird von ServicesSection gesetzt */}
            {error && <p className="error-message">{error}</p>}
            {services.length === 0 && !error ? (
                <p className="text-center text-gray-600">Keine Dienstleistungen verfügbar. Bitte fügen Sie welche im Backend hinzu.</p>
            ) : (
                <table className="app-table"> {/* Nutzt globale app-table Klasse */}
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Beschreibung</th>
                        <th>Preis</th>
                        <th>Dauer (Min)</th>
                        <th>Aktionen</th>
                    </tr>
                    </thead>
                    <tbody>
                    {services.map(service => (
                        <tr key={service.id}>
                            <td>{service.name}</td>
                            <td>{service.description}</td>
                            <td>{service.price.toFixed(2)} €</td>
                            <td>{service.durationMinutes}</td>
                            <td>
                                <div className="action-buttons"> {/* Nutzt globale action-buttons Klasse */}
                                    <button onClick={() => handleEditClick(service)} className="edit-button">
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    <button onClick={() => handleDelete(service.id)} className="delete-button">
                                        <FontAwesomeIcon icon={faTrashAlt} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
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
