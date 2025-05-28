// src/components/AdminDashboardStats.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import './AdminDashboardStats.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine, faCalendarCheck, faCalendarWeek, faSpinner,
    faExclamationCircle, faClockFour, faEuroSign,
    faChartPie, faChartBar, faListAlt, faCalendarAlt,
    faFilter, faArrowUp, faArrowDown, faEquals, faCoins // faCoins für Ø-Umsatz
} from '@fortawesome/free-solid-svg-icons';
import AppointmentEditModal from './AppointmentEditModal';
import { format as formatDateFns, parseISO, isValid as isValidDate, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, addMonths, formatISO } from 'date-fns';
import { de as deLocale } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import AppointmentsByDayRechart from './charts/AppointmentsByDayRechart';
import AppointmentsByServiceRechart from './charts/AppointmentsByServiceRechart';

registerLocale('de', deLocale);

const PERIOD_OPTIONS = {
    TODAY: 'today',
    LAST_7_DAYS: 'last7days',
    LAST_30_DAYS: 'last30days',
    THIS_MONTH: 'thisMonth',
    NEXT_MONTH: 'nextMonth', // NEU
    LAST_MONTH: 'lastMonth',
    CUSTOM: 'custom',
};

const PERIOD_LABELS = {
    [PERIOD_OPTIONS.TODAY]: 'Heute',
    [PERIOD_OPTIONS.LAST_7_DAYS]: 'Letzte 7 Tage',
    [PERIOD_OPTIONS.LAST_30_DAYS]: 'Letzte 30 Tage',
    [PERIOD_OPTIONS.THIS_MONTH]: 'Dieser Monat',
    [PERIOD_OPTIONS.NEXT_MONTH]: 'Nächster Monat',
    [PERIOD_OPTIONS.LAST_MONTH]: 'Letzter Monat',
    [PERIOD_OPTIONS.CUSTOM]: 'Benutzerdefiniert',
};

const getDatesForPeriod = (period) => {
    const today = new Date();
    let startDate, endDate = today;

    switch (period) {
        case PERIOD_OPTIONS.TODAY:
            startDate = today;
            endDate = today;
            break;
        case PERIOD_OPTIONS.LAST_7_DAYS:
            startDate = subDays(today, 6);
            endDate = today;
            break;
        case PERIOD_OPTIONS.LAST_30_DAYS:
            startDate = subDays(today, 29);
            endDate = today;
            break;
        case PERIOD_OPTIONS.THIS_MONTH:
            startDate = startOfMonth(today);
            endDate = endOfMonth(today);
            break;
        case PERIOD_OPTIONS.NEXT_MONTH: // NEU
            const firstDayNextMonth = startOfMonth(addMonths(today, 1));
            startDate = firstDayNextMonth;
            endDate = endOfMonth(firstDayNextMonth);
            break;
        case PERIOD_OPTIONS.LAST_MONTH:
            const firstDayLastMonth = startOfMonth(subMonths(today, 1));
            startDate = firstDayLastMonth;
            endDate = endOfMonth(firstDayLastMonth);
            break;
        default:
            startDate = today;
            endDate = today;
    }
    return {
        startDate: formatISO(startDate, { representation: 'date' }),
        endDate: formatISO(endDate, { representation: 'date' })
    };
};


