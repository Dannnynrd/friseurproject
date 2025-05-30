// File: src/components/AppointmentList.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api.service';
import AppointmentEditModal from './AppointmentEditModal';
import ConfirmModal from './ConfirmModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit, faTrashAlt, faBan, faFilter, faCalendarDay,
    faSyncAlt, faTimesCircle, faSpinner, faExclamationCircle,
    faCheckCircle, faChevronDown, faChevronUp,
    faCalendarWeek, faCalendarCheck, faHistory, faSearch // faSearch hinzugefügt
} from '@fortawesome/free-solid-svg-icons';
import { format, parseISO, isValid, startOfDay, endOfDay, startOfWeek, endOfWeek, isPast, isToday, isFuture } from 'date-fns';
import { de } from 'date-fns/locale';
import './AppointmentList.css';

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
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);

    // Admin filter states
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [activeQuickFilter, setActiveQuickFilter] = useState(QUICK_FILTER_OPTIONS.ALL);
    const [searchTerm, setSearchTerm] = useState(''); // NEU: Suchbegriff-State

    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [appointmentToDelete, setAppointmentToDelete] = useState(null);

    const isAdmin = useMemo(() => currentUser && currentUser.roles && currentUser.roles.includes("ROLE_ADMIN"), [currentUser]);

    const fetchAppointments = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setMessage({ type: '', text: '' });
        // setAppointments([]); // Nicht leeren, um Flackern zu vermeiden, wenn nur gefiltert wird

        let params = {};
        let endpoint = 'appointments/my-appointments'; // Standard-Endpunkt

        if (isAdmin) {
            // Logik für Datumsfilter (Quick oder Advanced)
            if (activeQuickFilter === QUICK_FILTER_OPTIONS.TODAY) {
                params.start = format(startOfDay(new Date()), 'yyyy-MM-dd');
                params.end = format(endOfDay(new Date()), 'yyyy-MM-dd');
                endpoint = 'appointments/by-date-range';
            } else if (activeQuickFilter === QUICK_FILTER_OPTIONS.THIS_WEEK) {
                params.start = format(startOfWeek(new Date(), { weekStartsOn: 1, locale: de }), 'yyyy-MM-dd');
                params.end = format(endOfWeek(new Date(), { weekStartsOn: 1, locale: de }), 'yyyy-MM-dd');
                endpoint = 'appointments/by-date-range';
            } else if (filterStartDate && filterEndDate) {
                params.start = filterStartDate;
                params.end = filterEndDate;
                endpoint = 'appointments/by-date-range';
            }
            // Wenn 'ALL', 'UPCOMING', 'PAST' ohne explizite Daten, wird der Standard-Admin-Endpunkt verwendet,
            // der alle Termine zurückgibt, und dann clientseitig gefiltert.
        }

        try {
            const response = await api.get(endpoint, { params });
            let fetchedAppointments = response.data.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

            // Client-seitige Filterung für Admin (Suche, und UPCOMING/PAST ohne Datumsbereich)
            if (isAdmin) {
                if (searchTerm) {
                    fetchedAppointments = fetchedAppointments.filter(apt =>
                        (apt.customer?.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                        (apt.customer?.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                        (apt.customer?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                        (apt.service?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                    );
                }
                if (!(filterStartDate && filterEndDate)) { // Nur filtern, wenn kein expliziter Datumsbereich gesetzt ist
                    if (activeQuickFilter === QUICK_FILTER_OPTIONS.UPCOMING) {
                        fetchedAppointments = fetchedAppointments.filter(apt => isFuture(parseISO(apt.startTime)) || isToday(parseISO(apt.startTime)));
                    } else if (activeQuickFilter === QUICK_FILTER_OPTIONS.PAST) {
                        fetchedAppointments = fetchedAppointments.filter(apt => isPast(parseISO(apt.startTime)) && !isToday(parseISO(apt.startTime)));
                    }
                }
            }
            setAppointments(fetchedAppointments);
        } catch (err) {
            console.error("Fehler beim Abrufen der Termine:", err);
            setError(err.response?.data?.message || "Termine konnten nicht geladen werden.");
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, isAdmin, filterStartDate, filterEndDate, activeQuickFilter, searchTerm]); // searchTerm hinzugefügt

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments, refreshTrigger]);

    // Debounced search effect
    useEffect(() => {
        const handler = setTimeout(() => {
            if (isAdmin) { // Nur für Admin die Suche auslösen
                fetchAppointments();
            }
        }, 500); // 500ms Verzögerung
        return () => clearTimeout(handler);
    }, [searchTerm, isAdmin, fetchAppointments]);


    const handleApplyDateFilter = () => {
        setActiveQuickFilter(''); // Benutzerdefinierter Bereich, kein Schnellfilter aktiv
        fetchAppointments();
        // setShowAdvancedFilters(false); // Optional: Filter nach Anwendung schließen
    };

    const handleClearDateFilters = () => {
        setFilterStartDate('');
        setFilterEndDate('');
        setActiveQuickFilter(QUICK_FILTER_OPTIONS.ALL); // Zurück zu "Alle"
        // fetchAppointments wird durch useEffect ausgelöst
    };

    const handleQuickFilterChange = (filter) => {
        setFilterStartDate('');
        setFilterEndDate('');
        setActiveQuickFilter(filter);
        // fetchAppointments wird durch useEffect ausgelöst
    };

    const handleDeleteOrCancelClick = (appointment) => {
        setAppointmentToDelete(appointment);
        setShowDeleteConfirmModal(true);
    };

    const confirmDeleteOrCancelAppointment = async () => {
        if (!appointmentToDelete) return;
        setMessage({ type: '', text: '' });
        setIsLoading(true);
        try {
            await api.delete(`appointments/${appointmentToDelete.id}`);
            setShowDeleteConfirmModal(false);
            setAppointmentToDelete(null);
            setMessage({type: 'success', text: 'Termin erfolgreich storniert/gelöscht.'});
            if (onAppointmentModified) onAppointmentModified();
            else fetchAppointments();
        } catch (err) {
            console.error("Fehler beim Stornieren/Löschen des Termins:", err);
            const errorMsg = err.response?.data?.message || "Fehler beim Stornieren/Löschen.";
            setMessage({type: 'error', text: errorMsg});
            setShowDeleteConfirmModal(false);
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
        // Annahme: appointment.status vom Backend könnte 'CANCELLED', 'COMPLETED', etc. sein.
        if (appointmentStatusValue === 'CANCELLED') {
            return { text: 'Storniert', className: 'status-cancelled', icon: faTimesCircle };
        }
        if (appointmentStatusValue === 'COMPLETED') { // Falls Sie diesen Status verwenden
            return { text: 'Abgeschlossen', className: 'status-completed', icon: faCheckCircle };
        }

        const now = new Date();
        const appointmentDate = parseISO(startTime);
        if (!isValid(appointmentDate)) return { text: 'Unbekannt', className: 'status-unknown', icon: faExclamationCircle };

        if (isPast(appointmentDate) && !isToday(appointmentDate)) {
            return { text: 'Vergangen', className: 'status-past', icon: faHistory };
        }
        return { text: 'Anstehend', className: 'status-upcoming', icon: faCalendarCheck };
    };

    const renderAdminFilters = () => (
        <div className="admin-appointment-controls">
            <div className="filter-section search-and-quick-filters">
                <div className="search-input-container admin-search">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Suche (Kunde, Service)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="admin-search-input"
                    />
                </div>
                <div className="quick-filter-buttons">
                    <button onClick={() => handleQuickFilterChange(QUICK_FILTER_OPTIONS.ALL)} className={`quick-filter-btn ${activeQuickFilter === QUICK_FILTER_OPTIONS.ALL ? 'active' : ''}`}>Alle</button>
                    <button onClick={() => handleQuickFilterChange(QUICK_FILTER_OPTIONS.TODAY)} className={`quick-filter-btn ${activeQuickFilter === QUICK_FILTER_OPTIONS.TODAY ? 'active' : ''}`}><FontAwesomeIcon icon={faCalendarDay}/> Heute</button>
                    <button onClick={() => handleQuickFilterChange(QUICK_FILTER_OPTIONS.THIS_WEEK)} className={`quick-filter-btn ${activeQuickFilter === QUICK_FILTER_OPTIONS.THIS_WEEK ? 'active' : ''}`}><FontAwesomeIcon icon={faCalendarWeek}/> Woche</button>
                    <button onClick={() => handleQuickFilterChange(QUICK_FILTER_OPTIONS.UPCOMING)} className={`quick-filter-btn ${activeQuickFilter === QUICK_FILTER_OPTIONS.UPCOMING ? 'active' : ''}`}><FontAwesomeIcon icon={faCalendarCheck}/> Anstehend</button>
                    <button onClick={() => handleQuickFilterChange(QUICK_FILTER_OPTIONS.PAST)} className={`quick-filter-btn ${activeQuickFilter === QUICK_FILTER_OPTIONS.PAST ? 'active' : ''}`}><FontAwesomeIcon icon={faHistory}/> Vergangen</button>
                </div>
            </div>

            <div className="filter-controls-header">
                <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="button-link-outline small-button filter-toggle-button"
                    aria-expanded={showAdvancedFilters}
                >
                    <FontAwesomeIcon icon={showAdvancedFilters ? faChevronUp : faChevronDown} />
                    {showAdvancedFilters ? 'Datumsfilter ausblenden' : 'Nach Datum filtern'}
                </button>
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
                        <button onClick={handleClearDateFilters} className="button-link-outline small-button" disabled={isLoading}>
                            <FontAwesomeIcon icon={faSyncAlt} /> Zurücksetzen
                        </button>
                        <button onClick={handleApplyDateFilter} className="button-link small-button" disabled={isLoading || !filterStartDate || !filterEndDate}>
                            <FontAwesomeIcon icon={faFilter} /> Anwenden
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
                        <tr key={appointment.id} className={`appointment-row ${statusInfo.className}`}>
                            {isAdmin && <td data-label="Status:"><span className={`status-badge ${statusInfo.className}`}><FontAwesomeIcon icon={statusInfo.icon} className="mr-1.5"/>{statusInfo.text}</span></td>}
                            <td data-label="Datum & Zeit:">{formatDateForDisplay(appointment.startTime)}</td>
                            <td data-label="Dienstleistung:">{appointment.service?.name || 'N/A'}</td>
                            {isAdmin && <>
                                <td data-label="Kunde:">{appointment.customer ? `${appointment.customer.firstName} ${appointment.customer.lastName}` : 'N/A'}</td>
                                <td data-label="E-Mail:">{appointment.customer?.email || 'N/A'}</td>
                                <td data-label="Telefon:">{appointment.customer?.phoneNumber || '-'}</td>
                            </>}
                            <td data-label="Notizen:" className="notes-cell" title={appointment.notes}>{appointment.notes || '-'}</td>
                            <td data-label="Aktionen:">
                                <div className="action-buttons-table">
                                    {isAdmin && (
                                        <button onClick={() => handleEditClick(appointment)} className="button-link-outline small-button icon-button" title="Bearbeiten">
                                            <FontAwesomeIcon icon={faEdit} /><span className="action-button-text">Bearbeiten</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteOrCancelClick(appointment)}
                                        className={`button-link-outline small-button icon-button ${isAdmin ? 'danger' : ''}`}
                                        title={isAdmin ? "Löschen" : "Stornieren"}
                                        disabled={!isAdmin && statusInfo.className === 'status-past'}
                                    >
                                        <FontAwesomeIcon icon={isAdmin ? faTrashAlt : (statusInfo.className === 'status-past' ? faTimesCircle : faBan)} />
                                        <span className="action-button-text">{isAdmin ? "Löschen" : "Stornieren"}</span>
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
        <div className="appointment-cards-grid">
            {appointments.map(appointment => {
                const statusInfo = getAppointmentStatus(appointment.startTime, appointment.status);
                return (
                    <div key={appointment.id} className={`appointment-card-mobile ${statusInfo.className}`}>
                        <div className="appointment-card-header-mobile">
                            <p className="appointment-card-datetime-mobile">{formatDateForDisplay(appointment.startTime)}</p>
                            <span className={`status-badge ${statusInfo.className}`}><FontAwesomeIcon icon={statusInfo.icon} className="mr-1"/>{statusInfo.text}</span>
                        </div>
                        <div className="appointment-card-details-mobile">
                            <p><strong>Dienstleistung:</strong> {appointment.service?.name || 'N/A'}</p>
                            {isAdmin && (
                                <>
                                    <p><strong>Kunde:</strong> {appointment.customer ? `${appointment.customer.firstName} ${appointment.customer.lastName}` : 'N/A'}</p>
                                    {/* E-Mail und Telefon können hier auch angezeigt werden, wenn gewünscht */}
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
                    <div className="hidden md:block">
                        {renderAppointmentTable()}
                    </div>
                    <div className="md:hidden">
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
