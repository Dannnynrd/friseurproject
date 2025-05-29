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
    faPlusCircle, faBolt, faUserFriends, faClock, faCut,
    faUserPlus, faFileExport, faCog, faArrowTrendUp, faUsersCog,
    faUserSlash, faPercentage, faCalendarDay, faEye, faEyeSlash,
    faInfoCircle, faHistory
} from '@fortawesome/free-solid-svg-icons';
import AppointmentEditModal from './AppointmentEditModal';
import AppointmentCreateModal from './AppointmentCreateModal';
import { format as formatDateFns, parseISO, isValid as isValidDate, subDays, startOfMonth, endOfMonth, subMonths, addMonths, formatISO, startOfWeek, endOfWeek, differenceInDays, startOfYear as dateFnsStartOfYear } from 'date-fns'; // startOfYear importiert
import { de as deLocale } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import AppointmentsByDayRechart from './charts/AppointmentsByDayRechart';
import AppointmentsByServiceRechart from './charts/AppointmentsByServiceRechart';
import RevenueOverTimeRechart from './charts/RevenueOverTimeRechart';

registerLocale('de', deLocale);

const PERIOD_OPTIONS = {
    TODAY: 'today',
    THIS_WEEK: 'thisWeek',
    LAST_7_DAYS: 'last7days',
    THIS_MONTH: 'thisMonth',
    LAST_MONTH: 'lastMonth',
    LAST_30_DAYS: 'last30days',
    YEAR_TO_DATE: 'yearToDate',
    LAST_365_DAYS: 'last365days',
    CUSTOM: 'custom',
};

const PERIOD_LABELS = {
    [PERIOD_OPTIONS.TODAY]: 'Heute',
    [PERIOD_OPTIONS.THIS_WEEK]: 'Diese Woche',
    [PERIOD_OPTIONS.LAST_7_DAYS]: 'Letzte 7 Tage',
    [PERIOD_OPTIONS.THIS_MONTH]: 'Dieser Monat',
    [PERIOD_OPTIONS.LAST_MONTH]: 'Letzter Monat',
    [PERIOD_OPTIONS.LAST_30_DAYS]: 'Letzte 30 Tage',
    [PERIOD_OPTIONS.YEAR_TO_DATE]: 'Dieses Jahr',
    [PERIOD_OPTIONS.LAST_365_DAYS]: 'Gesamt (365T)',
    [PERIOD_OPTIONS.CUSTOM]: 'Zeitraum wählen',
};

