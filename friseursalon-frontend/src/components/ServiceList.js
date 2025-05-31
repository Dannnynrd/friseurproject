// friseursalon-frontend/src/components/ServiceList.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
// Erstelle diese Datei, auch wenn sie anfangs leer ist oder nur minimale Stile enthält
import styles from './ServiceList.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrashAlt, faSpinner, faExclamationTriangle, faCheckCircle, faTag, faClock, faEuroSign } from '@fortawesome/free-solid-svg-icons';

// Annahme: Diese Modale existieren und sind gestylt/werden separat migriert
import ServiceEditModal from './ServiceEditModal';
import ConfirmModal from './ConfirmModal';
// ServiceForm könnte direkt im ServiceEditModal verwendet werden oder als separates Modal zum Erstellen
// Für dieses Beispiel nehmen wir an, ServiceEditModal kann auch zum Erstellen verwendet werden (wenn serviceToEdit null ist)

function ServiceList({ onServiceAdded, refreshServicesList }) {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const [showEditModal, setShowEditModal] = useState(false);
    const [serviceToEdit, setServiceToEdit] = useState(null); // Für Bearbeiten und Neuanlage (null bei Neuanlage)

    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);

    const fetchServices = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage('');
        try {
            const response = await api.get('/api/services'); // Admin-Endpunkt zum Abrufen aller Services
            setServices(response.data || []);
        } catch (err) {
            console.error("Error fetching services:", err);
            setError(err.response?.data?.message || "Dienstleistungen konnten nicht geladen werden.");
            setServices([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchServices();
    }, [fetchServices, refreshServicesList]); // Refresh, wenn refreshServicesList sich ändert

    const handleEdit = (service) => {
        setServiceToEdit(service);
        setShowEditModal(true);
    };

    const handleCreateNew = () => {
        setServiceToEdit(null); // Kein Service zum Bearbeiten, also Neuanlage
        setShowEditModal(true); // Wir verwenden dasselbe Modal
    };

    const confirmDelete = (serviceId) => {
        setServiceToDelete(serviceId);
        setShowConfirmDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!serviceToDelete) return;
        // Hier könnte man den Ladezustand spezifisch für den Löschvorgang setzen
        // setLoading(true); // Oder einen eigenen Ladezustand für den Button
        setError(null);
        setSuccessMessage('');
        try {
            await api.delete(`/api/services/${serviceToDelete}`); // Admin-Endpunkt zum Löschen
            setSuccessMessage("Dienstleistung erfolgreich gelöscht.");
            fetchServices(); // Liste neu laden
            if (typeof onServiceAdded === 'function') { // Allgemeiner Callback für Änderungen
                onServiceAdded();
            }
        } catch (err) {
            console.error("Error deleting service:", err);
            setError(err.response?.data?.message || "Fehler beim Löschen der Dienstleistung.");
        } finally {
            // setLoading(false);
            setShowConfirmDeleteModal(false);
            setServiceToDelete(null);
        }
    };

    const handleModalClose = () => {
        setShowEditModal(false);
        setServiceToEdit(null);
    };

    const handleModalSave = () => {
        handleModalClose();
        fetchServices(); // Liste neu laden nach Speichern
        if (typeof onServiceAdded === 'function') {
            onServiceAdded(); // Elternkomponente benachrichtigen
        }
        setSuccessMessage(serviceToEdit ? "Dienstleistung erfolgreich aktualisiert." : "Dienstleistung erfolgreich erstellt.");
    };

    const formatPrice = (price) => {
        if (typeof price !== 'number') return 'N/A';
        return `${price.toFixed(2).replace('.', ',')} €`;
    };

    const formatDuration = (minutes) => {
        if (typeof minutes !== 'number' || minutes <= 0) return 'N/A';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        let durationString = '';
        if (h > 0) durationString += `${h} Std. `;
        if (m > 0) durationString += `${m} Min.`;
        return durationString.trim() || 'N/A';
    };


    if (loading && services.length === 0) {
        return (
            <div className="flex justify-center items-center p-10 text-gray-600">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-indigo-500" />
                <p className="ml-3 text-md">Lade Dienstleistungen...</p>
            </div>
        );
    }

    return (
        <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-lg ${styles.serviceListContainer}`}>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 font-serif">
                    Dienstleistungsverwaltung
                </h2>
                <button
                    onClick={handleCreateNew}
                    className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Neue Dienstleistung
                </button>
            </div>

            {error && (
                <div className={`mb-4 p-3 rounded-md bg-red-50 text-red-600 border border-red-200 text-sm flex items-center ${styles.message}`}>
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 flex-shrink-0" /> {error}
                </div>
            )}
            {successMessage && (
                <div className={`mb-4 p-3 rounded-md bg-green-50 text-green-600 border border-green-200 text-sm flex items-center ${styles.message}`}>
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2 flex-shrink-0" /> {successMessage}
                </div>
            )}

            {services.length === 0 && !loading && !error && (
                <div className={`text-center py-8 px-6 bg-slate-50 rounded-lg ${styles.noServices}`}>
                    <FontAwesomeIcon icon={faTag} size="2x" className="text-gray-400 mb-3" />
                    <p className="text-gray-500 text-md">
                        Es sind keine Dienstleistungen vorhanden. Fügen Sie eine neue hinzu!
                    </p>
                </div>
            )}

            {services.length > 0 && (
                <div className={`overflow-x-auto shadow rounded-lg ${styles.tableContainer}`}>
                    <table className={`min-w-full divide-y divide-gray-200 ${styles.appTable}`}>
                        <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Beschreibung</th>
                            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dauer</th>
                            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preis</th>
                            <th scope="col" className="relative px-5 py-3">
                                <span className="sr-only">Aktionen</span>
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {services.map((service) => (
                            <tr key={service.id} className={`hover:bg-slate-50 transition-colors duration-150 ${styles.tableRow}`}>
                                <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{service.name}</td>
                                <td className="px-5 py-4 text-sm text-gray-600 hidden sm:table-cell">
                                    <p className="truncate w-64 md:w-96" title={service.description}>{service.description || '-'}</p>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{formatDuration(service.duration)}</td>
                                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{formatPrice(service.price)}</td>
                                <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1.5">
                                    <button onClick={() => handleEdit(service)} className={`text-indigo-600 hover:text-indigo-800 p-1.5 rounded-md hover:bg-indigo-50 transition-colors ${styles.actionButton}`} title="Bearbeiten">
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    <button onClick={() => confirmDelete(service.id)} className={`text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors ${styles.actionButton}`} title="Löschen">
                                        <FontAwesomeIcon icon={faTrashAlt} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showEditModal && (
                <ServiceEditModal // Annahme: Dieses Modal kann auch zum Erstellen verwendet werden, wenn serviceToEdit null ist
                    isOpen={showEditModal}
                    onClose={handleModalClose}
                    onSave={handleModalSave}
                    serviceData={serviceToEdit} // Ist null für "Neu erstellen"
                />
            )}
            {showConfirmDeleteModal && (
                <ConfirmModal
                    isOpen={showConfirmDeleteModal}
                    onClose={() => setShowConfirmDeleteModal(false)}
                    onConfirm={handleDelete}
                    title="Dienstleistung löschen"
                    message="Möchten Sie diese Dienstleistung wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden."
                    confirmButtonText="Ja, löschen"
                    // isLoading={loading} // Ein spezifischer Ladezustand für den Lösch-Button wäre besser
                />
            )}
        </div>
    );
}

export default ServiceList;
