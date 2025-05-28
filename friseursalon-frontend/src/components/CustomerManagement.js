// src/components/CustomerManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import CustomerEditModal from './CustomerEditModal';
import ConfirmModal from './ConfirmModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faSpinner, faExclamationCircle, faSearch, faUsers, faCheckCircle } from '@fortawesome/free-solid-svg-icons'; // faCheckCircle HINZUGEFÜGT
import './CustomerManagement.css'; // Eigene CSS-Datei importieren

function CustomerManagement({ currentUser, refreshTrigger: parentRefreshTrigger }) {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState({ type: '', text: '' });


    // Interner Refresh-Trigger für diese Komponente, falls benötigt, oder direkt parentRefreshTrigger nutzen
    const [internalRefreshTrigger, setInternalRefreshTrigger] = useState(0);

    const fetchCustomers = useCallback(async () => {
        if (!currentUser || !currentUser.roles?.includes("ROLE_ADMIN")) {
            setError("Zugriff verweigert. Nur Administratoren können Kundendaten einsehen.");
            setIsLoading(false);
            setCustomers([]);
            return;
        }

        setIsLoading(true);
        setError(null);
        setDeleteMessage({ type: '', text: ''}); // Lösch-Nachrichten zurücksetzen
        try {
            const response = await api.get('/customers');
            setCustomers(Array.isArray(response.data) ? response.data : []);
            if (!Array.isArray(response.data)) {
                console.warn('[CustomerManagement] Backend hat kein Array zurückgegeben für /customers:', response.data);
                setError("Unerwartetes Datenformat vom Server erhalten.");
            }
        } catch (err) {
            console.error("[CustomerManagement] Fehler beim Abrufen der Kunden:", err.response || err);
            setError(`Kunden konnten nicht geladen werden: ${err.response?.data?.message || err.message || 'Unbekannter Fehler'}`);
            setCustomers([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]); // Abhängigkeit von currentUser

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers, internalRefreshTrigger, parentRefreshTrigger]); // Auf beide Trigger reagieren

    const handleEditClick = (customer) => {
        setSelectedCustomer(customer);
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setSelectedCustomer(null);
    };

    const handleCustomerUpdated = () => {
        handleCloseEditModal();
        setInternalRefreshTrigger(prev => prev + 1); // Löst Neuladen der Kundenliste aus
        setDeleteMessage({ type: 'success', text: 'Kundendaten erfolgreich aktualisiert.' });
        setTimeout(() => setDeleteMessage({ type: '', text: '' }), 3000);
    };

    const handleDeleteClick = (customer) => {
        setCustomerToDelete(customer);
        setShowConfirmDeleteModal(true);
    };

    const confirmDeleteCustomer = async () => {
        if (!customerToDelete) return;
        setIsLoading(true); // Zeigt generellen Ladezustand während des Löschens
        setShowConfirmDeleteModal(false);
        try {
            await api.delete(`/customers/${customerToDelete.id}`);
            setDeleteMessage({ type: 'success', text: `Kunde "${customerToDelete.firstName} ${customerToDelete.lastName}" erfolgreich gelöscht.` });
            setCustomerToDelete(null);
            setInternalRefreshTrigger(prev => prev + 1); // Löst Neuladen der Kundenliste aus
        } catch (err) {
            console.error("Fehler beim Löschen des Kunden:", err);
            setDeleteMessage({ type: 'error', text: `Fehler beim Löschen: ${err.response?.data?.message || err.message}` });
            setCustomerToDelete(null); // Wichtig, um Modal-State zu bereinigen
        } finally {
            setIsLoading(false);
            setTimeout(() => setDeleteMessage({ type: '', text: '' }), 5000); // Nachricht nach 5s ausblenden
        }
    };

    const filteredCustomers = customers.filter(customer =>
        `${customer.firstName || ''} ${customer.lastName || ''} ${customer.email || ''} ${customer.phoneNumber || ''}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );


    if (isLoading && customers.length === 0 && !error) { // Zeige Loader nur, wenn initial geladen wird und noch keine Daten da sind
        return (
            <div className="loading-message" style={{ textAlign: 'center', padding: '2rem' }}>
                <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                <p style={{ marginTop: '0.5rem' }}>Lade Kundendaten...</p>
            </div>
        );
    }
    return (
        <div className="customer-management-container">
            <h2 className="dashboard-section-heading">
                <FontAwesomeIcon icon={faUsers} /> Kundenverwaltung
            </h2>

            {error && ( // Fehler wird prominent angezeigt, wenn er auftritt
                <p className="form-message error mb-4" style={{ marginBottom: '1rem' }}>
                    <FontAwesomeIcon icon={faExclamationCircle} style={{ marginRight: '0.5rem' }} /> {error}
                </p>
            )}
            {deleteMessage.text && (
                <p className={`form-message ${deleteMessage.type} small mb-3`}>
                    <FontAwesomeIcon icon={deleteMessage.type === 'success' ? faCheckCircle : faExclamationCircle} /> {deleteMessage.text}
                </p>
            )}

            <div className="list-controls-header">
                <div className="search-input-container">
                    <FontAwesomeIcon icon={faSearch} />
                    <input
                        type="text"
                        placeholder="Kunden suchen (Name, E-Mail, Telefon)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-control" // Annahme: eine globale CSS-Klasse für Formular-Inputs
                    />
                </div>
                {/* Optional: Button für "Neuen Kunden hinzufügen" könnte hier platziert werden */}
            </div>

            {isLoading && customers.length > 0 && ( // Zeige Ladeindikator diskret, wenn bereits Daten da sind
                <div style={{ textAlign: 'right', marginBottom: '0.5rem', color: 'var(--medium-grey-text)', fontSize: '0.9rem' }}>
                    <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '0.5rem' }}/> Liste wird aktualisiert...
                </div>
            )}

            {!isLoading && filteredCustomers.length === 0 && !error && (
                <p className="text-center py-4" style={{color: 'var(--medium-grey-text)', padding: '2rem 0' }}>
                    {searchTerm ? 'Keine Kunden für Ihre Suche gefunden.' : 'Es sind keine Kunden vorhanden.'}
                </p>
            )}

            {!isLoading && filteredCustomers.length > 0 && (
                <div className="table-responsive-container"> {/* Für besseres Scrollen auf Mobile */}
                    <table className="app-table customers-table">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>E-Mail</th>
                            <th>Telefon</th>
                            <th>Notizen (Admin)</th>
                            <th>Aktionen</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredCustomers.map(customer => (
                            <tr key={customer.id}>
                                <td data-label="Name:">{customer.firstName} {customer.lastName}</td>
                                <td data-label="E-Mail:">{customer.email}</td>
                                <td data-label="Telefon:">{customer.phoneNumber || '-'}</td>
                                <td data-label="Notizen:" className="notes-cell">
                                    {/* Tooltip für längere Notizen ist gut, kann via title-Attribut realisiert werden */}
                                    {customer.notes ? (
                                        <div title={customer.notes}>
                                            {customer.notes.substring(0, 50)}{customer.notes.length > 50 ? '...' : ''}
                                        </div>
                                    ) : '-'}
                                </td>
                                <td data-label="Aktionen:">
                                    <div className="action-buttons-table"> {/* Klasse für konsistente Button-Abstände */}
                                        <button
                                            onClick={() => handleEditClick(customer)}
                                            className="button-link-outline small-button icon-button"
                                            title="Kunde bearbeiten"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                            <span className="button-text-desktop">Bearbeiten</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(customer)}
                                            className="button-link-outline small-button danger icon-button"
                                            title="Kunde löschen"
                                        >
                                            <FontAwesomeIcon icon={faTrashAlt} />
                                            <span className="button-text-desktop">Löschen</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showEditModal && selectedCustomer && (
                <CustomerEditModal
                    customer={selectedCustomer}
                    onClose={handleCloseEditModal}
                    onCustomerUpdated={handleCustomerUpdated}
                />
            )}

            <ConfirmModal
                isOpen={showConfirmDeleteModal}
                onClose={() => { setShowConfirmDeleteModal(false); setCustomerToDelete(null); }}
                onConfirm={confirmDeleteCustomer}
                title="Kunde löschen"
                message={`Möchten Sie den Kunden "${customerToDelete?.firstName} ${customerToDelete?.lastName}" wirklich endgültig löschen? Dieser Schritt kann nicht rückgängig gemacht werden. Zugehörige Termine verlieren ihre Kundenzuordnung.`}
                confirmText="Ja, löschen"
                cancelText="Abbrechen"
                type="danger"
            />
        </div>
    );
}

export default CustomerManagement;
