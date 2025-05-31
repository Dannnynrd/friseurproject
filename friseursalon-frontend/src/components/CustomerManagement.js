// friseursalon-frontend/src/components/CustomerManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import styles from './CustomerManagement.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUserPlus, faEdit, faTrashAlt, faSpinner, faExclamationTriangle, faCheckCircle, faSearch, faTimes, faSort, faSortUp, faSortDown, faEnvelope, faPhone, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import CustomerEditModal from './CustomerEditModal';
import ConfirmModal from './ConfirmModal';

const ROWS_PER_PAGE = 10;

function CustomerManagement({ refreshTrigger, onCustomerAction }) {
    const [customers, setCustomers] = useState([]);
    const [allCustomers, setAllCustomers] = useState([]); // Für clientseitige Filterung/Sortierung
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [showEditModal, setShowEditModal] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState(null);

    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'lastName', direction: 'ascending' });

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            // KORREKTUR: Relativer Pfad
            const response = await api.get('customers');
            const fetchedCustomers = response.data || [];
            setAllCustomers(fetchedCustomers); // Store all for filtering
            setCustomers(fetchedCustomers); // Initially display all
        } catch (err) {
            console.error("Error fetching customers:", err);
            setError(err.response?.data?.message || "Kunden konnten nicht geladen werden.");
            setAllCustomers([]);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers, refreshTrigger]);

    useEffect(() => {
        let filtered = [...allCustomers];
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(customer =>
                (customer.firstName?.toLowerCase() || '').includes(lowerSearchTerm) ||
                (customer.lastName?.toLowerCase() || '').includes(lowerSearchTerm) ||
                (customer.email?.toLowerCase() || '').includes(lowerSearchTerm) ||
                (customer.phoneNumber?.toLowerCase() || '').includes(lowerSearchTerm)
            );
        }

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let valA = a[sortConfig.key];
                let valB = b[sortConfig.key];

                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();

                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        setCustomers(filtered);
        setCurrentPage(1); // Reset to first page on filter/sort change
    }, [searchTerm, sortConfig, allCustomers]);


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

    const handleDeleteCustomer = async () => {
        if (!customerToDelete) return;
        setError('');
        setSuccessMessage('');
        try {
            // KORREKTUR: Relativer Pfad
            await api.delete(`customers/${customerToDelete}`);
            setSuccessMessage("Kunde erfolgreich gelöscht.");
            fetchCustomers(); // Liste neu laden
            if (typeof onCustomerAction === 'function') {
                onCustomerAction();
            }
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
        fetchCustomers();
        setSuccessMessage(customerToEdit ? "Kundendaten erfolgreich aktualisiert." : "Kunde erfolgreich erstellt.");
        if (typeof onCustomerAction === 'function') {
            onCustomerAction();
        }
    };

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return faSort;
        return sortConfig.direction === 'ascending' ? faSortUp : faSortDown;
    };

    const paginatedCustomers = customers.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);
    const totalPages = Math.ceil(customers.length / ROWS_PER_PAGE);


    if (loading && allCustomers.length === 0) {
        return (
            <div className="flex justify-center items-center p-10 text-gray-600">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-indigo-500" />
                <p className="ml-3 text-md">Lade Kunden...</p>
            </div>
        );
    }

    return (
        <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-lg ${styles.customerManagementContainer}`}>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 font-serif flex items-center">
                    <FontAwesomeIcon icon={faUsers} className="mr-3 text-indigo-500" />
                    Kundenverwaltung
                </h2>
                <button
                    onClick={handleCreateNew}
                    className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                    Neuen Kunden anlegen
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

            <div className={`mb-4 relative ${styles.searchBarContainer}`}>
                <FontAwesomeIcon icon={faSearch} className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${styles.searchIcon}`} />
                <input
                    type="text"
                    placeholder="Kunden suchen (Name, E-Mail, Telefon)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.searchInput}`}
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${styles.clearSearchButton}`} aria-label="Suche zurücksetzen">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                )}
            </div>


            {customers.length === 0 && !loading && !error && (
                <div className={`text-center py-8 px-6 bg-slate-50 rounded-lg ${styles.noCustomers}`}>
                    <FontAwesomeIcon icon={faUserCircle} size="2x" className="text-gray-400 mb-3" />
                    <p className="text-gray-500 text-md">
                        {searchTerm ? "Keine Kunden entsprechen Ihrer Suche." : "Es sind keine Kunden vorhanden."}
                    </p>
                </div>
            )}

            {customers.length > 0 && (
                <>
                    <div className={`overflow-x-auto shadow rounded-lg ${styles.tableContainer}`}>
                        <table className={`min-w-full divide-y divide-gray-200 ${styles.appTable}`}>
                            <thead className="bg-slate-50">
                            <tr>
                                {['firstName', 'lastName', 'email', 'phoneNumber'].map(key => (
                                    <th key={key} scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100" onClick={() => requestSort(key)}>
                                        {key === 'firstName' ? 'Vorname' : key === 'lastName' ? 'Nachname' : key === 'email' ? 'E-Mail' : 'Telefon'}
                                        <FontAwesomeIcon icon={getSortIcon(key)} className="ml-1.5 h-3 w-3" />
                                    </th>
                                ))}
                                <th scope="col" className="relative px-5 py-3"><span className="sr-only">Aktionen</span></th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedCustomers.map((customer) => (
                                <tr key={customer.id} className={`hover:bg-slate-50 transition-colors duration-150 ${styles.tableRow}`}>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-700">{customer.firstName || '-'}</td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-800">{customer.lastName || '-'}</td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {customer.email ? <a href={`mailto:${customer.email}`} className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center"><FontAwesomeIcon icon={faEnvelope} className="mr-1.5 text-gray-400"/>{customer.email}</a> : '-'}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {customer.phoneNumber ? <a href={`tel:${customer.phoneNumber}`} className="text-gray-600 hover:text-indigo-700 flex items-center"><FontAwesomeIcon icon={faPhone} className="mr-1.5 text-gray-400"/>{customer.phoneNumber}</a> : '-'}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1.5">
                                        <button onClick={() => handleEdit(customer)} className={`text-indigo-600 hover:text-indigo-800 p-1.5 rounded-md hover:bg-indigo-50 transition-colors ${styles.actionButton}`} title="Bearbeiten">
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button onClick={() => confirmDelete(customer.id)} className={`text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors ${styles.actionButton}`} title="Löschen">
                                            <FontAwesomeIcon icon={faTrashAlt} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <nav className={`mt-5 flex items-center justify-between border-t border-gray-200 px-2 py-3 ${styles.paginationControls}`} aria-label="Pagination">
                            <div className="hidden sm:block">
                                <p className="text-sm text-gray-700">
                                    Seite <span className="font-medium">{currentPage}</span> von <span className="font-medium">{totalPages}</span> ({customers.length} Kunden gesamt)
                                </p>
                            </div>
                            <div className="flex-1 flex justify-between sm:justify-end">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Vorherige
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="ml-2 relative inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Nächste
                                </button>
                            </div>
                        </nav>
                    )}
                </>
            )}

            {showEditModal && (
                <CustomerEditModal
                    isOpen={showEditModal}
                    onClose={handleModalClose}
                    onSave={handleModalSave}
                    customerData={customerToEdit}
                />
            )}
            {showConfirmDeleteModal && (
                <ConfirmModal
                    isOpen={showConfirmDeleteModal}
                    onClose={() => setShowConfirmDeleteModal(false)}
                    onConfirm={handleDeleteCustomer}
                    title="Kunden löschen"
                    message="Möchten Sie diesen Kunden wirklich endgültig löschen? Alle zugehörigen Termine und Daten könnten ebenfalls betroffen sein. Diese Aktion kann nicht rückgängig gemacht werden."
                    confirmButtonText="Ja, löschen"
                />
            )}
        </div>
    );
}

export default CustomerManagement;
