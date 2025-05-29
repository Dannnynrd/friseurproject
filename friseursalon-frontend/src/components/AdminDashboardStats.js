// Datei: friseursalon-frontend/src/components/AdminDashboardStats.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import './AdminDashboardStats.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine, faCalendarCheck, faSpinner, faUsers,
    faExclamationCircle, faEuroSign, faReceipt, faHourglassHalf,
    faChartPie, faChartBar, faListAlt, faCalendarAlt,
    faFilter, faArrowUp, faArrowDown, faEquals, faCoins,
    faPlusCircle, faBolt
} from '@fortawesome/free-solid-svg-icons';
import AppointmentEditModal from './AppointmentEditModal';
import AppointmentCreateModal from './AppointmentCreateModal';
import { format as formatDateFns, parseISO, isValid as isValidDate, subDays, startOfMonth, endOfMonth, subMonths, addMonths, formatISO, startOfWeek, endOfWeek } from 'date-fns';
import { de as deLocale } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import AppointmentsByDayRechart from './charts/AppointmentsByDayRechart';
import AppointmentsByServiceRechart from './charts/AppointmentsByServiceRechart';
import RevenueOverTimeRechart from './charts/RevenueOverTimeRechart'; // NEU

registerLocale('de', deLocale);

const PERIOD_OPTIONS = {
    TODAY: 'today',
    THIS_WEEK: 'thisWeek',
    LAST_7_DAYS: 'last7days',
    THIS_MONTH: 'thisMonth',
    LAST_MONTH: 'lastMonth',
    LAST_30_DAYS: 'last30days',
    CUSTOM: 'custom',
};

const PERIOD_LABELS = {
    [PERIOD_OPTIONS.TODAY]: 'Heute',
    [PERIOD_OPTIONS.THIS_WEEK]: 'Diese Woche',
    [PERIOD_OPTIONS.LAST_7_DAYS]: 'Letzte 7 Tage',
    [PERIOD_OPTIONS.THIS_MONTH]: 'Dieser Monat',
    [PERIOD_OPTIONS.LAST_MONTH]: 'Letzter Monat',
    [PERIOD_OPTIONS.LAST_30_DAYS]: 'Letzte 30 Tage',
    [PERIOD_OPTIONS.CUSTOM]: 'Zeitraum wählen',
};

const getDatesForPeriod = (period) => {
    const today = new Date();
    let startDate, endDate;
    switch (period) {
        case PERIOD_OPTIONS.TODAY: startDate = today; endDate = today; break;
        case PERIOD_OPTIONS.THIS_WEEK:
            startDate = startOfWeek(today, { locale: deLocale, weekStartsOn: 1 });
            endDate = endOfWeek(today, { locale: deLocale, weekStartsOn: 1 });
            break;
        case PERIOD_OPTIONS.LAST_7_DAYS: startDate = subDays(today, 6); endDate = today; break;
        case PERIOD_OPTIONS.THIS_MONTH: startDate = startOfMonth(today); endDate = endOfMonth(today); break;
        case PERIOD_OPTIONS.LAST_MONTH:
            const firstDayLastMonth = startOfMonth(subMonths(today, 1));
            startDate = firstDayLastMonth; endDate = endOfMonth(firstDayLastMonth); break;
        case PERIOD_OPTIONS.LAST_30_DAYS: startDate = subDays(today, 29); endDate = today; break;
        default: startDate = startOfMonth(today); endDate = endOfMonth(today);
    }
    return {
        startDate: formatISO(startDate, { representation: 'date' }),
        endDate: formatISO(endDate, { representation: 'date' })
    };
};

