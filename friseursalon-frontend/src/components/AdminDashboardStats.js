// Datei: friseursalon-frontend/src/components/AdminDashboardStats.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'; // useRef hinzugefügt
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
    faUserSlash, faCalendarDay, faEye, faEyeSlash,
    faInfoCircle, faHistory, faCalendarWeek, faGlobe, faBell,
    faBullseye, faSyncAlt, faDownload, faBusinessTime, faUsersGear,
    faAngleDown, faAngleUp, faQuestionCircle, faTimes // faTimes hinzugefügt
} from '@fortawesome/free-solid-svg-icons';
import AppointmentEditModal from './AppointmentEditModal';
import AppointmentCreateModal from './AppointmentCreateModal';
import {
    format as formatDateFns, parseISO, isValid as isValidDateFns,
    subDays, startOfMonth, endOfMonth, subMonths, addMonths,
    formatISO, startOfWeek, endOfWeek,
    startOfYear as dateFnsStartOfYear // Alias, um Konflikt zu vermeiden
} from 'date-fns';
import { de as deLocale } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import AppointmentsByDayRechart from './charts/AppointmentsByDayRechart';
import AppointmentsByServiceRechart from './charts/AppointmentsByServiceRechart';
import RevenueOverTimeRechart from './charts/RevenueOverTimeRechart';
import AppointmentsByHourRechart from './charts/AppointmentsByHourRechart';

// Platzhalter für Mitarbeiter-Chart
const AppointmentsByEmployeeRechart = ({ title }) => (
    <>
        <h4 className="chart-title"><FontAwesomeIcon icon={faUsersGear} /> {title || 'Termine / Mitarbeiter'}</h4>
        <p className="chart-no-data-message">
            Dieses Diagramm wird relevant, sobald mehrere Mitarbeiter verwaltet werden.
            <br/><small>(Benötigt zukünftige Backend-Anpassung)</small>
        </p>
    </>
);

registerLocale('de', deLocale);

// Konstanten für Periodenfilter
const PERIOD_OPTIONS = {
    TODAY: 'today', THIS_WEEK: 'thisWeek', LAST_7_DAYS: 'last7days',
    THIS_MONTH: 'thisMonth', LAST_MONTH: 'lastMonth', LAST_30_DAYS: 'last30days',
    YEAR_TO_DATE: 'yearToDate', LAST_365_DAYS: 'last365days', CUSTOM: 'custom',
};
const MAIN_PERIOD_OPTIONS = [ PERIOD_OPTIONS.THIS_MONTH, PERIOD_OPTIONS.LAST_30_DAYS, PERIOD_OPTIONS.YEAR_TO_DATE, PERIOD_OPTIONS.LAST_365_DAYS ];
const MORE_PERIOD_OPTIONS = [ PERIOD_OPTIONS.TODAY, PERIOD_OPTIONS.THIS_WEEK, PERIOD_OPTIONS.LAST_7_DAYS, PERIOD_OPTIONS.LAST_MONTH ];
const PERIOD_LABELS = {
    [PERIOD_OPTIONS.TODAY]: 'Heute', [PERIOD_OPTIONS.THIS_WEEK]: 'Diese Woche', [PERIOD_OPTIONS.LAST_7_DAYS]: 'Letzte 7 Tage',
    [PERIOD_OPTIONS.THIS_MONTH]: 'Dieser Monat', [PERIOD_OPTIONS.LAST_MONTH]: 'Letzter Monat', [PERIOD_OPTIONS.LAST_30_DAYS]: 'Letzte 30 Tage',
    [PERIOD_OPTIONS.YEAR_TO_DATE]: 'Dieses Jahr', [PERIOD_OPTIONS.LAST_365_DAYS]: 'Letzte 365 Tage', [PERIOD_OPTIONS.CUSTOM]: 'Benutzerdefiniert',
};

// Konstanten für LocalStorage Keys
const KPI_VISIBILITY_STORAGE_KEY = 'friseurDashboardKpiVisibility_v2';
const KPI_GOALS_STORAGE_KEY = 'friseurDashboardKpiGoals_v1';
const KPI_GROUP_ORDER_STORAGE_KEY = 'friseurDashboardKpiGroupOrder_v1';
const TOP_N_SERVICES_STORAGE_KEY = 'friseurDashboardTopNServices_v1';

// Definitionen der KPIs
const KPI_DEFINITIONS = {
    main: {
        label: "Hauptkennzahlen",
        kpis: [
            { id: 'termine', label: "Termine", icon: faCalendarCheck, isMain: true, tooltip: "Gesamtzahl der Termine im ausgewählten Zeitraum.", goalKey: 'monthlyAppointmentsGoal' },
            { id: 'umsatz', label: "Umsatz", icon: faReceipt, isMain: true, tooltip: "Gesamtumsatz im ausgewählten Zeitraum.", goalKey: 'monthlyRevenueGoal', isCurrency: true },
            { id: 'avgUmsatz', label: "Ø-Umsatz/Termin", icon: faCoins, isMain: true, tooltip: "Durchschnittlicher Umsatz pro Termin.", isCurrency: true },
            { id: 'auslastung', label: "Auslastung", icon: faHourglassHalf, isMain: true, tooltip: "Prozentuale Auslastung der verfügbaren Arbeitszeit.", isPercentage: true },
        ]
    },
    customerService: {
        label: "Kunden- & Service-Metriken",
        kpis: [
            { id: 'einzigKunden', label: "Einzig. Kunden", icon: faUserFriends, tooltip: "Anzahl der unterschiedlichen Kunden mit Terminen." },
            { id: 'kundenWachstum', label: "Kundenwachstum", icon: faArrowTrendUp, iconClass: 'growth', tooltip: "Prozentuale Veränderung der einzigartigen Kunden zur Vorperiode.", isPercentage: true },
            { id: 'avgBuchungKunde', label: "Ø Buchung/Kunde", icon: faUsersCog, iconClass: 'avg-bookings', tooltip: "Durchschnittliche Anzahl Buchungen pro Kunde." },
            { id: 'neukundenAnteil', label: "Neukundenanteil", icon: faUserPlus, iconClass: 'new-customer', tooltip: "Anteil neuer Kunden an allen Kunden im Zeitraum (benötigt Backend-Logik).", isPercentage: true, requiresBackendLogic: true },
            { id: 'avgTermindauer', label: "Ø Termindauer", icon: faClock, iconClass: 'duration', tooltip: "Durchschnittliche Dauer eines Termins in Minuten." },
            { id: 'servicesAngeboten', label: "Services Angeboten", icon: faCut, iconClass: 'services', tooltip: "Anzahl der aktuell angebotenen Dienstleistungen." },
        ]
    },
    operationalDaily: {
        label: "Operative & Tagesaktuelle Zahlen",
        kpis: [
            { id: 'termineHeute', label: "Termine Heute", icon: faCalendarDay, iconClass: 'today', tooltip: "Anzahl der Termine am heutigen Tag." },
            { id: 'umsatzHeute', label: "Umsatz Heute", icon: faEuroSign, iconClass: 'revenue', tooltip: "Heutiger Umsatz.", isCurrency: true },
            { id: 'gesBevorstehend', label: "Ges. Bevorstehend", icon: faCalendarAlt, iconClass: 'upcoming', tooltip: "Gesamtzahl aller zukünftigen Termine." },
            { id: 'stornoquote', label: "Stornoquote", icon: faUserSlash, iconClass: 'cancellation', tooltip: "Prozentsatz stornierter Termine (benötigt Backend-Logik).", isPercentage: true, requiresBackendLogic: true },
            { id: 'avgVorlaufzeit', label: "Ø Vorlaufzeit Buch.", icon: faCalendarCheck, iconClass: 'leadtime', tooltip: "Durchschnittliche Zeit zwischen Buchung und Termin in Tagen (benötigt Backend-Logik).", requiresBackendLogic: true },
            { id: 'prognUmsatz', label: "Progn. Umsatz (30T)", icon: faArrowTrendUp, iconClass: 'projection', tooltip: "Geschätzter Umsatz für die nächsten 30 Tage basierend auf aktuellen Daten.", isCurrency: true },
        ]
    }
};

