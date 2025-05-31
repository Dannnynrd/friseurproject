// Datei: friseursalon-frontend/src/components/AdminDashboardStats.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api from '../services/api.service';
// Korrekter Import für CSS-Module
import styles from './AdminDashboardStats.module.css';
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
    faAngleDown, faAngleUp, faQuestionCircle, faTimes, faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import AppointmentEditModal from './AppointmentEditModal';
import AppointmentCreateModal from './AppointmentCreateModal';
import {
    format as formatDateFns, parseISO, isValid as isValidDateFns,
    subDays, startOfMonth, endOfMonth, subMonths, addMonths,
    formatISO, startOfWeek, endOfWeek,
    startOfYear as dateFnsStartOfYear
} from 'date-fns';
import { de as deLocale } from 'date-fns/locale';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

import AppointmentsByDayRechart from './charts/AppointmentsByDayRechart';
import AppointmentsByServiceRechart from './charts/AppointmentsByServiceRechart';
import RevenueOverTimeRechart from './charts/RevenueOverTimeRechart';
import AppointmentsByHourRechart from './charts/AppointmentsByHourRechart';

const AppointmentsByEmployeeRechart = ({ title }) => (
    // Tailwind für Karten-Styling hier anwenden
    <div className="p-4 bg-white rounded-lg shadow">
        <h4 className={`text-md font-semibold text-gray-700 mb-2 flex items-center ${styles.chartTitle || 'chart-title'}`}> {/* Fallback für CSS-Modul */}
            <FontAwesomeIcon icon={faUsersGear} className="mr-2 text-gray-500" />
            {title || 'Termine / Mitarbeiter'}
        </h4>
        <p className={`text-sm text-gray-500 ${styles.chartNoDataMessage || 'chart-no-data-message'}`}>
            Dieses Diagramm wird relevant, sobald mehrere Mitarbeiter verwaltet werden.
            <br/><small>(Benötigt zukünftige Backend-Anpassung)</small>
        </p>
    </div>
);

registerLocale('de', deLocale);

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

const KPI_VISIBILITY_STORAGE_KEY = 'friseurDashboardKpiVisibility_v2';
const KPI_GOALS_STORAGE_KEY = 'friseurDashboardKpiGoals_v1';
const KPI_GROUP_ORDER_STORAGE_KEY = 'friseurDashboardKpiGroupOrder_v1';
const TOP_N_SERVICES_STORAGE_KEY = 'friseurDashboardTopNServices_v1';

const KPI_DEFINITIONS = {
    main: {
        label: "Hauptkennzahlen",
        kpis: [
            { id: 'termine', label: "Termine", icon: faCalendarCheck, isMain: true, tooltip: "Gesamtzahl der (nicht stornierten) Termine im ausgewählten Zeitraum.", goalKey: 'monthlyAppointmentsGoal', dtoKey: 'totalAppointmentsInPeriod', comparisonKey: 'appointmentCountChangePercentage', previousPeriodKey: 'previousPeriodTotalAppointments' },
            { id: 'umsatz', label: "Umsatz", icon: faReceipt, isMain: true, tooltip: "Gesamtumsatz (nicht stornierter Termine) im ausgewählten Zeitraum.", goalKey: 'monthlyRevenueGoal', isCurrency: true, dtoKey: 'totalRevenueInPeriod', comparisonKey: 'revenueChangePercentage', previousPeriodKey: 'previousPeriodTotalRevenue'},
            { id: 'avgUmsatz', label: "Ø-Umsatz/Termin", icon: faCoins, isMain: true, tooltip: "Durchschnittlicher Umsatz pro (nicht storniertem) Termin.", isCurrency: true, dtoKey: 'avgRevenuePerAppointment' },
            { id: 'auslastung', label: "Auslastung", icon: faHourglassHalf, isMain: true, tooltip: "Prozentuale Auslastung der verfügbaren Arbeitszeit durch (nicht stornierte) Termine.", isPercentage: true, dtoKey: 'capacityUtilizationPercentage' },
        ]
    },
    customerService: {
        label: "Kunden- & Service-Metriken",
        kpis: [
            { id: 'einzigKunden', label: "Einzig. Kunden", icon: faUserFriends, tooltip: "Anzahl der unterschiedlichen Kunden mit (nicht stornierten) Terminen.", dtoKey: 'uniqueCustomersInPeriod', comparisonKey: 'customerGrowthPercentage', previousPeriodKey: 'previousPeriodUniqueCustomers' },
            { id: 'kundenWachstum', label: "Kundenwachstum", icon: faArrowTrendUp, iconClass: 'growth', tooltip: "Prozentuale Veränderung der einzigartigen Kunden (mit nicht stornierten Terminen) zur Vorperiode.", isPercentage: true, dtoKey: 'customerGrowthPercentage' },
            { id: 'avgBuchungKunde', label: "Ø Buchung/Kunde", icon: faUsersCog, iconClass: 'avg-bookings', tooltip: "Durchschnittliche Anzahl (nicht stornierter) Buchungen pro Kunde.", dtoKey: 'avgBookingsPerCustomer' },
            { id: 'neukundenAnteil', label: "Neukundenanteil", icon: faUserPlus, iconClass: 'new-customer', tooltip: "Anteil neuer Kunden (registriert im Zeitraum und mit Termin) an allen Kunden mit (nicht stornierten) Terminen.", isPercentage: true, dtoKey: 'newCustomerShare', comparisonKey: 'newCustomerShareChangePercentage', previousPeriodKey: 'previousPeriodNewCustomerShare' },
            { id: 'avgTermindauer', label: "Ø Termindauer", icon: faClock, iconClass: 'duration', tooltip: "Durchschnittliche Dauer eines (nicht stornierten) Termins in Minuten.", dtoKey: 'averageAppointmentDurationInPeriod' },
            { id: 'servicesAngeboten', label: "Services Angeboten", icon: faCut, iconClass: 'services', tooltip: "Anzahl der aktuell angebotenen Dienstleistungen.", dtoKey: 'totalActiveServices' },
        ]
    },
    operationalDaily: {
        label: "Operative & Tagesaktuelle Zahlen",
        kpis: [
            { id: 'termineHeute', label: "Termine Heute", icon: faCalendarDay, iconClass: 'today', tooltip: "Anzahl der (nicht stornierten) Termine am heutigen Tag.", dtoKey: 'todayCount' },
            { id: 'umsatzHeute', label: "Umsatz Heute", icon: faEuroSign, iconClass: 'revenue', tooltip: "Heutiger Umsatz (nicht stornierter Termine).", isCurrency: true, dtoKey: 'revenueToday' },
            { id: 'gesBevorstehend', label: "Ges. Bevorstehend", icon: faCalendarAlt, iconClass: 'upcoming', tooltip: "Gesamtzahl aller zukünftigen (nicht stornierten) Termine.", dtoKey: 'totalUpcomingCount' },
            { id: 'stornoquote', label: "Stornoquote", icon: faUserSlash, iconClass: 'cancellation', tooltip: "Prozentsatz stornierter Termine von allen für den Zeitraum erstellten Terminen.", isPercentage: true, dtoKey: 'cancellationRate', comparisonKey: 'cancellationRateChangePercentage', previousPeriodKey: 'previousPeriodCancellationRate' },
            { id: 'avgVorlaufzeit', label: "Ø Vorlaufzeit Buch.", icon: faCalendarCheck, iconClass: 'leadtime', tooltip: "Durchschnittliche Zeit zwischen Buchung und (nicht storniertem) Termin in Tagen.", dtoKey: 'avgBookingLeadTime' },
            { id: 'prognUmsatz', label: "Progn. Umsatz (30T)", icon: faArrowTrendUp, iconClass: 'projection', tooltip: "Geschätzter Umsatz für die nächsten 30 Tage, basierend auf dem Durchschnittsumsatz des aktuell gewählten Zeitraums.", isCurrency: true, dtoKey: 'projectedRevenueNext30Days' },
        ]
    }
};

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

