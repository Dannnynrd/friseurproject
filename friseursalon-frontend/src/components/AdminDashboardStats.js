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
    faInfoCircle, faHistory, faCalendarWeek, faGlobe, faBell, faTimes,
    faBullseye, faSyncAlt, faDownload, faSortAmountUp, faSortAmountDown, // Für Sortierung
    faBusinessTime // Für neues Chart
} from '@fortawesome/free-solid-svg-icons';
import AppointmentEditModal from './AppointmentEditModal';
import AppointmentCreateModal from './AppointmentCreateModal';
import {
    format as formatDateFns, parseISO, isValid as isValidDate,
    subDays, startOfMonth, endOfMonth, subMonths, addMonths,
    formatISO, startOfWeek, endOfWeek, differenceInDays,
    startOfYear as dateFnsStartOfYear
} from 'date-fns';
import { de as deLocale } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import AppointmentsByDayRechart from './charts/AppointmentsByDayRechart';
import AppointmentsByServiceRechart from './charts/AppointmentsByServiceRechart';
import RevenueOverTimeRechart from './charts/RevenueOverTimeRechart';
// Platzhalter für neues Chart
import AppointmentsByHourRechart from './charts/AppointmentsByHourRechart';


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

const KPI_VISIBILITY_STORAGE_KEY = 'friseurDashboardKpiVisibility_v2';
const KPI_GOALS_STORAGE_KEY = 'friseurDashboardKpiGoals_v1';
const KPI_GROUP_ORDER_STORAGE_KEY = 'friseurDashboardKpiGroupOrder_v1';