const KPI_GROUP_VISIBILITY_STORAGE_KEY = 'friseurDashboardKpiVisibility';

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
        case PERIOD_OPTIONS.YEAR_TO_DATE:
            startDate = dateFnsStartOfYear(today); // Korrekter Importname
            endDate = today;
            break;
        case PERIOD_OPTIONS.LAST_365_DAYS:
            startDate = subDays(today, 364);
            endDate = today;
            break;
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
    const [keyChanges, setKeyChanges] = useState({ positive: [], negative: [] });


    const [appointmentsByDayData, setAppointmentsByDayData] = useState({ labels: [], data: [] });
    const [appointmentsByServiceData, setAppointmentsByServiceData] = useState({ labels: [], data: [] });
    const [revenueOverTimeData, setRevenueOverTimeData] = useState([]);
    const [capacityUtilizationData, setCapacityUtilizationData] = useState(null);

    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isLoadingDaily, setIsLoadingDaily] = useState(true);
    const [isLoadingActivity, setIsLoadingActivity] = useState(true);
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
    const [customDateRangeApplied, setCustomDateRangeApplied] = useState(false);

    const [kpiGroupVisibility, setKpiGroupVisibility] = useState(() => {
        const savedVisibility = localStorage.getItem(KPI_GROUP_VISIBILITY_STORAGE_KEY);
        return savedVisibility ? JSON.parse(savedVisibility) : {
            main: true,
            customerService: true,
            operationalDaily: true,
        };
    });

    useEffect(() => {
        localStorage.setItem(KPI_GROUP_VISIBILITY_STORAGE_KEY, JSON.stringify(kpiGroupVisibility));
    }, [kpiGroupVisibility]);

    const toggleKpiGroupVisibility = (groupKey) => {
        setKpiGroupVisibility(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
    };


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
            setDetailedStats(backendStats);

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

            // KPIs aus dem Backend-DTO extrahieren oder stabile Fallbacks verwenden
            setUniqueCustomers(backendStats.uniqueCustomersInPeriod != null ? Number(backendStats.uniqueCustomersInPeriod) : null);
            setAverageAppointmentDuration(backendStats.averageAppointmentDurationInPeriod != null ? Number(backendStats.averageAppointmentDurationInPeriod) : null);

            const growthFromBackend = backendStats.customerGrowthPercentage != null ? Number(backendStats.customerGrowthPercentage) : null;
            setCustomerGrowthPercentage(growthFromBackend);

            setAvgBookingsPerCustomer(backendStats.avgBookingsPerCustomer != null ? Number(backendStats.avgBookingsPerCustomer) : null);
            setCancellationRate(backendStats.cancellationRate != null ? Number(backendStats.cancellationRate) : null);
            setNewCustomerShare(backendStats.newCustomerShare != null ? Number(backendStats.newCustomerShare) : null);
            setAvgBookingLeadTime(backendStats.avgBookingLeadTime != null ? Number(backendStats.avgBookingLeadTime) : null);
            setProjectedRevenueNext30Days(backendStats.projectedRevenueNext30Days != null ? Number(backendStats.projectedRevenueNext30Days) : null);
            setTotalActiveServices(backendStats.totalActiveServices != null ? Number(backendStats.totalActiveServices) : null);

            // "Wichtigste Veränderungen" basierend auf den *aktuell abgerufenen* backendStats
            const changes = [];
            if (backendStats.revenueChangePercentage != null) changes.push({ label: "Umsatz", value: backendStats.revenueChangePercentage, isGood: backendStats.revenueChangePercentage >= 0 });
            if (backendStats.appointmentCountChangePercentage != null) changes.push({ label: "Terminanzahl", value: backendStats.appointmentCountChangePercentage, isGood: backendStats.appointmentCountChangePercentage >= 0 });
            if (growthFromBackend != null) changes.push({ label: "Kundenwachstum", value: growthFromBackend, isGood: growthFromBackend >= 0 });
            // TODO: Weitere "Key Changes" hinzufügen, wenn das Backend entsprechende Vergleichswerte liefert (z.B. für Stornoquote)

            changes.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
            setKeyChanges({
                positive: changes.filter(c => c.isGood && c.value > 0).slice(0, 2),
                negative: changes.filter(c => !c.isGood && c.value < 0).slice(0, 2)
            });

            if (selectedPeriod === PERIOD_OPTIONS.CUSTOM && customDateRangeApplied) {
                setActiveDateRangeLabel(`Zeitraum: ${formatDateFns(parseISO(startDate), 'dd.MM.yy')} - ${formatDateFns(parseISO(endDate), 'dd.MM.yy')}`);
            } else if (selectedPeriod !== PERIOD_OPTIONS.CUSTOM) {
                setActiveDateRangeLabel(PERIOD_LABELS[selectedPeriod]);
            }

        } catch (err) {
            console.error("Fehler beim Laden der Hauptstatistiken/Charts:", err.response?.data || err.message);
            setError(prev => `${prev} Hauptstatistiken, Diagrammdaten & Zusatz-KPIs;`.trim());
            setDetailedStats(null); setAppointmentsByDayData({ labels: [], data: [] });
            setAppointmentsByServiceData({ labels: [], data: [] }); setRevenueOverTimeData([]);
            setCapacityUtilizationData(null); setUniqueCustomers(null); setAverageAppointmentDuration(null);
            setTotalActiveServices(null); setCustomerGrowthPercentage(null); setAvgBookingsPerCustomer(null);
            setProjectedRevenueNext30Days(null); setCancellationRate(null); setNewCustomerShare(null); setAvgBookingLeadTime(null);
            setKeyChanges({ positive: [], negative: [] });
        } finally {
            setIsLoadingStats(false);
        }
    }, [selectedPeriod, customDateRangeApplied]); // Entferne customerGrowthPercentage aus den Dependencies

    const fetchActivityAndUpcoming = useCallback(async () => {
        setIsLoadingActivity(true);
        setIsLoadingDaily(true);
        setError(prev => prev.replace(/Aktivität;|Terminliste;|Buchungszahlen;/g, '').trim());
        try {
            // Werte direkt aus detailedStats nehmen, wenn vorhanden, sonst Fallback
            setNewBookingsToday(detailedStats?.newBookingsToday != null ? Number(detailedStats.newBookingsToday) : 0);
            setNewBookingsYesterday(detailedStats?.newBookingsYesterday != null ? Number(detailedStats.newBookingsYesterday) : 0);

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
        // Dieser Effekt soll laufen, wenn detailedStats sich ändert (nach fetchMainStatsAndCharts)
        // oder wenn eine externe Aktion (onAppointmentAction) ein Neuladen erfordert.
        if (detailedStats || !isLoadingStats) { // Nur ausführen, wenn Hauptdaten geladen sind oder Ladevorgang beendet
            fetchActivityAndUpcoming();
        }
    }, [detailedStats, isLoadingStats, onAppointmentAction, fetchActivityAndUpcoming]);


    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        setCustomDateRangeApplied(false);
        if (period !== PERIOD_OPTIONS.CUSTOM) {
            const { startDate, endDate } = getDatesForPeriod(period);
            setCurrentFilterStartDate(startDate);
            setCurrentFilterEndDate(endDate);
            setActiveDateRangeLabel(PERIOD_LABELS[period]);
            setShowCustomDatePickers(false);
        } else {
            setShowCustomDatePickers(true);
        }
    };

    const handleApplyCustomDateRange = () => {
        if (customPickerStartDate && customPickerEndDate) {
            if (customPickerEndDate < customPickerStartDate) {
                setError("Das Enddatum darf nicht vor dem Startdatum liegen.");
                return;
            }
            const newStartDate = formatISO(customPickerStartDate, { representation: 'date' });
            const newEndDate = formatISO(customPickerEndDate, { representation: 'date' });
            setCurrentFilterStartDate(newStartDate);
            setCurrentFilterEndDate(newEndDate);
            setActiveDateRangeLabel(`Zeitraum: ${formatDateFns(customPickerStartDate, 'dd.MM.yy')} - ${formatDateFns(customPickerEndDate, 'dd.MM.yy')}`);
            setShowCustomDatePickers(false);
            setCustomDateRangeApplied(true);
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

        if (hasPreviousData && parseFloat(previousValue) !== 0) {
            if (isNaN(changePercentage)) {
                // Bleibt N/A wenn keine Prozentänderung vorhanden ist
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
        } else if (hasPreviousData && parseFloat(previousValue) === 0 && !isNaN(changePercentage) && changePercentage > 0) {
            changeText = 'vs. 0';
            icon = faArrowUp;
            colorClass = 'positive';
        } else if (hasPreviousData && parseFloat(previousValue) === 0 && (isNaN(changePercentage) || changePercentage === 0)) {
            // Wenn Vorperiode 0 war und aktuelle Periode auch (oder keine Änderung), bleibt es neutral
            changeText = 'vs. 0';
        }
        return (
            <span className={`comparison-data ${colorClass}`}>
                <FontAwesomeIcon icon={icon} /> {changeText}
            </span>
        );
    };

    const KpiCard = ({ label, value, icon, iconClass, comparison, tooltipText, isMain = false }) => (
        <div className={`stat-card ${isMain ? 'main-kpi' : 'small-kpi'}`} title={tooltipText || label}>
            <div className="stat-card-header">
                <FontAwesomeIcon icon={icon} className={`stat-icon ${iconClass || ''}`} />
                <span className="stat-label">{label}</span>
            </div>
            <div className={`stat-value ${isMain ? 'large' : ''}`}>{value === null || value === undefined ? 'N/A' : value}</div>
            {comparison && <div className="stat-comparison">{comparison}</div>}
        </div>
    );

    const renderStatCards = () => {
        if (isLoadingStats && !detailedStats) {
            const skeletonCard = (isMain, keyPrefix) => (
                <div key={`${keyPrefix}-${Math.random()}`} className={`stat-card ${isMain ? 'main-kpi' : 'small-kpi'} is-loading-skeleton`}>
                    <div className="stat-card-header-skeleton"></div>
                    <div className={`stat-value-skeleton ${isMain ? 'large' : ''}`}></div>
                    {isMain && <div className="stat-comparison-skeleton"></div>}
                </div>
            );
            return (
                <>
                    {kpiGroupVisibility.main && (
                        <div className="stats-overview-cards kpi-group">
                            {[...Array(4)].map((_, i) => skeletonCard(true, `main-skel-${i}`))}
                        </div>
                    )}
                    {kpiGroupVisibility.customerService && (
                        <>
                            <hr className="kpi-divider" />
                            <h4 className="stats-section-subtitle">Kunden- & Service-Metriken</h4>
                            <div className="stats-overview-cards kpi-group">
                                {[...Array(4)].map((_, i) => skeletonCard(false, `cust-skel-${i}`))}
                            </div>
                        </>
                    )}
                    {kpiGroupVisibility.operationalDaily && (
                        <>
                            <hr className="kpi-divider" />
                            <h4 className="stats-section-subtitle">Operative & Tagesaktuelle Zahlen</h4>
                            <div className="stats-overview-cards kpi-group">
                                {[...Array(6)].map((_, i) => skeletonCard(false, `ops-skel-${i}`))}
                            </div>
                        </>
                    )}
                </>
            );
        }
        if (!detailedStats) return <p className="stat-card-no-data">Keine Kennzahlen für den gewählten Zeitraum verfügbar.</p>;

        const avgRevenue = (detailedStats.totalAppointmentsInPeriod > 0 && detailedStats.totalRevenueInPeriod && parseFloat(detailedStats.totalRevenueInPeriod) > 0)
            ? (parseFloat(detailedStats.totalRevenueInPeriod) / detailedStats.totalAppointmentsInPeriod) : 0;

        const mainKpis = [
            { id: 'termine', label: "Termine", value: detailedStats.totalAppointmentsInPeriod ?? '0', icon: faCalendarCheck, comparison: renderComparison(detailedStats.appointmentCountChangePercentage, detailedStats.previousPeriodTotalAppointments), tooltipText: "Gesamtzahl der Termine im ausgewählten Zeitraum." },
            { id: 'umsatz', label: "Umsatz", value: formatCurrency(detailedStats.totalRevenueInPeriod), icon: faReceipt, comparison: renderComparison(detailedStats.revenueChangePercentage, detailedStats.previousPeriodTotalRevenue), tooltipText: "Gesamtumsatz im ausgewählten Zeitraum." },
            { id: 'avgUmsatz', label: "Ø-Umsatz/Termin", value: formatCurrency(avgRevenue), icon: faCoins, tooltipText: "Durchschnittlicher Umsatz pro Termin." },
            { id: 'auslastung', label: "Auslastung", value: capacityUtilizationData ? `${Number(capacityUtilizationData.utilizationPercentage).toFixed(1)}%` : (isLoadingStats ? <FontAwesomeIcon icon={faSpinner} spin/> : 'N/A'), icon: faHourglassHalf, tooltipText: "Prozentuale Auslastung der verfügbaren Arbeitszeit." },
        ];

        const customerKpis = [
            { id: 'einzigKunden', label: "Einzig. Kunden", value: uniqueCustomers ?? (isLoadingActivity ? <FontAwesomeIcon icon={faSpinner} spin/> : 'N/A'), icon: faUserFriends, comparison: renderComparison(customerGrowthPercentage, detailedStats.previousPeriodUniqueCustomers), tooltipText: "Anzahl der unterschiedlichen Kunden mit Terminen." },
            { id: 'kundenWachstum', label: "Kundenwachstum", value: customerGrowthPercentage != null ? `${Number(customerGrowthPercentage).toFixed(1)}%` : 'N/A', icon: faArrowTrendUp, iconClass: 'growth', tooltipText: "Prozentuale Veränderung der einzigartigen Kunden zur Vorperiode." },
            { id: 'avgBuchungKunde', label: "Ø Buchung/Kunde", value: avgBookingsPerCustomer != null ? Number(avgBookingsPerCustomer).toFixed(1) : 'N/A', icon: faUsersCog, iconClass: 'avg-bookings', tooltipText: "Durchschnittliche Anzahl Buchungen pro Kunde." },
            { id: 'neukundenAnteil', label: "Neukundenanteil", value: newCustomerShare != null ? `${Number(newCustomerShare).toFixed(1)}%` : 'N/A', icon: faUserPlus, iconClass: 'new-customer', tooltipText: "Anteil neuer Kunden an allen Kunden im Zeitraum (benötigt Backend-Logik)." },
        ];

        const operationalKpis = [
            { id: 'termineHeute', label: "Termine Heute", value: detailedStats.todayCount ?? '0', icon: faCalendarDay, iconClass: 'today', tooltipText: "Anzahl der Termine am heutigen Tag." },
            { id: 'umsatzHeute', label: "Umsatz Heute", value: formatCurrency(detailedStats.revenueToday ?? 0), icon: faEuroSign, iconClass: 'revenue', tooltipText: "Heutiger Umsatz." },
            { id: 'gesBevorstehend', label: "Ges. Bevorstehend", value: detailedStats.totalUpcomingCount ?? '0', icon: faCalendarAlt, iconClass: 'upcoming', tooltipText: "Gesamtzahl aller zukünftigen Termine." },
            { id: 'avgTermindauer', label: "Ø Termindauer", value: averageAppointmentDuration != null ? `${Number(averageAppointmentDuration).toFixed(0)} Min.` : 'N/A', icon: faClock, iconClass: 'duration', tooltipText: "Durchschnittliche Dauer eines Termins." },
            { id: 'servicesAngeboten', label: "Services Angeboten", value: totalActiveServices ?? 'N/A', icon: faCut, iconClass: 'services', tooltipText: "Anzahl der aktuell angebotenen Dienstleistungen." },
            { id: 'stornoquote', label: "Stornoquote", value: cancellationRate != null ? `${Number(cancellationRate).toFixed(1)}%` : 'N/A', icon: faUserSlash, iconClass: 'cancellation', comparison: renderComparison(null, detailedStats.previousPeriodCancellationRate, false), tooltipText: "Prozentsatz stornierter Termine (benötigt Backend-Logik)." }, // Annahme: Backend liefert previousPeriodCancellationRate
            { id: 'avgVorlaufzeit', label: "Ø Vorlaufzeit Buch.", value: avgBookingLeadTime != null ? `${avgBookingLeadTime} Tage` : 'N/A', icon: faCalendarCheck, iconClass: 'leadtime', tooltipText: "Durchschnittliche Zeit zwischen Buchung und Termin (benötigt Backend-Logik)." },
            { id: 'prognUmsatz', label: "Progn. Umsatz (30T)", value: projectedRevenueNext30Days != null ? formatCurrency(projectedRevenueNext30Days) : 'N/A', icon: faArrowTrendUp, iconClass: 'projection', tooltipText: "Geschätzter Umsatz für die nächsten 30 Tage basierend auf aktuellen Daten." },
        ];

        return (
            <>
                {kpiGroupVisibility.main && (
                    <div className="stats-overview-cards kpi-group">
                        {mainKpis.map(kpi => <KpiCard key={kpi.id} {...kpi} isMain={true} />)}
                    </div>
                )}
                {kpiGroupVisibility.customerService && (
                    <>
                        <hr className="kpi-divider" />
                        <h4 className="stats-section-subtitle">Kunden- & Service-Metriken</h4>
                        <div className="stats-overview-cards kpi-group">
                            {customerKpis.map(kpi => <KpiCard key={kpi.id} {...kpi} />)}
                            {operationalKpis.filter(kpi => ["Ø Termindauer", "Services Angeboten"].includes(kpi.label)).map(kpi => <KpiCard key={kpi.id} {...kpi} />)}
                        </div>
                    </>
                )}
                {kpiGroupVisibility.operationalDaily && (
                    <>
                        <hr className="kpi-divider" />
                        <h4 className="stats-section-subtitle">Operative & Tagesaktuelle Zahlen</h4>
                        <div className="stats-overview-cards kpi-group">
                            {operationalKpis.filter(kpi => !["Ø Termindauer", "Services Angeboten"].includes(kpi.label)).map(kpi => <KpiCard key={kpi.id} {...kpi} />)}
                        </div>
                    </>
                )}
            </>
        );
    };

    const renderKeyChanges = () => {
        if (isLoadingStats || isLoadingActivity) {
            return <p className="no-data-small"><FontAwesomeIcon icon={faSpinner} spin /> Lade Veränderungen...</p>;
        }
        if (keyChanges.positive.length === 0 && keyChanges.negative.length === 0) {
            return <p className="no-data-small">Keine signifikanten Veränderungen im Vergleich zur Vorperiode.</p>;
        }
        return (
            <ul className="key-changes-list">
                {keyChanges.positive.map(change => (
                    <li key={`pos-${change.label}`} className="key-change-item positive">
                        <FontAwesomeIcon icon={faArrowUp} /> <span>{change.label}: +{Number(change.value).toFixed(1)}%</span>
                    </li>
                ))}
                {keyChanges.negative.map(change => (
                    <li key={`neg-${change.label}`} className="key-change-item negative">
                        <FontAwesomeIcon icon={faArrowDown} /> <span>{change.label}: {Number(change.value).toFixed(1)}%</span>
                    </li>
                ))}
            </ul>
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
                    <div className="custom-date-pickers-container">
                        <div className="custom-date-pickers">
                            <DatePicker selected={customPickerStartDate} onChange={date => setCustomPickerStartDate(date)} selectsStart startDate={customPickerStartDate} endDate={customPickerEndDate} dateFormat="dd.MM.yyyy" locale="de" placeholderText="Start" className="date-picker-input" maxDate={addMonths(new Date(), 12)} />
                            <DatePicker selected={customPickerEndDate} onChange={date => setCustomPickerEndDate(date)} selectsEnd startDate={customPickerStartDate} endDate={customPickerEndDate} minDate={customPickerStartDate} maxDate={addMonths(new Date(), 12)} dateFormat="dd.MM.yyyy" locale="de" placeholderText="Ende" className="date-picker-input" />
                        </div>
                        <button onClick={handleApplyCustomDateRange} className="button-link apply-custom-date-btn" disabled={isLoadingStats || !customPickerStartDate || !customPickerEndDate}>
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
                    <div className="key-changes-section stats-section-box">
                        <h3 className="stats-section-title small-title"><span><FontAwesomeIcon icon={faHistory} /> Wichtigste Veränderungen</span></h3>
                        {renderKeyChanges()}
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

                    <div className="dashboard-customize-section stats-section-box">
                        <h3 className="stats-section-title small-title"><span><FontAwesomeIcon icon={faCog} /> Dashboard Anpassen</span></h3>
                        <div className="dashboard-customize-content">
                            <p className="no-data-small">Passen Sie die Ansicht Ihres Dashboards an.</p>
                            <fieldset className="kpi-visibility-controls">
                                <legend>Angezeigte KPI-Gruppen:</legend>
                                {Object.entries({main: "Hauptkennzahlen", customerService: "Kunden & Services", operationalDaily: "Operative Zahlen"}).map(([key, label]) => (
                                    <div key={key} className="kpi-visibility-toggle">
                                        <input type="checkbox" id={`toggle-${key}`} checked={kpiGroupVisibility[key]} onChange={() => toggleKpiGroupVisibility(key)} />
                                        <label htmlFor={`toggle-${key}`}>{label}</label>
                                    </div>
                                ))}
                            </fieldset>
                            <button className="button-link-outline small-button mt-2" disabled>
                                <FontAwesomeIcon icon={faFileExport} /> Daten exportieren (bald)
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