const exportToCsv = (filename, rows, headers) => {
    if (!rows || !rows.length) { return; }
    const csvContent = [
        headers.join(","),
        ...rows.map(row => headers.map(header => {
            let cellValue = row[header];
            if (typeof cellValue === 'string' && cellValue.includes(',')) {
                cellValue = `"${cellValue}"`;
            }
            return cellValue;
        }).join(","))
    ].join("\n");

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

const CustomDateRangeModal = ({ isOpen, onClose, startDate, endDate, onStartDateChange, onEndDateChange, onApply, isLoading }) => {
    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1070] p-4 ${styles.customDatePickersModalOverlay || 'custom-date-pickers-modal-overlay'}`} onClick={onClose}>
            <div className={`bg-white p-6 rounded-lg shadow-xl w-auto min-w-[300px] max-w-2xl relative ${styles.customDatePickersModalContent || 'custom-date-pickers-modal-content'}`} onClick={(e) => e.stopPropagation()}>
                <button
                    className={`absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full ${styles.modalCloseButton || 'modal-close-button'}`}
                    onClick={onClose}
                    aria-label="Schließen"
                >
                    <FontAwesomeIcon icon={faTimes} size="lg"/>
                </button>
                <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center pb-2 border-b border-gray-200">Benutzerdefinierten Zeitraum wählen</h4>
                <div className={`flex flex-col sm:flex-row gap-4 justify-center ${styles.customDatePickersInline || 'custom-date-pickers-inline'}`}>
                    <DatePicker
                        selected={startDate}
                        onChange={onStartDateChange}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        dateFormat="dd.MM.yyyy"
                        locale="de"
                        placeholderText="Startdatum"
                        className={`w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${styles.datePickerInput || 'date-picker-input'}`}
                        maxDate={addMonths(new Date(), 12)}
                        inline
                    />
                    <DatePicker
                        selected={endDate}
                        onChange={onEndDateChange}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        maxDate={addMonths(new Date(), 12)}
                        dateFormat="dd.MM.yyyy"
                        locale="de"
                        placeholderText="Enddatum"
                        className={`w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${styles.datePickerInput || 'date-picker-input'}`}
                        inline
                    />
                </div>
                <div className={`flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 ${styles.customDateModalActions || 'custom-date-modal-actions'}`}>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        Abbrechen
                    </button>
                    <button
                        onClick={onApply}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                        disabled={isLoading || !startDate || !endDate}
                    >
                        Anwenden
                    </button>
                </div>
            </div>
        </div>
    );
};


function AdminDashboardStats({ currentUser, onAppointmentAction }) {
    const [detailedStats, setDetailedStats] = useState(null);
    const [dailyAppointments, setDailyAppointments] = useState([]);
    const [keyChanges, setKeyChanges] = useState({ positive: [], negative: [], neutral: [] });
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

    const [customPickerStartDate, setCustomPickerStartDate] = useState(parseISO(initialDates.startDate + 'T00:00:00'));
    const [customPickerEndDate, setCustomPickerEndDate] = useState(parseISO(initialDates.endDate + 'T00:00:00'));

    const [showCustomDatePickersModal, setShowCustomDatePickersModal] = useState(false);
    const [activeDateRangeLabel, setActiveDateRangeLabel] = useState(PERIOD_LABELS[PERIOD_OPTIONS.THIS_MONTH]);
    const [showMorePeriodsDropdown, setShowMorePeriodsDropdown] = useState(false);
    const morePeriodsDropdownRef = useRef(null);
    const [customizationMessage, setCustomizationMessage] = useState('');

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
            return savedOrder ? JSON.parse(savedOrder) : Object.keys(KPI_DEFINITIONS);
        } catch (e) {
            console.error("Fehler beim Lesen der KPI Gruppenreihenfolge:", e);
            return Object.keys(KPI_DEFINITIONS);
        }
    });
    const [topNServicesConfig, setTopNServicesConfig] = useState(() => {
        try {
            const savedTopN = localStorage.getItem(TOP_N_SERVICES_STORAGE_KEY);
            return savedTopN ? parseInt(savedTopN, 10) : 5;
        } catch (e) { return 5; }
    });

    const showAndClearCustomizationMessage = (message) => {
        setCustomizationMessage(message);
        setTimeout(() => setCustomizationMessage(''), 3000);
    };

    useEffect(() => { localStorage.setItem(KPI_VISIBILITY_STORAGE_KEY, JSON.stringify(kpiVisibility)); }, [kpiVisibility]);
    useEffect(() => { localStorage.setItem(KPI_GOALS_STORAGE_KEY, JSON.stringify(kpiGoals)); }, [kpiGoals]);
    useEffect(() => { localStorage.setItem(KPI_GROUP_ORDER_STORAGE_KEY, JSON.stringify(kpiGroupOrder)); }, [kpiGroupOrder]);

    const firstUpdateTopNServices = useRef(true);

    // fetchMainStatsAndCharts als useCallback definieren
    // Der Name wurde zu fetchMainStatsAndCharts_Memoized geändert, um Konflikte zu vermeiden,
    // falls die ursprüngliche Funktion noch irgendwo referenziert wird (obwohl sie jetzt durch diese ersetzt werden sollte).
    const fetchMainStatsAndCharts_Memoized = useCallback(async (startDate, endDate) => {
        setIsLoadingStats(true);
        let currentError = '';
        try {
            const apiRequests = [
                api.get('/statistics/detailed-counts', { params: { startDate, endDate } }),
                api.get('/statistics/by-day-of-week', { params: { startDate, endDate } }),
                api.get('/statistics/by-service', { params: { startDate, endDate, topN: topNServicesConfig } }),
                api.get('/statistics/revenue-over-time', { params: { startDate, endDate } }),
                api.get('/statistics/capacity-utilization', { params: { startDate, endDate } }),
                api.get('/statistics/by-hour-of-day', { params: { startDate, endDate } })
            ];
            const [statsRes, dayRes, serviceRes, revenueTimeRes, capacityRes, hourRes] = await Promise.all(apiRequests.map(p => p.catch(e => e)));

            if (statsRes instanceof Error) throw new Error(`Hauptstatistiken: ${statsRes.response?.data?.message || statsRes.message}`);
            const backendStats = statsRes.data;
            setDetailedStats(backendStats);

            if (backendStats.totalAppointmentsInPeriod > 0 && backendStats.totalRevenueInPeriod != null) {
                backendStats.avgRevenuePerAppointment = parseFloat(backendStats.totalRevenueInPeriod) / backendStats.totalAppointmentsInPeriod;
            } else {
                backendStats.avgRevenuePerAppointment = 0;
            }
            if (capacityRes && !(capacityRes instanceof Error) && capacityRes.data) {
                backendStats.capacityUtilizationPercentage = capacityRes.data.utilizationPercentage;
            } else {
                backendStats.capacityUtilizationPercentage = null;
            }

            if (dayRes instanceof Error) { currentError += `Termine/Tag: ${dayRes.response?.data?.message || dayRes.message}; `; setAppointmentsByDayData({labels: [], data: []}); }
            else setAppointmentsByDayData({ labels: dayRes.data.map(d => d.dayName ? d.dayName.substring(0, 2) : "Unb."), data: dayRes.data.map(d => d.appointmentCount || 0) });

            if (serviceRes instanceof Error) { currentError += `Termine/Service: ${serviceRes.response?.data?.message || serviceRes.message}; `; setAppointmentsByServiceData({labels: [], data: []});}
            else setAppointmentsByServiceData({ labels: serviceRes.data.map(s => s.serviceName || "Unbekannt"), data: serviceRes.data.map(s => s.appointmentCount || 0) });

            if (revenueTimeRes instanceof Error) { currentError += `Umsatzverlauf: ${revenueTimeRes.response?.data?.message || revenueTimeRes.message}; `; setRevenueOverTimeData([]);}
            else setRevenueOverTimeData(revenueTimeRes.data);

            if (capacityRes instanceof Error) { currentError += `Auslastung: ${capacityRes.response?.data?.message || capacityRes.message}; `; setCapacityUtilizationData(null);}
            else setCapacityUtilizationData(capacityRes.data);

            if (hourRes instanceof Error) { currentError += `Termine/Stunde: ${hourRes.response?.data?.message || hourRes.message}; `; setAppointmentsByHourData([]);}
            else setAppointmentsByHourData(hourRes.data || []);

            const allChanges = [];
            const kpiChangeMapping = [
                { dtoKey: 'appointmentCountChangePercentage', label: 'Terminanzahl', isGrowthGood: true },
                { dtoKey: 'revenueChangePercentage', label: 'Umsatz', isGrowthGood: true },
                { dtoKey: 'customerGrowthPercentage', label: 'Kundenwachstum', isGrowthGood: true },
                { dtoKey: 'cancellationRateChangePercentage', label: 'Stornoquote', isGrowthGood: false },
                { dtoKey: 'newCustomerShareChangePercentage', label: 'Neukundenanteil', isGrowthGood: true },
            ];

            kpiChangeMapping.forEach(kpi => {
                const value = backendStats[kpi.dtoKey];
                if (value != null && !isNaN(parseFloat(value))) {
                    allChanges.push({
                        label: kpi.label,
                        value: parseFloat(value),
                        isGood: kpi.isGrowthGood ? parseFloat(value) >= 0 : parseFloat(value) <= 0,
                        icon: KPI_DEFINITIONS.main.kpis.find(def => def.comparisonKey === kpi.dtoKey)?.icon ||
                            KPI_DEFINITIONS.customerService.kpis.find(def => def.comparisonKey === kpi.dtoKey)?.icon ||
                            KPI_DEFINITIONS.operationalDaily.kpis.find(def => def.comparisonKey === kpi.dtoKey)?.icon ||
                            faChartLine,
                        isIncrease: parseFloat(value) > 0,
                        isDecrease: parseFloat(value) < 0,
                    });
                }
            });

            allChanges.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
            const topPositive = allChanges.filter(c => c.value > 0).slice(0, 2);
            const topNegative = allChanges.filter(c => c.value < 0).slice(0, 2);
            const neutralOrNoChange = allChanges.filter(c => c.value === 0);
            setKeyChanges({ positive: topPositive, negative: topNegative, neutral: neutralOrNoChange.slice(0,1) });

            const alerts = [];
            if (backendStats.cancellationRate != null && Number(backendStats.cancellationRate) > 15 ) alerts.push({ type: 'warning', message: `Stornoquote bei ${Number(backendStats.cancellationRate).toFixed(1)}%`});
            if (capacityRes.data && !(capacityRes instanceof Error) && capacityRes.data.utilizationPercentage < 40) alerts.push({ type: 'info', message: `Auslastung: ${Number(capacityRes.data.utilizationPercentage).toFixed(1)}%. Potenzial prüfen.`});
            if (backendStats && backendStats.totalAppointmentsInPeriod === 0 && (selectedPeriod === PERIOD_OPTIONS.THIS_MONTH || selectedPeriod === PERIOD_OPTIONS.LAST_30_DAYS)) alerts.push({ type: 'info', message: `Keine Termine in diesem Zeitraum. Marketing?` });
            setDashboardAlerts(alerts.slice(0,2));

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
    }, [selectedPeriod, topNServicesConfig, showCustomDatePickersModal]); // Abhängigkeiten von fetchMainStatsAndCharts_Memoized

    useEffect(() => {
        if (firstUpdateTopNServices.current) {
            firstUpdateTopNServices.current = false;
            return;
        }
        localStorage.setItem(TOP_N_SERVICES_STORAGE_KEY, topNServicesConfig.toString());
        showAndClearCustomizationMessage("Top N Services aktualisiert.");
        // Rufe die memoized Version auf
        fetchMainStatsAndCharts_Memoized(currentFilterStartDate, currentFilterEndDate);
    }, [topNServicesConfig, currentFilterStartDate, currentFilterEndDate, fetchMainStatsAndCharts_Memoized]); // fetchMainStatsAndCharts_Memoized als Abhängigkeit


    const fetchActivityAndUpcoming = useCallback(async () => {
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

    useEffect(() => { fetchMainStatsAndCharts_Memoized(currentFilterStartDate, currentFilterEndDate); }, [currentFilterStartDate, currentFilterEndDate, fetchMainStatsAndCharts_Memoized]);
    useEffect(() => { fetchActivityAndUpcoming(); }, [onAppointmentAction, fetchActivityAndUpcoming]);

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
            setSelectedPeriod(PERIOD_OPTIONS.CUSTOM);
        } else { setError("Bitte wählen Sie ein gültiges Start- und Enddatum."); }
    };

    const handleViewDetails = async (appointmentDTO) => {
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


    const formatCurrency = (value, withEuroSign = true) => {
        if (value == null || isNaN(parseFloat(value))) return withEuroSign ? '0,00 €' : '0,00';
        const formatted = parseFloat(value).toFixed(2).replace('.', ',');
        return withEuroSign ? `${formatted} €` : formatted;
    };
    const formatPercentage = (value) => value != null && !isNaN(parseFloat(value)) ? `${parseFloat(value).toFixed(1).replace('.', ',')}%` : 'N/A';


    const renderComparison = (changePercentageInput, previousValue, isGrowthGood = true) => {
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

    const KpiCard = ({ label, value, icon, iconClass, comparison, tooltipText, isMain = false, goalValue, isCurrency = false, isPercentage = false }) => {
        let progressPercent = null; let goalText = null;
        if (goalValue != null && value != null && value !== 'N/A') {
            const numericValue = isCurrency ? parseFloat(String(value).replace('€', '').replace('.', '').replace(',', '.')) : (isPercentage ? parseFloat(String(value).replace('%','').replace(',','.')) : Number(value));
            if (!isNaN(numericValue) && goalValue > 0) {
                progressPercent = Math.min((numericValue / goalValue) * 100, 100);
                goalText = `${isCurrency ? formatCurrency(numericValue, false) : (isPercentage ? formatPercentage(numericValue) : numericValue)} / ${isCurrency ? formatCurrency(goalValue, false) : (isPercentage ? formatPercentage(goalValue) : goalValue)}`;
            }
        }
        const cardTitleTooltip = tooltipText || label;

        return (
            <div className={`bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow duration-200 ${styles.statCard} ${isMain ? styles.mainKpi : styles.smallKpi}`} title={cardTitleTooltip}>
                <div className={`flex items-center text-gray-500 mb-1 ${styles.statCardHeader}`}>
                    <FontAwesomeIcon icon={icon} className={`w-4 h-4 mr-2 ${styles.statIcon} ${iconClass ? styles[iconClass] : ''}`} />
                    <span className={`text-xs font-medium uppercase tracking-wider ${styles.statLabel}`}>{label}</span>
                    {tooltipText && (
                        <span className={`ml-auto relative ${styles.kpiTooltipWrapper}`} data-tooltip={tooltipText}>
                            <FontAwesomeIcon icon={faQuestionCircle} className={`w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-help ${styles.statTooltipIcon}`} />
                        </span>
                    )}
                </div>
                <div className={`font-bold ${isMain ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'} text-gray-800 ${styles.statValue}`}>{value == null || value === undefined ? 'N/A' : value}</div>
                {comparison && <div className={`text-xs mt-1 ${styles.statComparison}`}>{comparison}</div>}
                {progressPercent !== null && (
                    <div className={`mt-2 ${styles.kpiGoalProgress}`} title={`Ziel: ${isCurrency ? formatCurrency(goalValue) : (isPercentage ? formatPercentage(goalValue) : goalValue)}`}>
                        <div className={`w-full bg-gray-200 rounded-full h-1.5 ${styles.progressBarContainer}`}>
                            <div className={`bg-green-500 h-1.5 rounded-full ${styles.progressBar}`} style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <span className={`text-xs text-gray-500 mt-0.5 block text-right ${styles.goalText}`}>{goalText}</span>
                    </div>
                )}
            </div>
        );
    };

    const renderStatCards = () => {
        if (isLoadingStats && !detailedStats) {
            return (<div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${styles.statsOverviewCards} ${styles.kpiGroup}`}>
                {Array(4).fill(0).map((_, i) => (
                    <div key={`skel-main-${i}`} className={`bg-white p-4 rounded-lg shadow animate-pulse ${styles.statCard} ${styles.mainKpi}`}>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div> <div className="h-8 bg-gray-300 rounded w-1/2 mb-1"></div> <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>))}
                {Array(6).fill(0).map((_, i) => (
                    <div key={`skel-small-${i}`} className={`bg-white p-4 rounded-lg shadow animate-pulse ${styles.statCard} ${styles.smallKpi}`}>
                        <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div> <div className="h-6 bg-gray-300 rounded w-1/3"></div>
                    </div>))}
            </div>);
        }
        if (!detailedStats) return <p className={`p-4 text-center text-gray-500 ${styles.statCardNoData}`}>Keine Kennzahlen verfügbar.</p>;

        const kpiData = {
            totalAppointmentsInPeriod: detailedStats.totalAppointmentsInPeriod ?? '0',
            totalRevenueInPeriod: formatCurrency(detailedStats.totalRevenueInPeriod),
            avgRevenuePerAppointment: formatCurrency(detailedStats.avgRevenuePerAppointment),
            capacityUtilizationPercentage: capacityUtilizationData ? formatPercentage(capacityUtilizationData.utilizationPercentage) : 'N/A',
            uniqueCustomersInPeriod: detailedStats.uniqueCustomersInPeriod ?? 'N/A',
            customerGrowthPercentage: formatPercentage(detailedStats.customerGrowthPercentage),
            avgBookingsPerCustomer: detailedStats.avgBookingsPerCustomer != null ? Number(detailedStats.avgBookingsPerCustomer).toFixed(1) : 'N/A',
            newCustomerShare: formatPercentage(detailedStats.newCustomerShare),
            todayCount: detailedStats.todayCount ?? '0',
            revenueToday: formatCurrency(detailedStats.revenueToday ?? 0),
            totalUpcomingCount: detailedStats.totalUpcomingCount ?? '0',
            averageAppointmentDurationInPeriod: detailedStats.averageAppointmentDurationInPeriod != null ? `${Number(detailedStats.averageAppointmentDurationInPeriod).toFixed(0)} Min.` : 'N/A',
            totalActiveServices: detailedStats.totalActiveServices ?? 'N/A',
            cancellationRate: formatPercentage(detailedStats.cancellationRate),
            avgBookingLeadTime: detailedStats.avgBookingLeadTime != null ? `${detailedStats.avgBookingLeadTime} Tage` : 'N/A',
            projectedRevenueNext30Days: detailedStats.projectedRevenueNext30Days != null ? formatCurrency(detailedStats.projectedRevenueNext30Days) : 'N/A',
        };

        return (<>{kpiGroupOrder.map(groupKey => {
            if (!kpiVisibility[groupKey]?.visible) return null;
            const groupDef = KPI_DEFINITIONS[groupKey]; if (!groupDef) return null;
            return (<React.Fragment key={groupKey}>
                {groupKey !== kpiGroupOrder[0] && <hr className={`my-6 border-gray-200 ${styles.kpiDivider}`} />}
                <h4 className={`text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ${styles.statsSectionSubtitle}`}>{groupDef.label}</h4>
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${styles.statsOverviewCards} ${styles.kpiGroup}`}>
                    {groupDef.kpis.filter(kpiDef => kpiVisibility[groupKey]?.kpis[kpiDef.id] ?? true).map(kpiDef => {
                        let comparisonValue = null;
                        if (kpiDef.comparisonKey && detailedStats[kpiDef.comparisonKey] != null && detailedStats[kpiDef.previousPeriodKey] !== undefined) {
                            comparisonValue = renderComparison(detailedStats[kpiDef.comparisonKey], detailedStats[kpiDef.previousPeriodKey], kpiDef.label !== 'Stornoquote');
                        }
                        let displayValue = kpiData[kpiDef.dtoKey] == null ? 'N/A' : kpiData[kpiDef.dtoKey];

                        return (
                            <KpiCard key={kpiDef.id} label={kpiDef.label} value={displayValue} icon={kpiDef.icon} iconClass={kpiDef.iconClass}
                                     comparison={comparisonValue} tooltipText={kpiDef.tooltip} isMain={kpiDef.isMain}
                                     goalValue={kpiGoals[kpiDef.goalKey]} isCurrency={kpiDef.isCurrency} isPercentage={kpiDef.isPercentage} />
                        );
                    })}</div></React.Fragment>);
        })}</>);
    };

    const renderKeyChanges = () => {
        if (isLoadingStats || isLoadingActivity) return <p className={`text-xs text-gray-500 text-center py-2 ${styles.noDataSmall}`}><FontAwesomeIcon icon={faSpinner} spin className="mr-1" /> Lade Highlights...</p>;

        const { positive, negative, neutral } = keyChanges;
        const allSortedChanges = [...positive, ...negative, ...neutral];

        if (allSortedChanges.length === 0) return <p className={`text-xs text-gray-500 text-center py-2 ${styles.noDataSmall}`}>Keine signifikanten Veränderungen zur Vorperiode.</p>;

        return (
            <ul className={`space-y-1 ${styles.keyChangesList}`}>
                {allSortedChanges.slice(0, 3).map(change => (
                    <li key={change.label} className={`flex items-center text-xs ${styles.keyChangeItem} ${change.value === 0 ? 'text-gray-600' : (change.isGood ? 'text-green-600' : 'text-red-600')}`}>
                        <FontAwesomeIcon icon={change.value === 0 ? faEquals : (change.value > 0 ? faArrowUp : faArrowDown)} className="w-3 h-3 mr-1.5" />
                        <span className="flex-grow truncate" title={change.label}>{change.label}:</span>
                        <span className="font-medium ml-1">{change.value > 0 ? '+' : ''}{Number(change.value).toFixed(1)}%</span>
                    </li>
                ))}
            </ul>
        );
    };


    const renderDashboardAlerts = () => {
        if (isLoadingStats || isLoadingActivity) return <p className={`text-xs text-gray-500 text-center py-2 ${styles.noDataSmall}`}><FontAwesomeIcon icon={faSpinner} spin className="mr-1" /> Lade Hinweise...</p>;
        if (dashboardAlerts.length === 0) return <p className={`text-xs text-gray-500 text-center py-2 ${styles.noDataSmall}`}>Keine aktuellen Hinweise.</p>;
        return (<ul className={`space-y-1.5 ${styles.dashboardAlertsList}`}>
            {dashboardAlerts.map((a, i) => (<li key={i} className={`flex items-start text-xs p-2 rounded-md ${styles.dashboardAlertItem} ${a.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                <FontAwesomeIcon icon={a.type === 'warning' ? faExclamationCircle : faInfoCircle} className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{a.message}</span>
            </li>))}
        </ul>);
    };


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (morePeriodsDropdownRef.current && !morePeriodsDropdownRef.current.contains(event.target)) {
                setShowMorePeriodsDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [morePeriodsDropdownRef]);

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
        <div className={`p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-full ${styles.adminDashboardStats}`}>
            <div className={`flex flex-wrap items-center gap-2 sm:gap-3 mb-6 p-3 bg-white rounded-lg shadow ${styles.statsPeriodFilterBar}`}>
                <div className={`flex flex-wrap gap-1.5 ${styles.periodButtonsMain}`}>
                    {MAIN_PERIOD_OPTIONS.map(key => (
                        <button
                            key={key}
                            onClick={() => handlePeriodChange(key)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors
                                        ${selectedPeriod === key && !showCustomDatePickersModal
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'}`}
                            aria-pressed={selectedPeriod === key && !showCustomDatePickersModal}
                        >
                            {PERIOD_LABELS[key]}
                        </button>
                    ))}
                </div>
                <div className={`relative ${styles.periodButtonsMore}`} ref={morePeriodsDropdownRef}>
                    <button
                        onClick={() => setShowMorePeriodsDropdown(prev => !prev)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md border bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400 flex items-center ${styles.morePeriodsBtn}`}
                        aria-expanded={showMorePeriodsDropdown}
                    >
                        Mehr <FontAwesomeIcon icon={showMorePeriodsDropdown ? faAngleUp : faAngleDown} className="ml-1.5 h-3 w-3" />
                    </button>
                    {showMorePeriodsDropdown && (
                        <div className={`absolute top-full left-0 mt-1.5 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 p-1.5 space-y-1 ${styles.morePeriodsDropdown}`}>
                            {MORE_PERIOD_OPTIONS.map(key => (
                                <button
                                    key={key}
                                    onClick={() => handlePeriodChange(key)}
                                    className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded hover:bg-gray-100 ${selectedPeriod === key ? 'text-indigo-600 font-semibold' : 'text-gray-700'}`}
                                    aria-pressed={selectedPeriod === key}
                                >
                                    {PERIOD_LABELS[key]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    onClick={() => handlePeriodChange(PERIOD_OPTIONS.CUSTOM)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border flex items-center transition-colors
                                ${selectedPeriod === PERIOD_OPTIONS.CUSTOM
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'} ${styles.customPeriodBtn}`}
                    aria-pressed={selectedPeriod === PERIOD_OPTIONS.CUSTOM}
                >
                    <FontAwesomeIcon icon={faFilter} className="mr-1.5 h-3.5 w-3.5" />
                    {activeDateRangeLabel.startsWith("Custom:") || activeDateRangeLabel.startsWith("Zeitraum:") ? activeDateRangeLabel.replace(/Custom:|Zeitraum:/g, "").trim() : PERIOD_LABELS[PERIOD_OPTIONS.CUSTOM]}
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

            {lastUpdated && <div className={`text-xs text-gray-500 text-right mb-4 -mt-2 flex items-center justify-end ${styles.lastUpdatedTimestamp}`}><FontAwesomeIcon icon={faSyncAlt} className="mr-1.5" />Datenstand: {formatDateFns(lastUpdated, 'dd.MM.yyyy HH:mm:ss')}</div>}
            {(isLoadingStats || isLoadingDaily || isLoadingActivity) && !lastUpdated &&
                <div className={`text-sm text-gray-500 text-center py-2 px-3 bg-blue-50 border border-blue-200 rounded-md mb-4 flex items-center justify-center ${styles.loadingIndicatorTop}`}>
                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Daten werden geladen...
                </div>
            }
            {error && <p className={`p-3 mb-4 text-sm rounded-md flex items-center bg-red-50 text-red-700 border border-red-200 ${styles.formMessage} ${styles.error}`}><FontAwesomeIcon icon={faExclamationCircle} className="mr-2 flex-shrink-0" /> Fehler: {error.replace(/;/g, '; ')}</p>}
            {customizationMessage &&
                <div className={`p-2 mb-3 text-xs rounded-md flex items-center justify-center bg-green-50 text-green-700 border border-green-200 ${styles.customizationFeedback} ${styles.success}`}>
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-1.5" /> {customizationMessage}
                </div>
            }

            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${styles.dashboardGridLayout}`}>
                <div className={`lg:col-span-2 space-y-6 ${styles.mainStatsColumn}`}>
                    <div className={`bg-white p-5 rounded-xl shadow-lg ${styles.statsOverviewCardsWrapper} ${styles.statsSectionBox}`}>
                        <h3 className={`text-lg font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200 flex items-center justify-between ${styles.statsSectionTitle}`}>
                            <span><FontAwesomeIcon icon={faChartLine} className="mr-2 text-indigo-500" /> Kennzahlen</span>
                            <span className={`text-xs font-normal text-gray-500 ${styles.statsPeriodDisplay}`}>({activeDateRangeLabel.startsWith("Custom:") || activeDateRangeLabel.startsWith("Zeitraum:") ? activeDateRangeLabel.replace(/Custom:|Zeitraum:/g, "").trim() : activeDateRangeLabel})</span>
                        </h3>
                        {renderStatCards()}
                    </div>
                    <div className={`bg-white p-5 rounded-xl shadow-lg ${styles.chartsSectionWrapper} ${styles.statsSectionBox}`}>
                        <div className={`flex justify-between items-center mb-4 pb-2 border-b border-gray-200 ${styles.sectionHeaderWithExport}`}>
                            <h3 className={`text-lg font-semibold text-gray-700 flex items-center ${styles.statsSectionTitle}`}>
                                <FontAwesomeIcon icon={faChartPie} className="mr-2 text-indigo-500" /> Visuelle Analysen
                                <span className={`text-xs font-normal text-gray-500 ml-2 ${styles.statsPeriodDisplay}`}>({activeDateRangeLabel.startsWith("Custom:") || activeDateRangeLabel.startsWith("Zeitraum:") ? activeDateRangeLabel.replace(/Custom:|Zeitraum:/g, "").trim() : activeDateRangeLabel})</span>
                            </h3>
                        </div>
                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 ${styles.chartsGrid}`}>
                            <div className={`relative ${styles.chartCard} ${styles.revenueChartCard}`}>
                                <RevenueOverTimeRechart chartData={revenueOverTimeData} title="Umsatzentwicklung" periodLabel={activeDateRangeLabel.startsWith("Custom:") || activeDateRangeLabel.startsWith("Zeitraum:") ? activeDateRangeLabel.replace(/Custom:|Zeitraum:/g, "").trim() : activeDateRangeLabel} />
                                <button onClick={() => exportToCsv(`umsatz_${currentFilterStartDate}_${currentFilterEndDate}.csv`, revenueOverTimeData, ["Datum", "Umsatz"])} className={`absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 text-xs ${styles.exportChartBtn}`} title="Umsatzdaten exportieren"><FontAwesomeIcon icon={faDownload} /></button>
                            </div>
                            <div className={`relative ${styles.chartCard}`}>
                                <AppointmentsByDayRechart chartData={appointmentsByDayData} title="Termine / Wochentag" />
                                <button onClick={() => exportToCsv(`termine_tag_${currentFilterStartDate}_${currentFilterEndDate}.csv`, appointmentsByDayData.labels.map((l,i) => ({Wochentag: l, Termine: appointmentsByDayData.data[i]})), ["Wochentag", "Termine"])} className={`absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 text-xs ${styles.exportChartBtn}`} title="Termine/Tag Daten exportieren"><FontAwesomeIcon icon={faDownload} /></button>
                            </div>
                            <div className={`relative ${styles.chartCard}`}>
                                <AppointmentsByServiceRechart chartData={appointmentsByServiceData} title={`Top ${topNServicesConfig} Dienstleistungen`} />
                                <button onClick={() => exportToCsv(`termine_service_${currentFilterStartDate}_${currentFilterEndDate}.csv`, appointmentsByServiceData.labels.map((l,i) => ({Dienstleistung: l, Termine: appointmentsByServiceData.data[i]})), ["Dienstleistung", "Termine"])} className={`absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 text-xs ${styles.exportChartBtn}`} title="Termine/Service Daten exportieren"><FontAwesomeIcon icon={faDownload} /></button>
                            </div>
                            <div className={`relative ${styles.chartCard}`}>
                                <AppointmentsByHourRechart chartData={appointmentsByHourData} title="Terminauslastung / Stunde" />
                                <button onClick={() => exportToCsv(`termine_stunde_${currentFilterStartDate}_${currentFilterEndDate}.csv`, appointmentsByHourData.map(item => ({Stunde: `${String(item.hour).padStart(2, '0')}:00`, Termine: item.appointmentCount})), ["Stunde", "Termine"])} className={`absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 text-xs ${styles.exportChartBtn}`} title="Termine/Stunde Daten exportieren"><FontAwesomeIcon icon={faDownload} /></button>
                            </div>
                            <div className={`${styles.chartCard} ${styles.placeholderChartCard}`}><AppointmentsByEmployeeRechart title="Termine / Mitarbeiter (Zukunft)" /></div>
                        </div>
                    </div>
                </div>

                <div className={`space-y-6 ${styles.sidebarStatsColumn}`}>
                    <div className={`bg-white p-5 rounded-xl shadow-lg ${styles.quickAccessSection} ${styles.statsSectionBox}`}>
                        <h3 className={`text-base font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200 flex items-center ${styles.statsSectionTitle} ${styles.smallTitle}`}>
                            <FontAwesomeIcon icon={faBolt} className="mr-2 text-indigo-500" /> Schnellzugriff & Aktivität
                        </h3>
                        <div className={`space-y-3 ${styles.quickAccessContent}`}>
                            <button onClick={handleOpenCreateModal} className={`w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 ${styles.quickCreateButton}`}>
                                <FontAwesomeIcon icon={faPlusCircle} className="mr-2" /> Termin anlegen
                            </button>
                            <div className={`p-3 bg-slate-50 rounded-md border border-slate-200 ${styles.bookingActivityWidget}`}>
                                <h4 className="text-xs font-semibold text-gray-600 mb-1 pb-1 border-b border-slate-200">Neue Buchungen</h4>
                                {isLoadingActivity || isLoadingStats ? <p className={`text-xs text-gray-500 ${styles.noDataSmall}`}><FontAwesomeIcon icon={faSpinner} spin className="mr-1" /> Lade...</p> : (<>
                                    <p className="text-xs text-gray-500">Heute: <span className="font-medium text-gray-700">{detailedStats?.newBookingsToday ?? 'N/A'}</span></p>
                                    <p className="text-xs text-gray-500">Gestern: <span className="font-medium text-gray-700">{detailedStats?.newBookingsYesterday ?? 'N/A'}</span></p>
                                </>)}
                            </div>
                        </div>
                    </div>
                    <div className={`bg-white p-5 rounded-xl shadow-lg ${styles.salonHighlightsSection} ${styles.statsSectionBox}`}>
                        <h3 className={`text-base font-semibold text-gray-700 mb-2 pb-2 border-b border-gray-200 flex items-center justify-between ${styles.statsSectionTitle} ${styles.smallTitle}`}>
                            <span><FontAwesomeIcon icon={faBullseye} className="mr-2 text-indigo-500" /> Wichtige Veränderungen</span>
                            <span className={`text-xs font-normal text-gray-500 ${styles.statsPeriodDisplay}`}>(vs. Vorp.)</span>
                        </h3>
                        {renderKeyChanges()}
                        <hr className={`my-3 border-gray-200 ${styles.kpiDivider}`}/>
                        <h3 className={`text-base font-semibold text-gray-700 mb-2 pb-2 border-b border-gray-200 flex items-center ${styles.statsSectionTitle} ${styles.smallTitle}`}>
                            <FontAwesomeIcon icon={faBell} className="mr-2 text-indigo-500" /> Hinweise & Alerts
                        </h3>
                        {renderDashboardAlerts()}
                    </div>
                    <div className={`bg-white p-5 rounded-xl shadow-lg ${styles.dailyAppointmentsSection} ${styles.statsSectionBox}`}>
                        <div className={`flex justify-between items-center mb-3 pb-2 border-b border-gray-200 ${styles.sectionHeaderWithExport}`}>
                            <h3 className={`text-base font-semibold text-gray-700 flex items-center ${styles.dailyAppointmentsHeading}`}>
                                <FontAwesomeIcon icon={faListAlt} className="mr-2 text-indigo-500" /> Heutige & Nächste Termine
                            </h3>
                            <button onClick={() => exportToCsv(`tagesliste.csv`, dailyAppointments.map(apt => ({Datum: apt.appointmentDate, Zeit: apt.startTime, Service: apt.serviceName, Kunde: `${apt.customerFirstName} ${apt.customerLastName}`, Status: apt.status})), ["Datum", "Zeit", "Service", "Kunde", "Status"])} className={`p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 text-xs ${styles.exportListBtn}`} title="Terminliste exportieren"><FontAwesomeIcon icon={faDownload} /></button>
                        </div>
                        {isLoadingDaily ? <div className={`text-center py-4 text-sm text-gray-500 ${styles.loadingMessageStats} ${styles.smallListLoader}`}><FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Lade Termine...</div> : dailyAppointments.length > 0 ? (
                            <ul className={`space-y-1.5 ${styles.dailyAppointmentsList}`}>
                                {dailyAppointments.map(apt => {
                                    const appointmentDateTime = apt.appointmentDate && apt.startTime ? parseISO(`${formatDateFns(apt.appointmentDate, 'yyyy-MM-dd')}T${typeof apt.startTime === 'string' ? apt.startTime.substring(0,5) : `${String(apt.startTime.hour).padStart(2,'0')}:${String(apt.startTime.minute).padStart(2,'0')}`}:00`) : null;
                                    let statusClass = `${styles.statusTag} ${styles['status-' + (apt.status?.toLowerCase().replace(/\./g, '').replace(/ /g, '-') || 'unbekannt')]}`;
                                    if (apt.status && apt.status !== "Heute" && apt.status !== "Morgen") statusClass = `${styles.statusTag} ${styles.statusDatum}`;
                                    return (<li key={apt.appointmentId} className={`flex items-center justify-between p-2.5 rounded-md hover:bg-slate-50 cursor-pointer transition-colors ${styles.dailyAppointmentItem}`} onClick={() => handleViewDetails(apt)} role="button" tabIndex={0} onKeyPress={(e) => e.key === 'Enter' && handleViewDetails(apt)} aria-label={`Termin ansehen`}>
                                        {isLoadingModalAppointment && selectedAppointmentForEdit?.id === apt.appointmentId && <FontAwesomeIcon icon={faSpinner} spin className={`text-gray-400 ${styles.itemLoaderIcon}`} />}
                                        <span className={`text-xs font-semibold text-gray-700 ${styles.appointmentTime}`}>{appointmentDateTime ? formatDateFns(appointmentDateTime, 'HH:mm') : 'N/A'}</span>
                                        <div className={`flex-grow mx-2 text-xs ${styles.appointmentInfoGroup}`}>
                                            <span className={`block font-medium text-gray-800 truncate ${styles.appointmentService}`}>{apt.serviceName}</span>
                                            <span className={`block text-gray-500 truncate ${styles.appointmentCustomer}`}>{apt.customerFirstName} {apt.customerLastName}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 text-[0.65rem] font-semibold rounded-full leading-tight ${statusClass}`}>{apt.status || 'Unbekannt'}</span>
                                    </li>);})}</ul>
                        ) : (!isLoadingDaily && !error && <p className={`text-sm text-gray-500 text-center py-4 ${styles.noUpcomingAppointments}`}>Keine anstehenden Termine.</p>)}
                    </div>

                </div>
            </div>

            {selectedAppointmentForEdit && currentUser?.roles?.includes("ROLE_ADMIN") && (<AppointmentEditModal isOpen={!!selectedAppointmentForEdit} appointment={selectedAppointmentForEdit} onClose={handleCloseEditModal} onAppointmentUpdated={handleAppointmentUpdatedFromModal} />)}
            {showCreateModal && (<AppointmentCreateModal isOpen={showCreateModal} onClose={handleCloseCreateModal} onAppointmentCreated={handleAppointmentCreated} currentUser={currentUser} selectedSlot={selectedSlotForCreate} />)}
        </div>
    );
}
export default AdminDashboardStats;