function AdminDashboardStats({ currentUser, onAppointmentAction }) {
    const [detailedStats, setDetailedStats] = useState(null);
    const [dailyAppointments, setDailyAppointments] = useState([]);
    const [appointmentsByDayData, setAppointmentsByDayData] = useState({ labels: [], data: [] });
    const [appointmentsByServiceData, setAppointmentsByServiceData] = useState({ labels: [], data: [] });

    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingModalAppointment, setIsLoadingModalAppointment] = useState(false);
    const [error, setError] = useState('');
    const [selectedAppointmentForEdit, setSelectedAppointmentForEdit] = useState(null);

    const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_OPTIONS.THIS_MONTH);
    const [customStartDate, setCustomStartDate] = useState(null);
    const [customEndDate, setCustomEndDate] = useState(null);
    const [showCustomDatePickers, setShowCustomDatePickers] = useState(false);

    const fetchData = useCallback(async (period, sDate, eDate) => {
        setIsLoading(true);
        setError('');

        let queryStartDate, queryEndDate;

        if (period === PERIOD_OPTIONS.CUSTOM) {
            if (sDate && eDate) {
                queryStartDate = formatISO(sDate, { representation: 'date' });
                queryEndDate = formatISO(eDate, { representation: 'date' });
            } else {
                setIsLoading(false);
                return;
            }
        } else {
            const dates = getDatesForPeriod(period);
            queryStartDate = dates.startDate;
            queryEndDate = dates.endDate;
        }

        console.log(`[AdminDashboardStats] Abfrage für Zeitraum: ${queryStartDate} bis ${queryEndDate}`);

        const promises = [
            api.get('/statistics/detailed-counts', { params: { startDate: queryStartDate, endDate: queryEndDate } }),
            api.get('/statistics/today-upcoming-appointments'),
            api.get(`/statistics/by-day-of-week`, { params: { startDate: queryStartDate, endDate: queryEndDate } }), // Backend muss das unterstützen
            api.get(`/statistics/by-service`, { params: { startDate: queryStartDate, endDate: queryEndDate, topN: 5 } }) // Backend muss das unterstützen
        ];

        try {
            const responses = await Promise.allSettled(promises);
            const [
                detailedStatsRes,
                dailyAppointmentsRes,
                appByDayRes,
                appByServiceRes
            ] = responses;

            if (detailedStatsRes.status === 'fulfilled' && detailedStatsRes.value.data) {
                setDetailedStats(detailedStatsRes.value.data);
            } else {
                setDetailedStats(null);
                setError(prev => prev ? `${prev}, Kennzahlen` : 'Fehler beim Laden: Kennzahlen');
            }

            if (dailyAppointmentsRes.status === 'fulfilled' && dailyAppointmentsRes.value.data) {
                setDailyAppointments(dailyAppointmentsRes.value.data.map(dto => {
                    let reconstructedStartTime;
                    if (dto.appointmentDate && dto.startTime) {
                        const datePart = String(dto.appointmentDate);
                        const timePart = typeof dto.startTime === 'object'
                            ? `${String(dto.startTime.hour).padStart(2, '0')}:${String(dto.startTime.minute).padStart(2, '0')}`
                            : String(dto.startTime).substring(0,5);
                        reconstructedStartTime = `${datePart}T${timePart}:00`;
                    } else {
                        reconstructedStartTime = new Date().toISOString();
                    }
                    return { ...dto, reconstructedStartTime };
                }));
            }

            if (appByDayRes.status === 'fulfilled' && appByDayRes.value.data) {
                setAppointmentsByDayData({
                    labels: appByDayRes.value.data.map(d => d.dayName ? d.dayName.substring(0, 2) : "Unb."),
                    data: appByDayRes.value.data.map(d => d.appointmentCount || 0),
                });
            } else {
                setAppointmentsByDayData({ labels: [], data: [] });
            }

            if (appByServiceRes.status === 'fulfilled' && appByServiceRes.value.data) {
                setAppointmentsByServiceData({
                    labels: appByServiceRes.value.data.map(s => s.serviceName || "Unbekannt"),
                    data: appByServiceRes.value.data.map(s => s.appointmentCount || 0),
                });
            } else {
                setAppointmentsByServiceData({ labels: [], data: [] });
            }

        } catch (generalError) {
            setError('Ein allgemeiner Fehler ist aufgetreten.');
        } finally {
            setIsLoading(false);
        }
    }, []); // Leeres Array, da Abhängigkeiten in handlePeriodChange etc. verwaltet werden

    useEffect(() => {
        if (selectedPeriod === PERIOD_OPTIONS.CUSTOM) {
            if (customStartDate && customEndDate && customEndDate >= customStartDate) {
                fetchData(selectedPeriod, customStartDate, customEndDate);
            }
        } else {
            fetchData(selectedPeriod);
        }
    }, [selectedPeriod, customStartDate, customEndDate, onAppointmentAction, fetchData]);


    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        if (period === PERIOD_OPTIONS.CUSTOM) {
            setShowCustomDatePickers(true);
        } else {
            setShowCustomDatePickers(false);
            setCustomStartDate(null);
            setCustomEndDate(null);
        }
    };

    const handleViewDetails = async (appointmentDTO) => {
        if (!appointmentDTO || !appointmentDTO.appointmentId) {
            setError("Details für diesen Termin konnten nicht geladen werden (fehlende ID).");
            return;
        }
        setIsLoadingModalAppointment(true);
        try {
            const response = await api.get(`/appointments/${appointmentDTO.appointmentId}`);
            setSelectedAppointmentForEdit(response.data || null);
        } catch (err) {
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
        if (value == null || isNaN(parseFloat(value))) return '0,00 €';
        return `${parseFloat(value).toFixed(2).replace('.', ',')} €`;
    };

    const renderComparison = (changePercentage, previousValue) => {
        const hasPreviousData = previousValue !== null && previousValue !== undefined;
        let changeText = 'vs. Vorp.: N/A';
        let icon = faEquals;
        let colorClass = 'neutral';

        if(hasPreviousData){
            if (changePercentage === null || changePercentage === undefined) {
                changeText = 'vs. 0';
                icon = faArrowUp;
                colorClass = 'positive';
            } else {
                const isPositive = changePercentage > 0;
                const isNegative = changePercentage < 0;
                icon = isPositive ? faArrowUp : (isNegative ? faArrowDown : faEquals);
                colorClass = isPositive ? 'positive' : (isNegative ? 'negative' : 'neutral');
                changeText = `${changePercentage.toFixed(1).replace('.', ',')}%`;
            }
        }

        return (
            <span className={`comparison-data ${colorClass}`}>
                <FontAwesomeIcon icon={icon} /> {changeText}
            </span>
        );
    };

    const renderStatCards = () => {
        if (!detailedStats && isLoading && selectedPeriod !== PERIOD_OPTIONS.CUSTOM) {
            return Array(6).fill(null).map((_, i) => (
                <div key={`skeleton-stat-${i}`} className="stat-card is-loading-skeleton">
                    <div className="stat-card-header-skeleton"></div>
                    <div className="stat-value-skeleton"></div>
                    <div className="stat-comparison-skeleton"></div>
                </div>
            ));
        }
        if (!detailedStats) return <p className="stat-card-no-data">Keine Kennzahlen verfügbar für den gewählten Zeitraum.</p>;

        const avgRevenue = (detailedStats.totalAppointmentsInPeriod > 0)
            ? (parseFloat(detailedStats.totalRevenueInPeriod) / detailedStats.totalAppointmentsInPeriod)
            : 0;

        const mainKpis = [
            {
                label: "Termine",
                value: detailedStats.totalAppointmentsInPeriod ?? 'N/A',
                icon: faCalendarCheck,
                comparison: renderComparison(detailedStats.appointmentCountChangePercentage, detailedStats.previousPeriodTotalAppointments),
            },
            {
                label: "Umsatz",
                value: formatCurrency(detailedStats.totalRevenueInPeriod),
                icon: faEuroSign,
                comparison: renderComparison(detailedStats.revenueChangePercentage, detailedStats.previousPeriodTotalRevenue),
            },
            {
                label: "Ø-Umsatz / Termin",
                value: formatCurrency(avgRevenue),
                icon: faCoins,
            }
        ];

        const additionalKpis = [
            { label: "Termine Heute", value: detailedStats.todayCount ?? 'N/A', icon: faCalendarCheck },
            { label: "Umsatz Heute", value: formatCurrency(detailedStats.revenueToday ?? 0), icon: faEuroSign },
            { label: "Bevorstehend", value: detailedStats.totalUpcomingCount ?? 'N/A', icon: faClockFour },
        ];


        return (
            <>
                {mainKpis.map(kpi => (
                    <div key={kpi.label} className="stat-card">
                        <div className="stat-card-header">
                            <FontAwesomeIcon icon={kpi.icon} className="stat-icon" />
                            <span className="stat-label">{kpi.label}</span>
                        </div>
                        <div className="stat-value">{kpi.value}</div>
                        {kpi.comparison && <div className="stat-comparison">{kpi.comparison}</div>}
                    </div>
                ))}
                {additionalKpis.map(kpi => (
                    <div key={kpi.label} className="stat-card small-kpi">
                        <div className="stat-card-header">
                            <FontAwesomeIcon icon={kpi.icon} className="stat-icon" />
                            <span className="stat-label">{kpi.label}</span>
                        </div>
                        <div className="stat-value">{kpi.value}</div>
                    </div>
                ))}
            </>
        );
    };

    const showInitialLoader = isLoading && !detailedStats;

    if (showInitialLoader && !(selectedPeriod === PERIOD_OPTIONS.CUSTOM && (!customStartDate || !customEndDate))) {
        return (
            <div className="loading-message-stats">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                <p>Lade Dashboard-Daten...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-stats">
            <div className="stats-period-filter-bar">
                <div className="period-buttons">
                    {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                        key !== PERIOD_OPTIONS.CUSTOM &&
                        <button key={key} onClick={() => handlePeriodChange(key)} className={selectedPeriod === key ? 'active' : ''}>
                            {label}
                        </button>
                    ))}
                    <button onClick={() => handlePeriodChange(PERIOD_OPTIONS.CUSTOM)} className={selectedPeriod === PERIOD_OPTIONS.CUSTOM ? 'active' : ''}>
                        <FontAwesomeIcon icon={faCalendarAlt} /> {PERIOD_LABELS.CUSTOM}
                    </button>
                </div>
                {showCustomDatePickers && (
                    <div className="custom-date-pickers">
                        <DatePicker
                            selected={customStartDate}
                            onChange={(date) => setCustomStartDate(date)}
                            selectsStart
                            startDate={customStartDate}
                            endDate={customEndDate}
                            dateFormat="dd.MM.yyyy"
                            locale="de"
                            placeholderText="Startdatum"
                            className="date-picker-input"
                            maxDate={addMonths(new Date(), 6)}
                        />
                        <DatePicker
                            selected={customEndDate}
                            onChange={(date) => setCustomEndDate(date)}
                            selectsEnd
                            startDate={customStartDate}
                            endDate={customEndDate}
                            minDate={customStartDate}
                            maxDate={addMonths(new Date(), 6)}
                            dateFormat="dd.MM.yyyy"
                            locale="de"
                            placeholderText="Enddatum"
                            className="date-picker-input"
                        />
                    </div>
                )}
            </div>

            {(isLoading && !showInitialLoader) && (
                <div className="loading-indicator-top">
                    <FontAwesomeIcon icon={faSpinner} spin /> Daten werden aktualisiert...
                </div>
            )}
            {error && (
                <p className="form-message error mb-4" style={{ marginBottom: '1rem' }}>
                    <FontAwesomeIcon icon={faExclamationCircle} style={{ marginRight: '0.5rem' }} /> {error}
                </p>
            )}

            <div className="stats-main-layout">
                <div className="stats-overview-cards-wrapper">
                    <h3 className="stats-section-title">
                        <span><FontAwesomeIcon icon={faChartLine} /> Kennzahlen</span>
                        {detailedStats && detailedStats.periodStartDateFormatted && (
                            <span className="stats-period-display">
                                ({detailedStats.periodStartDateFormatted} - {detailedStats.periodEndDateFormatted})
                             </span>
                        )}
                    </h3>
                    <div className="stats-overview-cards">{renderStatCards()}</div>
                </div>

                <div className="charts-section-wrapper">
                    <h3 className="stats-section-title">
                        <span><FontAwesomeIcon icon={faChartPie} /> Visuelle Analysen</span>
                        {detailedStats && (
                            <span className="stats-period-display">
                                ({PERIOD_LABELS[selectedPeriod]}{selectedPeriod === PERIOD_OPTIONS.CUSTOM && detailedStats.periodStartDateFormatted ? `: ${detailedStats.periodStartDateFormatted} - ${detailedStats.periodEndDateFormatted}` : ''})
                             </span>
                        )}
                    </h3>
                    <div className="charts-grid">
                        <div className="chart-card">
                            <AppointmentsByDayRechart
                                chartData={appointmentsByDayData}
                                title={`Terminverteilung`}
                            />
                        </div>
                        <div className="chart-card">
                            <AppointmentsByServiceRechart
                                chartData={appointmentsByServiceData}
                                title={`Top 5 Dienstleistungen`}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="daily-appointments-section">
                <h3 className="daily-appointments-heading">
                    <FontAwesomeIcon icon={faListAlt} /> Heutige & Nächste Termine
                </h3>
                {isLoading && dailyAppointments.length === 0 ? (
                    <div className="loading-message-stats small-list-loader">
                        <FontAwesomeIcon icon={faSpinner} spin /> Termine werden geladen...
                    </div>
                ) : dailyAppointments.length > 0 ? (
                    <ul className="daily-appointments-list">
                        {dailyAppointments.map(apt => {
                            let displayTime = 'N/A';
                            if (apt.reconstructedStartTime && isValidDate(parseISO(apt.reconstructedStartTime))) {
                                displayTime = formatDateFns(parseISO(apt.reconstructedStartTime), 'HH:mm');
                            } else if (apt.startTime) {
                                displayTime = typeof apt.startTime === 'object'
                                    ? `${String(apt.startTime.hour).padStart(2, '0')}:${String(apt.startTime.minute).padStart(2, '0')}`
                                    : String(apt.startTime).substring(0,5);
                            }

                            let statusClass = `status-${apt.status.toLowerCase().replace(/\./g, '')}`;
                            if (apt.status !== "Heute" && apt.status !== "Morgen") {
                                statusClass = "status-datum";
                            }

                            return (
                                <li
                                    key={apt.appointmentId}
                                    className={`daily-appointment-item ${apt.status === 'Heute' ? 'status-heute-item' : ''}`}
                                    onClick={() => handleViewDetails(apt)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleViewDetails(apt); }}
                                    aria-label={`Termin ansehen: ${apt.serviceName} mit ${apt.customerFirstName} ${apt.customerLastName} um ${displayTime} Uhr, Status: ${apt.status}`}
                                >
                                    {isLoadingModalAppointment && selectedAppointmentForEdit?.id === apt.appointmentId && <FontAwesomeIcon icon={faSpinner} spin className="item-loader-icon" />}
                                    <span className="appointment-time">{displayTime} Uhr</span>
                                    <div className="appointment-info-group">
                                        <span className="appointment-service">{apt.serviceName}</span>
                                        <span className="appointment-customer">{apt.customerFirstName} {apt.customerLastName}</span>
                                    </div>
                                    <span className={`appointment-status-tag ${statusClass}`}>{apt.status}</span>
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
