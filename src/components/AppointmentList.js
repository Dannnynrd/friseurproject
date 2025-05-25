import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service'; // WICHTIG: Hier api importieren
import AppointmentEditModal from './AppointmentEditModal';

function AppointmentList({ refreshTrigger }) {
    const [appointments, setAppointments] = useState([]);
    const [error, setError] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    const fetchAppointments = useCallback(async () => {
        try {
            // NUTZE 'api' STATT 'axios' FÜR ALLE AUFRUFE AN DEIN BACKEND
            const response = await api.get('appointments'); // Pfad ist jetzt relativ zur baseURL
            // Termine nach Startzeit sortieren, um bessere Übersicht zu haben
            const sortedAppointments = response.data.sort((a, b) =>
                new Date(a.startTime) - new Date(b.startTime)
            );
            setAppointments(sortedAppointments);
            setError(null);
        } catch (err) {
            console.error("Fehler beim Abrufen der Termine:", err);
            setError("Termine konnten nicht geladen werden. Bitte versuchen Sie es später erneut.");
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments, refreshTrigger]);

    const handleDelete = async (id) => {
        if (window.confirm('Sind Sie sicher, dass Sie diesen Termin löschen möchten?')) {
            try {
                // NUTZE 'api' STATT 'axios'
                await api.delete(`appointments/${id}`); // Pfad ist jetzt relativ zur baseURL
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
            <h2>Gebuchte Termine</h2>
            {error && <p className="error-message">{error}</p>}
            {appointments.length === 0 && !error ? (
                <p>Es sind noch keine Termine gebucht.</p>
            ) : (
                <table className="appointment-table">
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
                            <td className="appointment-actions">
                                <button onClick={() => handleEditClick(appointment)} className="edit-button">Bearbeiten</button>
                                <button onClick={() => handleDelete(appointment.id)} className="delete-button">Löschen</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
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