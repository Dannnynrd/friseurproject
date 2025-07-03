// friseursalon-frontend/src/components/AppointmentList.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import styles from './AppointmentList.module.css'; // Wir verwenden das neue CSS-Modul
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarCheck, faSpinner, faExclamationTriangle, faInfoCircle,
    faStar, faCut, faClock, faEuro, faEdit, faTrashAlt, faCheckCircle // KORREKTUR: HIER HINZUGEFÜGT
} from '@fortawesome/free-solid-svg-icons';
import { format, parseISO, isPast, isFuture } from 'date-fns';
import { de } from 'date-fns/locale';
import AppointmentEditModal from './AppointmentEditModal';
import ConfirmModal from './ConfirmModal';
import TestimonialSubmitModal from './TestimonialSubmitModal';

// Hilfsfunktion zur Formatierung des Datums und der Zeit
const formatAppointmentDate = (dateString) => {
    try {
        const date = parseISO(dateString);
        return {
            day: format(date, 'dd', { locale: de }),
            month: format(date, 'MMM', { locale: de }),
            time: format(date, 'HH:mm', { locale: de }),
            full: format(date, 'EEEE, dd. MMMM yyyy \'um\' HH:mm \'Uhr\'', { locale: de })
        };
    } catch (e) {
        return { day: '?', month: '???', time: '??:??' };
    }
};

// Die Hauptkomponente
function AppointmentList({ refreshTrigger, onAppointmentAction }) {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // State-Hooks für die Modals bleiben gleich
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
            // Termine sortieren: Zukünftige zuerst, dann vergangene
            const sortedAppointments = (response.data || []).sort((a, b) =>
                isFuture(parseISO(a.startTime)) && isPast(parseISO(b.startTime)) ? -1 :
                    isPast(parseISO(a.startTime)) && isFuture(parseISO(b.startTime)) ? 1 :
                        new Date(b.startTime) - new Date(a.startTime) // Neueste zuerst
            );
            setAppointments(sortedAppointments);
        } catch (err) {
            setError(err.response?.data?.message || "Termine konnten nicht geladen werden.");
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments, refreshTrigger]);

    // Handler-Funktionen bleiben unverändert
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
        try {
            await api.delete(`appointments/${appointmentToCancel}`);
            setSuccessMessage("Termin erfolgreich storniert.");
            fetchAppointments();
            if (onAppointmentAction) onAppointmentAction();
        } catch (err) {
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
        fetchAppointments();
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center p-10 text-gray-500">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-indigo-500" />
                <p className="ml-3 text-md">Lade deine Termine...</p>
            </div>
        );
    }

    return (
        <div className={styles.appointmentListPage}>
            {error && (
                <div className={`${styles.message} ${styles.error}`}>
                    <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
                </div>
            )}
            {successMessage && (
                <div className={`${styles.message} ${styles.success}`}>
                    <FontAwesomeIcon icon={faCheckCircle} /> {successMessage}
                </div>
            )}

            {appointments.length === 0 && !error ? (
                <div className={styles.noAppointments}>
                    <FontAwesomeIcon icon={faCalendarCheck} size="3x" className="text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700">Keine Termine gefunden</h3>
                    <p className="text-gray-500 mt-2">Sie haben noch keine Termine gebucht.</p>
                </div>
            ) : (
                <div className={styles.appointmentsGrid}>
                    {appointments.map(app => {
                        const formattedDate = formatAppointmentDate(app.startTime);
                        const isUpcoming = isFuture(parseISO(app.startTime));

                        return (
                            <div key={app.id} className={`${styles.appointmentCard} ${isUpcoming ? styles.upcoming : styles.past}`}>
                                <div className={styles.cardDate}>
                                    <span className={styles.dateDay}>{formattedDate.day}</span>
                                    <span className={styles.dateMonth}>{formattedDate.month}</span>
                                </div>
                                <div className={styles.cardDetails}>
                                    <span className={styles.cardTime}>{formattedDate.time} Uhr</span>
                                    <h4 className={styles.cardService}>{app.service?.name || 'Unbekannter Service'}</h4>
                                    <div className={styles.cardMeta}>
                                        <span><FontAwesomeIcon icon={faClock} /> {app.service?.durationMinutes || '?'} min</span>
                                        <span><FontAwesomeIcon icon={faEuro} /> {app.service?.price?.toFixed(2) || '?.??'}</span>
                                    </div>
                                </div>
                                <div className={styles.cardActions}>
                                    {isUpcoming && (
                                        <>
                                            <button onClick={() => handleEditAppointment(app)} className={`${styles.actionButton} ${styles.editButton}`} title="Bearbeiten">
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                            <button onClick={() => confirmCancelAppointment(app.id)} className={`${styles.actionButton} ${styles.cancelButton}`} title="Stornieren">
                                                <FontAwesomeIcon icon={faTrashAlt} />
                                            </button>
                                        </>
                                    )}
                                    {app.status === 'COMPLETED' && (
                                        <button onClick={() => handleReviewAppointment(app)} className={`${styles.actionButton} ${styles.reviewButton}`} title="Bewerten">
                                            <FontAwesomeIcon icon={faStar} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Die Modals bleiben unverändert */}
            {showEditModal && selectedAppointmentForEdit && (
                <AppointmentEditModal
                    isOpen={showEditModal}
                    onClose={handleCloseEditModal}
                    onSave={handleAppointmentUpdated}
                    appointmentData={selectedAppointmentForEdit}
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