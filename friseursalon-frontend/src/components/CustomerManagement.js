// friseursalon-frontend/src/components/CustomerManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
// HIER den Import ändern:
import styles from './CustomerManagement.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUserEdit, faTrashAlt, faSpinner, faExclamationTriangle, faCheckCircle, faSearch, faTimes, faPlus, faEnvelope, faPhone, faUserSlash } from '@fortawesome/free-solid-svg-icons';

// Annahme: Diese Modale existieren und sind gestylt/werden separat migriert
import CustomerEditModal from './CustomerEditModal'; // Für Bearbeiten und Neuanlage
import ConfirmModal from './ConfirmModal';

function CustomerManagement() {
    const [customers, setCustomers] = useState([]);
    const [allCustomers, setAllCustomers] = useState([]); // Für Filterung
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [showEditModal, setShowEditModal] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState(null);

    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage('');
        try {
            // Annahme: Admin-Endpunkt zum Abrufen aller Kunden (nicht nur User, sondern alle erfassten Kunden)
            const response = await api.get('/api/customers');
            const sortedCustomers = (response.data || []).sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
            setCustomers(sortedCustomers);
            setAllCustomers(sortedCustomers); // Kopie für Filterung
        } catch (err) {
            console.error("Error fetching customers:", err);
            setError(err.response?.data?.message || "Kunden konnten nicht geladen werden.");
            setCustomers([]);
            setAllCustomers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    useEffect(() => {
        if (searchTerm === '') {
            setCustomers(allCustomers);
        } else {
            const filtered = allCustomers.filter(customer =>
                (customer.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (customer.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (customer.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (customer.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            );
            setCustomers(filtered);
        }
    }, [searchTerm, allCustomers]);

    const handleEdit = (customer) => {
        setCustomerToEdit(customer);
        setShowEditModal(true);
    };

    const handleCreateNew = () => {
        setCustomerToEdit(null); // Für Neuanlage
        setShowEditModal(true);
    };

    const confirmDelete = (customerId) => {
        setCustomerToDelete(customerId);
        setShowConfirmDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!customerToDelete) return;
        setError(null);
        setSuccessMessage('');
        try {
            // Annahme: Admin-Endpunkt zum Löschen eines Kunden
            await api.delete(`/api/customers/${customerToDelete}`);
            setSuccessMessage("Kunde erfolgreich gelöscht.");
            fetchCustomers(); // Liste neu laden
        } catch (err) {
            console.error("Error deleting customer:", err);
            setError(err.response?.data?.message || "Fehler beim Löschen des Kunden.");
        } finally {
            setShowConfirmDeleteModal(false);
            setCustomerToDelete(null);
        }
    };

    const handleModalClose = () => {
        setShowEditModal(false);
        setCustomerToEdit(null);
    };

    const handleModalSave = () => {
        handleModalClose();
        fetchCustomers(); // Liste neu laden nach Speichern
        setSuccessMessage(customerToEdit ? "Kundendaten erfolgreich aktualisiert." : "Kunde erfolgreich erstellt.");
    };

    if (loading && customers.length === 0) {
        return (
            <div className="flex justify-center items-center p-10 text-gray-600">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-indigo-500" />
                <p className="ml-3 text-md">Lade Kundendaten...</p>
            </div>
        );
    }

    return (
        <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-lg ${styles.customerManagementContainer}`}>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 font-serif">
                    Kundenverwaltung
                </h2>
                <button
                    onClick={handleCreateNew}
                    className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-2" />
                    Neuen Kunden anlegen
                </button>
            </div>

            {/* Suchfeld */}
            <div className="mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Kunden suchen (Name, E-Mail, Telefon)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            aria-label="Suche zurücksetzen"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    )}
                </div>
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

            {customers.length === 0 && !loading && !error && (
                <div className={`text-center py-8 px-6 bg-slate-50 rounded-lg ${styles.noCustomers}`}>
                    <FontAwesomeIcon icon={faUsers} size="2x" className="text-gray-400 mb-3" />
                    <p className="text-gray-500 text-md">
                        {searchTerm ? "Keine Kunden entsprechen Ihrer Suche." : "Es sind keine Kunden vorhanden."}
                    </p>
                </div>
            )}

            {customers.length > 0 && (
                <div className={`overflow-x-auto shadow rounded-lg ${styles.tableContainer}`}>
                    <table className={`min-w-full divide-y divide-gray-200 ${styles.appTable}`}>
                        <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">E-Mail</th>
                            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Telefon</th>
                            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Registriert am</th>
                            <th scope="col" className="relative px-5 py-3">
                                <span className="sr-only">Aktionen</span>
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {customers.map((customer) => (
                            <tr key={customer.id} className={`hover:bg-slate-50 transition-colors duration-150 ${styles.tableRow}`}>
                                <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                                    {customer.firstName || ''} {customer.lastName || ''}
                                    {!customer.firstName && !customer.lastName && (customer.user ? customer.user.username : 'N/A')}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                                    {customer.email || (customer.user ? customer.user.email : '-')}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 hidden sm:table-cell">
                                    {customer.phone || '-'}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                                    {customer.user?.createdAt ? new Date(customer.user.createdAt).toLocaleDateString('de-DE') : '-'}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1.5">
                                    <button onClick={() => handleEdit(customer)} className={`text-indigo-600 hover:text-indigo-800 p-1.5 rounded-md hover:bg-indigo-50 transition-colors ${styles.actionButton}`} title="Bearbeiten">
                                        <FontAwesomeIcon icon={faUserEdit} />
                                    </button>
                                    {/* Deaktivieren-Button statt Löschen, falls Soft-Delete gewünscht */}
                                    <button onClick={() => confirmDelete(customer.id)} className={`text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors ${styles.actionButton}`} title="Kunden löschen">
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
                <CustomerEditModal // Annahme: Dieses Modal existiert
                    isOpen={showEditModal}
                    onClose={handleModalClose}
                    onSave={handleModalSave}
                    customerData={customerToEdit} // Ist null für "Neu erstellen"
                />
            )}
            {showConfirmDeleteModal && (
                <ConfirmModal
                    isOpen={showConfirmDeleteModal}
                    onClose={() => setShowConfirmDeleteModal(false)}
                    onConfirm={handleDelete}
                    title="Kunden löschen"
                    message="Möchten Sie diesen Kunden wirklich endgültig löschen? Alle zugehörigen Daten (inkl. Termine) könnten ebenfalls betroffen sein. Diese Aktion kann nicht rückgängig gemacht werden."
                    confirmButtonText="Ja, löschen"
                    // isLoading={loading} // Ein spezifischer Ladezustand für den Lösch-Button wäre besser
                />
            )}
        </div>
    );
}

export default CustomerManagement;
