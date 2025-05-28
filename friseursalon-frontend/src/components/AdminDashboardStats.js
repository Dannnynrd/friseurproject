// src/components/AdminDashboardStats.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import './AdminDashboardStats.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine,
    faCalendarCheck,
    faCalendarWeek,
    faSpinner,
    faExclamationCircle,
    faClockFour,
    faUsers,
    faEuroSign,
    faChartPie,
    faChartColumn,
    faChartSimple
} from '@fortawesome/free-solid-svg-icons';
import AppointmentEditModal from './AppointmentEditModal';
import { format as formatDateFns, parseISO, isValid as isValidDate } from 'date-fns';
// import { de as deLocale } from 'date-fns/locale'; // Nicht unbedingt für Formatierung hier benötigt

// Chart Komponenten importieren
import AppointmentsByDayChart from './charts/AppointmentsByDayChart';
import AppointmentsByServiceChart from './charts/AppointmentsByServiceChart';

function AdminDashboardStats({ currentUser, onAppointmentAction }) {
    const [detailedStats, setDetailedStats] = useState(null);
    const [dailyAppointments, setDailyAppointments] = useState([]);
    const [appointmentsByDayData, setAppointmentsByDayData] = useState({ labels: [], data: [] });
    const [appointmentsByServiceData, setAppointmentsByServiceData] = useState({ labels: [], data: [] });

    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingModalAppointment, setIsLoadingModalAppointment] = useState(false);
    const [error, setError] = useState('');
    const [selectedAppointmentForEdit, setSelectedAppointmentForEdit] = useState(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        let errorsOccurred = [];
        console.log("[AdminDashboardStats] fetchData gestartet...");

        const todayForAPI = formatDateFns(new Date(), 'yyyy-MM-dd');

        const promises = [
            api.get('/statistics/detailed-counts').catch(err => {
                console.error("API Fehler: /statistics/detailed-counts:", err.response?.data || err.message);
                errorsOccurred.push('Kennzahlen');
                return { data: null };
            }),
            api.get('/statistics/today-upcoming-appointments').catch(err => {
                console.error("API Fehler: /statistics/today-upcoming-appointments:", err.response?.data || err.message);
                errorsOccurred.push('Tägliche Termine');
                return { data: [] };
            }),
            api.get(`/statistics/by-day-of-week?date=${todayForAPI}`).catch(err => {
                console.error("API Fehler: /statistics/by-day-of-week:", err.response?.data || err.message);
                errorsOccurred.push('Wochentags-Statistik');
                return { data: null };
            }),
            api.get(`/statistics/by-service?date=${todayForAPI}&topN=5`).catch(err => {
                console.error("API Fehler: /statistics/by-service:", err.response?.data || err.message);
                errorsOccurred.push('Service-Statistik');
                return { data: null };
            })
        ];

        try {
            const [
                detailedStatsRes,
                dailyAppointmentsRes,
                appByDayRes,
                appByServiceRes
            ] = await Promise.all(promises);

            console.log("[AdminDashboardStats] API Responses:", { detailedStatsRes, dailyAppointmentsRes, appByDayRes, appByServiceRes });

            if (detailedStatsRes && detailedStatsRes.data) {
                setDetailedStats(detailedStatsRes.data);
                console.log("[AdminDashboardStats] Verarbeitete Detailed Stats:", detailedStatsRes.data);
            } else {
                setDetailedStats(null);
            }

            if (dailyAppointmentsRes && dailyAppointmentsRes.data && Array.isArray(dailyAppointmentsRes.data)) {
                console.log("[AdminDashboardStats] Verarbeitete Rohdaten tägliche Termine:", dailyAppointmentsRes.data);
                setDailyAppointments(dailyAppointmentsRes.data.map(dto => {
                    let reconstructedStartTime;
                    if (dto.appointmentDate && dto.startTime) {
                        const datePart = String(dto.appointmentDate);
                        const timePart = typeof dto.startTime === 'object'
                            ? `${String(dto.startTime.hour).padStart(2, '0')}:${String(dto.startTime.minute).padStart(2, '0')}`
                            : String(dto.startTime).substring(0,5);
                        reconstructedStartTime = `${datePart}T${timePart}:00`;
                    } else {
                        console.warn("[AdminDashboardStats] Unvollständige Datums/Zeit-Info für DTO:", dto);
                        reconstructedStartTime = new Date().toISOString();
                    }
                    return { ...dto, reconstructedStartTime };
                }));
            } else {
                console.log("[AdminDashboardStats] Keine täglichen Termine empfangen oder Fehlerhafte Datenstruktur.");
                setDailyAppointments([]);
            }

            if (appByDayRes && appByDayRes.data && Array.isArray(appByDayRes.data)) {
                console.log("[AdminDashboardStats] Verarbeitete Wochentags-Statistik Rohdaten:", appByDayRes.data);
                setAppointmentsByDayData({
                    labels: appByDayRes.data.map(d => d.dayName ? d.dayName.substring(0, 2) : "Unb."),
                    data: appByDayRes.data.map(d => d.appointmentCount || 0),
                });
            } else {
                setAppointmentsByDayData({ labels: [], data: [] });
            }

            if (appByServiceRes && appByServiceRes.data && Array.isArray(appByServiceRes.data)) {
                console.log("[AdminDashboardStats] Verarbeitete Service-Statistik Rohdaten:", appByServiceRes.data);
                setAppointmentsByServiceData({
                    labels: appByServiceRes.data.map(s => s.serviceName || "Unbekannt"),
                    data: appByServiceRes.data.map(s => s.appointmentCount || 0),
                });
            } else {
                setAppointmentsByServiceData({ labels: [], data: [] });
            }

        } catch (generalError) {
            console.error("[AdminDashboardStats] Allgemeiner Fehler beim Verarbeiten der Statistikdaten:", generalError);
            errorsOccurred.push('Allgemeiner Datenverarbeitungsfehler.');
        }

        if (errorsOccurred.length > 0) {
            setError(`Fehler beim Laden: ${errorsOccurred.join(', ')}.`);
        }
        setIsLoading(false);
        console.log("[AdminDashboardStats] fetchData abgeschlossen. Aktueller Error State:", error);
        console.log("[AdminDashboardStats] Aktuelle Chart Daten (Tag):", appointmentsByDayData);
        console.log("[AdminDashboardStats] Aktuelle Chart Daten (Service):", appointmentsByServiceData);
        console.log("[AdminDashboardStats] Aktuelle Tägliche Termine:", dailyAppointments);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Entferne Abhängigkeiten, um Endlosschleife zu vermeiden, wenn error/chartData sich ändern

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onAppointmentAction]);

    const handleViewDetails = async (appointmentDTO) => {
        if (!appointmentDTO || !appointmentDTO.appointmentId) {
            setError("Fehler: Details für diesen Termin konnten nicht geladen werden (fehlende ID).");
            return;
        }
        setIsLoadingModalAppointment(true);
        try {
            // KORREKTUR HIER: Entferne das doppelte /api
            const response = await api.get(`/appointments/${appointmentDTO.appointmentId}`);
            if (response.data) {
                setSelectedAppointmentForEdit(response.data);
            } else {
                throw new Error("Keine vollständigen Termindaten vom Server erhalten.");
            }
        } catch (err) {
            console.error(`Fehler beim Laden der Termindetails für ID ${appointmentDTO.appointmentId}:`, err);
            setError(`Details für Termin konnten nicht geladen werden. Grund: ${err.response?.data?.message || err.message}`);
            setSelectedAppointmentForEdit(null);
        } finally {
            setIsLoadingModalAppointment(false);
        }
    };

    const handleCloseEditModal = () => setSelectedAppointmentForEdit(null);

    const handleAppointmentUpdatedFromModal = () => {
        handleCloseEditModal();
        if (onAppointmentAction) onAppointmentAction();
    };

    const formatCurrency = (value) => {
        if (value == null || isNaN(parseFloat(value))) return 'N/A';
        return `${parseFloat(value).toFixed(2)} €`;
    };

    const renderStatCards = () => {
        if (!detailedStats && isLoading) {
            return Array(7).fill(null).map((_, i) => (
                <div key={`skeleton-stat-${i}`} className="stat-card is-loading-skeleton">
                    <div className="stat-card-header-skeleton"></div>
                    <div className="stat-value-skeleton"></div>
                </div>
            ));
        }
        if (!detailedStats) return <p className="stat-card-no-data">Kennzahlen nicht verfügbar.</p>;

        return (
            <>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <FontAwesomeIcon icon={faCalendarCheck} className="stat-icon today" />
                        <span className="stat-label">Termine Heute</span>
                    </div>
                    <div className="stat-value">{detailedStats.todayCount}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <FontAwesomeIcon icon={faCalendarWeek} className="stat-icon week" />
                        <span className="stat-label">Termine diese Woche</span>
                    </div>
                    <div className="stat-value">{detailedStats.thisWeekCount}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-header">
                        <FontAwesomeIcon icon={faChartSimple} className="stat-icon month" />
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
                        <FontAwesomeIcon icon={faClockFour} className="stat-icon upcoming" />
                        <span className="stat-label">Alle Bevorstehenden</span>
                    </div>
                    <div className="stat-value">{detailedStats.totalUpcomingCount}</div>
                </div>
            </>
        );
    };

    const showInitialLoader = isLoading && !detailedStats && dailyAppointments.length === 0 &&
        (!appointmentsByDayData || appointmentsByDayData.labels.length === 0) &&
        (!appointmentsByServiceData || appointmentsByServiceData.labels.length === 0);

    if (showInitialLoader) {
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
                <FontAwesomeIcon icon={faExclamationCircle} size="lg" />
                <p>Fehler beim Laden der Dashboard-Daten:</p>
                <pre>{error}</pre>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-stats">
            {(isLoading && !selectedAppointmentForEdit) && (
                <div className="loading-indicator-top">
                    <FontAwesomeIcon icon={faSpinner} spin /> Daten werden aktualisiert...
                </div>
            )}

            <div className="stats-main-layout">
                <div className="stats-overview-cards-wrapper">
                    <h3 className="stats-section-title">
                        <FontAwesomeIcon icon={faChartLine} /> Kennzahlen
                    </h3>
                    {(!isLoading && !detailedStats && !error) && <p className="stat-card-no-data">Keine Kennzahlen verfügbar.</p>}
                    {detailedStats && <div className="stats-overview-cards">{renderStatCards()}</div>}
                </div>

                <div className="charts-section-wrapper">
                    <h3 className="stats-section-title">
                        <FontAwesomeIcon icon={faChartPie} /> Visuelle Analysen
                    </h3>
                    <div className="charts-grid">
                        <div className="chart-card">
                            {isLoading && (!appointmentsByDayData || appointmentsByDayData.labels.length === 0) ? <div className="chart-loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin /></div> :
                                (appointmentsByDayData && appointmentsByDayData.labels.length > 0) ? <AppointmentsByDayChart chartData={appointmentsByDayData} /> : <p className="chart-no-data-message">Keine Wochentagsdaten für Chart.</p>}
                        </div>
                        <div className="chart-card">
                            {isLoading && (!appointmentsByServiceData || appointmentsByServiceData.labels.length === 0) ? <div className="chart-loading-placeholder"><FontAwesomeIcon icon={faSpinner} spin /></div> :
                                (appointmentsByServiceData && appointmentsByServiceData.labels.length > 0) ? <AppointmentsByServiceChart chartData={appointmentsByServiceData} /> : <p className="chart-no-data-message">Keine Servicedaten für Chart.</p>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="daily-appointments-section">
                <h3 className="daily-appointments-heading">Heutige & Nächste Termine</h3>
                {isLoading && dailyAppointments.length === 0 ? (
                    <div className="loading-message-stats small-list-loader">
                        <FontAwesomeIcon icon={faSpinner} spin /> Termine werden geladen...
                    </div>
                ) : dailyAppointments.length > 0 ? (
                    <ul className="daily-appointments-list">
                        {dailyAppointments.map(apt => {
                            let displayTime = 'N/A';
                            if (apt.appointmentDate && apt.startTime) {
                                const timeStr = typeof apt.startTime === 'object'
                                    ? `${String(apt.startTime.hour).padStart(2, '0')}:${String(apt.startTime.minute).padStart(2, '0')}`
                                    : String(apt.startTime).substring(0,5);
                                const dateToParse = `${String(apt.appointmentDate)}T${timeStr}`;
                                if (isValidDate(parseISO(dateToParse))) {
                                    displayTime = formatDateFns(parseISO(dateToParse), 'HH:mm');
                                } else {
                                    console.warn("[AdminDashboardStats] Ungültiges Datum für Formatierung in Terminliste:", dateToParse, "Original DTO:", apt);
                                    displayTime = timeStr;
                                }
                            } else if (apt.startTime) {
                                displayTime = typeof apt.startTime === 'object'
                                    ? `${String(apt.startTime.hour).padStart(2, '0')}:${String(apt.startTime.minute).padStart(2, '0')}`
                                    : String(apt.startTime).substring(0,5);
                            }

                            return (
                                <li
                                    key={apt.appointmentId}
                                    className={`daily-appointment-item ${apt.status === 'Heute' ? 'status-heute-item' : ''}`}
                                    onClick={() => handleViewDetails(apt)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleViewDetails(apt); }}
                                >
                                    {isLoadingModalAppointment && selectedAppointmentForEdit?.id === apt.appointmentId && <FontAwesomeIcon icon={faSpinner} spin className="item-loader-icon" />}
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