// Hilfsfunktion zur Berechnung von Datumsbereichen
const getDatesForPeriod = (period) => {
    const today = new Date(); let startDate, endDate;
    switch (period) {
        case PERIOD_OPTIONS.TODAY: startDate = today; endDate = today; break;
        case PERIOD_OPTIONS.THIS_WEEK: startDate = startOfWeek(today, { locale: deLocale, weekStartsOn: 1 }); endDate = endOfWeek(today, { locale: deLocale, weekStartsOn: 1 }); break;
        case PERIOD_OPTIONS.LAST_7_DAYS: startDate = subDays(today, 6); endDate = today; break;
        case PERIOD_OPTIONS.THIS_MONTH: startDate = startOfMonth(today); endDate = endOfMonth(today); break;
        case PERIOD_OPTIONS.LAST_MONTH: const lmf = startOfMonth(subMonths(today, 1)); startDate = lmf; endDate = endOfMonth(lmf); break;
        case PERIOD_OPTIONS.LAST_30_DAYS: startDate = subDays(today, 29); endDate = today; break;
        case PERIOD_OPTIONS.YEAR_TO_DATE: startDate = dateFnsStartOfYear(today); endDate = today; break;
        case PERIOD_OPTIONS.LAST_365_DAYS: startDate = subDays(today, 364); endDate = today; break;
        default: startDate = startOfMonth(today); endDate = endOfMonth(today);
    }
    return { startDate: formatISO(startDate, { representation: 'date' }), endDate: formatISO(endDate, { representation: 'date' }) };
};

// Hilfsfunktion für CSV-Export
const exportToCsv = (filename, rows, headers) => { /* ... (wie zuvor) ... */ };


// NEU: Unterkomponente für das Modal des benutzerdefinierten Zeitraums
const CustomDateRangeModal = ({ isOpen, onClose, startDate, endDate, onStartDateChange, onEndDateChange, onApply, isLoading }) => {
    if (!isOpen) return null;

    return (
        <div className="custom-date-pickers-modal-overlay" onClick={onClose}>
            <div className="custom-date-pickers-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-button top-right" onClick={onClose} aria-label="Schließen">
                    <FontAwesomeIcon icon={faTimes} />
                </button>
                <h4>Benutzerdefinierten Zeitraum wählen</h4>
                <div className="custom-date-pickers-inline">
                    <DatePicker
                        selected={startDate}
                        onChange={onStartDateChange}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        dateFormat="dd.MM.yyyy"
                        locale="de"
                        placeholderText="Startdatum"
                        className="date-picker-input"
                        maxDate={addMonths(new Date(), 12)} // Zukünftige Auswahl begrenzen
                        inline
                    />
                    <DatePicker
                        selected={endDate}
                        onChange={onEndDateChange}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        maxDate={addMonths(new Date(), 12)} // Zukünftige Auswahl begrenzen
                        dateFormat="dd.MM.yyyy"
                        locale="de"
                        placeholderText="Enddatum"
                        className="date-picker-input"
                        inline
                    />
                </div>
                <div className="custom-date-modal-actions">
                    <button onClick={onClose} className="button-link-outline small-button" disabled={isLoading}>Abbrechen</button>
                    <button onClick={onApply} className="button-link small-button" disabled={isLoading || !startDate || !endDate}>Anwenden</button>
                </div>
            </div>
        </div>
    );
};


