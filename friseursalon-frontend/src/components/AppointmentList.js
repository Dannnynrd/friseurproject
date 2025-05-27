import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import AppointmentEditModal from './AppointmentEditModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faBan } from '@fortawesome/free-solid-svg-icons'; // faBan für Stornieren

function AppointmentList({ refreshTrigger, currentUser }) {
    const [appointments, setAppointments] = useState([]);
    const [error, setError] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [deleteSuccess, setDeleteSuccess] = useState('');

    const fetchAppointments = useCallback(async () => {
        setError(null);
        setDeleteError(null); // Auch Stornierungsfehler zurücksetzen
        setDeleteSuccess(''); // Auch Stornierungserfolg zurücksetzen
        setAppointments([]);
        try {
            let response;
            if (currentUser && currentUser.roles && !currentUser.roles.includes("ROLE_ADMIN")) {
                console.log('AppointmentList.js: Fetching appointments for current user.');
                response = await api.get('appointments/my-appointments');
            } else if (currentUser && currentUser.roles && currentUser.roles.includes("ROLE_ADMIN")) {
                console.log('AppointmentList.js: Admin-Benutzer, holt alle Termine.');
                response = await api.get('appointments/my-appointments'); // Admin kann auch diesen Endpunkt nutzen, wenn er alle Termine sortiert liefert
                // oder direkt /api/appointments, je nach Backend-Logik
            } else {
                console.log('AppointmentList.js: Kein Benutzer oder keine Rollen, keine Termine abrufen.');
                setError("Benutzer nicht authentifiziert, um Termine anzuzeigen.");
                return;
            }
            // Backend sortiert jetzt, aber eine clientseitige Sortierung als Fallback schadet nicht
            const sortedAppointments = response.data.sort((a, b) =>
                new Date(a.startTime) - new Date(b.startTime)
            );
            setAppointments(sortedAppointments);
        } catch (err) {
            console.error("Fehler beim Abrufen der Termine:", err);
            const errorMessage = err.response?.data?.message || "Termine konnten nicht geladen werden.";
            setError(errorMessage);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments, refreshTrigger]);

    const handleCancelAppointment = async (id) => {
        if (window.confirm('Sind Sie sicher, dass Sie diesen Termin stornieren möchten?')) {
            setDeleteError(null);
            setDeleteSuccess('');
            try {
                await api.delete(`appointments/${id}`); // Der Controller prüft die Berechtigung
                fetchAppointments(); // Liste neu laden
                setDeleteSuccess('Termin erfolgreich storniert.');
                setTimeout(() => setDeleteSuccess(''), 3000);
            } catch (err) {
                console.error("Fehler beim Stornieren des Termins:", err);
                const errorMsg = err.response?.data?.message || "Fehler beim Stornieren des Termins.";
                setDeleteError(errorMsg);
                setTimeout(() => setDeleteError(null), 5000); // Fehlermeldung nach 5s ausblenden
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

    const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes("ROLE_ADMIN");

    return (
        <div className="appointment-list-container">
            {error && <p className="form-message error small mb-3">{error}</p>}
            {deleteError && <p className="form-message error small mb-3">{deleteError}</p>}
            {deleteSuccess && <p className="form-message success small mb-3">{deleteSuccess}</p>}

            {appointments.length === 0 && !error ? (
                <p className="text-center text-gray-600 py-4">Es sind noch keine Termine gebucht oder sichtbar.</p>
            ) : (
                <>
                    {/* Desktop-Ansicht (Tabelle) */}
                    <div className="table-responsive-container hidden md:block">
                        <table className="app-table">
                            <thead>
                            <tr>
                                <th>Datum & Zeit</th>
                                <th>Dienstleistung</th>
                                {isAdmin && (
                                    <>
                                        <th>Kunde</th>
                                        <th>E-Mail</th>
                                        <th>Telefon</th>
                                    </>
                                )}
                                <th>Notizen</th>
                                <th>Aktionen</th>
                            </tr>
                            </thead>
                            <tbody>
                            {appointments.map(appointment => {
                                const isPastAppointment = new Date(appointment.startTime) < new Date();
                                return (
                                    <tr key={appointment.id}>
                                        <td>{new Date(appointment.startTime).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                                        <td>{appointment.service ? appointment.service.name : 'Unbekannt'}</td>
                                        {isAdmin && (
                                            <>
                                                <td>{appointment.customer ? `${appointment.customer.firstName} ${appointment.customer.lastName}` : 'Unbekannt'}</td>
                                                <td>{appointment.customer ? appointment.customer.email : 'Unbekannt'}</td>
                                                <td>{appointment.customer ? appointment.customer.phoneNumber : 'N/A'}</td>
                                            </>
                                        )}
                                        <td>{appointment.notes || '-'}</td>
                                        <td>
                                            <div className="action-buttons">
                                                {isAdmin && (
                                                    <button onClick={() => handleEditClick(appointment)} className="edit-button" title="Bearbeiten">
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </button>
                                                )}
                                                {(!isPastAppointment || isAdmin) && (
                                                    <button
                                                        onClick={() => handleCancelAppointment(appointment.id)}
                                                        className="delete-button" // Besser "cancel-button" oder eine spezifischere Klasse
                                                        title={isAdmin ? "Löschen" : "Stornieren"}>
                                                        <FontAwesomeIcon icon={isAdmin ? faTrashAlt : faBan} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile-Ansicht (Karten) */}
                    <div className="md:hidden space-y-4">
                        {appointments.map(appointment => {
                            const isPastAppointment = new Date(appointment.startTime) < new Date();
                            return (
                                <div key={appointment.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                                    <p className="font-bold text-lg mb-2">{new Date(appointment.startTime).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                    <p><strong>Dienstleistung:</strong> {appointment.service ? appointment.service.name : 'Unbekannt'}</p>
                                    {isAdmin && (
                                        <>
                                            <p><strong>Kunde:</strong> {appointment.customer ? `${appointment.customer.firstName} ${appointment.customer.lastName}` : 'Unbekannt'}</p>
                                            <p><strong>E-Mail:</strong> {appointment.customer ? appointment.customer.email : 'Unbekannt'}</p>
                                            <p><strong>Telefon:</strong> {appointment.customer ? appointment.customer.phoneNumber : 'N/A'}</p>
                                        </>
                                    )}
                                    <p className="mb-2"><strong>Notizen:</strong> {appointment.notes || '-'}</p>
                                    {(!isPastAppointment || isAdmin) && (
                                        <div className="action-buttons mt-3 justify-end">
                                            {isAdmin && (
                                                <button onClick={() => handleEditClick(appointment)} className="edit-button button-link-outline small-button mr-2"> {/* Beispiel für Button-Styling */}
                                                    <FontAwesomeIcon icon={faEdit} /> Bearbeiten
                                                </button>
                                            )}
                                            <button onClick={() => handleCancelAppointment(appointment.id)} className="delete-button button-link-outline small-button"> {/* Beispiel für Button-Styling */}
                                                <FontAwesomeIcon icon={isAdmin ? faTrashAlt : faBan} /> {isAdmin ? "Löschen" : "Stornieren"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {selectedAppointment && isAdmin && ( // Edit Modal nur für Admin
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