import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import ServiceEditModal from './ServiceEditModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';

function ServiceList({ refreshTrigger, currentUser }) {
    const [services, setServices] = useState([]);
    const [error, setError] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchServices = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('services');
            setServices(response.data || []); // Stelle sicher, dass es ein Array ist
        } catch (err) {
            console.error("Fehler beim Abrufen der Dienstleistungen:", err);
            setError("Dienstleistungen konnten nicht geladen werden. Bitte versuchen Sie es später erneut.");
            setServices([]); // Bei Fehler leere Liste setzen
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchServices();
    }, [fetchServices, refreshTrigger]);

    const handleDelete = async (id) => {
        if (window.confirm('Sind Sie sicher, dass Sie diese Dienstleistung löschen möchten?')) {
            setIsLoading(true);
            try {
                await api.delete(`services/${id}`);
                fetchServices();
            } catch (err) {
                console.error("Fehler beim Löschen der Dienstleistung:", err);
                setError("Fehler beim Löschen der Dienstleistung.");
                setIsLoading(false);
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

    if (isLoading && services.length === 0) {
        return <p className="loading-message"><FontAwesomeIcon icon={faSpinner} spin /> Dienstleistungen werden geladen...</p>;
    }


    return (
        <div className="service-list-container">
            {error && <p className="form-message error mb-3">{error}</p>}

            <div className="list-controls-header">
                {/* Platzhalter für zukünftige Controls wie Suche/Filter für Services */}
                {isLoading && services.length > 0 && <FontAwesomeIcon icon={faSpinner} spin className="ml-auto text-xl" />}
            </div>

            {services.length === 0 && !isLoading ? (
                <p className="text-center text-gray-600 py-4">Keine Dienstleistungen verfügbar. Bitte fügen Sie welche hinzu.</p>
            ) : (
                <div className="table-responsive-container mt-2"> {/* Leichter oberer Rand, falls keine Controls da sind */}
                    <table className="app-table services-table">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Beschreibung</th>
                            <th>Preis</th>
                            <th>Dauer (Min)</th>
                            {currentUser?.roles?.includes("ROLE_ADMIN") && <th>Aktionen</th>}
                        </tr>
                        </thead>
                        <tbody>
                        {services.map(service => (
                            <tr key={service.id}>
                                <td data-label="Name:">{service.name}</td>
                                <td data-label="Beschreibung:">{service.description}</td>
                                <td data-label="Preis:">{typeof service.price === 'number' ? service.price.toFixed(2) + ' €' : 'N/A'}</td>
                                <td data-label="Dauer:">{service.durationMinutes}</td>
                                {currentUser?.roles?.includes("ROLE_ADMIN") && (
                                    <td data-label="Aktionen:">
                                        <div className="action-buttons-table">
                                            <button onClick={() => handleEditClick(service)} className="button-link-outline small-button icon-button" title="Dienstleistung bearbeiten">
                                                <FontAwesomeIcon icon={faEdit} />
                                                <span className="button-text-desktop">Bearbeiten</span>
                                            </button>
                                            <button onClick={() => handleDelete(service.id)} className="button-link-outline small-button danger icon-button" title="Dienstleistung löschen">
                                                <FontAwesomeIcon icon={faTrashAlt} />
                                                <span className="button-text-desktop">Löschen</span>
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
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