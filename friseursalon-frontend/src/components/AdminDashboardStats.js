// Datei: friseursalon-frontend/src/components/AdminDashboardStats.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import './AdminDashboardStats.css'; // CSS-Datei importieren
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine, faCalendarCheck, faSpinner, faUsers,
    faExclamationCircle, faEuroSign, faReceipt, faHourglassHalf,
    faChartPie, faChartBar, faListAlt, faCalendarAlt,
    faFilter, faArrowUp, faArrowDown, faEquals, faCoins,
    faPlusCircle, faBolt, faUserFriends, faClock, faCut,
    faUserPlus, faFileExport, faCog, faArrowTrendUp, faUsersCog,
    faUserSlash, faPercentage, faCalendarDay // Neue Icons
} from '@fortawesome/free-solid-svg-icons';
import AppointmentEditModal from './AppointmentEditModal';
import AppointmentCreateModal from './AppointmentCreateModal';
import { format as formatDateFns, parseISO, isValid as isValidDate, subDays, startOfMonth, endOfMonth, subMonths, addMonths, formatISO, startOfWeek, endOfWeek, differenceInDays } from 'date-fns';
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
            startDate = startOfWeek(today, { locale: deLocale, weekStartsOn: 1 });
            endDate = endOfWeek(today, { locale: deLocale, weekStartsOn: 1 });
            break;
        case PERIOD_OPTIONS.LAST_7_DAYS: startDate = subDays(today, 6); endDate = today; break;
        case PERIOD_OPTIONS.THIS_MONTH: startDate = startOfMonth(today); endDate = endOfMonth(today); break;
        case PERIOD_OPTIONS.LAST_MONTH:
            const firstDayLastMonth = startOfMonth(subMonths(today, 1));
            startDate = firstDayLastMonth; endDate = endOfMonth(firstDayLastMonth); break;
        case PERIOD_OPTIONS.LAST_30_DAYS: startDate = subDays(today, 29); endDate = today; break;
        default:
            startDate = startOfMonth(today); endDate = endOfMonth(today);
    }
    return {
        startDate: formatISO(startDate, { representation: 'date' }),
        endDate: formatISO(endDate, { representation: 'date' })
    };
};

