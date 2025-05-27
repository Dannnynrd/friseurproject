import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import ServiceEditModal from './ServiceEditModal';
import ConfirmModal from './ConfirmModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import SkeletonLoader from './common/SkeletonLoader'; // Import SkeletonLoader

function ServiceList({ refreshTrigger, currentUser }) {
    const [services, setServices] = useState([]);
    const [error, setError] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);

    const fetchServices = useCallback(async () => {
        // For initial load, ensure isLoading is true before fetching
        if (services.length === 0) { // Check if it's the first load
            setIsLoading(true);
        } else {
            // For subsequent refreshes, we might not want a full page skeleton,
            // but the spinner in list-controls-header will indicate loading.
            // Or, set a different loading state e.g. isRefreshing
            setIsLoading(true); // Still set to true to show spinner
        }
        setError(null);
        try {
            const response = await api.get('services');
            setServices(response.data || []);
        } catch (err) {
            console.error("Fehler beim Abrufen der Dienstleistungen:", err);
            setError("Dienstleistungen konnten nicht geladen werden. Bitte versuchen Sie es später erneut.");
            setServices([]); // Clear services on error
        } finally {
            setIsLoading(false);
        }
    }, [services.length]); // services.length ensures setIsLoading(true) is correctly set on initial load

    useEffect(() => {
        fetchServices();
    }, [fetchServices, refreshTrigger]);

    const handleDeleteClick = (service) => {
        setServiceToDelete(service);
        setShowConfirmDeleteModal(true);
    };

    const confirmDeleteService = async () => {
        if (!serviceToDelete) return;
        // Consider a more specific loading state for delete, e.g., isDeleting
        // For now, global isLoading might show skeletons briefly, which is acceptable.
        setIsLoading(true); 
        setShowConfirmDeleteModal(false);
        try {
            await api.delete(`services/${serviceToDelete.id}`);
            setServiceToDelete(null);
            await fetchServices(); // Re-fetch services after deletion
        } catch (err) {
            console.error("Fehler beim Löschen der Dienstleistung:", err);
            setError("Fehler beim Löschen der Dienstleistung.");
            setIsLoading(false); // Ensure loading stops on error
            setServiceToDelete(null);
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
        fetchServices(); // Re-fetch services after update
    };


    // Render Skeleton Loader if loading and no services are yet available
    // The table structure will be part of the main return for non-loading state
    const renderTableWithSkeleton = (columns) => (
        <div className="table-responsive-container mt-2">
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
                    <SkeletonLoader type="service-row" count={3} columns={columns} />
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="service-list-container">
            {error && <p className="form-message error mb-3">{error}</p>}

            <div className="list-controls-header">
                {/* Show spinner if loading more data while some data is already present */}
                {isLoading && services.length > 0 && <FontAwesomeIcon icon={faSpinner} spin className="ml-auto text-xl" />}
            </div>

            {isLoading && services.length === 0 ? (
                renderTableWithSkeleton(currentUser?.roles?.includes("ROLE_ADMIN") ? 5 : 4)
            ) : services.length === 0 && !isLoading ? (
                <p className="text-center text-gray-600 py-4">Keine Dienstleistungen verfügbar. Bitte fügen Sie welche hinzu.</p>
            ) : (
                <div className="table-responsive-container mt-2">
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
                                            <button onClick={() => handleDeleteClick(service)} className="button-link-outline small-button danger icon-button" title="Dienstleistung löschen">
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
            {/* NEU: Bestätigungsmodal für Löschen einbinden */}
            <ConfirmModal
                isOpen={showConfirmDeleteModal}
                onClose={() => { setShowConfirmDeleteModal(false); setServiceToDelete(null); }}
                onConfirm={confirmDeleteService}
                title="Dienstleistung löschen"
                message={`Möchten Sie die Dienstleistung "${serviceToDelete?.name}" wirklich endgültig löschen? Dieser Schritt kann nicht rückgängig gemacht werden.`}
                confirmText="Ja, löschen"
                cancelText="Abbrechen"
                type="danger"
            />
        </div>
    );
}

export default ServiceList;