function AdminDashboardStats({ currentUser, onAppointmentAction }) {
    const [detailedStats, setDetailedStats] = useState(null);
    const [dailyAppointments, setDailyAppointments] = useState([]);
    // const [recentAppointments, setRecentAppointments] = useState([]); // Ersetzt durch "Aktuelle Buchungsaktivität"
    const [bookingActivity, setBookingActivity] = useState({ today: 0, yesterday: 0 }); // NEU für Buchungsaktivität

    const [appointmentsByDayData, setAppointmentsByDayData] = useState({ labels: [], data: [] });
    const [appointmentsByServiceData, setAppointmentsByServiceData] = useState({ labels: [], data: [] });
    const [revenueOverTimeData, setRevenueOverTimeData] = useState([]); // NEU
    const [capacityUtilizationData, setCapacityUtilizationData] = useState(null); // NEU

    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isLoadingDaily, setIsLoadingDaily] = useState(true);
    // const [isLoadingRecent, setIsLoadingRecent] = useState(true); // Ersetzt
    const [isLoadingBookingActivity, setIsLoadingBookingActivity] = useState(true); // NEU
    const [isLoadingModalAppointment, setIsLoadingModalAppointment] = useState(false);
    const [error, setError] = useState('');

    const [selectedAppointmentForEdit, setSelectedAppointmentForEdit] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedSlotForCreate, setSelectedSlotForCreate] = useState(null);

    const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_OPTIONS.THIS_MONTH);
    const initialDates = getDatesForPeriod(PERIOD_OPTIONS.THIS_MONTH);
    const [currentFilterStartDate, setCurrentFilterStartDate] = useState(initialDates.startDate);
    const [currentFilterEndDate, setCurrentFilterEndDate] = useState(initialDates.endDate);

    const [customPickerStartDate, setCustomPickerStartDate] = useState(new Date(currentFilterStartDate + 'T00:00:00'));
    const [customPickerEndDate, setCustomPickerEndDate] = useState(new Date(currentFilterEndDate + 'T00:00:00'));
    const [showCustomDatePickers, setShowCustomDatePickers] = useState(false);
    const [activeDateRangeLabel, setActiveDateRangeLabel] = useState(PERIOD_LABELS[PERIOD_OPTIONS.THIS_MONTH]);

    const fetchMainStatsAndCharts = useCallback(async (startDate, endDate) => {
        setIsLoadingStats(true);
        setError(prev => prev.replace(/Hauptstatistiken;|Diagrammdaten;/g, '').trim()); // Spezifische Fehler entfernen
        try {
            const [statsRes, dayRes, serviceRes, revenueTimeRes, capacityRes] = await Promise.all([
                api.get('/statistics/detailed-counts', { params: { startDate, endDate } }),
                api.get('/statistics/by-day-of-week', { params: { startDate, endDate } }),
                api.get('/statistics/by-service', { params: { startDate, endDate, topN: 5 } }),
                api.get('/statistics/revenue-over-time', { params: { startDate, endDate } }), // NEU
                api.get('/statistics/capacity-utilization', { params: { startDate, endDate } }) // NEU
            ]);
            setDetailedStats(statsRes.data);
            setAppointmentsByDayData({
                labels: dayRes.data.map(d => d.dayName ? d.dayName.substring(0, 2) : "Unb."),
                data: dayRes.data.map(d => d.appointmentCount || 0),
            });
            setAppointmentsByServiceData({
                labels: serviceRes.data.map(s => s.serviceName || "Unbekannt"),
                data: serviceRes.data.map(s => s.appointmentCount || 0),
            });
            setRevenueOverTimeData(revenueTimeRes.data); // NEU
            setCapacityUtilizationData(capacityRes.data); // NEU

            const currentSDate = parseISO(startDate + 'T00:00:00Z'); // Ensure UTC interpretation for consistency if backend sends plain date
            const currentEDate = parseISO(endDate + 'T00:00:00Z');

            if (startDate === endDate) {
                setActiveDateRangeLabel(formatDateFns(currentSDate, 'dd.MM.yyyy', { locale: deLocale }));
            } else {
                setActiveDateRangeLabel(`${formatDateFns(currentSDate, 'dd.MM.yy', { locale: deLocale })} - ${formatDateFns(currentEDate, 'dd.MM.yy', { locale: deLocale })}`);
            }


        } catch (err) {
            console.error("Fehler beim Laden der Hauptstatistiken/Charts:", err.response?.data || err.message);
            setError(prev => `${prev} Hauptstatistiken & Diagrammdaten;`.trim());
            setDetailedStats(null); // Wichtig: Im Fehlerfall zurücksetzen
            setAppointmentsByDayData({ labels: [], data: [] });
            setAppointmentsByServiceData({ labels: [], data: [] });
            setRevenueOverTimeData([]);
            setCapacityUtilizationData(null);
        } finally {
            setIsLoadingStats(false);
        }
    }, []);

    const fetchActivityAndUpcoming = useCallback(async () => {
        setIsLoadingBookingActivity(true);
        setIsLoadingDaily(true);
        setError(prev => prev.replace(/Aktivität;|Terminliste;/g, '').trim());
        try {
            // Für Buchungsaktivität brauchen wir einen neuen Endpunkt oder eine Anpassung von detailed-counts
            // Temporäre Simulation für "Buchungen heute/gestern"
            // In einer echten Implementierung würde hier ein API-Call stehen, z.B.
            // const activityRes = await api.get('/statistics/booking-activity');
            // setBookingActivity(activityRes.data);
            // Simulieren wir das erstmal, bis das Backend angepasst ist:
            // Diese Logik sollte im Backend erfolgen, wenn detailedStats.todayCount die *erstellten* Termine zählt
            // Da detailedStats.todayCount die *stattfindenden* Termine zählt, ist die Simulation hier nicht ganz korrekt.
            // Fürs Erste:
            // setBookingActivity({ today: detailedStats?.todayNewAppointments || 0, yesterday: detailedStats?.yesterdayNewAppointments || 0 });
            // Da wir die Felder `todayNewAppointments` etc. nicht im DTO haben, lassen wir es erstmal als Placeholder
            setBookingActivity({ today: 'N/A', yesterday: 'N/A'});


            const dailyRes = await api.get('/statistics/today-upcoming-appointments');
            setDailyAppointments(dailyRes.data);

        } catch (err) {
            console.error("Fehler beim Laden von Aktivität/Terminliste:", err.response?.data || err.message);
            setError(prev => `${prev} Aktivität & Terminliste;`.trim());
            setDailyAppointments([]);
            setBookingActivity({ today: 0, yesterday: 0 });
        } finally {
            setIsLoadingBookingActivity(false);
            setIsLoadingDaily(false);
        }
    }, []); // Keine Abhängigkeit von detailedStats hier, um Loop zu vermeiden

    useEffect(() => {
        fetchMainStatsAndCharts(currentFilterStartDate, currentFilterEndDate);
    }, [currentFilterStartDate, currentFilterEndDate, fetchMainStatsAndCharts]);

    useEffect(() => {
        fetchActivityAndUpcoming();
    }, [fetchActivityAndUpcoming, onAppointmentAction]);


    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        setShowCustomDatePickers(period === PERIOD_OPTIONS.CUSTOM);
        if (period !== PERIOD_OPTIONS.CUSTOM) {
            const { startDate, endDate } = getDatesForPeriod(period);
            setCurrentFilterStartDate(startDate);
            setCurrentFilterEndDate(endDate);
            // setActiveDateRangeLabel wird im fetchMainStatsAndCharts gesetzt
        } else {
            // Für Custom, Picker-Werte beibehalten oder auf aktuellen Zeitraum setzen
            setCustomPickerStartDate(new Date(currentFilterStartDate + 'T00:00:00'));
            setCustomPickerEndDate(new Date(currentFilterEndDate + 'T00:00:00'));
        }
    };

    const handleApplyCustomDateRange = () => {
        if (customPickerStartDate && customPickerEndDate) {
            if (customPickerEndDate < customPickerStartDate) {
                setError("Das Enddatum darf nicht vor dem Startdatum liegen.");
                return;
            }
            setCurrentFilterStartDate(formatISO(customPickerStartDate, { representation: 'date' }));
            setCurrentFilterEndDate(formatISO(customPickerEndDate, { representation: 'date' }));
            setShowCustomDatePickers(false);
        } else {
            setError("Bitte wählen Sie ein gültiges Start- und Enddatum.");
        }
    };

    const handleViewDetails = async (appointmentDTO) => { /* ... bleibt gleich ... */
        if (!appointmentDTO || !appointmentDTO.appointmentId) {
            setError("Details für diesen Termin konnten nicht geladen werden (fehlende ID).");
            return;
        }
        setIsLoadingModalAppointment(true);
        try {
            const response = await api.get(`/appointments/${appointmentDTO.appointmentId}`);
            setSelectedAppointmentForEdit(response.data || null);
        } catch (err) {
            setError(`Details für Termin ${appointmentDTO.appointmentId} konnten nicht geladen werden. Grund: ${err.response?.data?.message || err.message}`);
            setSelectedAppointmentForEdit(null);
        } finally {
            setIsLoadingModalAppointment(false);
        }
    };
    const handleCloseEditModal = () => setSelectedAppointmentForEdit(null);
    const handleAppointmentUpdatedFromModal = () => { /* ... bleibt gleich ... */
        handleCloseEditModal();
        if (onAppointmentAction) onAppointmentAction();
    };
    const handleOpenCreateModal = () => { /* ... bleibt gleich ... */
        setSelectedSlotForCreate({ start: new Date(), allDay: false });
        setShowCreateModal(true);
    };
    const handleCloseCreateModal = () => { /* ... bleibt gleich ... */
        setShowCreateModal(false);
        setSelectedSlotForCreate(null);
    };
    const handleAppointmentCreated = () => { /* ... bleibt gleich ... */
        handleCloseCreateModal();
        if (onAppointmentAction) onAppointmentAction();
    };
    const formatCurrency = (value) => { /* ... bleibt gleich ... */
        if (value == null || isNaN(parseFloat(value))) return '0,00 €';
        return `${parseFloat(value).toFixed(2).replace('.', ',')} €`;
    };
    const renderComparison = (changePercentage, previousValue) => { /* ... bleibt gleich (siehe vorherige Antwort) ... */
        const hasPreviousData = previousValue !== null && previousValue !== undefined && !isNaN(parseFloat(previousValue));
        let changeText = 'vs. Vorp.: N/A';
        let icon = faEquals;
        let colorClass = 'neutral';

        if (hasPreviousData) {
            if (changePercentage === null || changePercentage === undefined || isNaN(changePercentage)) {
                if (parseFloat(previousValue) === 0 && detailedStats && (
                    (detailedStats.totalAppointmentsInPeriod !== undefined && detailedStats.totalAppointmentsInPeriod > 0 && changePercentage === detailedStats.appointmentCountChangePercentage) ||
                    (detailedStats.totalRevenueInPeriod !== undefined && parseFloat(detailedStats.totalRevenueInPeriod) > 0 && changePercentage === detailedStats.revenueChangePercentage)
                ) ) {
                    changeText = 'vs. 0';
                    icon = faArrowUp;
                    colorClass = 'positive';
                }
            } else {
                const isPositive = changePercentage > 0;
                const isNegative = changePercentage < 0;
                icon = isPositive ? faArrowUp : (isNegative ? faArrowDown : faEquals);
                colorClass = isPositive ? 'positive' : (isNegative ? 'negative' : 'neutral');
                changeText = `${changePercentage > 0 ? '+' : ''}${changePercentage.toFixed(1).replace('.', ',')}%`;
            }
        }
        return (
            <span className={`comparison-data ${colorClass}`}>
                <FontAwesomeIcon icon={icon} /> {changeText}
            </span>
        );
    };

    const renderStatCards = () => { /* ... bleibt weitgehend gleich, ggf. Icons anpassen ... */
        if (isLoadingStats && !detailedStats) {
            return (
                <>
                    <div className="stats-overview-cards primary-kpis">
                        {[...Array(3)].map((_, i) => ( <div key={`skeleton-main-${i}`} className="stat-card main-kpi is-loading-skeleton"><div className="stat-card-header-skeleton"></div><div className="stat-value-skeleton large"></div><div className="stat-comparison-skeleton"></div></div> ))}
                    </div>
                    <hr className="kpi-divider" />
                    <div className="stats-overview-cards secondary-kpis">
                        {[...Array(3)].map((_, i) => ( <div key={`skeleton-sec-${i}`} className="stat-card small-kpi is-loading-skeleton"><div className="stat-card-header-skeleton"></div><div className="stat-value-skeleton"></div></div> ))}
                    </div>
                    {/* Skeleton für Auslastung */}
                    <div className="stat-card small-kpi is-loading-skeleton"><div className="stat-card-header-skeleton"></div><div className="stat-value-skeleton"></div></div>
                </>
            );
        }
        if (!detailedStats) return <p className="stat-card-no-data">Keine Kennzahlen verfügbar.</p>;

        const avgRevenue = (detailedStats.totalAppointmentsInPeriod > 0 && detailedStats.totalRevenueInPeriod && parseFloat(detailedStats.totalRevenueInPeriod) > 0)
            ? (parseFloat(detailedStats.totalRevenueInPeriod) / detailedStats.totalAppointmentsInPeriod) : 0;

        const mainKpisData = [
            { label: "Termine", value: detailedStats.totalAppointmentsInPeriod ?? '0', icon: faCalendarCheck, comparison: renderComparison(detailedStats.appointmentCountChangePercentage, detailedStats.previousPeriodTotalAppointments) },
            { label: "Umsatz", value: formatCurrency(detailedStats.totalRevenueInPeriod), icon: faReceipt, comparison: renderComparison(detailedStats.revenueChangePercentage, detailedStats.previousPeriodTotalRevenue) },
            { label: "Ø-Umsatz/Termin", value: formatCurrency(avgRevenue), icon: faCoins },
        ];
        // Sekundäre KPIs können nun auch die Auslastung enthalten
        const secondaryKpisData = [
            { label: "Termine Heute", value: detailedStats.todayCount ?? '0', icon: faCalendarCheck, iconClass: 'today' },
            { label: "Umsatz Heute", value: formatCurrency(detailedStats.revenueToday ?? 0), icon: faReceipt, iconClass: 'revenue' },
            { label: "Ges. Bevorstehend", value: detailedStats.totalUpcomingCount ?? '0', icon: faCalendarAlt, iconClass: 'upcoming' },
        ];
        if (capacityUtilizationData) {
            secondaryKpisData.push({
                label: `Auslastung (${capacityUtilizationData.periodStartDate} - ${capacityUtilizationData.periodEndDate})`,
                value: `${capacityUtilizationData.utilizationPercentage.toFixed(1)}%`,
                icon: faHourglassHalf,
                iconClass: 'capacity'
            });
        }


        return (
            <>
                <div className="stats-overview-cards primary-kpis">
                    {mainKpisData.map(kpi => (
                        <div key={kpi.label} className="stat-card main-kpi">
                            <div className="stat-card-header"><FontAwesomeIcon icon={kpi.icon} className={`stat-icon ${kpi.iconClass || ''}`} /><span className="stat-label">{kpi.label}</span></div>
                            <div className="stat-value large">{kpi.value}</div>
                            {kpi.comparison && <div className="stat-comparison">{kpi.comparison}</div>}
                        </div>
                    ))}
                </div>
                <hr className="kpi-divider" />
                <div className="stats-overview-cards secondary-kpis">
                    {secondaryKpisData.map(kpi => (
                        <div key={kpi.label} className="stat-card small-kpi">
                            <div className="stat-card-header"><FontAwesomeIcon icon={kpi.icon} className={`stat-icon ${kpi.iconClass || ''}`} /><span className="stat-label">{kpi.label}</span></div>
                            <div className="stat-value">{kpi.value}</div>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    return (
        <div className="admin-dashboard-stats">
            {/* Filterleiste */}
            <div className="stats-period-filter-bar">
                <div className="period-buttons">
                    {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                        <button key={key} onClick={() => handlePeriodChange(key)} className={`${selectedPeriod === key ? 'active' : ''} ${key === PERIOD_OPTIONS.CUSTOM ? 'custom-period-btn' : ''}`} aria-pressed={selectedPeriod === key}>
                            {key === PERIOD_OPTIONS.CUSTOM && <FontAwesomeIcon icon={faFilter} />} {label}
                        </button>
                    ))}
                </div>
                {showCustomDatePickers && (
                    <div className="custom-date-pickers">
                        <DatePicker selected={customPickerStartDate} onChange={date => setCustomPickerStartDate(date)} selectsStart startDate={customPickerStartDate} endDate={customPickerEndDate} dateFormat="dd.MM.yyyy" locale="de" placeholderText="Start" className="date-picker-input" maxDate={addMonths(new Date(), 12)} />
                        <DatePicker selected={customPickerEndDate} onChange={date => setCustomPickerEndDate(date)} selectsEnd startDate={customPickerStartDate} endDate={customPickerEndDate} minDate={customPickerStartDate} maxDate={addMonths(new Date(), 12)} dateFormat="dd.MM.yyyy" locale="de" placeholderText="Ende" className="date-picker-input" />
                        <button onClick={handleApplyCustomDateRange} className="button-link apply-custom-date" disabled={isLoadingStats || !customPickerStartDate || !customPickerEndDate}>
                            Anwenden
                        </button>
                    </div>
                )}
            </div>

            {(isLoadingStats || isLoadingDaily || isLoadingBookingActivity) && (
                <div className="loading-indicator-top"><FontAwesomeIcon icon={faSpinner} spin /> Daten werden aktualisiert...</div>
            )}
            {error && (
                <p className="form-message error mb-4"><FontAwesomeIcon icon={faExclamationCircle} /> Fehler: {error.replace(/;/g, '; ')}</p>
            )}

            {/* Schnellzugriff Sektion - Überarbeitet */}
            <div className="quick-access-section stats-section-box">
                <h3 className="stats-section-title small-title"><span><FontAwesomeIcon icon={faBolt} /> Schnellzugriff & Aktivität</span></h3>
                <div className="quick-access-content">
                    <button onClick={handleOpenCreateModal} className="button-link quick-create-button">
                        <FontAwesomeIcon icon={faPlusCircle} /> Termin anlegen
                    </button>
                    <div className="booking-activity-widget">
                        <h4>Buchungsaktivität</h4>
                        {isLoadingBookingActivity ? <p className="no-data-small"><FontAwesomeIcon icon={faSpinner} spin /> Lade...</p> : (
                            <>
                                <p>Heute: <span>{bookingActivity.today} Buchung(en)</span></p>
                                <p>Gestern: <span>{bookingActivity.yesterday} Buchung(en)</span></p>
                            </>
                        )}
                    </div>
                </div>
            </div>


            {/* Hauptlayout für KPIs und Charts */}
            <div className="stats-main-layout">
                <div className="stats-overview-cards-wrapper stats-section-box">
                    <h3 className="stats-section-title">
                        <span><FontAwesomeIcon icon={faChartLine} /> Kennzahlen</span>
                        <span className="stats-period-display">({activeDateRangeLabel})</span>
                    </h3>
                    {renderStatCards()}
                </div>

                <div className="charts-section-wrapper stats-section-box">
                    <h3 className="stats-section-title">
                        <span><FontAwesomeIcon icon={faChartPie} /> Visuelle Analysen</span>
                        <span className="stats-period-display">({activeDateRangeLabel})</span>
                    </h3>
                    <div className="charts-grid">
                        {/* NEUES DIAGRAMM: Umsatzentwicklung */}
                        <div className="chart-card">
                            <RevenueOverTimeRechart chartData={revenueOverTimeData} title="Umsatzentwicklung" periodLabel={activeDateRangeLabel} />
                        </div>
                        <div className="chart-card">
                            <AppointmentsByDayRechart chartData={appointmentsByDayData} title="Termine / Wochentag" />
                        </div>
                        <div className="chart-card">
                            <AppointmentsByServiceRechart chartData={appointmentsByServiceData} title="Top Dienstleistungen" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tägliche Terminliste */}
            <div className="daily-appointments-section stats-section-box">
                <h3 className="daily-appointments-heading"><FontAwesomeIcon icon={faListAlt} /> Heutige & Nächste Termine</h3>
                {isLoadingDaily ? <div className="loading-message-stats small-list-loader"><FontAwesomeIcon icon={faSpinner} spin /> Lade Termine...</div> : dailyAppointments.length > 0 ? (
                    <ul className="daily-appointments-list">
                        {dailyAppointments.map(apt => {
                            const appointmentDateTime = apt.appointmentDate && apt.startTime
                                ? parseISO(`${apt.appointmentDate}T${typeof apt.startTime === 'string' ? apt.startTime.substring(0,5) : `${String(apt.startTime.hour).padStart(2,'0')}:${String(apt.startTime.minute).padStart(2,'0')}`}:00`)
                                : null;
                            let statusClass = `status-${apt.status?.toLowerCase().replace(/\./g, '') || 'unbekannt'}`;
                            if (apt.status && apt.status !== "Heute" && apt.status !== "Morgen") { statusClass = "status-datum"; }
                            return (
                                <li key={apt.appointmentId} className={`daily-appointment-item`} onClick={() => handleViewDetails(apt)} role="button" tabIndex={0} onKeyPress={(e) => e.key === 'Enter' && handleViewDetails(apt)} aria-label={`Termin ansehen`}>
                                    {isLoadingModalAppointment && selectedAppointmentForEdit?.appointmentId === apt.appointmentId && <FontAwesomeIcon icon={faSpinner} spin className="item-loader-icon" />}
                                    <span className="appointment-time">{appointmentDateTime ? formatDateFns(appointmentDateTime, 'HH:mm') : 'N/A'} Uhr</span>
                                    <div className="appointment-info-group"><span className="appointment-service">{apt.serviceName}</span><span className="appointment-customer">{apt.customerFirstName} {apt.customerLastName}</span></div>
                                    <span className={`appointment-status-tag ${statusClass}`}>{apt.status || 'Unbekannt'}</span>
                                </li>
                            );
                        })}
                    </ul>
                ) : (!isLoadingDaily && !error && <p className="no-upcoming-appointments">Keine anstehenden Termine für heute oder die nächsten Tage.</p>)}
            </div>

            {selectedAppointmentForEdit && currentUser?.roles?.includes("ROLE_ADMIN") && (
                <AppointmentEditModal appointment={selectedAppointmentForEdit} onClose={handleCloseEditModal} onAppointmentUpdated={handleAppointmentUpdatedFromModal} />
            )}
            {showCreateModal && (
                <AppointmentCreateModal isOpen={showCreateModal} onClose={handleCloseCreateModal} onAppointmentCreated={handleAppointmentCreated} currentUser={currentUser} selectedSlot={selectedSlotForCreate} />
            )}
        </div>
    );
}
export default AdminDashboardStats;