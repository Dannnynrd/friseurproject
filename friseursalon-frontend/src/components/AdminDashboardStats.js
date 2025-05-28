// src/components/AdminDashboardStats.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import './AdminDashboardStats.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartBar, faCalendarDay, faTasks, faSpinner,
    faExclamationCircle, faClock, faUsers, faEuroSign
} from '@fortawesome/free-solid-svg-icons';
import AppointmentEditModal from './AppointmentEditModal';
import { format as formatDateFns, parseISO, isValid as isValidDate } from 'date-fns'; // parseISO jetzt korrekt importiert

// Chart Komponenten importieren
import AppointmentsByDayChart from './charts/AppointmentsByDayChart';
import AppointmentsByServiceChart from './charts/AppointmentsByServiceChart';


function AdminDashboardStats({ currentUser, onAppointmentAction }) {
    const [detailedStats, setDetailedStats] = useState(null);
    const [dailyAppointments, setDailyAppointments] = useState([]);
    const [appointmentsByDayData, setAppointmentsByDayData] = useState(null);
    const [appointmentsByServiceData, setAppointmentsByServiceData] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedAppointmentForEdit, setSelectedAppointmentForEdit] = useState(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        let errorsOccurred = [];

        try {
            const detailedStatsRes = await api.get('/statistics/detailed-counts');
            setDetailedStats(detailedStatsRes.data);
        } catch (err) {
            console.error("Fehler: detaillierte Statistiken:", err);
            errorsOccurred.push('Detaillierte Statistiken konnten nicht geladen werden.');
        }

        try {
            const dailyAppointmentsRes = await api.get('/statistics/today-upcoming-appointments');
            setDailyAppointments(dailyAppointmentsRes.data.map(dto => {
                // Annahme: dto.appointmentDate ist jetzt ein String im Format "yyyy-MM-dd" vom Backend
                // und dto.startTime ist ein String im Format "HH:mm" oder ein Objekt {hour, minute}
                let reconstructedStartTime;
                if (dto.appointmentDate && dto.startTime) {
                    // Wenn startTime ein String ist:
                    const timeStr = typeof dto.startTime === 'object' ? `${String(dto.startTime.hour).padStart(2,'0')}:${String(dto.startTime.minute).padStart(2,'0')}` : dto.startTime;
                    reconstructedStartTime = `${dto.appointmentDate}T${timeStr}`;
                } else {
                    reconstructedStartTime = new Date().toISOString(); // Fallback, sollte nicht passieren
                }

                return {
                    ...dto,
                    appointmentData: { // Für das Modal
                        id: dto.appointmentId,
                        startTime: reconstructedStartTime,
                        service: { name: dto.serviceName, id: null },
                        customer: { firstName: dto.customerFirstName, lastName: dto.customerLastName, email: 'N/A' },
                        notes: ''
                    }
                };
            }));
        } catch (err) {
            console.error("Fehler: tägliche Termine:", err);
            errorsOccurred.push('Tägliche Termine konnten nicht geladen werden.');
        }

        try {
            const appByDayRes = await api.get('/statistics/by-day-of-week');
            if (appByDayRes.data && Array.isArray(appByDayRes.data)) {
                setAppointmentsByDayData({
                    labels: appByDayRes.data.map(d => d.dayName.substring(0, 2)),
                    data: appByDayRes.data.map(d => d.appointmentCount),
                });
            } else {
                errorsOccurred.push('Daten für Termine pro Wochentag fehlerhaft.');
            }
        } catch (err) {
            console.error("Fehler: Termine pro Wochentag:", err);
            errorsOccurred.push('Termine pro Wochentag konnten nicht geladen werden.');
        }

        try {
            const appByServiceRes = await api.get('/statistics/by-service?topN=5');
            if (appByServiceRes.data && Array.isArray(appByServiceRes.data)) {
                setAppointmentsByServiceData({
                    labels: appByServiceRes.data.map(s => s.serviceName),
                    data: appByServiceRes.data.map(s => s.appointmentCount),
                });
            } else {
                errorsOccurred.push('Daten für Termine pro Service fehlerhaft.');
            }
        } catch (err) {
            console.error("Fehler: Termine pro Service:", err);
            errorsOccurred.push('Termine pro Service konnten nicht geladen werden.');
        }

        if (errorsOccurred.length > 0) {
            setError(errorsOccurred.join(' | '));
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleViewDetails = async (appointmentDTO) => {
        if (!appointmentDTO || !appointmentDTO.appointmentId) {
            setError("Fehler: Details für diesen Termin konnten nicht geladen werden (fehlende ID).");
            return;
        }
        const tempLoadingKey = `loading_details_${appointmentDTO.appointmentId}`;
        setDailyAppointments(prev => prev.map(apt => apt.appointmentId === appointmentDTO.appointmentId ? {...apt, [tempLoadingKey]: true} : apt));
        try {
            const response = await api.get(`/api/appointments/${appointmentDTO.appointmentId}`);
            setSelectedAppointmentForEdit(response.data);
        } catch (err) {
            console.error(`Fehler beim Laden der Termindetails für ID ${appointmentDTO.appointmentId}:`, err);
            setError(`Details für Termin konnten nicht geladen werden. Grund: ${err.response?.data?.message || err.message}`);
            setSelectedAppointmentForEdit(null);
        } finally {
            setDailyAppointments(prev => prev.map(apt => apt.appointmentId === appointmentDTO.appointmentId ? {...apt, [tempLoadingKey]: false} : apt));
        }
    };

    const handleCloseEditModal = () => {
        setSelectedAppointmentForEdit(null);
    };

    const handleAppointmentUpdatedFromModal = () => {
        handleCloseEditModal();
        if (onAppointmentAction) {
            onAppointmentAction();
        }
        fetchData();
    };

    const formatCurrency = (value) => {
        if (value == null || isNaN(parseFloat(value))) return 'N/A';
        return `${parseFloat(value).toFixed(2)} €`;
    };

    const renderStatCards = () => {
        if (!detailedStats) return Array(7).fill(null).map((_, i) => <div key={`skeleton-${i}`} className="stat-card is-loading-skeleton" />);
        return (
            <>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <FontAwesomeIcon icon={faCalendarDay} className="stat-icon today" />
                        <span className="stat-label">Termine Heute</span>
                    </div>
                    <div className="stat-value">{detailedStats.todayCount}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <FontAwesomeIcon icon={faTasks} className="stat-icon week" />
                        <span className="stat-label">Termine diese Woche</span>
                    </div>
                    <div className="stat-value">{detailedStats.thisWeekCount}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <FontAwesomeIcon icon={faChartBar} className="stat-icon month" />
                        <span className="stat-label">Termine dieser Monat</span>
                    </div>
                    <div className="stat-value">{detailedStats.thisMonthCount}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <FontAwesomeIcon icon={faEuroSign} className="stat-icon revenue" />
                        <span className="stat-label">Umsatz Heute</span>
                    </div>
                    <div className="stat-value">{formatCurrency(detailedStats.revenueToday)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <FontAwesomeIcon icon={faEuroSign} className="stat-icon revenue" />
                        <span className="stat-label">Umsatz diese Woche</span>
                    </div>
                    <div className="stat-value">{formatCurrency(detailedStats.revenueThisWeek)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <FontAwesomeIcon icon={faEuroSign} className="stat-icon revenue" />
                        <span className="stat-label">Umsatz dieser Monat</span>
                    </div>
                    <div className="stat-value">{formatCurrency(detailedStats.revenueThisMonth)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <FontAwesomeIcon icon={faClock} className="stat-icon upcoming" />
                        <span className="stat-label">Alle Bevorstehenden</span>
                    </div>
                    <div className="stat-value">{detailedStats.totalUpcomingCount}</div>
                </div>
            </>
        );
    };

    if (isLoading && !detailedStats && dailyAppointments.length === 0 && !selectedAppointmentForEdit) {
        return (
            <div className="loading-message-stats">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                <p>Lade Dashboard-Daten...</p>
            </div>
        );
    }

    if (error && !isLoading) {
        return (
            <div className="stats-error-message">
                <FontAwesomeIcon icon={faExclamationCircle} size="2x" />
                <p>Fehler beim Laden der Dashboard-Daten:</p>
                <pre>{error}</pre>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-stats">
            {isLoading && !selectedAppointmentForEdit && (
                <div className="loading-message-stats small-list-loader" style={{marginBottom: '1rem', textAlign:'center'}}>
                    <FontAwesomeIcon icon={faSpinner} spin /> Daten werden aktualisiert...
                </div>
            )}
            <div className="stats-grid-container">
                <div className="stats-overview-cards">
                    {renderStatCards()}
                </div>
                <div className="charts-grid">
                    <div className="chart-card">
                        {appointmentsByDayData ?
                            <AppointmentsByDayChart chartData={appointmentsByDayData} /> :
                            <p>Lade Termine pro Wochentag...</p>
                        }
                    </div>
                    <div className="chart-card">
                        {appointmentsByServiceData ?
                            <AppointmentsByServiceChart chartData={appointmentsByServiceData} /> :
                            <p>Lade Termine pro Service...</p>
                        }
                    </div>
                </div>
            </div>
            <div className="daily-appointments-section">
                <h3 className="daily-appointments-heading">Heutige & Nächste Termine</h3>
                {dailyAppointments.length > 0 ? (
                    <ul className="daily-appointments-list">
                        {dailyAppointments.map(apt => {
                            // Hier sicherstellen, dass apt.startTime und apt.appointmentDate vorhanden sind
                            let displayTime = 'N/A';
                            if (apt.appointmentDate && apt.startTime) {
                                // Wenn startTime ein Objekt ist (z.B. {hour: 10, minute: 30})
                                let timeString;
                                if (typeof apt.startTime === 'object' && apt.startTime !== null) {
                                    timeString = `${String(apt.startTime.hour).padStart(2, '0')}:${String(apt.startTime.minute).padStart(2, '0')}`;
                                } else { // Wenn startTime bereits ein String "HH:mm" ist
                                    timeString = apt.startTime;
                                }
                                // parseISO benötigt einen vollständigen ISO-String oder ein Date-Objekt
                                const dateToParse = `${apt.appointmentDate}T${timeString}`;
                                if (isValidDate(parseISO(dateToParse))) {
                                    displayTime = formatDateFns(parseISO(dateToParse), 'HH:mm');
                                } else {
                                    console.warn("Ungültiges Datum für Formatierung in Terminliste:", dateToParse);
                                    displayTime = timeString; // Fallback zur rohen Zeit
                                }
                            } else if (apt.startTime) { // Fallback, falls nur apt.startTime (als String) vorhanden ist
                                displayTime = apt.startTime;
                            }

                            return (
                                <li
                                    key={apt.appointmentId}
                                    className={`daily-appointment-item ${apt.status === 'Heute' ? 'status-heute-item' : ''}`}
                                    onClick={() => handleViewDetails(apt)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleViewDetails(apt);}}
                                >
                                    {apt[`loading_details_${apt.appointmentId}`] && <FontAwesomeIcon icon={faSpinner} spin className="item-loader-icon"/>}
                                    <span className="appointment-time">{displayTime} Uhr</span>
                                    <div className="appointment-info-group">
                                        <span className="appointment-service">{apt.serviceName}</span>
                                        <span className="appointment-customer">{apt.customerFirstName} {apt.customerLastName}</span>
                                    </div>
                                    <span className={`appointment-status-tag status-${apt.status.toLowerCase().replace(/\./g, '')}`}>{apt.status}</span>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    !isLoading && <p className="no-upcoming-appointments">Keine anstehenden Termine für heute oder die nächsten Tage.</p>
                )}
            </div>
            {selectedAppointmentForEdit && currentUser?.roles?.includes("ROLE_ADMIN") && (
                <AppointmentEditModal
                    appointment={selectedAppointmentForEdit}
                    onClose={handleCloseEditModal}
                    onAppointmentUpdated={handleAppointmentUpdatedFromModal}
                />
            )}
        </div>
    );
}
export default AdminDashboardStats;