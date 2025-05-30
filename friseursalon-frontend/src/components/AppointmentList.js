// File: src/components/AppointmentList.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api.service';
import AppointmentEditModal from './AppointmentEditModal';
import ConfirmModal from './ConfirmModal'; // Import ConfirmModal
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit, faTrashAlt, faBan, faFilter, faCalendarDay,
    faSyncAlt, faTimesCircle, faSpinner, faExclamationCircle,
    faCheckCircle, faChevronDown, faChevronUp, faPlusCircle,
    faCalendarWeek, faCalendarCheck, faHistory // Added new icons
} from '@fortawesome/free-solid-svg-icons';
import { format, parseISO, isValid, startOfDay, endOfDay, startOfWeek, endOfWeek, subDays, isPast, isToday, isFuture } from 'date-fns';
import { de } from 'date-fns/locale'; // German locale for date-fns
import './AppointmentList.css'; // Import new CSS

// Helper function to format date for display
const formatDateForDisplay = (dateString) => {
    if (!dateString || !isValid(parseISO(dateString))) return 'N/A';
    return format(parseISO(dateString), 'dd.MM.yyyy HH:mm', { locale: de });
};

const QUICK_FILTER_OPTIONS = {
    ALL: 'all',
    TODAY: 'today',
    THIS_WEEK: 'this_week',
    UPCOMING: 'upcoming',
    PAST: 'past',
};