const KPI_DEFINITIONS = {
    main: {
        label: "Hauptkennzahlen",
        kpis: [
            { id: 'termine', label: "Termine", icon: faCalendarCheck, isMain: true, tooltip: "Gesamtzahl der Termine im ausgewählten Zeitraum.", goalKey: 'monthlyAppointmentsGoal' },
            { id: 'umsatz', label: "Umsatz", icon: faReceipt, isMain: true, tooltip: "Gesamtumsatz im ausgewählten Zeitraum.", goalKey: 'monthlyRevenueGoal', isCurrency: true },
            { id: 'avgUmsatz', label: "Ø-Umsatz/Termin", icon: faCoins, isMain: true, tooltip: "Durchschnittlicher Umsatz pro Termin." },
            { id: 'auslastung', label: "Auslastung", icon: faHourglassHalf, isMain: true, tooltip: "Prozentuale Auslastung der verfügbaren Arbeitszeit." },
        ]
    },
    customerService: {
        label: "Kunden- & Service-Metriken",
        kpis: [
            { id: 'einzigKunden', label: "Einzig. Kunden", icon: faUserFriends, tooltip: "Anzahl der unterschiedlichen Kunden mit Terminen." },
            { id: 'kundenWachstum', label: "Kundenwachstum", icon: faArrowTrendUp, iconClass: 'growth', tooltip: "Prozentuale Veränderung der einzigartigen Kunden zur Vorperiode." },
            { id: 'avgBuchungKunde', label: "Ø Buchung/Kunde", icon: faUsersCog, iconClass: 'avg-bookings', tooltip: "Durchschnittliche Anzahl Buchungen pro Kunde." },
            { id: 'neukundenAnteil', label: "Neukundenanteil", icon: faUserPlus, iconClass: 'new-customer', tooltip: "Anteil neuer Kunden an allen Kunden im Zeitraum (benötigt Backend-Logik)." },
            { id: 'avgTermindauer', label: "Ø Termindauer", icon: faClock, iconClass: 'duration', tooltip: "Durchschnittliche Dauer eines Termins." },
            { id: 'servicesAngeboten', label: "Services Angeboten", icon: faCut, iconClass: 'services', tooltip: "Anzahl der aktuell angebotenen Dienstleistungen." },
        ]
    },
    operationalDaily: {
        label: "Operative & Tagesaktuelle Zahlen",
        kpis: [
            { id: 'termineHeute', label: "Termine Heute", icon: faCalendarDay, iconClass: 'today', tooltip: "Anzahl der Termine am heutigen Tag." },
            { id: 'umsatzHeute', label: "Umsatz Heute", icon: faEuroSign, iconClass: 'revenue', tooltipText: "Heutiger Umsatz." },
            { id: 'gesBevorstehend', label: "Ges. Bevorstehend", icon: faCalendarAlt, iconClass: 'upcoming', tooltip: "Gesamtzahl aller zukünftigen Termine." },
            { id: 'stornoquote', label: "Stornoquote", icon: faUserSlash, iconClass: 'cancellation', tooltip: "Prozentsatz stornierter Termine (benötigt Backend-Logik)." },
            { id: 'avgVorlaufzeit', label: "Ø Vorlaufzeit Buch.", icon: faCalendarCheck, iconClass: 'leadtime', tooltip: "Durchschnittliche Zeit zwischen Buchung und Termin (benötigt Backend-Logik)." },
            { id: 'prognUmsatz', label: "Progn. Umsatz (30T)", icon: faArrowTrendUp, iconClass: 'projection', tooltip: "Geschätzter Umsatz für die nächsten 30 Tage basierend auf aktuellen Daten." },
        ]
    }
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
        case PERIOD_OPTIONS.YEAR_TO_DATE:
            startDate = dateFnsStartOfYear(today);
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
    const [keyChanges, setKeyChanges] = useState({ positive: [], negative: [] });
    const [dashboardAlerts, setDashboardAlerts] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);

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

    const [appointmentsByHourData, setAppointmentsByHourData] = useState([]); // Für neues Chart


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

    const [kpiVisibility, setKpiVisibility] = useState(() => {
        try {
            const saved = localStorage.getItem(KPI_VISIBILITY_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                const validatedVisibility = {};
                for (const groupKey in KPI_DEFINITIONS) {
                    validatedVisibility[groupKey] = {
                        visible: parsed[groupKey]?.visible ?? true,
                        kpis: {}
                    };
                    KPI_DEFINITIONS[groupKey].kpis.forEach(kpi => {
                        validatedVisibility[groupKey].kpis[kpi.id] = parsed[groupKey]?.kpis?.[kpi.id] ?? true;
                    });
                }
                return validatedVisibility;
            }
        } catch (e) { console.error("Fehler beim Lesen der KPI Sichtbarkeit:", e); }
        const defaultVisibility = {};
        for (const groupKey in KPI_DEFINITIONS) {
            defaultVisibility[groupKey] = { visible: true, kpis: {} };
            KPI_DEFINITIONS[groupKey].kpis.forEach(kpi => {
                defaultVisibility[groupKey].kpis[kpi.id] = true;
            });
        }
        return defaultVisibility;
    });

    const [kpiGoals, setKpiGoals] = useState(() => {
        try {
            const savedGoals = localStorage.getItem(KPI_GOALS_STORAGE_KEY);
            return savedGoals ? JSON.parse(savedGoals) : {
                monthlyRevenueGoal: null,
                monthlyAppointmentsGoal: null,
            };
        } catch (e) {
            console.error("Fehler beim Lesen der KPI Ziele:", e);
            return { monthlyRevenueGoal: null, monthlyAppointmentsGoal: null };
        }
    });

    const [kpiGroupOrder, setKpiGroupOrder] = useState(() => {
        try {
            const savedOrder = localStorage.getItem(KPI_GROUP_ORDER_STORAGE_KEY);
            return savedOrder ? JSON.parse(savedOrder) : Object.keys(KPI_DEFINITIONS); // Default order
        } catch (e) {
            console.error("Fehler beim Lesen der KPI Gruppenreihenfolge:", e);
            return Object.keys(KPI_DEFINITIONS);
        }
    });


    useEffect(() => {
        try { localStorage.setItem(KPI_VISIBILITY_STORAGE_KEY, JSON.stringify(kpiVisibility)); }
        catch (e) { console.error("Fehler beim Speichern der KPI Sichtbarkeit:", e); }
    }, [kpiVisibility]);

    useEffect(() => {
        try { localStorage.setItem(KPI_GOALS_STORAGE_KEY, JSON.stringify(kpiGoals)); }
        catch (e) { console.error("Fehler beim Speichern der KPI Ziele:", e); }
    }, [kpiGoals]);

    useEffect(() => {
        try { localStorage.setItem(KPI_GROUP_ORDER_STORAGE_KEY, JSON.stringify(kpiGroupOrder)); }
        catch (e) { console.error("Fehler beim Speichern der KPI Gruppenreihenfolge:", e); }
    }, [kpiGroupOrder]);


    const handleGoalChange = (goalKey, value) => {
        const numericValue = value === '' ? null : Number(value);
        if (value === '' || (!isNaN(numericValue) && numericValue >= 0)) {
            setKpiGoals(prev => ({ ...prev, [goalKey]: numericValue }));
        }
    };

    const toggleKpiGroupVisibility = (groupKey) => {
        setKpiVisibility(prev => ({
            ...prev,
            [groupKey]: { ...prev[groupKey], visible: !prev[groupKey].visible }
        }));
    };

    const toggleIndividualKpiVisibility = (groupKey, kpiId) => {
        setKpiVisibility(prev => {
            const newGroupKpis = { ...prev[groupKey].kpis, [kpiId]: !prev[groupKey].kpis[kpiId] };
            return {
                ...prev,
                [groupKey]: { ...prev[groupKey], kpis: newGroupKpis }
            };
        });
    };

    const moveKpiGroup = (groupKey, direction) => {
        setKpiGroupOrder(prevOrder => {
            const currentIndex = prevOrder.indexOf(groupKey);
            if (currentIndex === -1) return prevOrder;
            const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (newIndex < 0 || newIndex >= prevOrder.length) return prevOrder;

            const newOrder = [...prevOrder];
            const temp = newOrder[currentIndex];
            newOrder[currentIndex] = newOrder[newIndex];
            newOrder[newIndex] = temp;
            return newOrder;
        });
    };


    const fetchMainStatsAndCharts = useCallback(async (startDate, endDate) => {
        setIsLoadingStats(true);
        setError(prev => prev.replace(/Hauptstatistiken;|Diagrammdaten;|Zusatz-KPIs;/g, '').trim());
        try {
            const [statsRes, dayRes, serviceRes, revenueTimeRes, capacityRes /*, hourRes (später)*/] = await Promise.all([
                api.get('/statistics/detailed-counts', { params: { startDate, endDate } }),
                api.get('/statistics/by-day-of-week', { params: { startDate, endDate } }),
                api.get('/statistics/by-service', { params: { startDate, endDate, topN: 5 } }),
                api.get('/statistics/revenue-over-time', { params: { startDate, endDate } }),
                api.get('/statistics/capacity-utilization', { params: { startDate, endDate } }),
                // TODO: api.get('/statistics/by-hour-of-day', { params: { startDate, endDate } }),
            ]);

            const backendStats = statsRes.data;
            setDetailedStats(backendStats);

            setAppointmentsByDayData({
                labels: dayRes.data.map(d => d.dayName ? d.dayName.substring(0, 2) : "Unb."),
                data: dayRes.data.map(d => d.appointmentCount || 0),
            });
            setAppointmentsByServiceData({
                labels: serviceRes.data.map(s => s.serviceName || "Unbekannt"),
                data: serviceRes.data.map(s => s.appointmentCount || 0)
            });
            setRevenueOverTimeData(revenueTimeRes.data);
            setCapacityUtilizationData(capacityRes.data);

            // Simulierte Daten für Termine pro Stunde (bis Backend bereit ist)
            const exampleHourData = [
                { hour: 8, appointments: Math.floor(Math.random() * 5) }, { hour: 9, appointments: Math.floor(Math.random() * 8) },
                { hour: 10, appointments: Math.floor(Math.random() * 12) }, { hour: 11, appointments: Math.floor(Math.random() * 10) },
                { hour: 12, appointments: Math.floor(Math.random() * 6) }, { hour: 13, appointments: Math.floor(Math.random() * 4) },
                { hour: 14, appointments: Math.floor(Math.random() * 9) }, { hour: 15, appointments: Math.floor(Math.random() * 11) },
                { hour: 16, appointments: Math.floor(Math.random() * 10) }, { hour: 17, appointments: Math.floor(Math.random() * 7) },
                { hour: 18, appointments: Math.floor(Math.random() * 3) }
            ];
            setAppointmentsByHourData(exampleHourData);


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

            const alerts = [];
            if (backendStats.cancellationRate != null && Number(backendStats.cancellationRate) > 10) {
                alerts.push({ type: 'warning', message: `Hohe Stornoquote: ${Number(backendStats.cancellationRate).toFixed(1)}%`});
            }
            if (capacityRes.data && capacityRes.data.utilizationPercentage < 50) {
                alerts.push({ type: 'info', message: `Auslastung bei nur ${Number(capacityRes.data.utilizationPercentage).toFixed(1)}%. Potenzial prüfen!`});
            }
            setDashboardAlerts(alerts.slice(0,2));


            const changes = [];
            if (backendStats.revenueChangePercentage != null) changes.push({ label: "Umsatz", value: backendStats.revenueChangePercentage, isGood: backendStats.revenueChangePercentage >= 0 });
            if (backendStats.appointmentCountChangePercentage != null) changes.push({ label: "Terminanzahl", value: backendStats.appointmentCountChangePercentage, isGood: backendStats.appointmentCountChangePercentage >= 0 });
            if (growthFromBackend != null) changes.push({ label: "Kundenwachstum", value: growthFromBackend, isGood: growthFromBackend >= 0 });
            if (backendStats.cancellationRateChangePercentage != null) {
                changes.push({ label: "Stornoquote", value: backendStats.cancellationRateChangePercentage, isGood: backendStats.cancellationRateChangePercentage <= 0 });
            }
            if (backendStats.newCustomerShareChangePercentage != null) {
                changes.push({ label: "Neukundenanteil", value: backendStats.newCustomerShareChangePercentage, isGood: backendStats.newCustomerShareChangePercentage >= 0 });
            }


            changes.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
            setKeyChanges({
                positive: changes.filter(c => c.isGood && c.value > 0).slice(0, 2),
                negative: changes.filter(c => !c.isGood && c.value !== 0).slice(0, 2)
            });


            if (selectedPeriod === PERIOD_OPTIONS.CUSTOM && customDateRangeApplied) {
                setActiveDateRangeLabel(`Zeitraum: ${formatDateFns(parseISO(startDate), 'dd.MM.yy')} - ${formatDateFns(parseISO(endDate), 'dd.MM.yy')}`);
            } else if (selectedPeriod !== PERIOD_OPTIONS.CUSTOM) {
                setActiveDateRangeLabel(PERIOD_LABELS[selectedPeriod]);
            }
            setLastUpdated(new Date());

        } catch (err) {
            console.error("Fehler beim Laden der Hauptstatistiken/Charts:", err.response?.data || err.message);
            setError(prev => `${prev} Hauptstatistiken, Diagrammdaten & Zusatz-KPIs;`.trim());
            setDetailedStats(null); setAppointmentsByDayData({ labels: [], data: [] });
            setAppointmentsByServiceData({ labels: [], data: [] }); setRevenueOverTimeData([]);
            setCapacityUtilizationData(null);
            setKeyChanges({ positive: [], negative: [] });
            setDashboardAlerts([]);
            setLastUpdated(null);
            setAppointmentsByHourData([]); // Reset für neues Chart
        } finally {
            setIsLoadingStats(false);
        }
    }, [selectedPeriod, customDateRangeApplied]);

    const fetchActivityAndUpcoming = useCallback(async () => {
        setIsLoadingActivity(true);
        setIsLoadingDaily(true);
        setError(prev => prev.replace(/Aktivität;|Terminliste;|Buchungszahlen;/g, '').trim());
        try {
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
        if (detailedStats || !isLoadingStats) {
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
            setActiveDateRangeLabel(PERIOD_LABELS[PERIOD_OPTIONS.CUSTOM]);
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
            if (isNaN(changePercentage) || changePercentageInput === null) {
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
            changeText = 'vs. 0';
        }
        return (
            <span className={`comparison-data ${colorClass}`}>
                <FontAwesomeIcon icon={icon} /> {changeText}
            </span>
        );
    };

    const KpiCard = ({ label, value, icon, iconClass, comparison, tooltipText, isMain = false, goalValue, isCurrencyGoal = false }) => {
        let progressPercent = null;
        let goalText = null;

        if (goalValue !== null && goalValue !== undefined && value !== null && value !== undefined && value !== 'N/A') {
            const numericValue = isCurrencyGoal ? parseFloat(String(value).replace('€', '').replace('.', '').replace(',', '.')) : Number(value);
            if (!isNaN(numericValue) && goalValue > 0) {
                progressPercent = Math.min((numericValue / goalValue) * 100, 100);
                goalText = `${isCurrencyGoal ? formatCurrency(numericValue) : numericValue} / ${isCurrencyGoal ? formatCurrency(goalValue) : goalValue}`;
            }
        }

        return (
            <div className={`stat-card ${isMain ? 'main-kpi' : 'small-kpi'}`} title={tooltipText || label}>
                <div className="stat-card-header">
                    <FontAwesomeIcon icon={icon} className={`stat-icon ${iconClass || ''}`} />
                    <span className="stat-label">{label}</span>
                </div>
                <div className={`stat-value ${isMain ? 'large' : ''}`}>{value === null || value === undefined ? 'N/A' : value}</div>
                {comparison && <div className="stat-comparison">{comparison}</div>}
                {progressPercent !== null && (
                    <div className="kpi-goal-progress" title={`Ziel: ${isCurrencyGoal ? formatCurrency(goalValue) : goalValue}`}>
                        <div className="progress-bar-container">
                            <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <span className="goal-text">{goalText}</span>
                    </div>
                )}
            </div>
        );
    };

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
                    {kpiGroupOrder.map(groupKey => {
                        if (!kpiVisibility[groupKey]?.visible) return null;
                        const groupDef = KPI_DEFINITIONS[groupKey];
                        return (
                            <React.Fragment key={groupKey}>
                                {groupKey !== kpiGroupOrder[0] && <hr className="kpi-divider" />}
                                <h4 className="stats-section-subtitle">{groupDef.label}</h4>
                                <div className="stats-overview-cards kpi-group">
                                    {groupDef.kpis.map((kpiDef, i) => skeletonCard(kpiDef.isMain, `${groupKey}-skel-${i}`))}
                                </div>
                            </React.Fragment>
                        );
                    })}
                </>
            );
        }
        if (!detailedStats) return <p className="stat-card-no-data">Keine Kennzahlen für den gewählten Zeitraum verfügbar.</p>;

        const avgRevenue = (detailedStats.totalAppointmentsInPeriod > 0 && detailedStats.totalRevenueInPeriod && parseFloat(detailedStats.totalRevenueInPeriod) > 0)
            ? (parseFloat(detailedStats.totalRevenueInPeriod) / detailedStats.totalAppointmentsInPeriod) : 0;

        const kpiData = {
            termine: detailedStats.totalAppointmentsInPeriod ?? '0',
            umsatz: formatCurrency(detailedStats.totalRevenueInPeriod),
            avgUmsatz: formatCurrency(avgRevenue),
            auslastung: capacityUtilizationData ? `${Number(capacityUtilizationData.utilizationPercentage).toFixed(1)}%` : 'N/A',
            einzigKunden: detailedStats.uniqueCustomersInPeriod ?? 'N/A',
            kundenWachstum: detailedStats.customerGrowthPercentage != null ? `${Number(detailedStats.customerGrowthPercentage).toFixed(1)}%` : 'N/A',
            avgBuchungKunde: detailedStats.avgBookingsPerCustomer != null ? Number(detailedStats.avgBookingsPerCustomer).toFixed(1) : 'N/A',
            neukundenAnteil: detailedStats.newCustomerShare != null ? `${Number(detailedStats.newCustomerShare).toFixed(1)}%` : 'N/A',
            termineHeute: detailedStats.todayCount ?? '0',
            umsatzHeute: formatCurrency(detailedStats.revenueToday ?? 0),
            gesBevorstehend: detailedStats.totalUpcomingCount ?? '0',
            avgTermindauer: detailedStats.averageAppointmentDurationInPeriod != null ? `${Number(detailedStats.averageAppointmentDurationInPeriod).toFixed(0)} Min.` : 'N/A',
            servicesAngeboten: detailedStats.totalActiveServices ?? 'N/A',
            stornoquote: detailedStats.cancellationRate != null ? `${Number(detailedStats.cancellationRate).toFixed(1)}%` : 'N/A',
            avgVorlaufzeit: detailedStats.avgBookingLeadTime != null ? `${detailedStats.avgBookingLeadTime} Tage` : 'N/A',
            prognUmsatz: detailedStats.projectedRevenueNext30Days != null ? formatCurrency(detailedStats.projectedRevenueNext30Days) : 'N/A',
        };

        const kpiComparisons = {
            termine: renderComparison(detailedStats.appointmentCountChangePercentage, detailedStats.previousPeriodTotalAppointments),
            umsatz: renderComparison(detailedStats.revenueChangePercentage, detailedStats.previousPeriodTotalRevenue),
            einzigKunden: renderComparison(detailedStats.customerGrowthPercentage, detailedStats.previousPeriodUniqueCustomers),
            stornoquote: renderComparison(detailedStats.cancellationRateChangePercentage, detailedStats.previousPeriodCancellationRate, false),
            neukundenAnteil: renderComparison(detailedStats.newCustomerShareChangePercentage, detailedStats.previousPeriodNewCustomerShare, true)
        };


        return (
            <>
                {kpiGroupOrder.map(groupKey => {
                    if (!kpiVisibility[groupKey]?.visible) return null;
                    const groupDef = KPI_DEFINITIONS[groupKey];
                    return (
                        <React.Fragment key={groupKey}>
                            {groupKey !== kpiGroupOrder[0] && <hr className="kpi-divider" />}
                            <h4 className="stats-section-subtitle">{groupDef.label}</h4>
                            <div className="stats-overview-cards kpi-group">
                                {groupDef.kpis.filter(kpiDef => kpiVisibility[groupKey]?.kpis[kpiDef.id] ?? true).map(kpiDef => (
                                    <KpiCard
                                        key={kpiDef.id}
                                        label={kpiDef.label}
                                        value={kpiData[kpiDef.id]}
                                        icon={kpiDef.icon}
                                        iconClass={kpiDef.iconClass}
                                        comparison={kpiComparisons[kpiDef.id]}
                                        tooltipText={kpiDef.tooltip}
                                        isMain={kpiDef.isMain}
                                        goalValue={kpiGoals[kpiDef.goalKey]}
                                        isCurrencyGoal={kpiDef.isCurrency}
                                    />
                                ))}
                            </div>
                        </React.Fragment>
                    );
                })}
            </>
        );
    };

    const renderKeyChanges = () => {
        if (isLoadingStats || isLoadingActivity) {
            return <p className="no-data-small"><FontAwesomeIcon icon={faSpinner} spin /> Lade Veränderungen...</p>;
        }
        const positiveChanges = keyChanges.positive || [];
        const negativeChanges = keyChanges.negative || [];

        if (positiveChanges.length === 0 && negativeChanges.length === 0) {
            return <p className="no-data-small">Keine signifikanten Veränderungen im Vergleich zur Vorperiode.</p>;
        }
        return (
            <ul className="key-changes-list">
                {positiveChanges.map(change => (
                    <li key={`pos-${change.label}`} className="key-change-item positive">
                        <FontAwesomeIcon icon={faArrowUp} /> <span>{change.label}: +{Number(change.value).toFixed(1)}%</span>
                    </li>
                ))}
                {negativeChanges.map(change => (
                    <li key={`neg-${change.label}`} className="key-change-item negative">
                        <FontAwesomeIcon icon={faArrowDown} /> <span>{change.label}: {Number(change.value).toFixed(1)}%</span>
                    </li>
                ))}
            </ul>
        );
    };

    const renderDashboardAlerts = () => {
        if (isLoadingStats || isLoadingActivity) {
            return <p className="no-data-small"><FontAwesomeIcon icon={faSpinner} spin /> Lade Hinweise...</p>;
        }
        if (dashboardAlerts.length === 0) {
            return <p className="no-data-small">Keine aktuellen Hinweise.</p>;
        }
        return (
            <ul className="dashboard-alerts-list">
                {dashboardAlerts.map((alert, index) => (
                    <li key={index} className={`dashboard-alert-item alert-${alert.type}`}>
                        <FontAwesomeIcon icon={alert.type === 'warning' ? faExclamationCircle : faInfoCircle} />
                        <span>{alert.message}</span>
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
            {lastUpdated && (
                <div className="last-updated-timestamp">
                    <FontAwesomeIcon icon={faSyncAlt} /> Daten zuletzt aktualisiert: {formatDateFns(lastUpdated, 'dd.MM.yyyy HH:mm:ss')}
                </div>
            )}


            {/* Lade- & Fehlermeldungen */}
            {(isLoadingStats || isLoadingDaily || isLoadingActivity) && !lastUpdated && (
                <div className="loading-indicator-top"><FontAwesomeIcon icon={faSpinner} spin /> Daten werden geladen...</div>
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
                            {/* Neues Diagramm: Terminauslastung pro Stunde */}
                            <div className="chart-card">
                                <AppointmentsByHourRechart chartData={appointmentsByHourData} title="Terminauslastung / Stunde" />
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
                    <div className="dashboard-alerts-widget stats-section-box">
                        <h3 className="stats-section-title small-title"><span><FontAwesomeIcon icon={faBell} /> Wichtige Hinweise</span></h3>
                        {renderDashboardAlerts()}
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
                            {kpiGroupOrder.map((groupKey, index) => {
                                const groupDef = KPI_DEFINITIONS[groupKey];
                                if (!groupDef) return null;
                                return (
                                    <fieldset key={groupKey} className="kpi-visibility-controls">
                                        <legend>
                                            <input
                                                type="checkbox"
                                                id={`toggle-group-${groupKey}`}
                                                checked={kpiVisibility[groupKey]?.visible ?? true}
                                                onChange={() => toggleKpiGroupVisibility(groupKey)}
                                            />
                                            <label htmlFor={`toggle-group-${groupKey}`}>{groupDef.label}</label>
                                            <span className="kpi-group-order-buttons">
                                                <button onClick={() => moveKpiGroup(groupKey, 'up')} disabled={index === 0} aria-label="Gruppe nach oben verschieben">
                                                    <FontAwesomeIcon icon={faArrowUp} />
                                                </button>
                                                <button onClick={() => moveKpiGroup(groupKey, 'down')} disabled={index === kpiGroupOrder.length - 1} aria-label="Gruppe nach unten verschieben">
                                                    <FontAwesomeIcon icon={faArrowDown} />
                                                </button>
                                            </span>
                                        </legend>
                                        {kpiVisibility[groupKey]?.visible && (
                                            <div className="individual-kpi-toggles">
                                                {groupDef.kpis.map(kpi => (
                                                    <div key={kpi.id} className="kpi-visibility-toggle">
                                                        <input
                                                            type="checkbox"
                                                            id={`toggle-kpi-${kpi.id}`}
                                                            checked={kpiVisibility[groupKey]?.kpis[kpi.id] ?? true}
                                                            onChange={() => toggleIndividualKpiVisibility(groupKey, kpi.id)}
                                                        />
                                                        <label htmlFor={`toggle-kpi-${kpi.id}`}>{kpi.label}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </fieldset>
                                )
                            })}
                            <hr className="kpi-divider" />
                            <fieldset className="kpi-goal-settings">
                                <legend>Monatsziele festlegen:</legend>
                                <div className="kpi-goal-input">
                                    <label htmlFor="monthlyRevenueGoal">Umsatzziel (€):</label>
                                    <input
                                        type="number"
                                        id="monthlyRevenueGoal"
                                        value={kpiGoals.monthlyRevenueGoal === null ? '' : kpiGoals.monthlyRevenueGoal}
                                        onChange={(e) => handleGoalChange('monthlyRevenueGoal', e.target.value)}
                                        placeholder="z.B. 5000"
                                    />
                                </div>
                                <div className="kpi-goal-input">
                                    <label htmlFor="monthlyAppointmentsGoal">Terminanzahl-Ziel:</label>
                                    <input
                                        type="number"
                                        id="monthlyAppointmentsGoal"
                                        value={kpiGoals.monthlyAppointmentsGoal === null ? '' : kpiGoals.monthlyAppointmentsGoal}
                                        onChange={(e) => handleGoalChange('monthlyAppointmentsGoal', e.target.value)}
                                        placeholder="z.B. 100"
                                    />
                                </div>
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
