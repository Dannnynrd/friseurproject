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
import RevenueOverTimeRechart from './charts/RevenueOverTimeRechart';

registerLocale('de', deLocale);

// Definition der Zeiträume für die Filterbuttons
const PERIOD_OPTIONS = {
    TODAY: 'today',
    THIS_WEEK: 'thisWeek',
    LAST_7_DAYS: 'last7days',
    THIS_MONTH: 'thisMonth',
    LAST_MONTH: 'lastMonth',
    LAST_30_DAYS: 'last30days',
    CUSTOM: 'custom',
};

// Labels für die Filterbuttons
const PERIOD_LABELS = {
    [PERIOD_OPTIONS.TODAY]: 'Heute',
    [PERIOD_OPTIONS.THIS_WEEK]: 'Diese Woche',
    [PERIOD_OPTIONS.LAST_7_DAYS]: 'Letzte 7 Tage',
    [PERIOD_OPTIONS.THIS_MONTH]: 'Dieser Monat',
    [PERIOD_OPTIONS.LAST_MONTH]: 'Letzter Monat',
    [PERIOD_OPTIONS.LAST_30_DAYS]: 'Letzte 30 Tage',
    [PERIOD_OPTIONS.CUSTOM]: 'Zeitraum wählen',
};

// Hilfsfunktion zur Berechnung der Start- und Enddaten für vordefinierte Zeiträume
const getDatesForPeriod = (period) => {
    const today = new Date();
    let startDate, endDate;
    switch (period) {
        case PERIOD_OPTIONS.TODAY: startDate = today; endDate = today; break;
        case PERIOD_OPTIONS.THIS_WEEK:
            startDate = startOfWeek(today, { locale: deLocale, weekStartsOn: 1 }); // Woche beginnt am Montag
            endDate = endOfWeek(today, { locale: deLocale, weekStartsOn: 1 });
            break;
        case PERIOD_OPTIONS.LAST_7_DAYS: startDate = subDays(today, 6); endDate = today; break;
        case PERIOD_OPTIONS.THIS_MONTH: startDate = startOfMonth(today); endDate = endOfMonth(today); break;
        case PERIOD_OPTIONS.LAST_MONTH:
            const firstDayLastMonth = startOfMonth(subMonths(today, 1));
            startDate = firstDayLastMonth; endDate = endOfMonth(firstDayLastMonth); break;
        case PERIOD_OPTIONS.LAST_30_DAYS: startDate = subDays(today, 29); endDate = today; break;
        default: // Standard ist "Dieser Monat"
            startDate = startOfMonth(today); endDate = endOfMonth(today);
    }
    return {
        // Formatierung der Daten als YYYY-MM-DD Strings für API-Requests
        startDate: formatISO(startDate, { representation: 'date' }),
        endDate: formatISO(endDate, { representation: 'date' })
    };
};

