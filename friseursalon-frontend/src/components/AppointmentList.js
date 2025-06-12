// friseursalon-frontend/src/components/AppointmentList.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import styles from './AppointmentList.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faSpinner, faExclamationTriangle, faInfoCircle, faTimesCircle, faEdit, faTrashAlt, faStar } from '@fortawesome/free-solid-svg-icons';
import { format, parseISO, isPast } from 'date-fns';
import { de } from 'date-fns/locale';
import AppointmentEditModal from './AppointmentEditModal';
import ConfirmModal from './ConfirmModal';
import TestimonialSubmitModal from './TestimonialSubmitModal'; // Import des neuen Modals

function AppointmentList({ refreshTrigger, onAppointmentAction }) {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedAppointmentForEdit, setSelectedAppointmentForEdit] = useState(null);

    const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState(null);

    const [showTestimonialModal, setShowTestimonialModal] = useState(false);
    const [appointmentToReview, setAppointmentToReview] = useState(null);


    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage('');
        try {
            const response = await api.get('appointments/my-appointments');
            setAppointments(response.data || []);
        } catch (err) {
            console.error("Error fetching appointments:", err);
            setError(err.response?.data?.message || "Termine konnten nicht geladen werden.");
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments, refreshTrigger]);

    const handleEditAppointment = (appointment) => {
        setSelectedAppointmentForEdit(appointment);
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setSelectedAppointmentForEdit(null);
    };

    const handleAppointmentUpdated = () => {
        handleCloseEditModal();
        fetchAppointments();
        setSuccessMessage("Termin erfolgreich aktualisiert.");
        if (onAppointmentAction) onAppointmentAction();
    };

    const confirmCancelAppointment = (appointmentId) => {
        setAppointmentToCancel(appointmentId);
        setShowConfirmCancelModal(true);
    };

    const handleCancelAppointment = async () => {
        if (!appointmentToCancel) return;
        setError(null);
        setSuccessMessage('');
        try {
            await api.delete(`appointments/${appointmentToCancel}`);
            setSuccessMessage("Termin erfolgreich storniert.");
            fetchAppointments();
            if (onAppointmentAction) onAppointmentAction();
        } catch (err) {
            console.error("Error cancelling appointment:", err);
            setError(err.response?.data?.message || "Fehler beim Stornieren des Termins.");
        } finally {
            setShowConfirmCancelModal(false);
            setAppointmentToCancel(null);
        }
    };

    const handleReviewAppointment = (appointment) => {
        setAppointmentToReview(appointment);
        setShowTestimonialModal(true);
    };

    const handleTestimonialSubmitted = () => {
        // Hier könnten wir den Status des Termins lokal aktualisieren, um den "Bewerten"-Button auszublenden,
        // oder einfach die Liste neu laden. Fürs Erste laden wir neu.
        fetchAppointments();
    };

    const formatAppointmentDate = (dateString) => {
        try {
            return format(parseISO(dateString), 'EEEE, dd. MMMM yyyy \'um\' HH:mm \'Uhr\'', { locale: de });
        } catch (e) {
            return "Ungültiges Datum";
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-6 text-gray-500">
                <FontAwesomeIcon icon={faSpinner} spin size="lg" className="mr-2" />
                Lade Ihre Termine...
            </div>
        );
    }

    return (
        <div className={`bg-white p-4 sm:p-6 rounded-lg shadow-md ${styles.appointmentListContainer}`}>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FontAwesomeIcon icon={faCalendarCheck} className="mr-2 text-indigo-600" />
                Meine Termine
            </h3>

            {error && (
                <div className={`p-3 mb-4 text-sm rounded-md flex items-center bg-red-50 text-red-700 border border-red-200 ${styles.message}`}>
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 flex-shrink-0" /> {error}
                </div>
            )}
            {successMessage && (
                <div className={`p-3 mb-4 text-sm rounded-md flex items-center bg-green-50 text-green-600 border border-green-200 ${styles.message}`}>
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2 flex-shrink-0" /> {successMessage}
                </div>
            )}

            {appointments.length === 0 && !error && (
                <div className={`text-center py-6 px-4 bg-slate-50 rounded-md ${styles.noAppointments}`}>
                    <FontAwesomeIcon icon={faInfoCircle} size="lg" className="text-gray-400 mb-2" />
                    <p className="text-gray-600">Sie haben derzeit keine bevorstehenden Termine.</p>
                </div>
            )}

            {appointments.length > 0 && (
                <ul className="space-y-4">
                    {appointments.map(app => (
                        <li key={app.id} className={`p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${styles.appointmentItem} ${styles['status-' + (app.status?.toLowerCase() || 'default')]}`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                <div>
                                    <p className="font-semibold text-md text-indigo-700">{app.service?.name || 'Unbekannter Service'}</p>
                                    <p className="text-sm text-gray-600">{formatAppointmentDate(app.startTime)}</p>
                                    {app.notes && <p className="text-xs text-gray-500 mt-1">Notiz: {app.notes}</p>}
                                </div>
                                <div className="mt-3 sm:mt-0 flex flex-col sm:flex-row items-start sm:items-center sm:space-x-2">
                                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                                        app.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                            app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                app.status === 'CANCELLED' ? 'bg-red-100 text-red-700 line-through' :
                                                    app.status === 'COMPLETED' ? 'bg-gray-100 text-gray-600' :
                                                        'bg-blue-100 text-blue-700'
                                    } ${styles.statusBadge}`}>
                                        {app.status === 'PENDING' ? 'Ausstehend' :
                                            app.status === 'CONFIRMED' ? 'Bestätigt' :
                                                app.status === 'COMPLETED' ? 'Abgeschlossen' :
                                                    app.status === 'CANCELLED' ? 'Storniert' : app.status}
                                    </span>
                                    <div className="mt-2 sm:mt-0 flex space-x-2">
                                        {(app.status === 'PENDING' || (app.status === 'CONFIRMED' && !isPast(parseISO(app.startTime)))) && (
                                            <>
                                                <button onClick={() => handleEditAppointment(app)} className={`p-1.5 text-xs text-indigo-600 hover:text-indigo-800 rounded-md hover:bg-indigo-50 transition-colors ${styles.actionButton}`} title="Termin bearbeiten">
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button onClick={() => confirmCancelAppointment(app.id)} className={`p-1.5 text-xs text-red-500 hover:text-red-700 rounded-md hover:bg-red-50 transition-colors ${styles.actionButton}`} title="Termin stornieren">
                                                    <FontAwesomeIcon icon={faTrashAlt} />
                                                </button>
                                            </>
                                        )}
                                        {app.status === 'COMPLETED' && (
                                            <button onClick={() => handleReviewAppointment(app)} className={`inline-flex items-center px-3 py-1.5 border border-amber-500 text-xs font-medium rounded-md text-amber-700 bg-amber-100 hover:bg-amber-200 ${styles.actionButton}`} title="Bewertung abgeben">
                                                <FontAwesomeIcon icon={faStar} className="mr-1.5" />
                                                Bewerten
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            {showEditModal && selectedAppointmentForEdit && (
                <AppointmentEditModal
                    isOpen={showEditModal}
                    onClose={handleCloseEditModal}
                    onSave={handleAppointmentUpdated}
                    appointmentData={selectedAppointmentForEdit}
                    adminView={false}
                />
            )}

            {showConfirmCancelModal && (
                <ConfirmModal
                    isOpen={showConfirmCancelModal}
                    onClose={() => setShowConfirmCancelModal(false)}
                    onConfirm={handleCancelAppointment}
                    title="Termin stornieren"
                    message="Möchten Sie diesen Termin wirklich stornieren? Diese Aktion kann nicht rückgängig gemacht werden."
                    confirmButtonText="Ja, stornieren"
                    icon={faTimesCircle}
                    iconColorClass="text-red-500"
                />
            )}

            {showTestimonialModal && appointmentToReview && (
                <TestimonialSubmitModal
                    isOpen={showTestimonialModal}
                    onClose={() => setShowTestimonialModal(false)}
                    onSubmitted={handleTestimonialSubmitted}
                    appointment={appointmentToReview}
                />
            )}
        </div>
    );
}

export default AppointmentList;