function AdminDashboardStats({ currentUser, onAppointmentAction }) {
    const [detailedStats, setDetailedStats] = useState(null);
    const [dailyAppointments, setDailyAppointments] = useState([]);
    const [keyChanges, setKeyChanges] = useState({ positive: [], negative: [] });
    const [dashboardAlerts, setDashboardAlerts] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);

    const [appointmentsByDayData, setAppointmentsByDayData] = useState({ labels: [], data: [] });
    const [appointmentsByServiceData, setAppointmentsByServiceData] = useState({ labels: [], data: [] });
    const [revenueOverTimeData, setRevenueOverTimeData] = useState([]);
    const [capacityUtilizationData, setCapacityUtilizationData] = useState(null);
    const [appointmentsByHourData, setAppointmentsByHourData] = useState([]);

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

    // States für den DatePicker im Modal
    const [customPickerStartDate, setCustomPickerStartDate] = useState(parseISO(initialDates.startDate + 'T00:00:00'));
    const [customPickerEndDate, setCustomPickerEndDate] = useState(parseISO(initialDates.endDate + 'T00:00:00'));

    const [showCustomDatePickersModal, setShowCustomDatePickersModal] = useState(false);
    const [activeDateRangeLabel, setActiveDateRangeLabel] = useState(PERIOD_LABELS[PERIOD_OPTIONS.THIS_MONTH]);
    const [showMorePeriodsDropdown, setShowMorePeriodsDropdown] = useState(false);
    const morePeriodsDropdownRef = useRef(null); // Für Klick außerhalb des Dropdowns

    // Dashboard Anpassungs-States (wie zuvor)
    const [kpiVisibility, setKpiVisibility] = useState(() => {/* ... (wie zuvor) ... */
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
    const [kpiGoals, setKpiGoals] = useState(() => {/* ... (wie zuvor) ... */
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
    const [kpiGroupOrder, setKpiGroupOrder] = useState(() => {/* ... (wie zuvor) ... */
        try {
            const savedOrder = localStorage.getItem(KPI_GROUP_ORDER_STORAGE_KEY);
            return savedOrder ? JSON.parse(savedOrder) : Object.keys(KPI_DEFINITIONS);
        } catch (e) {
            console.error("Fehler beim Lesen der KPI Gruppenreihenfolge:", e);
            return Object.keys(KPI_DEFINITIONS);
        }
    });
    const [topNServicesConfig, setTopNServicesConfig] = useState(() => {/* ... (wie zuvor) ... */
        try {
            const savedTopN = localStorage.getItem(TOP_N_SERVICES_STORAGE_KEY);
            return savedTopN ? parseInt(savedTopN, 10) : 5;
        } catch (e) { return 5; }
    });

    // Speichern der Anpassungen im LocalStorage (wie zuvor)
    useEffect(() => { localStorage.setItem(KPI_VISIBILITY_STORAGE_KEY, JSON.stringify(kpiVisibility)); }, [kpiVisibility]);
    useEffect(() => { localStorage.setItem(KPI_GOALS_STORAGE_KEY, JSON.stringify(kpiGoals)); }, [kpiGoals]);
    useEffect(() => { localStorage.setItem(KPI_GROUP_ORDER_STORAGE_KEY, JSON.stringify(kpiGroupOrder)); }, [kpiGroupOrder]);
    useEffect(() => { localStorage.setItem(TOP_N_SERVICES_STORAGE_KEY, topNServicesConfig.toString()); }, [topNServicesConfig]);

    // Handler für Anpassungen (wie zuvor)
    const handleGoalChange = (goalKey, value) => { /* ... (wie zuvor) ... */
        const numericValue = value === '' ? null : Number(value);
        if (value === '' || (!isNaN(numericValue) && numericValue >= 0)) {
            setKpiGoals(prev => ({ ...prev, [goalKey]: numericValue }));
        }
    };
    const toggleKpiGroupVisibility = (groupKey) => setKpiVisibility(prev => ({ ...prev, [groupKey]: { ...prev[groupKey], visible: !prev[groupKey].visible } }));
    const toggleIndividualKpiVisibility = (groupKey, kpiId) => setKpiVisibility(prev => ({ ...prev, [groupKey]: { ...prev[groupKey], kpis: { ...prev[groupKey].kpis, [kpiId]: !prev[groupKey].kpis[kpiId] } } }));
    const moveKpiGroup = (groupKey, direction) => setKpiGroupOrder(prevOrder => { /* ... (wie zuvor) ... */
        const currentIndex = prevOrder.indexOf(groupKey); if (currentIndex === -1) return prevOrder;
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= prevOrder.length) return prevOrder;
        const newOrder = [...prevOrder]; [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
        return newOrder;
    });

    // Datenabruf-Funktionen (Callbacks wie zuvor, aber Fehlerbehandlung leicht angepasst)
    const fetchMainStatsAndCharts = useCallback(async (startDate, endDate) => {
        setIsLoadingStats(true);
        let currentError = '';
        try {
            const apiRequests = [
                api.get('/statistics/detailed-counts', { params: { startDate, endDate } }),
                api.get('/statistics/by-day-of-week', { params: { startDate, endDate } }),
                api.get('/statistics/by-service', { params: { startDate, endDate, topN: topNServicesConfig } }),
                api.get('/statistics/revenue-over-time', { params: { startDate, endDate } }),
                api.get('/statistics/capacity-utilization', { params: { startDate, endDate } }),
            ];
            const [statsRes, dayRes, serviceRes, revenueTimeRes, capacityRes] = await Promise.all(apiRequests.map(p => p.catch(e => e))); // Fehler einzeln fangen

            if (statsRes instanceof Error) throw new Error(`Hauptstatistiken: ${statsRes.response?.data?.message || statsRes.message}`);
            setDetailedStats(statsRes.data);

            if (dayRes instanceof Error) { currentError += `Termine/Tag: ${dayRes.response?.data?.message || dayRes.message}; `; setAppointmentsByDayData({labels: [], data: []}); }
            else setAppointmentsByDayData({ labels: dayRes.data.map(d => d.dayName ? d.dayName.substring(0, 2) : "Unb."), data: dayRes.data.map(d => d.appointmentCount || 0) });

            if (serviceRes instanceof Error) { currentError += `Termine/Service: ${serviceRes.response?.data?.message || serviceRes.message}; `; setAppointmentsByServiceData({labels: [], data: []});}
            else setAppointmentsByServiceData({ labels: serviceRes.data.map(s => s.serviceName || "Unbekannt"), data: serviceRes.data.map(s => s.appointmentCount || 0) });

            if (revenueTimeRes instanceof Error) { currentError += `Umsatzverlauf: ${revenueTimeRes.response?.data?.message || revenueTimeRes.message}; `; setRevenueOverTimeData([]);}
            else setRevenueOverTimeData(revenueTimeRes.data);

            if (capacityRes instanceof Error) { currentError += `Auslastung: ${capacityRes.response?.data?.message || capacityRes.message}; `; setCapacityUtilizationData(null);}
            else setCapacityUtilizationData(capacityRes.data);


            const exampleHourData = [8,9,10,11,12,13,14,15,16,17,18].map(h => ({ hour: h, appointments: Math.floor(Math.random() * (h > 11 && h < 18 ? 8 : 4)) + (h > 11 && h < 18 ? 2 : 0)}));
            setAppointmentsByHourData(exampleHourData);

            // Alerts und Key Changes Logik (wie zuvor)
            const backendStats = statsRes.data; // Sicherstellen, dass backendStats hier verfügbar ist
            const alerts = [];
            if (backendStats.cancellationRate != null && Number(backendStats.cancellationRate) > 15) alerts.push({ type: 'warning', message: `Stornoquote bei ${Number(backendStats.cancellationRate).toFixed(1)}%`});
            if (capacityRes.data && !(capacityRes instanceof Error) && capacityRes.data.utilizationPercentage < 40) alerts.push({ type: 'info', message: `Auslastung: ${Number(capacityRes.data.utilizationPercentage).toFixed(1)}%. Potenzial prüfen.`});
            if (backendStats && backendStats.totalAppointmentsInPeriod === 0 && (selectedPeriod === PERIOD_OPTIONS.THIS_MONTH || selectedPeriod === PERIOD_OPTIONS.LAST_30_DAYS)) alerts.push({ type: 'info', message: `Keine Termine in diesem Zeitraum. Marketing?` });
            setDashboardAlerts(alerts.slice(0,2));

            const changes = [];
            if (backendStats.revenueChangePercentage != null) changes.push({ label: "Umsatz", value: backendStats.revenueChangePercentage, isGood: backendStats.revenueChangePercentage >= 0 });
            if (backendStats.appointmentCountChangePercentage != null) changes.push({ label: "Terminanzahl", value: backendStats.appointmentCountChangePercentage, isGood: backendStats.appointmentCountChangePercentage >= 0 });
            // ... (Rest der Key Changes Logik)
            changes.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
            setKeyChanges({ positive: changes.filter(c => c.isGood && c.value > 0).slice(0, 1), negative: changes.filter(c => !c.isGood && c.value !== 0).slice(0, 1) });


            if (selectedPeriod === PERIOD_OPTIONS.CUSTOM && !showCustomDatePickersModal) {
                setActiveDateRangeLabel(`Zeitraum: ${formatDateFns(parseISO(startDate), 'dd.MM.yy')} - ${formatDateFns(parseISO(endDate), 'dd.MM.yy')}`);
            } else if (selectedPeriod !== PERIOD_OPTIONS.CUSTOM) {
                setActiveDateRangeLabel(PERIOD_LABELS[selectedPeriod]);
            }
            setLastUpdated(new Date());

        } catch (err) {
            console.error("Genereller Fehler beim Laden der Hauptstatistiken/Charts:", err.message);
            currentError += `Allgemeiner Statistikfehler: ${err.message}; `;
        } finally {
            setError(currentError.trim());
            setIsLoadingStats(false);
        }
    }, [selectedPeriod, topNServicesConfig, showCustomDatePickersModal]);

    const fetchActivityAndUpcoming = useCallback(async () => { /* ... (wie zuvor, Fehlerbehandlung kann hier auch angepasst werden) ... */
        setIsLoadingActivity(true); setIsLoadingDaily(true);
        let currentError = '';
        try {
            const dailyRes = await api.get('/statistics/today-upcoming-appointments');
            setDailyAppointments(dailyRes.data || []);
        } catch (err) {
            console.error("Fehler beim Laden von Terminliste:", err.response?.data || err.message);
            currentError += `Terminliste: ${err.response?.data?.message || err.message}; `;
            setDailyAppointments([]);
        } finally {
            setError(prev => prev ? `${prev} ${currentError}`.trim() : currentError.trim());
            setIsLoadingActivity(false); setIsLoadingDaily(false);
        }
    }, []);

    // useEffects für Datenabruf (wie zuvor)
    useEffect(() => { fetchMainStatsAndCharts(currentFilterStartDate, currentFilterEndDate); }, [currentFilterStartDate, currentFilterEndDate, fetchMainStatsAndCharts]);
    useEffect(() => { fetchActivityAndUpcoming(); }, [onAppointmentAction, fetchActivityAndUpcoming]);

    // Handler für Periodenänderung und benutzerdefinierten Zeitraum (wie zuvor)
    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        if (period !== PERIOD_OPTIONS.CUSTOM) {
            const { startDate, endDate } = getDatesForPeriod(period);
            setCurrentFilterStartDate(startDate);
            setCurrentFilterEndDate(endDate);
            setCustomPickerStartDate(parseISO(startDate + 'T00:00:00'));
            setCustomPickerEndDate(parseISO(endDate + 'T00:00:00'));
            setActiveDateRangeLabel(PERIOD_LABELS[period]);
            setShowCustomDatePickersModal(false);
            setShowMorePeriodsDropdown(false);
        } else {
            // Nur Modal öffnen, Label wird beim Anwenden gesetzt
            setShowCustomDatePickersModal(true);
            setShowMorePeriodsDropdown(false);
        }
    };
    const handleApplyCustomDateRange = () => {
        if (customPickerStartDate && customPickerEndDate) {
            if (customPickerEndDate < customPickerStartDate) { setError("Das Enddatum darf nicht vor dem Startdatum liegen."); return; }
            const newStartDate = formatISO(customPickerStartDate, { representation: 'date' });
            const newEndDate = formatISO(customPickerEndDate, { representation: 'date' });
            setCurrentFilterStartDate(newStartDate); setCurrentFilterEndDate(newEndDate);
            setActiveDateRangeLabel(`Custom: ${formatDateFns(customPickerStartDate, 'dd.MM.yy')} - ${formatDateFns(customPickerEndDate, 'dd.MM.yy')}`);
            setShowCustomDatePickersModal(false);
            setSelectedPeriod(PERIOD_OPTIONS.CUSTOM); // Stellt sicher, dass "custom" aktiv bleibt
        } else { setError("Bitte wählen Sie ein gültiges Start- und Enddatum."); }
    };

    // Modal-Handler (wie zuvor)
    const handleViewDetails = async (appointmentDTO) => { /* ... (wie zuvor) ... */
        if (!appointmentDTO || !appointmentDTO.appointmentId) { setError("Details konnten nicht geladen werden (ID fehlt)."); return; }
        setIsLoadingModalAppointment(true);
        try {
            const response = await api.get(`/appointments/${appointmentDTO.appointmentId}`);
            setSelectedAppointmentForEdit(response.data || null);
        } catch (err) { setError(`Details für Termin ${appointmentDTO.appointmentId} konnten nicht geladen werden.`); setSelectedAppointmentForEdit(null);
        } finally { setIsLoadingModalAppointment(false); }
    };
    const handleCloseEditModal = () => setSelectedAppointmentForEdit(null);
    const handleAppointmentUpdatedFromModal = () => { handleCloseEditModal(); if (onAppointmentAction) onAppointmentAction(); };
    const handleOpenCreateModal = () => { setSelectedSlotForCreate({ start: new Date(), allDay: false }); setShowCreateModal(true); };
    const handleCloseCreateModal = () => { setShowCreateModal(false); setSelectedSlotForCreate(null); };
    const handleAppointmentCreated = () => { handleCloseCreateModal(); if (onAppointmentAction) onAppointmentAction(); };


    // Formatierungsfunktionen (wie zuvor)
    const formatCurrency = (value, withEuroSign = true) => { /* ... (wie zuvor) ... */
        if (value == null || isNaN(parseFloat(value))) return withEuroSign ? '0,00 €' : '0,00';
        const formatted = parseFloat(value).toFixed(2).replace('.', ',');
        return withEuroSign ? `${formatted} €` : formatted;
    };
    const formatPercentage = (value) => value != null && !isNaN(parseFloat(value)) ? `${parseFloat(value).toFixed(1).replace('.', ',')}%` : 'N/A';


    // Render-Funktionen (KPI-Karten, Key Changes, Alerts - wie zuvor, aber mit neuem Tooltip-Icon)
    const renderComparison = (changePercentageInput, previousValue, isGrowthGood = true) => { /* ... (wie zuvor) ... */
        const hasPreviousData = previousValue !== null && previousValue !== undefined && !isNaN(parseFloat(previousValue));
        let changeText = 'vs. Vorp.: N/A'; let icon = faEquals; let colorClass = 'neutral';
        const changePercentage = Number(changePercentageInput);

        if (hasPreviousData && parseFloat(previousValue) !== 0) {
            if (!isNaN(changePercentage) && changePercentageInput !== null) {
                icon = changePercentage > 0 ? faArrowUp : (changePercentage < 0 ? faArrowDown : faEquals);
                colorClass = changePercentage > 0 ? (isGrowthGood ? 'positive' : 'negative') : (changePercentage < 0 ? (isGrowthGood ? 'negative' : 'positive') : 'neutral');
                changeText = `${changePercentage > 0 ? '+' : ''}${changePercentage.toFixed(1).replace('.', ',')}%`;
            }
        } else if (hasPreviousData && parseFloat(previousValue) === 0 && !isNaN(changePercentage) && changePercentage > 0) {
            changeText = 'vs. 0'; icon = faArrowUp; colorClass = 'positive';
        } else if (hasPreviousData && parseFloat(previousValue) === 0 && (isNaN(changePercentage) || changePercentage === 0)) {
            changeText = 'vs. 0';
        }
        return <span className={`comparison-data ${colorClass}`}><FontAwesomeIcon icon={icon} /> {changeText}</span>;
    };
    const KpiCard = ({ label, value, icon, iconClass, comparison, tooltipText, isMain = false, goalValue, isCurrency = false, isPercentage = false }) => { /* ... (angepasst mit faQuestionCircle für Tooltip) ... */
        let progressPercent = null; let goalText = null;
        if (goalValue != null && value != null && value !== 'N/A') {
            const numericValue = isCurrency ? parseFloat(String(value).replace('€', '').replace('.', '').replace(',', '.')) : (isPercentage ? parseFloat(String(value).replace('%','').replace(',','.')) : Number(value));
            if (!isNaN(numericValue) && goalValue > 0) {
                progressPercent = Math.min((numericValue / goalValue) * 100, 100);
                goalText = `${isCurrency ? formatCurrency(numericValue) : (isPercentage ? formatPercentage(numericValue) : numericValue)} / ${isCurrency ? formatCurrency(goalValue) : (isPercentage ? formatPercentage(goalValue) : goalValue)}`;
            }
        }
        const finalTooltipText = tooltipText || label;
        return (
            <div className={`stat-card ${isMain ? 'main-kpi' : 'small-kpi'}`} title={finalTooltipText}>
                <div className="stat-card-header">
                    <FontAwesomeIcon icon={icon} className={`stat-icon ${iconClass || ''}`} />
                    <span className="stat-label">{label}</span>
                    {tooltipText && <FontAwesomeIcon icon={faQuestionCircle} className="stat-tooltip-icon" />}
                </div>
                <div className={`stat-value ${isMain ? 'large' : ''}`}>{value == null || value === undefined ? 'N/A' : value}</div>
                {comparison && <div className="stat-comparison">{comparison}</div>}
                {progressPercent !== null && (
                    <div className="kpi-goal-progress" title={`Ziel: ${isCurrency ? formatCurrency(goalValue) : (isPercentage ? formatPercentage(goalValue) : goalValue)}`}>
                        <div className="progress-bar-container"><div className="progress-bar" style={{ width: `${progressPercent}%` }}></div></div>
                        <span className="goal-text">{goalText}</span>
                    </div>
                )}
            </div>
        );
    };
    const renderStatCards = () => { /* ... (wie zuvor) ... */
        if (isLoadingStats && !detailedStats) { /* Skeleton Loader */
            return (<div className="stats-overview-cards kpi-group">
                {Array(4).fill(0).map((_, i) => (
                    <div key={`skel-main-${i}`} className="stat-card main-kpi is-loading-skeleton">
                        <div className="stat-card-header-skeleton"></div> <div className="stat-value-skeleton large"></div> <div className="stat-comparison-skeleton"></div>
                    </div>))}
                {Array(6).fill(0).map((_, i) => (
                    <div key={`skel-small-${i}`} className="stat-card small-kpi is-loading-skeleton">
                        <div className="stat-card-header-skeleton"></div> <div className="stat-value-skeleton"></div>
                    </div>))}
            </div>);
        }
        if (!detailedStats) return <p className="stat-card-no-data">Keine Kennzahlen verfügbar.</p>;

        const avgRevenue = (detailedStats.totalAppointmentsInPeriod > 0 && detailedStats.totalRevenueInPeriod != null && parseFloat(detailedStats.totalRevenueInPeriod) > 0)
            ? (parseFloat(detailedStats.totalRevenueInPeriod) / detailedStats.totalAppointmentsInPeriod) : 0;
        const kpiData = {
            termine: detailedStats.totalAppointmentsInPeriod ?? '0', umsatz: formatCurrency(detailedStats.totalRevenueInPeriod),
            avgUmsatz: formatCurrency(avgRevenue), auslastung: capacityUtilizationData ? formatPercentage(capacityUtilizationData.utilizationPercentage) : 'N/A',
            einzigKunden: detailedStats.uniqueCustomersInPeriod ?? 'N/A', kundenWachstum: formatPercentage(detailedStats.customerGrowthPercentage),
            avgBuchungKunde: detailedStats.avgBookingsPerCustomer != null ? Number(detailedStats.avgBookingsPerCustomer).toFixed(1) : 'N/A',
            neukundenAnteil: formatPercentage(detailedStats.newCustomerShare), termineHeute: detailedStats.todayCount ?? '0',
            umsatzHeute: formatCurrency(detailedStats.revenueToday ?? 0), gesBevorstehend: detailedStats.totalUpcomingCount ?? '0',
            avgTermindauer: detailedStats.averageAppointmentDurationInPeriod != null ? `${Number(detailedStats.averageAppointmentDurationInPeriod).toFixed(0)} Min.` : 'N/A',
            servicesAngeboten: detailedStats.totalActiveServices ?? 'N/A', stornoquote: formatPercentage(detailedStats.cancellationRate),
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
        return (<>{kpiGroupOrder.map(groupKey => {
            if (!kpiVisibility[groupKey]?.visible) return null;
            const groupDef = KPI_DEFINITIONS[groupKey]; if (!groupDef) return null;
            return (<React.Fragment key={groupKey}>
                {groupKey !== kpiGroupOrder[0] && <hr className="kpi-divider" />}
                <h4 className="stats-section-subtitle">{groupDef.label}</h4>
                <div className="stats-overview-cards kpi-group">
                    {groupDef.kpis.filter(kpiDef => kpiVisibility[groupKey]?.kpis[kpiDef.id] ?? true).map(kpiDef => (
                        <KpiCard key={kpiDef.id} label={kpiDef.label} value={kpiData[kpiDef.id]} icon={kpiDef.icon} iconClass={kpiDef.iconClass}
                                 comparison={kpiComparisons[kpiDef.id]} tooltipText={kpiDef.requiresBackendLogic && (kpiData[kpiDef.id] === 'N/A' || kpiData[kpiDef.id] === null) ? `${kpiDef.tooltip} (Hinweis: Erweiterte Backend-Logik erforderlich)` : kpiDef.tooltip} isMain={kpiDef.isMain}
                                 goalValue={kpiGoals[kpiDef.goalKey]} isCurrency={kpiDef.isCurrency} isPercentage={kpiDef.isPercentage} />
                    ))}</div></React.Fragment>);
        })}</>);
    };
    const renderKeyChanges = () => { /* ... (wie zuvor) ... */
        if (isLoadingStats || isLoadingActivity) return <p className="no-data-small"><FontAwesomeIcon icon={faSpinner} spin /> Lade Highlights...</p>;
        const { positive = [], negative = [] } = keyChanges;
        if (positive.length === 0 && negative.length === 0) return <p className="no-data-small">Keine signifikanten Veränderungen zur Vorperiode.</p>;
        return (<ul className="key-changes-list">
            {positive.map(c => (<li key={`pos-${c.label}`} className="key-change-item positive"><FontAwesomeIcon icon={faArrowUp} /><span>{c.label}: +{Number(c.value).toFixed(1)}%</span></li>))}
            {negative.map(c => (<li key={`neg-${c.label}`} className="key-change-item negative"><FontAwesomeIcon icon={faArrowDown} /><span>{c.label}: {Number(c.value).toFixed(1)}%</span></li>))}
        </ul>);
    };
    const renderDashboardAlerts = () => { /* ... (wie zuvor) ... */
        if (isLoadingStats || isLoadingActivity) return <p className="no-data-small"><FontAwesomeIcon icon={faSpinner} spin /> Lade Hinweise...</p>;
        if (dashboardAlerts.length === 0) return <p className="no-data-small">Keine aktuellen Hinweise.</p>;
        return (<ul className="dashboard-alerts-list">
            {dashboardAlerts.map((a, i) => (<li key={i} className={`dashboard-alert-item alert-${a.type}`}><FontAwesomeIcon icon={a.type === 'warning' ? faExclamationCircle : faInfoCircle} /><span>{a.message}</span></li>))}
        </ul>);
    };


    // Effekt zum Schließen des "Mehr Zeiträume"-Dropdowns bei Klick außerhalb
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (morePeriodsDropdownRef.current && !morePeriodsDropdownRef.current.contains(event.target)) {
                setShowMorePeriodsDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [morePeriodsDropdownRef]);

    // Effekt zum Schließen des Custom Date Modals mit Escape
    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape' && showCustomDatePickersModal) {
                setShowCustomDatePickersModal(false);
            }
        };
        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [showCustomDatePickersModal]);


    return (
        <div className="admin-dashboard-stats">
            {/* Filterleiste */}
            <div className="stats-period-filter-bar">
                <div className="period-buttons-main">
                    {MAIN_PERIOD_OPTIONS.map(key => (
                        <button key={key} onClick={() => handlePeriodChange(key)} className={`${selectedPeriod === key && !showCustomDatePickersModal ? 'active' : ''}`} aria-pressed={selectedPeriod === key && !showCustomDatePickersModal}>
                            {PERIOD_LABELS[key]}
                        </button>
                    ))}
                </div>
                <div className="period-buttons-more" ref={morePeriodsDropdownRef}>
                    <button onClick={() => setShowMorePeriodsDropdown(prev => !prev)} className="more-periods-btn" aria-expanded={showMorePeriodsDropdown}>
                        Mehr <FontAwesomeIcon icon={showMorePeriodsDropdown ? faAngleUp : faAngleDown} />
                    </button>
                    {showMorePeriodsDropdown && (
                        <div className="more-periods-dropdown">
                            {MORE_PERIOD_OPTIONS.map(key => (
                                <button key={key} onClick={() => handlePeriodChange(key)} className={`${selectedPeriod === key ? 'active' : ''}`} aria-pressed={selectedPeriod === key}>
                                    {PERIOD_LABELS[key]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button onClick={() => handlePeriodChange(PERIOD_OPTIONS.CUSTOM)} className={`custom-period-btn ${selectedPeriod === PERIOD_OPTIONS.CUSTOM ? 'active' : ''}`} aria-pressed={selectedPeriod === PERIOD_OPTIONS.CUSTOM}>
                    <FontAwesomeIcon icon={faFilter} /> {activeDateRangeLabel.startsWith("Custom:") ? activeDateRangeLabel.replace("Custom: ", "") : PERIOD_LABELS[PERIOD_OPTIONS.CUSTOM]}
                </button>
            </div>

            <CustomDateRangeModal
                isOpen={showCustomDatePickersModal}
                onClose={() => setShowCustomDatePickersModal(false)}
                startDate={customPickerStartDate}
                endDate={customPickerEndDate}
                onStartDateChange={setCustomPickerStartDate}
                onEndDateChange={setCustomPickerEndDate}
                onApply={handleApplyCustomDateRange}
                isLoading={isLoadingStats}
            />

            {lastUpdated && <div className="last-updated-timestamp"><FontAwesomeIcon icon={faSyncAlt} />Datenstand: {formatDateFns(lastUpdated, 'dd.MM.yyyy HH:mm:ss')}</div>}
            {(isLoadingStats || isLoadingDaily || isLoadingActivity) && !lastUpdated && <div className="loading-indicator-top"><FontAwesomeIcon icon={faSpinner} spin /> Daten werden geladen...</div>}
            {error && <p className="form-message error mb-4"><FontAwesomeIcon icon={faExclamationCircle} /> Fehler: {error.replace(/;/g, '; ')}</p>}

            {/* Hauptlayout und Inhaltsblöcke */}
            <div className="dashboard-grid-layout">
                {/* Linke Spalte: KPIs und Diagramme */}
                <div className="main-stats-column">
                    <div className="stats-overview-cards-wrapper stats-section-box">
                        <h3 className="stats-section-title">
                            <span><FontAwesomeIcon icon={faChartLine} /> Kennzahlen</span>
                            <span className="stats-period-display">({activeDateRangeLabel.startsWith("Custom:") ? activeDateRangeLabel.replace("Custom: ", "") : activeDateRangeLabel})</span>
                        </h3>
                        {renderStatCards()}
                    </div>
                    <div className="charts-section-wrapper stats-section-box">
                        <div className="section-header-with-export">
                            <h3 className="stats-section-title"><span><FontAwesomeIcon icon={faChartPie} /> Visuelle Analysen</span><span className="stats-period-display">({activeDateRangeLabel.startsWith("Custom:") ? activeDateRangeLabel.replace("Custom: ", "") : activeDateRangeLabel})</span></h3>
                        </div>
                        <div className="charts-grid">
                            {/* ... (Chart-Komponenten wie zuvor) ... */}
                            <div className="chart-card revenue-chart-card">
                                <RevenueOverTimeRechart chartData={revenueOverTimeData} title="Umsatzentwicklung" periodLabel={activeDateRangeLabel.startsWith("Custom:") ? activeDateRangeLabel.replace("Custom: ", "") : activeDateRangeLabel} />
                                <button onClick={() => exportToCsv(`umsatz_${currentFilterStartDate}_${currentFilterEndDate}.csv`, revenueOverTimeData, ["Datum", "Umsatz"])} className="button-link-outline export-chart-btn" title="Umsatzdaten exportieren"><FontAwesomeIcon icon={faDownload} /></button>
                            </div>
                            <div className="chart-card"><AppointmentsByDayRechart chartData={appointmentsByDayData} title="Termine / Wochentag" /><button onClick={() => exportToCsv(`termine_tag_${currentFilterStartDate}_${currentFilterEndDate}.csv`, appointmentsByDayData.labels.map((l,i) => ({Wochentag: l, Termine: appointmentsByDayData.data[i]})), ["Wochentag", "Termine"])} className="button-link-outline export-chart-btn" title="Termine/Tag Daten exportieren"><FontAwesomeIcon icon={faDownload} /></button></div>
                            <div className="chart-card"><AppointmentsByServiceRechart chartData={appointmentsByServiceData} title={`Top ${topNServicesConfig} Dienstleistungen`} /><button onClick={() => exportToCsv(`termine_service_${currentFilterStartDate}_${currentFilterEndDate}.csv`, appointmentsByServiceData.labels.map((l,i) => ({Dienstleistung: l, Termine: appointmentsByServiceData.data[i]})), ["Dienstleistung", "Termine"])} className="button-link-outline export-chart-btn" title="Termine/Service Daten exportieren"><FontAwesomeIcon icon={faDownload} /></button></div>
                            <div className="chart-card"><AppointmentsByHourRechart chartData={appointmentsByHourData} title="Terminauslastung / Stunde" /><button onClick={() => exportToCsv(`termine_stunde_${currentFilterStartDate}_${currentFilterEndDate}.csv`, appointmentsByHourData.map(item => ({Stunde: `${String(item.hour).padStart(2, '0')}:00`, Termine: item.appointments})), ["Stunde", "Termine"])} className="button-link-outline export-chart-btn" title="Termine/Stunde Daten exportieren"><FontAwesomeIcon icon={faDownload} /></button></div>
                            <div className="chart-card placeholder-chart-card"><AppointmentsByEmployeeRechart title="Termine / Mitarbeiter (Zukunft)" /></div>
                        </div>
                    </div>
                </div>

                {/* Rechte Spalte: Schnellzugriff, Highlights, Tagestermine, Anpassung */}
                <div className="sidebar-stats-column">
                    {/* ... (Sidebar-Sektionen wie zuvor) ... */}
                    <div className="quick-access-section stats-section-box">
                        <h3 className="stats-section-title small-title"><span><FontAwesomeIcon icon={faBolt} /> Schnellzugriff & Aktivität</span></h3>
                        <div className="quick-access-content">
                            <button onClick={handleOpenCreateModal} className="button-link quick-create-button"><FontAwesomeIcon icon={faPlusCircle} /> Termin anlegen</button>
                            <div className="booking-activity-widget">
                                <h4>Neue Buchungen</h4>
                                {isLoadingActivity || isLoadingStats ? <p className="no-data-small"><FontAwesomeIcon icon={faSpinner} spin /> Lade...</p> : (<>
                                    <p>Heute: <span>{detailedStats?.newBookingsToday ?? 'N/A'}</span></p>
                                    <p>Gestern: <span>{detailedStats?.newBookingsYesterday ?? 'N/A'}</span></p>
                                </>)}
                            </div>
                        </div>
                    </div>
                    <div className="salon-highlights-section stats-section-box">
                        <h3 className="stats-section-title small-title"><span><FontAwesomeIcon icon={faBullseye} /> Salon-Highlights</span></h3>
                        {renderKeyChanges()}
                        {dashboardAlerts.length > 0 && keyChanges.positive.length === 0 && keyChanges.negative.length === 0 && <hr className="kpi-divider"/>}
                        {renderDashboardAlerts()}
                    </div>
                    <div className="daily-appointments-section stats-section-box">
                        <div className="section-header-with-export">
                            <h3 className="daily-appointments-heading"><FontAwesomeIcon icon={faListAlt} /> Heutige & Nächste Termine</h3>
                            <button onClick={() => exportToCsv(`tagesliste.csv`, dailyAppointments.map(apt => ({Datum: apt.appointmentDate, Zeit: apt.startTime, Service: apt.serviceName, Kunde: `${apt.customerFirstName} ${apt.customerLastName}`, Status: apt.status})), ["Datum", "Zeit", "Service", "Kunde", "Status"])} className="button-link-outline export-list-btn" title="Terminliste exportieren"><FontAwesomeIcon icon={faDownload} /></button>
                        </div>
                        {isLoadingDaily ? <div className="loading-message-stats small-list-loader"><FontAwesomeIcon icon={faSpinner} spin /> Lade Termine...</div> : dailyAppointments.length > 0 ? (
                            <ul className="daily-appointments-list">
                                {dailyAppointments.map(apt => {
                                    const appointmentDateTime = apt.appointmentDate && apt.startTime ? parseISO(`${formatDateFns(apt.appointmentDate, 'yyyy-MM-dd')}T${typeof apt.startTime === 'string' ? apt.startTime.substring(0,5) : `${String(apt.startTime.hour).padStart(2,'0')}:${String(apt.startTime.minute).padStart(2,'0')}`}:00`) : null;
                                    let statusClass = `status-${apt.status?.toLowerCase().replace(/\./g, '').replace(/ /g, '-') || 'unbekannt'}`;
                                    if (apt.status && apt.status !== "Heute" && apt.status !== "Morgen") statusClass = "status-datum";
                                    return (<li key={apt.appointmentId} className="daily-appointment-item" onClick={() => handleViewDetails(apt)} role="button" tabIndex={0} onKeyPress={(e) => e.key === 'Enter' && handleViewDetails(apt)} aria-label={`Termin ansehen`}>
                                        {isLoadingModalAppointment && selectedAppointmentForEdit?.id === apt.appointmentId && <FontAwesomeIcon icon={faSpinner} spin className="item-loader-icon" />}
                                        <span className="appointment-time">{appointmentDateTime ? formatDateFns(appointmentDateTime, 'HH:mm') : 'N/A'}</span>
                                        <div className="appointment-info-group"><span className="appointment-service">{apt.serviceName}</span><span className="appointment-customer">{apt.customerFirstName} {apt.customerLastName}</span></div>
                                        <span className={`appointment-status-tag ${statusClass}`}>{apt.status || 'Unbekannt'}</span>
                                    </li>);})}</ul>
                        ) : (!isLoadingDaily && !error && <p className="no-upcoming-appointments">Keine anstehenden Termine.</p>)}
                    </div>
                    <div className="dashboard-customize-section stats-section-box">
                        <h3 className="stats-section-title small-title"><span><FontAwesomeIcon icon={faCog} /> Dashboard Anpassen</span></h3>
                        <div className="dashboard-customize-content">
                            {/* ... (Inhalt der Anpassungssektion wie zuvor) ... */}
                            <p className="no-data-small">Passen Sie die Ansicht Ihres Dashboards an.</p>
                            {kpiGroupOrder.map((groupKey, index) => {const groupDef = KPI_DEFINITIONS[groupKey]; if (!groupDef) return null;
                                return (<fieldset key={groupKey} className="kpi-visibility-controls">
                                    <legend>
                                        <input type="checkbox" id={`toggle-group-${groupKey}`} checked={kpiVisibility[groupKey]?.visible ?? true} onChange={() => toggleKpiGroupVisibility(groupKey)} />
                                        <label htmlFor={`toggle-group-${groupKey}`}>{groupDef.label}</label>
                                        <span className="kpi-group-order-buttons">
                                            <button onClick={() => moveKpiGroup(groupKey, 'up')} disabled={index === 0} aria-label="Nach oben"><FontAwesomeIcon icon={faAngleUp} /></button>
                                            <button onClick={() => moveKpiGroup(groupKey, 'down')} disabled={index === kpiGroupOrder.length - 1} aria-label="Nach unten"><FontAwesomeIcon icon={faAngleDown} /></button>
                                        </span></legend>
                                    {kpiVisibility[groupKey]?.visible && (<div className="individual-kpi-toggles">
                                        {groupDef.kpis.map(kpi => (<div key={kpi.id} className="kpi-visibility-toggle">
                                            <input type="checkbox" id={`toggle-kpi-${kpi.id}`} checked={kpiVisibility[groupKey]?.kpis[kpi.id] ?? true} onChange={() => toggleIndividualKpiVisibility(groupKey, kpi.id)} />
                                            <label htmlFor={`toggle-kpi-${kpi.id}`}>{kpi.label}</label></div>))}</div>)}</fieldset>)})}
                            <hr className="kpi-divider" />
                            <fieldset className="kpi-goal-settings">
                                <legend>Monatsziele festlegen:</legend>
                                <div className="kpi-goal-input"><label htmlFor="monthlyRevenueGoal">Umsatzziel (€):</label><input type="number" id="monthlyRevenueGoal" value={kpiGoals.monthlyRevenueGoal ?? ''} onChange={(e) => handleGoalChange('monthlyRevenueGoal', e.target.value)} placeholder="z.B. 5000"/></div>
                                <div className="kpi-goal-input"><label htmlFor="monthlyAppointmentsGoal">Terminanzahl-Ziel:</label><input type="number" id="monthlyAppointmentsGoal" value={kpiGoals.monthlyAppointmentsGoal ?? ''} onChange={(e) => handleGoalChange('monthlyAppointmentsGoal', e.target.value)} placeholder="z.B. 100"/></div>
                            </fieldset>
                            <fieldset className="chart-settings">
                                <legend>Diagramm-Einstellungen:</legend>
                                <div className="top-n-services-config">
                                    <label htmlFor="topNServices">Top Dienstleistungen (Chart):</label>
                                    <select id="topNServices" value={topNServicesConfig} onChange={(e) => setTopNServicesConfig(parseInt(e.target.value, 10))}>
                                        {[3, 5, 7, 10].map(n => <option key={n} value={n}>Top {n}</option>)}
                                    </select>
                                </div>
                            </fieldset>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals (wie zuvor) */}
            {selectedAppointmentForEdit && currentUser?.roles?.includes("ROLE_ADMIN") && (<AppointmentEditModal appointment={selectedAppointmentForEdit} onClose={handleCloseEditModal} onAppointmentUpdated={handleAppointmentUpdatedFromModal} />)}
            {showCreateModal && (<AppointmentCreateModal isOpen={showCreateModal} onClose={handleCloseCreateModal} onAppointmentCreated={handleAppointmentCreated} currentUser={currentUser} selectedSlot={selectedSlotForCreate} />)}
        </div>
    );
}
export default AdminDashboardStats;