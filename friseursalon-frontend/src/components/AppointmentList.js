import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import AppointmentEditModal from './AppointmentEditModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faCalendarDay, faClock, faSpinner, faFilter } from '@fortawesome/free-solid-svg-icons';

function AppointmentList({ refreshTrigger, currentUser }) {
    const [allAppointments, setAllAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [error, setError] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');

    const fetchAppointments = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('appointments');
            let fetchedAppointments = response.data || []; // Sicherstellen, dass es ein Array ist

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

    const handleDelete = async (id) => {
        if (window.confirm('Sind Sie sicher, dass Sie diesen Termin löschen möchten?')) {
            setIsLoading(true);
            try {
                await api.delete(`appointments/${id}`);
                fetchAppointments();
            } catch (err) {
                console.error("Fehler beim Löschen des Termins:", err);
                setError("Fehler beim Löschen des Termins.");
                setIsLoading(false);
            }
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

    // Ladeanzeige, solange isLoading true ist
    if (isLoading) {
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
                {/* Optional: Lade-Spinner hier anzeigen, wenn _nur_ gefiltert wird und nicht initial geladen */}
            </div>

            {/* Anzeige für leere Liste NACHDEM der Ladevorgang abgeschlossen ist */}
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
                                                    onClick={() => handleDelete(appointment.id)}
                                                    className="button-link-outline small-button danger icon-button"
                                                    title="Termin löschen"
                                                >
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
                                            onClick={() => handleDelete(appointment.id)}
                                            className="button-link-outline small-button danger"
                                            title="Termin löschen"
                                        >
                                            <FontAwesomeIcon icon={faTrashAlt} /> Löschen
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
        </div>
    );
}

export default AppointmentList;