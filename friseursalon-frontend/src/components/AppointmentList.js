import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import AppointmentEditModal from './AppointmentEditModal';
import ConfirmModal from './ConfirmModal'; // NEU: Importieren
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faCalendarDay, faClock, faSpinner, faFilter, faBan } from '@fortawesome/free-solid-svg-icons'; // faBan für Stornieren

function AppointmentList({ refreshTrigger, currentUser }) {
    const [allAppointments, setAllAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [error, setError] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');

    // NEU: State für das Bestätigungsmodal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState(null);


    const fetchAppointments = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('appointments');
            let fetchedAppointments = response.data || [];

            if (currentUser && currentUser.roles && !currentUser.roles.includes("ROLE_ADMIN")) {
                fetchedAppointments = fetchedAppointments.filter(app => app.customer && app.customer.email === currentUser.email);
            }

            const sortedAppointments = fetchedAppointments.sort((a, b) =>
                new Date(b.startTime) - new Date(a.startTime)
            );
            setAllAppointments(sortedAppointments);
        } catch (err) {
            console.error("Fehler beim Abrufen der Termine:", err);
            setError("Termine konnten nicht geladen werden. Bitte versuchen Sie es später erneut.");
            setAllAppointments([]);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments, refreshTrigger]);

    useEffect(() => {
        let currentFiltered = [...allAppointments];
        if (activeFilter === 'upcoming') {
            currentFiltered = allAppointments.filter(app => !isPast(app.startTime));
        } else if (activeFilter === 'past') {
            currentFiltered = allAppointments.filter(app => isPast(app.startTime));
        }
        setFilteredAppointments(currentFiltered);
    }, [allAppointments, activeFilter]);

    // NEU: Handler für Klick auf "Stornieren"-Button
    const handleCancelClick = (appointment) => {
        setAppointmentToCancel(appointment);
        setShowConfirmModal(true);
    };

    // NEU: Handler für Bestätigung im Modal
    const confirmCancelAppointment = async () => {
        if (!appointmentToCancel) return;
        setIsLoading(true);
        setShowConfirmModal(false);
        try {
            await api.delete(`appointments/${appointmentToCancel.id}`);
            setAppointmentToCancel(null); // Zurücksetzen
            fetchAppointments(); // Liste neu laden
        } catch (err) {
            console.error("Fehler beim Stornieren des Termins:", err);
            setError("Fehler beim Stornieren des Termins.");
            setIsLoading(false);
            setAppointmentToCancel(null); // Auch im Fehlerfall zurücksetzen
        }
    };


    const handleEditClick = (appointment) => {
        setSelectedAppointment(appointment);
    };

    const handleCloseModal = () => {
        setSelectedAppointment(null);
    };

    const handleAppointmentUpdated = () => {
        handleCloseModal();
        fetchAppointments();
    };

    const isPast = (dateTimeString) => {
        const appointmentDate = new Date(dateTimeString);
        const today = new Date();
        return appointmentDate < today;
    };

    if (isLoading && filteredAppointments.length === 0) {
        return <p className="loading-message"><FontAwesomeIcon icon={faSpinner} spin /> Termine werden geladen...</p>;
    }

    return (
        <div className="appointment-list-container">
            {error && <p className="form-message error mb-3">{error}</p>}

            <div className="list-controls-header">
                <div className="appointment-filter-controls">
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`button-link-outline small-button ${activeFilter === 'all' ? 'active' : ''}`}
                    >
                        Alle
                    </button>
                    <button
                        onClick={() => setActiveFilter('upcoming')}
                        className={`button-link-outline small-button ${activeFilter === 'upcoming' ? 'active' : ''}`}
                    >
                        Zukünftige
                    </button>
                    <button
                        onClick={() => setActiveFilter('past')}
                        className={`button-link-outline small-button ${activeFilter === 'past' ? 'active' : ''}`}
                    >
                        Vergangene
                    </button>
                </div>
                {isLoading && <FontAwesomeIcon icon={faSpinner} spin className="ml-3 text-xl" />}
            </div>


            {filteredAppointments.length === 0 && !isLoading ? (
                <p className="text-center text-gray-600 py-4">
                    {activeFilter === 'all' ? 'Es sind noch keine Termine gebucht.' :
                        activeFilter === 'upcoming' ? 'Keine zukünftigen Termine gefunden.' :
                            'Keine vergangenen Termine gefunden.'}
                </p>
            ) : (
                <>
                    <div className="table-responsive-container hidden md:block mt-4">
                        <table className="app-table appointments-table">
                            <thead>
                            <tr>
                                <th>Datum & Zeit</th>
                                <th>Dienstleistung</th>
                                <th>Kunde</th>
                                <th>E-Mail</th>
                                <th>Telefon</th>
                                <th>Notizen</th>
                                {currentUser?.roles?.includes("ROLE_ADMIN") && <th>Aktionen</th>}
                            </tr>
                            </thead>
                            <tbody>
                            {filteredAppointments.map(appointment => (
                                <tr key={appointment.id} className={isPast(appointment.startTime) ? 'past-appointment' : ''}>
                                    <td data-label="Datum & Zeit:">
                                        <FontAwesomeIcon icon={faCalendarDay} className="table-cell-icon" />
                                        {new Date(appointment.startTime).toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                        <br />
                                        <FontAwesomeIcon icon={faClock} className="table-cell-icon" />
                                        {new Date(appointment.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                                    </td>
                                    <td data-label="Dienstleistung:">{appointment.service ? appointment.service.name : 'Unbekannt'}</td>
                                    <td data-label="Kunde:">{appointment.customer ? `${appointment.customer.firstName} ${appointment.customer.lastName}` : 'Unbekannt'}</td>
                                    <td data-label="E-Mail:">{appointment.customer ? appointment.customer.email : 'Unbekannt'}</td>
                                    <td data-label="Telefon:">{appointment.customer ? appointment.customer.phoneNumber : 'N/A'}</td>
                                    <td data-label="Notizen:">{appointment.notes || '-'}</td>
                                    {currentUser?.roles?.includes("ROLE_ADMIN") && (
                                        <td data-label="Aktionen:">
                                            <div className="action-buttons-table">
                                                <button
                                                    onClick={() => handleEditClick(appointment)}
                                                    className="button-link-outline small-button icon-button"
                                                    disabled={isPast(appointment.startTime)}
                                                    title={isPast(appointment.startTime) ? "Vergangene Termine können nicht bearbeitet werden" : "Termin bearbeiten"}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                    <span className="button-text-desktop">Bearbeiten</span>
                                                </button>
                                                <button
                                                    onClick={() => handleCancelClick(appointment)} // NEU
                                                    className="button-link-outline small-button danger icon-button"
                                                    title="Termin stornieren"
                                                >
                                                    <FontAwesomeIcon icon={faBan} /> {/* NEU: Icon geändert */}
                                                    <span className="button-text-desktop">Stornieren</span> {/* NEU: Text geändert */}
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="md:hidden space-y-4 mt-4">
                        {filteredAppointments.map(appointment => (
                            <div key={appointment.id} className={`appointment-card ${isPast(appointment.startTime) ? 'past-appointment' : ''}`}>
                                <div className="card-header">
                                    <p className="font-bold text-lg">
                                        <FontAwesomeIcon icon={faCalendarDay} className="mr-2 opacity-70" />
                                        {new Date(appointment.startTime).toLocaleDateString('de-DE', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                        <span className="ml-2">
                                            <FontAwesomeIcon icon={faClock} className="mr-1 opacity-70" />
                                            {new Date(appointment.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                                        </span>
                                    </p>
                                </div>
                                <div className="card-body">
                                    <p><strong>Dienstleistung:</strong> {appointment.service ? appointment.service.name : 'Unbekannt'}</p>
                                    <p><strong>Kunde:</strong> {appointment.customer ? `${appointment.customer.firstName} ${appointment.customer.lastName}` : 'Unbekannt'}</p>
                                    {currentUser?.roles?.includes("ROLE_ADMIN") && (
                                        <>
                                            <p><strong>E-Mail:</strong> {appointment.customer ? appointment.customer.email : 'Unbekannt'}</p>
                                            <p><strong>Telefon:</strong> {appointment.customer ? appointment.customer.phoneNumber : 'N/A'}</p>
                                        </>
                                    )}
                                    {appointment.notes && <p className="mt-1 pt-1 border-t border-gray-200"><strong>Notizen:</strong> {appointment.notes}</p>}
                                </div>
                                {currentUser?.roles?.includes("ROLE_ADMIN") && (
                                    <div className="card-actions">
                                        <button
                                            onClick={() => handleEditClick(appointment)}
                                            className="button-link-outline small-button"
                                            disabled={isPast(appointment.startTime)}
                                            title={isPast(appointment.startTime) ? "Vergangene Termine können nicht bearbeitet werden" : "Termin bearbeiten"}
                                        >
                                            <FontAwesomeIcon icon={faEdit} /> Bearbeiten
                                        </button>
                                        <button
                                            onClick={() => handleCancelClick(appointment)} // NEU
                                            className="button-link-outline small-button danger"
                                            title="Termin stornieren"
                                        >
                                            <FontAwesomeIcon icon={faBan} /> Stornieren {/* NEU */}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {selectedAppointment && (
                <AppointmentEditModal
                    appointment={selectedAppointment}
                    onClose={handleCloseModal}
                    onAppointmentUpdated={handleAppointmentUpdated}
                />
            )}
            {/* NEU: Bestätigungsmodal einbinden */}
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => { setShowConfirmModal(false); setAppointmentToCancel(null); }}
                onConfirm={confirmCancelAppointment}
                title="Termin stornieren"
                message={`Möchten Sie den Termin für "${appointmentToCancel?.customer?.firstName} ${appointmentToCancel?.customer?.lastName}" am ${appointmentToCancel ? new Date(appointmentToCancel.startTime).toLocaleDateString('de-DE') : ''} um ${appointmentToCancel ? new Date(appointmentToCancel.startTime).toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'}) : ''} Uhr wirklich stornieren?`}
                confirmText="Ja, stornieren"
                cancelText="Abbrechen"
                type="danger"
            />
        </div>
    );
}

export default AppointmentList;