function AdminDashboardStats({ currentUser, onAppointmentAction }) {
    // State für die detaillierten Statistiken vom Backend
    const [detailedStats, setDetailedStats] = useState(null);
    // State für die Liste der heutigen und kommenden Termine
    const [dailyAppointments, setDailyAppointments] = useState([]);
    // State für die Aktivität der Terminbuchungen (z.B. heute/gestern)
    const [bookingActivity, setBookingActivity] = useState({ today: 0, yesterday: 0 });

    // States für die Diagrammdaten
    const [appointmentsByDayData, setAppointmentsByDayData] = useState({ labels: [], data: [] });
    const [appointmentsByServiceData, setAppointmentsByServiceData] = useState({ labels: [], data: [] });
    const [revenueOverTimeData, setRevenueOverTimeData] = useState([]);
    const [capacityUtilizationData, setCapacityUtilizationData] = useState(null);

    // Lade- und Fehlerzustände
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isLoadingDaily, setIsLoadingDaily] = useState(true);
    const [isLoadingBookingActivity, setIsLoadingBookingActivity] = useState(true);
    const [isLoadingModalAppointment, setIsLoadingModalAppointment] = useState(false);
    const [error, setError] = useState('');

    // States für Modals (Termin bearbeiten/erstellen)
    const [selectedAppointmentForEdit, setSelectedAppointmentForEdit] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedSlotForCreate, setSelectedSlotForCreate] = useState(null);

    // States für die Filterleiste
    const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_OPTIONS.THIS_MONTH);
    const initialDates = getDatesForPeriod(PERIOD_OPTIONS.THIS_MONTH);
    const [currentFilterStartDate, setCurrentFilterStartDate] = useState(initialDates.startDate);
    const [currentFilterEndDate, setCurrentFilterEndDate] = useState(initialDates.endDate);
    const [customPickerStartDate, setCustomPickerStartDate] = useState(new Date(currentFilterStartDate + 'T00:00:00'));
    const [customPickerEndDate, setCustomPickerEndDate] = useState(new Date(currentFilterEndDate + 'T00:00:00'));
    const [showCustomDatePickers, setShowCustomDatePickers] = useState(false);
    const [activeDateRangeLabel, setActiveDateRangeLabel] = useState(PERIOD_LABELS[PERIOD_OPTIONS.THIS_MONTH]);

    // Funktion zum Abrufen der Hauptstatistiken und Diagrammdaten
    const fetchMainStatsAndCharts = useCallback(async (startDate, endDate) => {
        setIsLoadingStats(true);
        setError(prev => prev.replace(/Hauptstatistiken;|Diagrammdaten;/g, '').trim());
        try {
            // Parallele API-Aufrufe für bessere Performance
            const [statsRes, dayRes, serviceRes, revenueTimeRes, capacityRes] = await Promise.all([
                api.get('/statistics/detailed-counts', { params: { startDate, endDate } }),
                api.get('/statistics/by-day-of-week', { params: { startDate, endDate } }),
                api.get('/statistics/by-service', { params: { startDate, endDate, topN: 5 } }),
                api.get('/statistics/revenue-over-time', { params: { startDate, endDate } }),
                api.get('/statistics/capacity-utilization', { params: { startDate, endDate } })
            ]);

            setDetailedStats(statsRes.data);
            setAppointmentsByDayData({
                labels: dayRes.data.map(d => d.dayName ? d.dayName.substring(0, 2) : "Unb."), // Kürzel für Wochentage
                data: dayRes.data.map(d => d.appointmentCount || 0),
            });
            setAppointmentsByServiceData({
                labels: serviceRes.data.map(s => s.serviceName || "Unbekannt"),
                data: serviceRes.data.map(s => s.appointmentCount || 0),
            });
            setRevenueOverTimeData(revenueTimeRes.data);
            setCapacityUtilizationData(capacityRes.data);

            // Label für den angezeigten Zeitraum aktualisieren
            const currentSDate = parseISO(startDate + 'T00:00:00Z');
            const currentEDate = parseISO(endDate + 'T00:00:00Z');
            if (startDate === endDate) { // Für einzelne Tage
                setActiveDateRangeLabel(formatDateFns(currentSDate, 'dd.MM.yyyy', { locale: deLocale }));
            } else { // Für Zeiträume
                setActiveDateRangeLabel(`${formatDateFns(currentSDate, 'dd.MM.yy', { locale: deLocale })} - ${formatDateFns(currentEDate, 'dd.MM.yy', { locale: deLocale })}`);
            }
        } catch (err) {
            console.error("Fehler beim Laden der Hauptstatistiken/Charts:", err.response?.data || err.message);
            setError(prev => `${prev} Hauptstatistiken & Diagrammdaten;`.trim());
            // Im Fehlerfall Daten zurücksetzen, um inkonsistente Zustände zu vermeiden
            setDetailedStats(null);
            setAppointmentsByDayData({ labels: [], data: [] });
            setAppointmentsByServiceData({ labels: [], data: [] });
            setRevenueOverTimeData([]);
            setCapacityUtilizationData(null);
        } finally {
            setIsLoadingStats(false);
        }
    }, []);

    // Funktion zum Abrufen der Buchungsaktivität und der anstehenden Termine
    const fetchActivityAndUpcoming = useCallback(async () => {
        setIsLoadingBookingActivity(true);
        setIsLoadingDaily(true);
        setError(prev => prev.replace(/Aktivität;|Terminliste;/g, '').trim());
        try {
            // TODO: Backend-Endpunkt für "Buchungsaktivität (heute/gestern)" erstellen/nutzen.
            // Aktuell wird ein Platzhalter verwendet.
            setBookingActivity({ today: 'N/A', yesterday: 'N/A'});

            const dailyRes = await api.get('/statistics/today-upcoming-appointments');
            setDailyAppointments(dailyRes.data);
        } catch (err) {
            console.error("Fehler beim Laden von Aktivität/Terminliste:", err.response?.data || err.message);
            setError(prev => `${prev} Aktivität & Terminliste;`.trim());
            setDailyAppointments([]);
            setBookingActivity({ today: 0, yesterday: 0 }); // Fallback im Fehlerfall
        } finally {
            setIsLoadingBookingActivity(false);
            setIsLoadingDaily(false);
        }
    }, []);

    // Effekt zum Laden der Hauptstatistiken bei Änderung des Zeitraums
    useEffect(() => {
        fetchMainStatsAndCharts(currentFilterStartDate, currentFilterEndDate);
    }, [currentFilterStartDate, currentFilterEndDate, fetchMainStatsAndCharts]);

    // Effekt zum Laden der Aktivitätsdaten (wird durch onAppointmentAction getriggert)
    useEffect(() => {
        fetchActivityAndUpcoming();
    }, [fetchActivityAndUpcoming, onAppointmentAction]);

    // Handler für Periodenwechsel durch Buttons
    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        setShowCustomDatePickers(period === PERIOD_OPTIONS.CUSTOM);
        if (period !== PERIOD_OPTIONS.CUSTOM) {
            const { startDate, endDate } = getDatesForPeriod(period);
            setCurrentFilterStartDate(startDate);
            setCurrentFilterEndDate(endDate);
        } else {
            // Bei "Custom" die aktuellen Picker-Werte beibehalten oder ggf. zurücksetzen
            setCustomPickerStartDate(new Date(currentFilterStartDate + 'T00:00:00'));
            setCustomPickerEndDate(new Date(currentFilterEndDate + 'T00:00:00'));
        }
    };

    // Handler für benutzerdefinierten Zeitraum
    const handleApplyCustomDateRange = () => {
        if (customPickerStartDate && customPickerEndDate) {
            if (customPickerEndDate < customPickerStartDate) {
                setError("Das Enddatum darf nicht vor dem Startdatum liegen.");
                return;
            }
            setCurrentFilterStartDate(formatISO(customPickerStartDate, { representation: 'date' }));
            setCurrentFilterEndDate(formatISO(customPickerEndDate, { representation: 'date' }));
            setShowCustomDatePickers(false); // Schließt die Picker nach Auswahl
        } else {
            setError("Bitte wählen Sie ein gültiges Start- und Enddatum.");
        }
    };

    // Handler für das Anzeigen von Termindetails (z.B. aus der Liste "Heutige & Nächste Termine")
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
            setError(`Details für Termin ${appointmentDTO.appointmentId} konnten nicht geladen werden. Grund: ${err.response?.data?.message || err.message}`);
            setSelectedAppointmentForEdit(null);
        } finally {
            setIsLoadingModalAppointment(false);
        }
    };

    // Schließen des Bearbeitungsmodals
    const handleCloseEditModal = () => setSelectedAppointmentForEdit(null);

    // Callback, wenn ein Termin im Modal aktualisiert wurde
    const handleAppointmentUpdatedFromModal = () => {
        handleCloseEditModal();
        if (onAppointmentAction) onAppointmentAction(); // Trigger für Neuladen der Daten
    };

    // Öffnen des Modals zum Erstellen eines neuen Termins
    const handleOpenCreateModal = () => {
        setSelectedSlotForCreate({ start: new Date(), allDay: false }); // Standard-Slot-Info
        setShowCreateModal(true);
    };

    // Schließen des Erstellungsmodals
    const handleCloseCreateModal = () => {
        setShowCreateModal(false);
        setSelectedSlotForCreate(null);
    };

    // Callback, wenn ein Termin im Modal erstellt wurde
    const handleAppointmentCreated = () => {
        handleCloseCreateModal();
        if (onAppointmentAction) onAppointmentAction(); // Trigger für Neuladen der Daten
    };

    // Hilfsfunktion zur Währungsformatierung
    const formatCurrency = (value) => {
        if (value == null || isNaN(parseFloat(value))) return '0,00 €';
        return `${parseFloat(value).toFixed(2).replace('.', ',')} €`;
    };

    // Rendert die Vergleichsanzeige (z.B. "+10% vs. Vorperiode")
    const renderComparison = (changePercentage, previousValue) => {
        const hasPreviousData = previousValue !== null && previousValue !== undefined && !isNaN(parseFloat(previousValue));
        let changeText = 'vs. Vorp.: N/A';
        let icon = faEquals;
        let colorClass = 'neutral';

        if (hasPreviousData) {
            if (changePercentage === null || changePercentage === undefined || isNaN(changePercentage)) {
                // Spezifischer Fall: Wenn Vorperiode 0 war und aktuelle Periode > 0 ist
                if (parseFloat(previousValue) === 0 && detailedStats && (
                    (detailedStats.totalAppointmentsInPeriod !== undefined && detailedStats.totalAppointmentsInPeriod > 0 && changePercentage === detailedStats.appointmentCountChangePercentage) ||
                    (detailedStats.totalRevenueInPeriod !== undefined && parseFloat(detailedStats.totalRevenueInPeriod) > 0 && changePercentage === detailedStats.revenueChangePercentage)
                ) ) {
                    changeText = 'vs. 0'; // Deutlich machen, dass es von 0 gestiegen ist
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

    // Rendert die KPI-Karten
    const renderStatCards = () => {
        // Skeleton-Loader, während die Statistiken geladen werden
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
                    <div className="stat-card small-kpi is-loading-skeleton"><div className="stat-card-header-skeleton"></div><div className="stat-value-skeleton"></div></div>
                </>
            );
        }
        if (!detailedStats) return <p className="stat-card-no-data">Keine Kennzahlen verfügbar.</p>;

        // Berechnung des Durchschnittsumsatzes pro Termin
        const avgRevenue = (detailedStats.totalAppointmentsInPeriod > 0 && detailedStats.totalRevenueInPeriod && parseFloat(detailedStats.totalRevenueInPeriod) > 0)
            ? (parseFloat(detailedStats.totalRevenueInPeriod) / detailedStats.totalAppointmentsInPeriod) : 0;

        // Daten für Haupt-KPIs
        const mainKpisData = [
            { label: "Termine", value: detailedStats.totalAppointmentsInPeriod ?? '0', icon: faCalendarCheck, comparison: renderComparison(detailedStats.appointmentCountChangePercentage, detailedStats.previousPeriodTotalAppointments) },
            { label: "Umsatz", value: formatCurrency(detailedStats.totalRevenueInPeriod), icon: faReceipt, comparison: renderComparison(detailedStats.revenueChangePercentage, detailedStats.previousPeriodTotalRevenue) },
            { label: "Ø-Umsatz/Termin", value: formatCurrency(avgRevenue), icon: faCoins },
        ];
        // Daten für sekundäre KPIs inkl. Kapazitätsauslastung
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
            {/* Filterleiste für den Zeitraum */}
            <div className="stats-period-filter-bar">
                <div className="period-buttons">
                    {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                        <button key={key} onClick={() => handlePeriodChange(key)} className={`${selectedPeriod === key ? 'active' : ''} ${key === PERIOD_OPTIONS.CUSTOM ? 'custom-period-btn' : ''}`} aria-pressed={selectedPeriod === key}>
                            {key === PERIOD_OPTIONS.CUSTOM && <FontAwesomeIcon icon={faFilter} />} {label}
                        </button>
                    ))}
                </div>
                {/* DatePicker für benutzerdefinierten Zeitraum */}
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

            {/* Lade- und Fehlermeldungen */}
            {(isLoadingStats || isLoadingDaily || isLoadingBookingActivity) && (
                <div className="loading-indicator-top"><FontAwesomeIcon icon={faSpinner} spin /> Daten werden aktualisiert...</div>
            )}
            {error && (
                <p className="form-message error mb-4"><FontAwesomeIcon icon={faExclamationCircle} /> Fehler: {error.replace(/;/g, '; ')}</p>
            )}

            {/* Schnellzugriffssektion */}
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

            {/* Hauptlayout: KPIs und Diagramme */}
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

            {/* Liste der täglichen/kommenden Termine */}
            <div className="daily-appointments-section stats-section-box">
                <h3 className="daily-appointments-heading"><FontAwesomeIcon icon={faListAlt} /> Heutige & Nächste Termine</h3>
                {isLoadingDaily ? <div className="loading-message-stats small-list-loader"><FontAwesomeIcon icon={faSpinner} spin /> Lade Termine...</div> : dailyAppointments.length > 0 ? (
                    <ul className="daily-appointments-list">
                        {dailyAppointments.map(apt => {
                            // Stellt sicher, dass startTime korrekt geparst wird, egal ob String oder Objekt
                            const appointmentDateTime = apt.appointmentDate && apt.startTime
                                ? parseISO(`${apt.appointmentDate}T${typeof apt.startTime === 'string' ? apt.startTime.substring(0,5) : `${String(apt.startTime.hour).padStart(2,'0')}:${String(apt.startTime.minute).padStart(2,'0')}`}:00`)
                                : null;
                            let statusClass = `status-${apt.status?.toLowerCase().replace(/\./g, '') || 'unbekannt'}`;
                            if (apt.status && apt.status !== "Heute" && apt.status !== "Morgen") { statusClass = "status-datum"; } // Für spezifische Datumsanzeige
                            return (
                                <li key={apt.appointmentId} className={`daily-appointment-item`} onClick={() => handleViewDetails(apt)} role="button" tabIndex={0} onKeyPress={(e) => e.key === 'Enter' && handleViewDetails(apt)} aria-label={`Termin ansehen`}>
                                    {/* Ladeindikator direkt im Listenelement, wenn dieses spezifische Element geladen wird */}
                                    {isLoadingModalAppointment && selectedAppointmentForEdit?.id === apt.appointmentId && <FontAwesomeIcon icon={faSpinner} spin className="item-loader-icon" />}
                                    <span className="appointment-time">{appointmentDateTime ? formatDateFns(appointmentDateTime, 'HH:mm') : 'N/A'} Uhr</span>
                                    <div className="appointment-info-group"><span className="appointment-service">{apt.serviceName}</span><span className="appointment-customer">{apt.customerFirstName} {apt.customerLastName}</span></div>
                                    <span className={`appointment-status-tag ${statusClass}`}>{apt.status || 'Unbekannt'}</span>
                                </li>
                            );
                        })}
                    </ul>
                ) : (!isLoadingDaily && !error && <p className="no-upcoming-appointments">Keine anstehenden Termine für heute oder die nächsten Tage.</p>)}
            </div>

            {/* Modals für Terminbearbeitung und -erstellung */}
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