// friseursalon-frontend/src/components/AppointmentList.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import AuthService from '../services/auth.service';
import { Link } from 'react-router-dom';
import styles from './AppointmentList.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faCalendarPlus, faSpinner, faExclamationTriangle, faInfoCircle, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import AppointmentEditModal from './AppointmentEditModal';
import AppointmentCreateModal from './AppointmentCreateModal';
import ConfirmModal from './ConfirmModal';

function AppointmentList({ adminView = false, refreshAppointmentsList, onAppointmentAdded, currentUser }) { // currentUser als Prop hinzugefügt
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [appointmentToDelete, setAppointmentToDelete] = useState(null);

    // const localCurrentUser = AuthService.getCurrentUser(); // Besser currentUser als Prop verwenden
    console.log(`AppointmentList rendered. adminView: ${adminView}, currentUser ID: ${currentUser?.id}`);


    const fetchAppointments = useCallback(async () => {
        console.log(`fetchAppointments called. adminView: ${adminView}, currentUser ID: ${currentUser?.id}`); // DEBUG
        setLoading(true);
        setError(null);
        setSuccessMessage('');
        try {
            let response;
            if (adminView) {
                response = await api.get('/api/appointments/admin/all');
            } else if (currentUser && currentUser.id) { // Sicherstellen, dass currentUser und ID existieren
                response = await api.get(`/api/appointments/user/${currentUser.id}`);
            } else {
                setError("Benutzer nicht angemeldet oder ID fehlt.");
                setAppointments([]);
                setLoading(false);
                return;
            }
            setAppointments(response.data || []);
        } catch (err) {
            console.error("Error fetching appointments:", err);
            setError(err.response?.data?.message || "Termine konnten nicht geladen werden.");
            setAppointments([]);
        } finally {
            setLoading(false);
        }
        // Abhängigkeit von currentUser.id statt dem ganzen Objekt
    }, [adminView, currentUser?.id]);

    useEffect(() => {
        console.log("AppointmentList useEffect for fetchAppointments triggered."); // DEBUG
        if (adminView || (currentUser && currentUser.id)) { // Nur fetchen, wenn User vorhanden ist (für User-Ansicht)
            fetchAppointments();
        } else if (!adminView && !currentUser) {
            setError("Bitte melden Sie sich an, um Ihre Termine zu sehen.");
            setLoading(false);
            setAppointments([]);
        }
    }, [fetchAppointments, refreshAppointmentsList, adminView, currentUser?.id]); // currentUser.id auch hier

    const handleEdit = (appointment) => {
        setSelectedAppointment(appointment);
        setShowEditModal(true);
    };

    const handleCreate = () => {
        setSelectedAppointment(null);
        setShowCreateModal(true);
    };

    const confirmDelete = (appointmentId) => {
        setAppointmentToDelete(appointmentId);
        setShowConfirmDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!appointmentToDelete) return;
        setLoading(true);
        setError(null);
        setSuccessMessage('');
        try {
            await api.delete(`/api/appointments/${appointmentToDelete}`);
            setSuccessMessage("Termin erfolgreich storniert/gelöscht.");
            fetchAppointments();
            if (typeof onAppointmentAdded === 'function') {
                onAppointmentAdded();
            }
        } catch (err) {
            console.error("Error deleting appointment:", err);
            setError(err.response?.data?.message || "Fehler beim Löschen des Termins.");
        } finally {
            setLoading(false);
            setShowConfirmDeleteModal(false);
            setAppointmentToDelete(null);
        }
    };

    const handleModalClose = () => {
        setShowEditModal(false);
        setShowCreateModal(false);
        setSelectedAppointment(null);
    };

    const handleModalSave = () => {
        handleModalClose();
        fetchAppointments();
        if (typeof onAppointmentAdded === 'function') {
            onAppointmentAdded();
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleString('de-DE', options);
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-green-100 text-green-700'; // Dunklerer Text für besseren Kontrast
            case 'PENDING': return 'bg-yellow-100 text-yellow-700';
            case 'CANCELLED': return 'bg-red-100 text-red-700';
            case 'COMPLETED': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };


    if (loading && appointments.length === 0) {
        return (
            <div className="flex justify-center items-center p-10 text-gray-600">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-indigo-500" />
                <p className="ml-3 text-md">Lade Termine...</p>
            </div>
        );
    }

    return (
        <div className={`w-full bg-white p-4 sm:p-6 rounded-lg shadow-md ${styles.appointmentListContainer}`}>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-700 font-serif"> {/* Kleinere Überschrift für Konsistenz im Dashboard */}
                    {adminView ? "Terminübersicht (Admin)" : "Meine Termine"}
                </h3>
                {adminView && (
                    <button
                        onClick={handleCreate}
                        className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <FontAwesomeIcon icon={faCalendarPlus} className="mr-2" />
                        Neuen Termin anlegen
                    </button>
                )}
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

            {appointments.length === 0 && !loading && !error && (
                <div className={`text-center py-8 px-6 bg-slate-50 rounded-lg ${styles.noAppointments}`}>
                    <FontAwesomeIcon icon={faInfoCircle} size="2x" className="text-gray-400 mb-3" />
                    <p className="text-gray-500 text-md">
                        {adminView ? "Es sind aktuell keine Termine im System vorhanden." : "Sie haben aktuell keine bevorstehenden Termine."}
                    </p>
                    {!adminView && (
                        <Link
                            to="/#services-dynamic"
                            className="mt-5 inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <FontAwesomeIcon icon={faCalendarPlus} className="-ml-1 mr-2 h-4 w-4" />
                            Jetzt Termin buchen
                        </Link>
                    )}
                </div>
            )}

            {appointments.length > 0 && (
                <div className={`overflow-x-auto shadow rounded-lg ${styles.tableContainer}`}>
                    <table className={`min-w-full divide-y divide-gray-200 ${styles.appTable}`}>
                        <thead className="bg-slate-50"> {/* Hellerer Tabellenkopf */}
                        <tr>
                            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum & Zeit</th>
                            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dienstleistung</th>
                            {adminView && <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kunde</th>}
                            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preis</th>
                            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="relative px-5 py-3">
                                <span className="sr-only">Aktionen</span>
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {appointments.map((appointment) => (
                            <tr key={appointment.id} className={`hover:bg-slate-50 transition-colors duration-150 ${styles.tableRow}`}>
                                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(appointment.appointmentTime)}</td>
                                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{appointment.serviceName}</td>
                                {adminView && <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{appointment.customerName || (appointment.customer ? appointment.customer.name : 'N/A')}</td>}
                                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {typeof appointment.price === 'number' ? `${appointment.price.toFixed(2)} €` : 'N/A'}
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(appointment.status)} ${styles.statusBadge}`}>
                                            {appointment.status || 'UNBEKANNT'}
                                        </span>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1.5">
                                    <button onClick={() => handleEdit(appointment)} className={`text-indigo-600 hover:text-indigo-800 p-1.5 rounded-md hover:bg-indigo-50 transition-colors ${styles.actionButton}`} title="Bearbeiten">
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    {(adminView || appointment.status !== 'CANCELLED') && (
                                        <button onClick={() => confirmDelete(appointment.id)} className={`text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors ${styles.actionButton}`} title={adminView ? "Löschen" : "Stornieren"}>
                                            <FontAwesomeIcon icon={faTrashAlt} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showEditModal && selectedAppointment && (
                <AppointmentEditModal
                    isOpen={showEditModal}
                    onClose={handleModalClose}
                    onSave={handleModalSave}
                    appointmentData={selectedAppointment}
                    adminView={adminView}
                />
            )}
            {showCreateModal && (
                <AppointmentCreateModal
                    isOpen={showCreateModal}
                    onClose={handleModalClose}
                    onSave={handleModalSave}
                />
            )}
            {showConfirmDeleteModal && (
                <ConfirmModal
                    isOpen={showConfirmDeleteModal}
                    onClose={() => setShowConfirmDeleteModal(false)}
                    onConfirm={handleDelete}
                    title="Termin löschen"
                    message={`Möchten Sie diesen Termin wirklich ${adminView ? 'löschen' : 'stornieren'}? Diese Aktion kann nicht rückgängig gemacht werden.`}
                    confirmButtonText={adminView ? "Ja, löschen" : "Ja, stornieren"}
                    isLoading={loading}
                />
            )}
        </div>
    );
}

export default AppointmentList;