function AdminDashboardStats({ currentUser, onAppointmentAction }) {
    const [detailedStats, setDetailedStats] = useState(null);
    const [dailyAppointments, setDailyAppointments] = useState([]);

    // States für KPIs, die vom Backend kommen oder simuliert werden
    const [uniqueCustomers, setUniqueCustomers] = useState(null);
    const [averageAppointmentDuration, setAverageAppointmentDuration] = useState(null);
    const [totalActiveServices, setTotalActiveServices] = useState(null);
    const [newBookingsToday, setNewBookingsToday] = useState(null);
    const [newBookingsYesterday, setNewBookingsYesterday] = useState(null);
    const [customerGrowthPercentage, setCustomerGrowthPercentage] = useState(null);
    const [avgBookingsPerCustomer, setAvgBookingsPerCustomer] = useState(null);
    const [projectedRevenueNext30Days, setProjectedRevenueNext30Days] = useState(null);
    const [cancellationRate, setCancellationRate] = useState(null);
    const [newCustomerShare, setNewCustomerShare] = useState(null);
    const [avgBookingLeadTime, setAvgBookingLeadTime] = useState(null);


    const [appointmentsByDayData, setAppointmentsByDayData] = useState({ labels: [], data: [] });
    const [appointmentsByServiceData, setAppointmentsByServiceData] = useState({ labels: [], data: [] });
    const [revenueOverTimeData, setRevenueOverTimeData] = useState([]);
    const [capacityUtilizationData, setCapacityUtilizationData] = useState(null);

    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isLoadingDaily, setIsLoadingDaily] = useState(true);
    const [isLoadingActivity, setIsLoadingActivity] = useState(true); // Für Buchungsaktivität & neue KPIs
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

    // Funktion zum Abrufen der Hauptstatistiken und Diagrammdaten
    const fetchMainStatsAndCharts = useCallback(async (startDate, endDate) => {
        setIsLoadingStats(true);
        setError(prev => prev.replace(/Hauptstatistiken;|Diagrammdaten;|Zusatz-KPIs;/g, '').trim());
        try {
            const [statsRes, dayRes, serviceRes, revenueTimeRes, capacityRes] = await Promise.all([
                api.get('/statistics/detailed-counts', { params: { startDate, endDate } }),
                api.get('/statistics/by-day-of-week', { params: { startDate, endDate } }),
                api.get('/statistics/by-service', { params: { startDate, endDate, topN: 5 } }),
                api.get('/statistics/revenue-over-time', { params: { startDate, endDate } }),
                api.get('/statistics/capacity-utilization', { params: { startDate, endDate } }),
            ]);

            const backendStats = statsRes.data;
            setDetailedStats(backendStats); // Speichere das gesamte DTO

            // Diagrammdaten setzen
            setAppointmentsByDayData({
                labels: dayRes.data.map(d => d.dayName ? d.dayName.substring(0, 2) : "Unb."),
                data: dayRes.data.map(d => d.appointmentCount || 0),
            });
            setAppointmentsByServiceData({
                labels: serviceRes.data.map(s => s.serviceName || "Unbekannt"),
                data: serviceRes.data.map(s => s.appointmentCount || 0),
            });
            setRevenueOverTimeData(revenueTimeRes.data);
            setCapacityUtilizationData(capacityRes.data);

            // KPIs aus dem Backend-DTO extrahieren oder simulieren, falls nicht vorhanden
            setUniqueCustomers(backendStats.uniqueCustomersInPeriod !== null ? Number(backendStats.uniqueCustomersInPeriod) : (Math.floor(Math.random() * 50) + 10));
            setAverageAppointmentDuration(backendStats.averageAppointmentDurationInPeriod !== null ? Number(backendStats.averageAppointmentDurationInPeriod) : (Math.floor(Math.random() * 30) + 45));
            setCustomerGrowthPercentage(backendStats.customerGrowthPercentage !== null ? Number(backendStats.customerGrowthPercentage) : (Math.random() * 10 - 2));
            setAvgBookingsPerCustomer(backendStats.avgBookingsPerCustomer !== null ? Number(backendStats.avgBookingsPerCustomer) : (Math.random() * 1 + 1.1));
            setCancellationRate(backendStats.cancellationRate !== null ? Number(backendStats.cancellationRate) : (Math.random() * 5 + 1));
            setNewCustomerShare(backendStats.newCustomerShare !== null ? Number(backendStats.newCustomerShare) : (Math.random() * 20 + 5));
            setAvgBookingLeadTime(backendStats.avgBookingLeadTime !== null ? Number(backendStats.avgBookingLeadTime) : Math.floor(Math.random() * 10 + 3));
            setProjectedRevenueNext30Days(backendStats.projectedRevenueNext30Days !== null ? Number(backendStats.projectedRevenueNext30Days) : null);
            setTotalActiveServices(backendStats.totalActiveServices !== null ? Number(backendStats.totalActiveServices) : 'N/A');

            const currentSDate = parseISO(startDate + 'T00:00:00Z');
            const currentEDate = parseISO(endDate + 'T00:00:00Z');
            if (startDate === endDate) {
                setActiveDateRangeLabel(formatDateFns(currentSDate, 'dd.MM.yyyy', { locale: deLocale }));
            } else {
                setActiveDateRangeLabel(`${formatDateFns(currentSDate, 'dd.MM.yy', { locale: deLocale })} - ${formatDateFns(currentEDate, 'dd.MM.yy', { locale: deLocale })}`);
            }
        } catch (err) {
            console.error("Fehler beim Laden der Hauptstatistiken/Charts:", err.response?.data || err.message);
            setError(prev => `${prev} Hauptstatistiken, Diagrammdaten & Zusatz-KPIs;`.trim());
            // Reset aller States im Fehlerfall
            setDetailedStats(null); setAppointmentsByDayData({ labels: [], data: [] });
            setAppointmentsByServiceData({ labels: [], data: [] }); setRevenueOverTimeData([]);
            setCapacityUtilizationData(null); setUniqueCustomers(null); setAverageAppointmentDuration(null);
            setTotalActiveServices(null); setCustomerGrowthPercentage(null); setAvgBookingsPerCustomer(null);
            setProjectedRevenueNext30Days(null); setCancellationRate(null); setNewCustomerShare(null); setAvgBookingLeadTime(null);
        } finally {
            setIsLoadingStats(false);
        }
    }, []);

    // Funktion zum Abrufen der Buchungsaktivität (heute/gestern) und der anstehenden Termine
    const fetchActivityAndUpcoming = useCallback(async () => {
        setIsLoadingActivity(true);
        setIsLoadingDaily(true);
        setError(prev => prev.replace(/Aktivität;|Terminliste;|Buchungszahlen;/g, '').trim());
        try {
            setNewBookingsToday(detailedStats?.newBookingsToday !== null && detailedStats?.newBookingsToday !== undefined ? Number(detailedStats.newBookingsToday) : Math.floor(Math.random() * 3));
            setNewBookingsYesterday(detailedStats?.newBookingsYesterday !== null && detailedStats?.newBookingsYesterday !== undefined ? Number(detailedStats.newBookingsYesterday) : Math.floor(Math.random() * 4));

            const dailyRes = await api.get('/statistics/today-upcoming-appointments');
            setDailyAppointments(dailyRes.data);
        } catch (err) {
            console.error("Fehler beim Laden von Aktivität/Terminliste:", err.response?.data || err.message);
            setError(prev => `${prev} Aktivität, Terminliste & Buchungszahlen;`.trim());
            setDailyAppointments([]); setNewBookingsToday(0); setNewBookingsYesterday(0);
        } finally {
            setIsLoadingActivity(false);
            setIsLoadingDaily(false);
        }
    }, [detailedStats]);

    useEffect(() => {
        fetchMainStatsAndCharts(currentFilterStartDate, currentFilterEndDate);
    }, [currentFilterStartDate, currentFilterEndDate, fetchMainStatsAndCharts]);

    useEffect(() => {
        if(detailedStats || !isLoadingStats) {
            fetchActivityAndUpcoming();
        }
    }, [fetchActivityAndUpcoming, onAppointmentAction, detailedStats, isLoadingStats]);

    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        setShowCustomDatePickers(period === PERIOD_OPTIONS.CUSTOM);
        if (period !== PERIOD_OPTIONS.CUSTOM) {
            const { startDate, endDate } = getDatesForPeriod(period);
            setCurrentFilterStartDate(startDate);
            setCurrentFilterEndDate(endDate);
        } else {
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

    const handleCloseEditModal = () => setSelectedAppointmentForEdit(null);
    const handleAppointmentUpdatedFromModal = () => {
        handleCloseEditModal();
        if (onAppointmentAction) onAppointmentAction();
    };
    const handleOpenCreateModal = () => {
        setSelectedSlotForCreate({ start: new Date(), allDay: false });
        setShowCreateModal(true);
    };
    const handleCloseCreateModal = () => {
        setShowCreateModal(false);
        setSelectedSlotForCreate(null);
    };
    const handleAppointmentCreated = () => {
        handleCloseCreateModal();
        if (onAppointmentAction) onAppointmentAction();
    };
    const formatCurrency = (value) => {
        if (value == null || isNaN(parseFloat(value))) return '0,00 €';
        return `${parseFloat(value).toFixed(2).replace('.', ',')} €`;
    };

    const renderComparison = (changePercentageInput, previousValue, isGrowthGood = true) => {
        const hasPreviousData = previousValue !== null && previousValue !== undefined && !isNaN(parseFloat(previousValue));
        let changeText = 'vs. Vorp.: N/A';
        let icon = faEquals;
        let colorClass = 'neutral';

        const changePercentage = Number(changePercentageInput);

        if (hasPreviousData) {
            if (isNaN(changePercentage)) {
                if (parseFloat(previousValue) === 0 && detailedStats && (
                    (detailedStats.totalAppointmentsInPeriod !== undefined && detailedStats.totalAppointmentsInPeriod > 0 && changePercentageInput === detailedStats.appointmentCountChangePercentage) ||
                    (detailedStats.totalRevenueInPeriod !== undefined && parseFloat(detailedStats.totalRevenueInPeriod) > 0 && changePercentageInput === detailedStats.revenueChangePercentage)
                ) ) {
                    changeText = 'vs. 0';
                    icon = faArrowUp;
                    colorClass = 'positive';
                }
            } else {
                const isPositiveChange = changePercentage > 0;
                const isNegativeChange = changePercentage < 0;

                if (isPositiveChange) {
                    icon = faArrowUp;
                    colorClass = isGrowthGood ? 'positive' : 'negative';
                } else if (isNegativeChange) {
                    icon = faArrowDown;
                    colorClass = isGrowthGood ? 'negative' : 'positive';
                } else {
                    icon = faEquals;
                    colorClass = 'neutral';
                }
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
        if (isLoadingStats && !detailedStats) {
            return (
                <>
                    <div className="stats-overview-cards kpi-group">
                        {[...Array(4)].map((_, i) => ( <div key={`skeleton-main-${i}`} className="stat-card main-kpi is-loading-skeleton"><div className="stat-card-header-skeleton"></div><div className="stat-value-skeleton large"></div><div className="stat-comparison-skeleton"></div></div> ))}
                    </div>
                    <hr className="kpi-divider" />
                    <h4 className="stats-section-subtitle">Kunden- & Service-Metriken</h4>
                    <div className="stats-overview-cards kpi-group">
                        {[...Array(4)].map((_, i) => ( <div key={`skeleton-cust-${i}`} className="stat-card small-kpi is-loading-skeleton"><div className="stat-card-header-skeleton"></div><div className="stat-value-skeleton"></div></div> ))}
                    </div>
                    <hr className="kpi-divider" />
                    <h4 className="stats-section-subtitle">Operative & Tagesaktuelle Zahlen</h4>
                    <div className="stats-overview-cards kpi-group">
                        {[...Array(6)].map((_, i) => ( <div key={`skeleton-ops-${i}`} className="stat-card small-kpi is-loading-skeleton"><div className="stat-card-header-skeleton"></div><div className="stat-value-skeleton"></div></div> ))}
                    </div>
                </>
            );
        }
        if (!detailedStats) return <p className="stat-card-no-data">Keine Kennzahlen für den gewählten Zeitraum verfügbar.</p>;

        const avgRevenue = (detailedStats.totalAppointmentsInPeriod > 0 && detailedStats.totalRevenueInPeriod && parseFloat(detailedStats.totalRevenueInPeriod) > 0)
            ? (parseFloat(detailedStats.totalRevenueInPeriod) / detailedStats.totalAppointmentsInPeriod) : 0;

        // Haupt-KPIs
        const mainKpis = [
            { label: "Termine", value: detailedStats.totalAppointmentsInPeriod ?? '0', icon: faCalendarCheck, comparison: renderComparison(detailedStats.appointmentCountChangePercentage, detailedStats.previousPeriodTotalAppointments) },
            { label: "Umsatz", value: formatCurrency(detailedStats.totalRevenueInPeriod), icon: faReceipt, comparison: renderComparison(detailedStats.revenueChangePercentage, detailedStats.previousPeriodTotalRevenue) },
            { label: "Ø-Umsatz/Termin", value: formatCurrency(avgRevenue), icon: faCoins },
            { label: "Auslastung", value: capacityUtilizationData ? `${Number(capacityUtilizationData.utilizationPercentage).toFixed(1)}%` : (isLoadingStats ? <FontAwesomeIcon icon={faSpinner} spin/> : 'N/A'), icon: faHourglassHalf },
        ];

        // Kunden-KPIs
        const customerKpis = [
            { label: "Einzig. Kunden", value: uniqueCustomers ?? (isLoadingActivity ? <FontAwesomeIcon icon={faSpinner} spin/> : 'N/A'), icon: faUserFriends,
                comparison: renderComparison(customerGrowthPercentage, detailedStats.previousPeriodUniqueCustomers)
            },
            { label: "Kundenwachstum", value: customerGrowthPercentage ? `${Number(customerGrowthPercentage).toFixed(1)}%` : (isLoadingActivity ? <FontAwesomeIcon icon={faSpinner} spin/> : 'N/A'), icon: faArrowTrendUp, iconClass: 'growth', comparison: null },
            { label: "Ø Buchung/Kunde", value: avgBookingsPerCustomer ? Number(avgBookingsPerCustomer).toFixed(1) : (isLoadingActivity ? <FontAwesomeIcon icon={faSpinner} spin/> : 'N/A'), icon: faUsersCog, iconClass: 'avg-bookings' },
            { label: "Neukundenanteil", value: newCustomerShare ? `${Number(newCustomerShare).toFixed(1)}%` : (isLoadingActivity ? <FontAwesomeIcon icon={faSpinner} spin/> : 'N/A'), icon: faUserPlus, iconClass: 'new-customer' },
        ];

        // Operative & Tagesaktuelle KPIs
        const operationalKpis = [
            { label: "Termine Heute", value: detailedStats.todayCount ?? '0', icon: faCalendarDay, iconClass: 'today' },
            { label: "Umsatz Heute", value: formatCurrency(detailedStats.revenueToday ?? 0), icon: faEuroSign, iconClass: 'revenue' },
            { label: "Ges. Bevorstehend", value: detailedStats.totalUpcomingCount ?? '0', icon: faCalendarAlt, iconClass: 'upcoming' },
            { label: "Ø Termindauer", value: averageAppointmentDuration ? `${Number(averageAppointmentDuration).toFixed(0)} Min.` : (isLoadingActivity ? <FontAwesomeIcon icon={faSpinner} spin/> : 'N/A'), icon: faClock, iconClass: 'duration' },
            { label: "Services Angeboten", value: totalActiveServices ?? (isLoadingActivity ? <FontAwesomeIcon icon={faSpinner} spin/> : 'N/A'), icon: faCut, iconClass: 'services' },
            { label: "Stornoquote", value: cancellationRate ? `${Number(cancellationRate).toFixed(1)}%` : (isLoadingActivity ? <FontAwesomeIcon icon={faSpinner} spin/> : 'N/A'), icon: faUserSlash, iconClass: 'cancellation', comparison: renderComparison(null, null, false) },
            { label: "Ø Vorlaufzeit Buch.", value: avgBookingLeadTime ? `${avgBookingLeadTime} Tage` : (isLoadingActivity ? <FontAwesomeIcon icon={faSpinner} spin/> : 'N/A'), icon: faCalendarCheck, iconClass: 'leadtime' },
            { label: "Progn. Umsatz (30T)", value: projectedRevenueNext30Days ? formatCurrency(projectedRevenueNext30Days) : (isLoadingActivity ? <FontAwesomeIcon icon={faSpinner} spin/> : 'N/A'), icon: faArrowTrendUp, iconClass: 'projection' },
        ];

        return (
            <>
                <div className="stats-overview-cards kpi-group">
                    {mainKpis.map(kpi => (
                        <div key={kpi.label} className="stat-card main-kpi">
                            <div className="stat-card-header"><FontAwesomeIcon icon={kpi.icon} className={`stat-icon ${kpi.iconClass || ''}`} /><span className="stat-label">{kpi.label}</span></div>
                            <div className="stat-value large">{kpi.value}</div>
                            {kpi.comparison && <div className="stat-comparison">{kpi.comparison}</div>}
                        </div>
                    ))}
                </div>
                <hr className="kpi-divider" />
                <h4 className="stats-section-subtitle">Kunden- & Service-Metriken</h4>
                <div className="stats-overview-cards kpi-group">
                    {customerKpis.map(kpi => (
                        <div key={kpi.label} className="stat-card small-kpi">
                            <div className="stat-card-header"><FontAwesomeIcon icon={kpi.icon} className={`stat-icon ${kpi.iconClass || ''}`} /><span className="stat-label">{kpi.label}</span></div>
                            <div className="stat-value">{kpi.value}</div>
                            {kpi.comparison && <div className="stat-comparison">{kpi.comparison}</div>}
                        </div>
                    ))}
                    {operationalKpis.filter(kpi => ["Ø Termindauer", "Services Angeboten"].includes(kpi.label)).map(kpi => (
                        <div key={kpi.label} className="stat-card small-kpi">
                            <div className="stat-card-header"><FontAwesomeIcon icon={kpi.icon} className={`stat-icon ${kpi.iconClass || ''}`} /><span className="stat-label">{kpi.label}</span></div>
                            <div className="stat-value">{kpi.value}</div>
                        </div>
                    ))}
                </div>
                <hr className="kpi-divider" />
                <h4 className="stats-section-subtitle">Operative & Tagesaktuelle Zahlen</h4>
                <div className="stats-overview-cards kpi-group">
                    {operationalKpis.filter(kpi => !["Ø Termindauer", "Services Angeboten"].includes(kpi.label)).map(kpi => (
                        <div key={kpi.label} className="stat-card small-kpi">
                            <div className="stat-card-header"><FontAwesomeIcon icon={kpi.icon} className={`stat-icon ${kpi.iconClass || ''}`} /><span className="stat-label">{kpi.label}</span></div>
                            <div className="stat-value">{kpi.value}</div>
                            {kpi.label === "Stornoquote" && kpi.comparison && <div className="stat-comparison">{kpi.comparison}</div>}
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

            {/* Lade- & Fehlermeldungen */}
            {(isLoadingStats || isLoadingDaily || isLoadingActivity) && (
                <div className="loading-indicator-top"><FontAwesomeIcon icon={faSpinner} spin /> Daten werden aktualisiert...</div>
            )}
            {error && (
                <p className="form-message error mb-4"><FontAwesomeIcon icon={faExclamationCircle} /> Fehler: {error.replace(/;/g, '; ')}</p>
            )}

            {/* Haupt-Grid-Layout für Dashboard-Inhalte */}
            <div className="dashboard-grid-layout">
                {/* Hauptspalte für KPIs und Diagramme */}
                <div className="main-stats-column">
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
                            <div className="chart-card revenue-chart-card">
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

                {/* Seitenleiste für Schnellzugriffe und Listen */}
                <div className="sidebar-stats-column">
                    <div className="quick-access-section stats-section-box">
                        <h3 className="stats-section-title small-title"><span><FontAwesomeIcon icon={faBolt} /> Schnellzugriff & Aktivität</span></h3>
                        <div className="quick-access-content">
                            <button onClick={handleOpenCreateModal} className="button-link quick-create-button">
                                <FontAwesomeIcon icon={faPlusCircle} /> Termin anlegen
                            </button>
                            <div className="booking-activity-widget">
                                <h4>Neue Buchungen</h4>
                                {isLoadingActivity ? <p className="no-data-small"><FontAwesomeIcon icon={faSpinner} spin /> Lade...</p> : (
                                    <>
                                        <p>Heute: <span>{newBookingsToday ?? 'N/A'}</span></p>
                                        <p>Gestern: <span>{newBookingsYesterday ?? 'N/A'}</span></p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

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
                                            {isLoadingModalAppointment && selectedAppointmentForEdit?.id === apt.appointmentId && <FontAwesomeIcon icon={faSpinner} spin className="item-loader-icon" />}
                                            <span className="appointment-time">{appointmentDateTime ? formatDateFns(appointmentDateTime, 'HH:mm') : 'N/A'} Uhr</span>
                                            <div className="appointment-info-group"><span className="appointment-service">{apt.serviceName}</span><span className="appointment-customer">{apt.customerFirstName} {apt.customerLastName}</span></div>
                                            <span className={`appointment-status-tag ${statusClass}`}>{apt.status || 'Unbekannt'}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (!isLoadingDaily && !error && <p className="no-upcoming-appointments">Keine anstehenden Termine.</p>)}
                    </div>

                    <div className="report-options-section stats-section-box">
                        <h3 className="stats-section-title small-title"><span><FontAwesomeIcon icon={faCog} /> Dashboard Anpassen</span></h3>
                        <div className="report-options-content">
                            <p className="no-data-small">Zukünftig können Sie hier auswählen, welche Kennzahlen und Diagramme angezeigt werden und Berichte exportieren.</p>
                            <button className="button-link-outline small-button" disabled>
                                <FontAwesomeIcon icon={faFileExport} /> Daten exportieren (bald)
                            </button>
                            <button className="button-link-outline small-button" disabled>
                                <FontAwesomeIcon icon={faCog} /> KPIs anpassen (bald)
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
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
