// src/components/CustomerManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import CustomerEditModal from './CustomerEditModal';
import ConfirmModal from './ConfirmModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faSpinner, faUsers, faPlusCircle, faExclamationCircle, faSearch } from '@fortawesome/free-solid-svg-icons';

function CustomerManagement({ currentUser }) {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);

    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchCustomers = useCallback(async () => {
        console.log('[CustomerManagement] fetchCustomers aufgerufen. currentUser:', currentUser);
        if (!currentUser || !currentUser.roles?.includes("ROLE_ADMIN")) {
            console.warn('[CustomerManagement] fetchCustomers: Kein Admin-Benutzer oder keine Rollen vorhanden.');
            setError("Zugriff verweigert oder Benutzerdaten unvollständig.");
            setIsLoading(false);
            setCustomers([]);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            console.log('[CustomerManagement] Rufe /api/customers auf...');
            const response = await api.get('/customers');
            console.log('[CustomerManagement] Antwort von /api/customers:', response);
            if (response && response.data) {
                setCustomers(Array.isArray(response.data) ? response.data : []);
                if (!Array.isArray(response.data)) {
                    console.warn('[CustomerManagement] Backend hat kein Array zurückgegeben für /customers:', response.data);
                    setError("Unerwartetes Datenformat vom Server erhalten.");
                }
            } else {
                console.warn('[CustomerManagement] Keine Daten in der Antwort von /api/customers.');
                setCustomers([]);
                setError("Keine Kundendaten vom Server erhalten.");
            }
        } catch (err) {
            console.error("[CustomerManagement] Fehler beim Abrufen der Kunden:", err.response || err);
            setError(`Kunden konnten nicht geladen werden: ${err.response?.data?.message || err.message || 'Unbekannter Fehler'}`);
            setCustomers([]);
        } finally {
            setIsLoading(false);
            console.log('[CustomerManagement] fetchCustomers abgeschlossen.');
        }
    }, [currentUser]);

    useEffect(() => {
        console.log('[CustomerManagement] useEffect für fetchCustomers getriggert. refreshTrigger:', refreshTrigger);
        fetchCustomers();
    }, [fetchCustomers, refreshTrigger]);

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
        setRefreshTrigger(prev => prev + 1);
    };

    const handleDeleteClick = (customer) => {
        setCustomerToDelete(customer);
        setShowConfirmDeleteModal(true);
    };

    const confirmDeleteCustomer = async () => {
        if (!customerToDelete) return;

        try {
            await api.delete(`/customers/${customerToDelete.id}`);
            setCustomerToDelete(null);
            setShowConfirmDeleteModal(false);
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            console.error("Fehler beim Löschen des Kunden:", err);
            setError("Fehler beim Löschen des Kunden: " + (err.response?.data?.message || err.message));
            setShowConfirmDeleteModal(false);
        }
    };

    const filteredCustomers = customers.filter(customer =>
        `${customer.firstName || ''} ${customer.lastName || ''} ${customer.email || ''} ${customer.phoneNumber || ''}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    if (!currentUser || !currentUser.roles?.includes("ROLE_ADMIN")) {
        if (!error) setError("Keine Berechtigung, Kundendaten anzuzeigen.");
    }

    console.log(`[CustomerManagement] Render: isLoading=${isLoading}, customers.length=${customers.length}, filteredCustomers.length=${filteredCustomers.length}, error=${error}`);

    if (isLoading && customers.length === 0) {
        return (
            <div className="loading-message" style={{ textAlign: 'center', padding: '2rem' }}>
                <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                <p style={{ marginTop: '0.5rem' }}>Lade Kundendaten...</p>
            </div>
        );
    }

    return (
        <div className="customer-management-container" style={{ padding: '1rem 0' }}>
            {error && !isLoading && (
                <p className="form-message error mb-4" style={{ marginBottom: '1rem' }}>
                    <FontAwesomeIcon icon={faExclamationCircle} style={{ marginRight: '0.5rem' }} /> {error}
                </p>
            )}

            <div className="list-controls-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div className="search-input-container" style={{ position: 'relative', flexGrow: 1, maxWidth: '450px' }}>
                    <FontAwesomeIcon icon={faSearch} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--medium-grey-text)', fontSize: '0.9rem' }} />
                    <input
                        type="text"
                        placeholder="Kunden suchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-control"
                        style={{ paddingLeft: '2.5rem', width: '100%' }}
                    />
                </div>
            </div>

            {isLoading && customers.length > 0 && (
                <div style={{ textAlign: 'right', marginBottom: '0.5rem', color: 'var(--medium-grey-text)', fontSize: '0.9rem' }}>
                    <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: '0.5rem' }}/> Liste wird aktualisiert...
                </div>
            )}

            {!isLoading && filteredCustomers.length === 0 && !error ? (
                <p className="text-center py-4" style={{color: 'var(--medium-grey-text)', padding: '2rem 0' }}>
                    {searchTerm ? 'Keine Kunden für Ihre Suche gefunden.' : 'Es sind keine Kunden vorhanden.'}
                </p>
            ) : null}

            {!isLoading && filteredCustomers.length > 0 && (
                <div className="table-responsive-container">
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
                        {filteredCustomers.map(customer => {
                            // NEUER LOG: Überprüfe das customer-Objekt
                            console.log('[CustomerManagement] Rendering customer in table:', customer);
                            return (
                                <tr key={customer.id}>
                                    <td data-label="Name:">{customer.firstName} {customer.lastName}</td>
                                    <td data-label="E-Mail:">{customer.email}</td>
                                    <td data-label="Telefon:">{customer.phoneNumber || '-'}</td>
                                    <td data-label="Notizen:" className="notes-cell">
                                        {customer.notes ? (
                                            <div title={customer.notes}>
                                                {customer.notes.substring(0, 50)}{customer.notes.length > 50 ? '...' : ''}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td data-label="Aktionen:">
                                        <div className="action-buttons-table">
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
                            );
                        })}
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

            {showConfirmDeleteModal && customerToDelete && (
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
            )}
        </div>
    );
}

export default CustomerManagement;
