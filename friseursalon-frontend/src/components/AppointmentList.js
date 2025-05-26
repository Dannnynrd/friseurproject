import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import AppointmentEditModal from './AppointmentEditModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

function AppointmentList({ refreshTrigger, currentUser }) {
    console.log('AppointmentList.js: Erhaltene currentUser Prop:', currentUser);
    console.log('AppointmentList.js: Rollenprüfung (isAdmin):', currentUser?.roles?.includes("ROLE_ADMIN"));

    const [appointments, setAppointments] = useState([]);
    const [error, setError] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    const fetchAppointments = useCallback(async () => {
        try {
            const response = await api.get('appointments');

            let filteredAppointments = response.data;
            if (currentUser && currentUser.roles && !currentUser.roles.includes("ROLE_ADMIN")) {
                console.log('AppointmentList.js: Filterung aktiviert für Nicht-Admin-Benutzer.');
                filteredAppointments = response.data.filter(app => app.customer && app.customer.email === currentUser.email);
                console.log('AppointmentList.js: Anzahl der gefilterten Termine:', filteredAppointments.length);
            } else if (currentUser && currentUser.roles && currentUser.roles.includes("ROLE_ADMIN")) {
                console.log('AppointmentList.js: Admin-Benutzer, zeigt alle Termine.');
            } else {
                console.log('AppointmentList.js: Kein Benutzer angemeldet, sollte nicht hier sein.');
            }

            const sortedAppointments = filteredAppointments.sort((a, b) =>
                new Date(a.startTime) - new Date(b.startTime)
            );
            setAppointments(sortedAppointments);
            setError(null);
        } catch (err) {
            console.error("Fehler beim Abrufen der Termine:", err);
            setError("Termine konnten nicht geladen werden. Bitte versuchen Sie es später erneut.");
        }
    }, [currentUser]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments, refreshTrigger]);

    const handleDelete = async (id) => {
        if (window.confirm('Sind Sie sicher, dass Sie diese Termin löschen möchten?')) {
            try {
                await api.delete(`appointments/${id}`);
                fetchAppointments();
            } catch (err) {
                console.error("Fehler beim Löschen des Termins:", err);
                setError("Fehler beim Löschen des Termins.");
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

    return (
        <div className="appointment-list-container">
            {error && <p className="error-message">{error}</p>}
            {appointments.length === 0 && !error ? (
                <p className="text-center text-gray-600">Es sind noch keine Termine gebucht.</p>
            ) : (
                <>
                    {/* Desktop-Ansicht (Tabelle) */}
                    <div className="table-responsive-container hidden md:block">
                        <table className="app-table">
                            <thead>
                            <tr>
                                <th>Datum & Zeit</th>
                                <th>Dienstleistung</th>
                                <th>Kunde</th>
                                <th>E-Mail</th>
                                <th>Telefon</th>
                                <th>Notizen</th>
                                <th>Aktionen</th>
                            </tr>
                            </thead>
                            <tbody>
                            {appointments.map(appointment => (
                                <tr key={appointment.id}>
                                    <td>{new Date(appointment.startTime).toLocaleString('de-DE')}</td>
                                    <td>{appointment.service ? appointment.service.name : 'Unbekannt'}</td>
                                    <td>{appointment.customer ? `${appointment.customer.firstName} ${appointment.customer.lastName}` : 'Unbekannt'}</td>
                                    <td>{appointment.customer ? appointment.customer.email : 'Unbekannt'}</td>
                                    <td>{appointment.customer ? appointment.customer.phoneNumber : 'N/A'}</td>
                                    <td>{appointment.notes}</td>
                                    <td>
                                        {currentUser && currentUser.roles && currentUser.roles.includes("ROLE_ADMIN") && (
                                            <div className="action-buttons">
                                                <button onClick={() => handleEditClick(appointment)} className="edit-button">
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </button>
                                                <button onClick={() => handleDelete(appointment.id)} className="delete-button">
                                                    <FontAwesomeIcon icon={faTrashAlt} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile-Ansicht (Karten) */}
                    <div className="md:hidden space-y-4">
                        {appointments.map(appointment => (
                            <div key={appointment.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                                <p className="font-bold text-lg mb-2">{new Date(appointment.startTime).toLocaleString('de-DE')}</p>
                                <p><strong>Dienstleistung:</strong> {appointment.service ? appointment.service.name : 'Unbekannt'}</p>
                                <p><strong>Kunde:</strong> {appointment.customer ? `${appointment.customer.firstName} ${appointment.customer.lastName}` : 'Unbekannt'}</p>
                                <p><strong>E-Mail:</strong> {appointment.customer ? appointment.customer.email : 'Unbekannt'}</p>
                                <p><strong>Telefon:</strong> {appointment.customer ? appointment.customer.phoneNumber : 'N/A'}</p>
                                <p className="mb-2"><strong>Notizen:</strong> {appointment.notes}</p>
                                {currentUser && currentUser.roles && currentUser.roles.includes("ROLE_ADMIN") && (
                                    <div className="action-buttons mt-3">
                                        <button onClick={() => handleEditClick(appointment)} className="edit-button">
                                            <FontAwesomeIcon icon={faEdit} /> Bearbeiten
                                        </button>
                                        <button onClick={() => handleDelete(appointment.id)} className="delete-button">
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
