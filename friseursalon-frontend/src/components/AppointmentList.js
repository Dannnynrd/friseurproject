import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import AppointmentEditModal from './AppointmentEditModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faBan, faFilter, faCalendarDay, faSyncAlt, faTimesCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { format, parseISO, isValid } from 'date-fns';

// Helper function to format date for display
const formatDateForDisplay = (dateString) => {
    if (!dateString || !isValid(parseISO(dateString))) return 'N/A';
    return format(parseISO(dateString), 'dd.MM.yyyy HH:mm');
};


function AppointmentList({ refreshTrigger, currentUser }) {
    const [appointments, setAppointments] = useState([]);
    const [error, setError] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [deleteSuccess, setDeleteSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes("ROLE_ADMIN");

    const fetchAppointments = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setDeleteError(null);
        setDeleteSuccess('');
        setAppointments([]);

        try {
            let response;
            if (isAdmin && filterStartDate && filterEndDate) {
                response = await api.get('appointments/by-date-range', {
                    params: {
                        start: filterStartDate,
                        end: filterEndDate
                    }
                });
            } else if (isAdmin) {
                response = await api.get('appointments/my-appointments');
            } else if (currentUser) {
                response = await api.get('appointments/my-appointments');
            } else {
                setError("Benutzer nicht authentifiziert, um Termine anzuzeigen.");
                setIsLoading(false);
                return;
            }

            const sortedAppointments = response.data.sort((a, b) =>
                new Date(a.startTime) - new Date(b.startTime)
            );
            setAppointments(sortedAppointments);
        } catch (err) {
            console.error("Fehler beim Abrufen der Termine:", err);
            let errorMessage = "Termine konnten nicht geladen werden. Bitte versuchen Sie es später erneut.";

            if (err.response && err.response.data) {
                if (err.response.data.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
                    errorMessage = err.response.data.errors.join("; ");
                } else if (typeof err.response.data === 'string') {
                    errorMessage = err.response.data;
                } else if (err.response.statusText) {
                    errorMessage = `Fehler: ${err.response.status} ${err.response.statusText}`;
                }
            } else if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, isAdmin, filterStartDate, filterEndDate]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments, refreshTrigger]);

    const handleFilterApply = () => {
        fetchAppointments();
    };

    const handleClearFilters = () => {
        setFilterStartDate('');
        setFilterEndDate('');
        setShowFilters(false);
        // The useEffect for fetchAppointments will pick up the cleared dates via its dependency array.
        // However, to be absolutely sure it refetches with no filters immediately:
        // Temporarily store current filters, set them to empty for the fetch, then restore.
        // Or, make the dependency array of the useEffect [fetchAppointments, refreshTrigger]
        // and manage the call to fetchAppointments inside handleClearFilters / handleFilterApply directly.
        // The current fetchAppointments useCallback already depends on filterStartDate/EndDate.
        // So changing them and it being in the useEffect's dep array will trigger it.
        // Let's make the call explicit here to ensure it happens after state update is processed.
        // We'll rely on the fact that fetchAppointments will be recreated with new empty values for dates.
        fetchAppointments();
    };

    const handleCancelAppointment = async (id) => {
        if (window.confirm('Sind Sie sicher, dass Sie diesen Termin stornieren/löschen möchten?')) {
            setDeleteError(null);
            setDeleteSuccess('');
            setIsLoading(true);
            try {
                await api.delete(`appointments/${id}`);
                fetchAppointments();
                setDeleteSuccess('Termin erfolgreich storniert/gelöscht.');
                setTimeout(() => setDeleteSuccess(''), 3000);
            } catch (err) {
                console.error("Fehler beim Stornieren/Löschen des Termins:", err);
                const errorMsg = err.response?.data?.message || "Fehler beim Stornieren/Löschen des Termins.";
                setDeleteError(errorMsg);
                setTimeout(() => setDeleteError(null), 5000);
            } finally {
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

    const getAppointmentStatus = (startTime) => {
        const now = new Date();
        const appointmentDate = parseISO(startTime);
        if (!isValid(appointmentDate)) return { text: 'Unbekannt', className: 'status-unknown' };

        if (appointmentDate < now) {
            return { text: 'Vergangen', className: 'status-past' };
        }
        return { text: 'Anstehend', className: 'status-upcoming' };
    };

    return (
        <div className="appointment-list-container">
            {isAdmin && (
                <div className="admin-appointment-controls">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="button-link-outline small-button filter-toggle-button"
                        aria-expanded={showFilters}
                    >
                        <FontAwesomeIcon icon={faFilter} /> Filter {showFilters ? 'schließen' : 'öffnen'}
                    </button>
                    {showFilters && (
                        <div className="admin-filters card-style">
                            <div className="form-grid-halved">
                                <div className="form-group">
                                    <label htmlFor="filterStartDate">Startdatum:</label>
                                    <input
                                        type="date"
                                        id="filterStartDate"
                                        value={filterStartDate}
                                        onChange={(e) => setFilterStartDate(e.target.value)}
                                        className="admin-filter-date-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="filterEndDate">Enddatum:</label>
                                    <input
                                        type="date"
                                        id="filterEndDate"
                                        value={filterEndDate}
                                        onChange={(e) => setFilterEndDate(e.target.value)}
                                        min={filterStartDate}
                                        className="admin-filter-date-input"
                                    />
                                </div>
                            </div>
                            <div className="filter-actions">
                                <button onClick={handleFilterApply} className="button-link small-button" disabled={isLoading || !filterStartDate || !filterEndDate}>
                                    <FontAwesomeIcon icon={faCalendarDay} /> Filter anwenden
                                </button>
                                <button onClick={handleClearFilters} className="button-link-outline small-button" disabled={isLoading}>
                                    <FontAwesomeIcon icon={faSyncAlt} /> Filter zurücksetzen
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isLoading && <p className="loading-message"><FontAwesomeIcon icon={faSpinner} spin /> Termine werden geladen...</p>}
            {error && <p className="form-message error small mb-3">{error}</p>}
            {deleteError && <p className="form-message error small mb-3">{deleteError}</p>}
            {deleteSuccess && <p className="form-message success small mb-3">{deleteSuccess}</p>}

            {!isLoading && appointments.length === 0 && !error ? (
                <p className="text-center text-gray-600 py-4">
                    {filterStartDate && filterEndDate ? "Keine Termine im ausgewählten Zeitraum gefunden." : "Es sind noch keine Termine gebucht oder sichtbar."}
                </p>
            ) : !isLoading && appointments.length > 0 ? (
                <>
                    <div className="table-responsive-container hidden md:block">
                        <table className="app-table appointments-table">
                            <thead>
                            <tr>
                                {isAdmin && <th>Status</th>}
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
                                const status = getAppointmentStatus(appointment.startTime);
                                return (
                                    <tr key={appointment.id} className={status.className}>
                                        {isAdmin && <td data-label="Status:"><span className={`status-badge ${status.className}`}>{status.text}</span></td>}
                                        <td data-label="Datum & Zeit:">{formatDateForDisplay(appointment.startTime)}</td>
                                        <td data-label="Dienstleistung:">{appointment.service ? appointment.service.name : 'Unbekannt'}</td>
                                        {isAdmin && (
                                            <>
                                                <td data-label="Kunde:">{appointment.customer ? `${appointment.customer.firstName} ${appointment.customer.lastName}` : 'Unbekannt'}</td>
                                                <td data-label="E-Mail:">{appointment.customer ? appointment.customer.email : 'Unbekannt'}</td>
                                                <td data-label="Telefon:">{appointment.customer ? (appointment.customer.phoneNumber || 'N/A') : 'N/A'}</td>
                                            </>
                                        )}
                                        <td data-label="Notizen:">{appointment.notes || '-'}</td>
                                        <td data-label="Aktionen:">
                                            <div className="action-buttons">
                                                {isAdmin && (
                                                    <button onClick={() => handleEditClick(appointment)} className="edit-button" title="Bearbeiten">
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleCancelAppointment(appointment.id)}
                                                    className="delete-button"
                                                    title={isAdmin ? "Löschen" : "Stornieren"}
                                                    disabled={!isAdmin && status.text === 'Vergangen'}
                                                >
                                                    <FontAwesomeIcon icon={isAdmin ? faTrashAlt : (status.text === 'Vergangen' ? faTimesCircle : faBan)} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>

                    <div className="md:hidden space-y-4 mt-4">
                        {appointments.map(appointment => {
                            const status = getAppointmentStatus(appointment.startTime);
                            return (
                                <div key={appointment.id} className={`appointment-card ${status.className}`}>
                                    {isAdmin && <div className={`status-banner-mobile ${status.className}`}>{status.text}</div>}
                                    <p className="appointment-card-time">{formatDateForDisplay(appointment.startTime)}</p>
                                    <p><strong>Dienstleistung:</strong> {appointment.service ? appointment.service.name : 'Unbekannt'}</p>
                                    {isAdmin && (
                                        <>
                                            <p><strong>Kunde:</strong> {appointment.customer ? `${appointment.customer.firstName} ${appointment.customer.lastName}` : 'Unbekannt'}</p>
                                            <p><strong>E-Mail:</strong> {appointment.customer ? appointment.customer.email : 'Unbekannt'}</p>
                                            <p><strong>Telefon:</strong> {appointment.customer ? (appointment.customer.phoneNumber || 'N/A') : 'N/A'}</p>
                                        </>
                                    )}
                                    <p className="mb-2"><strong>Notizen:</strong> {appointment.notes || '-'}</p>
                                    <div className="action-buttons mobile-card-actions">
                                        {isAdmin && (
                                            <button onClick={() => handleEditClick(appointment)} className="edit-button button-link-outline small-button">
                                                <FontAwesomeIcon icon={faEdit} /> Bearbeiten
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleCancelAppointment(appointment.id)}
                                            className="delete-button button-link-outline small-button"
                                            disabled={!isAdmin && status.text === 'Vergangen'}
                                        >
                                            <FontAwesomeIcon icon={isAdmin ? faTrashAlt : (status.text === 'Vergangen' ? faTimesCircle : faBan)} /> {isAdmin ? "Löschen" : "Stornieren"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : null}

            {selectedAppointment && isAdmin && (
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