function AppointmentList({ refreshTrigger, currentUser, onAppointmentModified }) {
    const [appointments, setAppointments] = useState([]);
    const [error, setError] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' }); // For success/error messages
    const [isLoading, setIsLoading] = useState(false);

    // Admin filter states
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [activeQuickFilter, setActiveQuickFilter] = useState(QUICK_FILTER_OPTIONS.ALL);

    // Delete confirmation modal
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [appointmentToDelete, setAppointmentToDelete] = useState(null);


    const isAdmin = useMemo(() => currentUser && currentUser.roles && currentUser.roles.includes("ROLE_ADMIN"), [currentUser]);

    const fetchAppointments = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setMessage({ type: '', text: '' }); // Clear previous messages
        setAppointments([]);

        let params = {};
        if (isAdmin) {
            if (activeQuickFilter === QUICK_FILTER_OPTIONS.TODAY) {
                params.start = format(startOfDay(new Date()), 'yyyy-MM-dd');
                params.end = format(endOfDay(new Date()), 'yyyy-MM-dd');
            } else if (activeQuickFilter === QUICK_FILTER_OPTIONS.THIS_WEEK) {
                params.start = format(startOfWeek(new Date(), { weekStartsOn: 1, locale: de }), 'yyyy-MM-dd');
                params.end = format(endOfWeek(new Date(), { weekStartsOn: 1, locale: de }), 'yyyy-MM-dd');
            } else if (filterStartDate && filterEndDate) {
                params.start = filterStartDate;
                params.end = filterEndDate;
            }
            // For 'UPCOMING' and 'PAST', we might need to fetch all and filter client-side,
            // or have specific backend endpoints if lists are very large.
            // For now, if no date range is set, admin fetches all via 'my-appointments' which is not ideal.
            // Let's adjust this: if admin and 'all' or specific upcoming/past, fetch a wider range or all.
        }

        try {
            let response;
            if (isAdmin) {
                // If specific date filters are set, use them regardless of quick filter (unless quick filter is 'all')
                if (filterStartDate && filterEndDate && activeQuickFilter !== QUICK_FILTER_OPTIONS.ALL) {
                    params = { start: filterStartDate, end: filterEndDate };
                } else if (activeQuickFilter === QUICK_FILTER_OPTIONS.ALL && !filterStartDate && !filterEndDate) {
                    // Admin, "All" selected, no date range: Fetch all appointments (could be large)
                    // Consider adding a default range or pagination in a real-world scenario
                    response = await api.get('appointments/my-appointments'); // This endpoint currently returns all for admin
                } else {
                    response = await api.get('appointments/by-date-range', { params });
                }
                if (!response) response = await api.get('appointments/my-appointments'); // Fallback if params were empty

            } else if (currentUser) {
                response = await api.get('appointments/my-appointments');
            } else {
                setError("Benutzer nicht authentifiziert.");
                setIsLoading(false);
                return;
            }

            let fetchedAppointments = response.data.sort((a, b) =>
                new Date(a.startTime) - new Date(b.startTime)
            );

            // Client-side filtering for UPCOMING and PAST if admin and no specific date range
            if (isAdmin) {
                if (activeQuickFilter === QUICK_FILTER_OPTIONS.UPCOMING && !(filterStartDate && filterEndDate)) {
                    fetchedAppointments = fetchedAppointments.filter(apt => isFuture(parseISO(apt.startTime)) || isToday(parseISO(apt.startTime)));
                } else if (activeQuickFilter === QUICK_FILTER_OPTIONS.PAST && !(filterStartDate && filterEndDate)) {
                    fetchedAppointments = fetchedAppointments.filter(apt => isPast(parseISO(apt.startTime)) && !isToday(parseISO(apt.startTime)));
                }
            }


            setAppointments(fetchedAppointments);
        } catch (err) {
            console.error("Fehler beim Abrufen der Termine:", err);
            // ... (error message handling as before)
            setError(err.response?.data?.message || "Termine konnten nicht geladen werden.");
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, isAdmin, filterStartDate, filterEndDate, activeQuickFilter]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments, refreshTrigger]);

    const handleApplyDateFilter = () => {
        setActiveQuickFilter(QUICK_FILTER_OPTIONS.ALL); // Reset quick filter when custom date is applied
        fetchAppointments();
        setShowAdvancedFilters(false); // Close advanced filters after applying
    };

    const handleClearDateFilters = () => {
        setFilterStartDate('');
        setFilterEndDate('');
        setActiveQuickFilter(QUICK_FILTER_OPTIONS.ALL);
        // fetchAppointments will be called by useEffect due to state change
    };

    const handleQuickFilterChange = (filter) => {
        setFilterStartDate(''); // Clear date range when using quick filter
        setFilterEndDate('');
        setActiveQuickFilter(filter);
        // fetchAppointments will be called by useEffect
    };

    const handleDeleteOrCancelClick = (appointment) => {
        setAppointmentToDelete(appointment);
        setShowDeleteConfirmModal(true);
    };

    const confirmDeleteOrCancelAppointment = async () => {
        if (!appointmentToDelete) return;

        setMessage({ type: '', text: '' });
        setIsLoading(true); // Use general loading for this action for simplicity

        try {
            await api.delete(`appointments/${appointmentToDelete.id}`);
            setShowDeleteConfirmModal(false);
            setAppointmentToDelete(null);
            setMessage({type: 'success', text: 'Termin erfolgreich storniert/gelöscht.'});
            if (onAppointmentModified) onAppointmentModified(); // Trigger refresh in parent
            else fetchAppointments(); // Fallback to local refresh
        } catch (err) {
            console.error("Fehler beim Stornieren/Löschen des Termins:", err);
            const errorMsg = err.response?.data?.message || "Fehler beim Stornieren/Löschen.";
            setMessage({type: 'error', text: errorMsg});
            setShowDeleteConfirmModal(false); // Close modal even on error
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
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
        setMessage({type: 'success', text: 'Termin erfolgreich aktualisiert.'});
        if (onAppointmentModified) onAppointmentModified();
        else fetchAppointments();
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    };

    const getAppointmentStatus = (startTime, appointmentStatusValue) => {
        if (appointmentStatusValue === 'CANCELLED') { // Assuming backend sends 'CANCELLED' string
            return { text: 'Storniert', className: 'status-cancelled' };
        }
        const now = new Date();
        const appointmentDate = parseISO(startTime);
        if (!isValid(appointmentDate)) return { text: 'Unbekannt', className: 'status-unknown' };

        if (isPast(appointmentDate) && !isToday(appointmentDate)) {
            return { text: 'Vergangen', className: 'status-past' };
        }
        return { text: 'Anstehend', className: 'status-upcoming' };
    };

    const renderAdminFilters = () => (
        <div className="admin-appointment-controls">
            <div className="filter-controls-header">
                <h3 className="text-md font-semibold text-gray-700">Terminfilter</h3>
                <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="button-link-outline small-button filter-toggle-button"
                    aria-expanded={showAdvancedFilters}
                >
                    <FontAwesomeIcon icon={showAdvancedFilters ? faChevronUp : faChevronDown} />
                    {showAdvancedFilters ? 'Erweiterte Filter ausblenden' : 'Datumsfilter anzeigen'}
                </button>
            </div>

            <div className="quick-filter-buttons">
                <button onClick={() => handleQuickFilterChange(QUICK_FILTER_OPTIONS.ALL)} className={`button-link-outline ${activeQuickFilter === QUICK_FILTER_OPTIONS.ALL ? 'active' : ''}`}>Alle</button>
                <button onClick={() => handleQuickFilterChange(QUICK_FILTER_OPTIONS.TODAY)} className={`button-link-outline ${activeQuickFilter === QUICK_FILTER_OPTIONS.TODAY ? 'active' : ''}`}><FontAwesomeIcon icon={faCalendarDay}/> Heute</button>
                <button onClick={() => handleQuickFilterChange(QUICK_FILTER_OPTIONS.THIS_WEEK)} className={`button-link-outline ${activeQuickFilter === QUICK_FILTER_OPTIONS.THIS_WEEK ? 'active' : ''}`}><FontAwesomeIcon icon={faCalendarWeek}/> Diese Woche</button>
                <button onClick={() => handleQuickFilterChange(QUICK_FILTER_OPTIONS.UPCOMING)} className={`button-link-outline ${activeQuickFilter === QUICK_FILTER_OPTIONS.UPCOMING ? 'active' : ''}`}><FontAwesomeIcon icon={faCalendarCheck}/> Anstehend</button>
                <button onClick={() => handleQuickFilterChange(QUICK_FILTER_OPTIONS.PAST)} className={`button-link-outline ${activeQuickFilter === QUICK_FILTER_OPTIONS.PAST ? 'active' : ''}`}><FontAwesomeIcon icon={faHistory}/> Vergangen</button>
            </div>

            {showAdvancedFilters && (
                <div className="admin-filters-content">
                    <div className="date-filter-grid">
                        <div className="form-group">
                            <label htmlFor="filterStartDate">Startdatum:</label>
                            <input type="date" id="filterStartDate" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} className="admin-filter-date-input"/>
                        </div>
                        <div className="form-group">
                            <label htmlFor="filterEndDate">Enddatum:</label>
                            <input type="date" id="filterEndDate" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} min={filterStartDate} className="admin-filter-date-input"/>
                        </div>
                    </div>
                    <div className="filter-actions">
                        <button onClick={handleApplyDateFilter} className="button-link small-button" disabled={isLoading || !filterStartDate || !filterEndDate}>
                            <FontAwesomeIcon icon={faFilter} /> Datumsfilter anwenden
                        </button>
                        <button onClick={handleClearDateFilters} className="button-link-outline small-button" disabled={isLoading}>
                            <FontAwesomeIcon icon={faSyncAlt} /> Filter zurücksetzen
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderAppointmentTable = () => (
        <div className="appointments-table-wrapper">
            <table className="app-table appointments-table">
                <thead>
                <tr>
                    {isAdmin && <th>Status</th>}
                    <th>Datum & Zeit</th>
                    <th>Dienstleistung</th>
                    {isAdmin && <>
                        <th>Kunde</th>
                        <th>E-Mail</th>
                        <th>Telefon</th>
                    </>}
                    <th>Notizen</th>
                    <th>Aktionen</th>
                </tr>
                </thead>
                <tbody>
                {appointments.map(appointment => {
                    const statusInfo = getAppointmentStatus(appointment.startTime, appointment.status);
                    return (
                        <tr key={appointment.id} className={statusInfo.className.replace('status-','') /* For potential row styling */}>
                            {isAdmin && <td data-label="Status:"><span className={`status-badge ${statusInfo.className}`}>{statusInfo.text}</span></td>}
                            <td data-label="Datum & Zeit:">{formatDateForDisplay(appointment.startTime)}</td>
                            <td data-label="Dienstleistung:">{appointment.service?.name || 'N/A'}</td>
                            {isAdmin && <>
                                <td data-label="Kunde:">{appointment.customer ? `${appointment.customer.firstName} ${appointment.customer.lastName}` : 'N/A'}</td>
                                <td data-label="E-Mail:">{appointment.customer?.email || 'N/A'}</td>
                                <td data-label="Telefon:">{appointment.customer?.phoneNumber || '-'}</td>
                            </>}
                            <td data-label="Notizen:" className="max-w-xs truncate" title={appointment.notes}>{appointment.notes || '-'}</td>
                            <td data-label="Aktionen:">
                                <div className="action-buttons-table">
                                    {isAdmin && (
                                        <button onClick={() => handleEditClick(appointment)} className="button-link-outline small-button icon-button" title="Bearbeiten">
                                            <FontAwesomeIcon icon={faEdit} /><span className="sr-only md:not-sr-only ml-1">Bearbeiten</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteOrCancelClick(appointment)}
                                        className={`button-link-outline small-button icon-button ${isAdmin ? 'danger' : ''}`}
                                        title={isAdmin ? "Löschen" : "Stornieren"}
                                        disabled={!isAdmin && statusInfo.className === 'status-past'}
                                    >
                                        <FontAwesomeIcon icon={isAdmin ? faTrashAlt : (statusInfo.className === 'status-past' ? faTimesCircle : faBan)} />
                                        <span className="sr-only md:not-sr-only ml-1">{isAdmin ? "Löschen" : "Stornieren"}</span>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );

    const renderAppointmentCards = () => (
        <div className="space-y-4"> {/* Tailwind: space-y-4 */}
            {appointments.map(appointment => {
                const statusInfo = getAppointmentStatus(appointment.startTime, appointment.status);
                return (
                    <div key={appointment.id} className={`appointment-card-mobile ${statusInfo.className}`}>
                        <div className="appointment-card-header-mobile">
                            <p className="appointment-card-datetime-mobile">{formatDateForDisplay(appointment.startTime)}</p>
                            <span className={`status-badge ${statusInfo.className}`}>{statusInfo.text}</span>
                        </div>
                        <div className="appointment-card-details-mobile">
                            <p><strong>Dienstleistung:</strong> {appointment.service?.name || 'N/A'}</p>
                            {isAdmin && (
                                <>
                                    <p><strong>Kunde:</strong> {appointment.customer ? `${appointment.customer.firstName} ${appointment.customer.lastName}` : 'N/A'}</p>
                                    <p><strong>E-Mail:</strong> {appointment.customer?.email || 'N/A'}</p>
                                    <p><strong>Telefon:</strong> {appointment.customer?.phoneNumber || '-'}</p>
                                </>
                            )}
                            {appointment.notes && <p className="appointment-card-notes-mobile"><strong>Notizen:</strong> {appointment.notes}</p>}
                        </div>
                        <div className="appointment-card-actions-mobile">
                            {isAdmin && (
                                <button onClick={() => handleEditClick(appointment)} className="button-link-outline small-button">
                                    <FontAwesomeIcon icon={faEdit} /> Bearbeiten
                                </button>
                            )}
                            <button
                                onClick={() => handleDeleteOrCancelClick(appointment)}
                                className={`button-link-outline small-button ${isAdmin ? 'danger' : ''}`}
                                disabled={!isAdmin && statusInfo.className === 'status-past'}
                            >
                                <FontAwesomeIcon icon={isAdmin ? faTrashAlt : (statusInfo.className === 'status-past' ? faTimesCircle : faBan)} /> {isAdmin ? "Löschen" : "Stornieren"}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );


    return (
        <div className="appointment-list-container">
            {isAdmin && renderAdminFilters()}

            {message.text && (
                <p className={`form-message ${message.type} mb-4`}>
                    <FontAwesomeIcon icon={message.type === 'success' ? faCheckCircle : faExclamationCircle} /> {message.text}
                </p>
            )}

            {isLoading && <div className="appointment-list-loading"><FontAwesomeIcon icon={faSpinner} spin /> Termine werden geladen...</div>}
            {error && !isLoading && <div className="appointment-list-empty"><FontAwesomeIcon icon={faExclamationCircle} className="text-red-500" /> {error}</div>}

            {!isLoading && !error && appointments.length === 0 && (
                <div className="appointment-list-empty">
                    Keine Termine gefunden für die aktuellen Filter oder es sind keine Termine vorhanden.
                </div>
            )}

            {!isLoading && !error && appointments.length > 0 && (
                <>
                    <div className="hidden md:block"> {/* Tailwind: hidden on mobile, block on medium screens and up */}
                        {renderAppointmentTable()}
                    </div>
                    <div className="md:hidden"> {/* Tailwind: block on mobile, hidden on medium screens and up */}
                        {renderAppointmentCards()}
                    </div>
                </>
            )}

            {selectedAppointment && isAdmin && (
                <AppointmentEditModal
                    appointment={selectedAppointment}
                    onClose={handleCloseModal}
                    onAppointmentUpdated={handleAppointmentUpdated}
                />
            )}

            <ConfirmModal
                isOpen={showDeleteConfirmModal}
                onClose={() => {setShowDeleteConfirmModal(false); setAppointmentToDelete(null);}}
                onConfirm={confirmDeleteOrCancelAppointment}
                title="Termin Stornieren/Löschen"
                message={`Möchten Sie diesen Termin wirklich ${isAdmin ? 'endgültig löschen' : 'stornieren'}?`}
                confirmText={isAdmin ? "Ja, löschen" : "Ja, stornieren"}
                cancelText="Abbrechen"
                type="danger"
            />
        </div>
    );
}

export default AppointmentList;
