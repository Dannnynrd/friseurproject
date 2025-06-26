// src/components/AdminDashboardStats.js
import React, { useState, useMemo } from 'react';
import styles from './AdminDashboardStats.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChartLine, faUsers, faScissors, faBullseye, faCalendarDay, faEuroSign,
    faPercent, faUserPlus, faClock, faPlaneDeparture, faProjectDiagram, faSyncAlt,
    faCalendar, faExclamationCircle, faSpinner, faArrowUp, faArrowDown, faEquals
} from '@fortawesome/free-solid-svg-icons';
import { parseISO, format as formatDateFns, subDays, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, startOfYear as dateFnsStartOfYear, formatISO } from 'date-fns';
import { de as deLocale } from 'date-fns/locale';
import { registerLocale } from 'react-datepicker';

import KpiGrid from './KpiGrid';
import ChartsSection from './ChartsSection';
import ActivitySidebar from './ActivitySidebar';
import CustomDateRangeModal from './CustomDateRangeModal';

registerLocale('de', deLocale);

const PERIOD_OPTIONS = {
    TODAY: 'today', THIS_WEEK: 'thisWeek', LAST_7_DAYS: 'last7days', THIS_MONTH: 'thisMonth', LAST_MONTH: 'lastMonth',
    LAST_30_DAYS: 'last30days', YEAR_TO_DATE: 'yearToDate', LAST_365_DAYS: 'last365days', CUSTOM: 'custom',
};
const PERIOD_LABELS = {
    [PERIOD_OPTIONS.TODAY]: 'Heute', [PERIOD_OPTIONS.THIS_WEEK]: 'Diese Woche', [PERIOD_OPTIONS.LAST_7_DAYS]: 'Letzte 7 Tage',
    [PERIOD_OPTIONS.THIS_MONTH]: 'Dieser Monat', [PERIOD_OPTIONS.LAST_MONTH]: 'Letzter Monat', [PERIOD_OPTIONS.LAST_30_DAYS]: 'Letzte 30 Tage',
    [PERIOD_OPTIONS.YEAR_TO_DATE]: 'Dieses Jahr', [PERIOD_OPTIONS.LAST_365_DAYS]: 'Letzte 365 Tage', [PERIOD_OPTIONS.CUSTOM]: 'Benutzerdefiniert',
};

const KPI_DEFINITIONS = {
    main: {
        label: "Hauptkennzahlen",
        kpis: [ { id: 'termine', label: "Termine", icon: faCalendarDay, dtoKey: 'totalAppointmentsInPeriod' }, { id: 'umsatz', label: "Umsatz", icon: faEuroSign, dtoKey: 'totalRevenueInPeriod' } ]
    },
    customerService: {
        label: "Kunden- & Service-Metriken",
        kpis: [ { id: 'einzigKunden', label: "Einzig. Kunden", icon: faUsers, dtoKey: 'uniqueCustomersInPeriod' }, { id: 'neukundenAnteil', label: "Neukundenanteil", icon: faUserPlus, dtoKey: 'newCustomerShare' } ]
    },
    operationalDaily: {
        label: "Operative & Tagesaktuelle Zahlen",
        kpis: [ { id: 'stornoquote', label: "Stornoquote", icon: faPercent, dtoKey: 'cancellationRate' }, { id: 'avgVorlaufzeit', label: "Ø Vorlaufzeit Buch.", icon: faPlaneDeparture, dtoKey: 'avgBookingLeadTime' } ]
    }
};

const getDatesForPeriod = (period) => {
    const today = new Date(); let startDate, endDate;
    switch (period) {
        case PERIOD_OPTIONS.TODAY: startDate = today; endDate = today; break;
        case PERIOD_OPTIONS.THIS_WEEK: startDate = startOfWeek(today, { locale: deLocale }); endDate = endOfWeek(today, { locale: deLocale }); break;
        case PERIOD_OPTIONS.LAST_7_DAYS: startDate = subDays(today, 6); endDate = today; break;
        case PERIOD_OPTIONS.LAST_MONTH: const lmf = startOfMonth(subMonths(today, 1)); startDate = lmf; endDate = endOfMonth(lmf); break;
        case PERIOD_OPTIONS.LAST_30_DAYS: startDate = subDays(today, 29); endDate = today; break;
        case PERIOD_OPTIONS.YEAR_TO_DATE: startDate = dateFnsStartOfYear(today); endDate = today; break;
        case PERIOD_OPTIONS.LAST_365_DAYS: startDate = subDays(today, 364); endDate = today; break;
        case PERIOD_OPTIONS.THIS_MONTH: default: startDate = startOfMonth(today); endDate = endOfMonth(today); break;
    }
    return { startDate: formatISO(startDate, { representation: 'date' }), endDate: formatISO(endDate, { representation: 'date' }) };
};

const exampleKpiData = {
    formatted: { totalAppointmentsInPeriod: '143', totalRevenueInPeriod: '4.321,50 €', uniqueCustomersInPeriod: '98', newCustomerShare: '15,3 %', averageAppointmentDurationInPeriod: '52 min', totalActiveServices: '12', cancellationRate: '6.2 %', avgBookingLeadTime: '9 Tage' },
    numeric: { totalAppointmentsInPeriod: 143, totalRevenueInPeriod: 4321.50, uniqueCustomersInPeriod: 98, newCustomerShare: 15.3, cancellationRate: 6.2 },
    appointmentCountChangePercentage: 15.5, revenueChangePercentage: -15.0, customerGrowthPercentage: 10,
};
const exampleChartData = { /* ... unverändert ... */ };
const exampleActivityData = {
    dailyAppointments: [ { appointmentId: 1, appointmentDate: '2025-06-26', startTime: '14:00', customerFirstName: 'Anna', customerLastName: 'Muster', serviceName: 'Damenhaarschnitt', status: 'Heute' }, { appointmentId: 3, appointmentDate: '2025-06-27', startTime: '10:00', customerFirstName: 'Julia', customerLastName: 'Sommer', serviceName: 'Balayage', status: 'Morgen' } ],
};
const exampleInsights = [
    { id: 1, type: 'alert', title: 'Hohe Stornoquote', description: 'Die aktuelle Stornoquote von 6.2% liegt über dem Zielwert von 5%.' },
    { id: 2, type: 'warning', title: 'Umsatztrend rückläufig', description: 'Der Umsatz der letzten 30 Tage liegt 15% unter dem des Vormonats.' },
    { id: 3, type: 'info', title: 'Beliebteste Dienstleistung', description: 'Balayage ist diesen Monat die am häufigsten gebuchte Leistung.' },
    { id: 4, type: 'success', title: 'Kundenwachstum', description: 'Die Anzahl der Neukunden ist im Vergleich zum Vormonat um 10% gestiegen.' },
];

const initialKpiVisibility = {};
for (const groupKey in KPI_DEFINITIONS) {
    initialKpiVisibility[groupKey] = {
        visible: true,
        kpis: KPI_DEFINITIONS[groupKey].kpis.reduce((acc, kpi) => { acc[kpi.id] = true; return acc; }, {})
    };
}

function AdminDashboardStats({ currentUser }) {
    const [selectedPeriod, setSelectedPeriod] = useState('last30days');
    const [dateRange, setDateRange] = useState(getDatesForPeriod('last30days'));
    const [activeDateRangeLabel, setActiveDateRangeLabel] = useState('Letzte 30 Tage');

    const [showCustomDateModal, setShowCustomDateModal] = useState(false);
    const [customStartDate, setCustomStartDate] = useState(new Date());
    const [customEndDate, setCustomEndDate] = useState(new Date());

    const allData = { kpiData: exampleKpiData, activityData: exampleActivityData, chartData: exampleChartData, insightsData: exampleInsights };
    const isLoading = false;
    const error = '';

    const [kpiVisibility, setKpiVisibility] = useState(initialKpiVisibility);
    const [kpiGoals, setKpiGoals] = useState({ monthlyRevenueGoal: 5000, monthlyAppointmentsGoal: 150 });
    const [kpiGroupOrder, setKpiGroupOrder] = useState(['main', 'customerService', 'operationalDaily']);

    const formattedCurrentDate = useMemo(() => formatDateFns(new Date(), "EEEE, d. MMMM yyyy", { locale: deLocale }), []);

    const { kpiData, activityData, chartData, insightsData } = useMemo(() => ({
        kpiData: allData?.kpiData || null,
        activityData: allData?.activityData || {},
        chartData: allData?.chartData || {},
        insightsData: allData?.insightsData || [],
    }), [allData]);

    const handlePeriodChange = (periodKey) => {
        setSelectedPeriod(periodKey);
        if (periodKey === 'custom') {
            setShowCustomDateModal(true);
        } else {
            setDateRange(getDatesForPeriod(periodKey));
            setActiveDateRangeLabel(PERIOD_LABELS[periodKey]);
        }
    };

    const handleApplyCustomDateRange = (start, end) => {
        const newStartDate = formatISO(start, { representation: 'date' });
        const newEndDate = formatISO(end, { representation: 'date' });
        setDateRange({ startDate: newStartDate, endDate: newEndDate });
        setActiveDateRangeLabel(`Custom: ${formatDateFns(start, 'dd.MM.yy')} - ${formatDateFns(end, 'dd.MM.yy')}`);
        setShowCustomDateModal(false);
    };

    const renderComparison = (changePercentage) => {
        if (changePercentage == null || isNaN(changePercentage)) return null;
        const change = parseFloat(changePercentage);
        const isGrowthGood = true;
        const colorClass = change === 0 ? styles.neutral : (change > 0 ? (isGrowthGood ? styles.positive : styles.negative) : (isGrowthGood ? styles.negative : styles.positive));
        const icon = change === 0 ? faEquals : (change > 0 ? faArrowUp : faArrowDown);
        return <span className={`${styles.comparisonData} ${colorClass}`}><FontAwesomeIcon icon={icon} /> {change.toFixed(1).replace('.', ',')}%</span>;
    };

    const isDataReady = !isLoading && kpiData && kpiData.formatted;

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.dashboardHeader}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>Dein Dashboard</h1>
                    <p className={styles.currentDate}>Hallo {currentUser?.firstName || 'Admin'}, willkommen zurück! Heute ist {formattedCurrentDate}.</p>
                </div>
            </div>

            <div className={styles.periodSelectorContainer}>
                <div className={styles.periodSelector}>
                    {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                        <button key={key} onClick={() => handlePeriodChange(key)} className={`${styles.periodButton} ${selectedPeriod === key ? styles.active : ''}`}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {error && <p className={styles.error}><FontAwesomeIcon icon={faExclamationCircle} /> {error}</p>}

            <div className={styles.dashboardGrid}>
                <main className={styles.mainColumn}>
                    <div className={styles.mainMetricsGrid}>
                        {isDataReady ? (
                            <>
                                <div className={styles.mainMetricCard}>
                                    <span className={styles.metricLabel}>Umsatz ({activeDateRangeLabel})</span>
                                    <span className={styles.metricValue}>{kpiData.formatted.totalRevenueInPeriod}</span>
                                    <span className={styles.metricComparison}>{renderComparison(kpiData.revenueChangePercentage)}</span>
                                </div>
                                <div className={styles.mainMetricCard}>
                                    <span className={styles.metricLabel}>Termine ({activeDateRangeLabel})</span>
                                    <span className={styles.metricValue}>{kpiData.formatted.totalAppointmentsInPeriod}</span>
                                    <span className={styles.metricComparison}>{renderComparison(kpiData.appointmentCountChangePercentage)}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={`${styles.mainMetricCard} ${styles.skeleton}`}>
                                    <div className={styles.skeletonText} style={{width: '50%'}}></div>
                                    <div className={styles.skeletonText} style={{width: '30%', height: '2.5rem', margin: '0.5rem 0'}}></div>
                                    <div className={styles.skeletonText} style={{width: '40%'}}></div>
                                </div>
                                <div className={`${styles.mainMetricCard} ${styles.skeleton}`}>
                                    <div className={styles.skeletonText} style={{width: '50%'}}></div>
                                    <div className={styles.skeletonText} style={{width: '30%', height: '2.5rem', margin: '0.5rem 0'}}></div>
                                    <div className={styles.skeletonText} style={{width: '40%'}}></div>
                                </div>
                            </>
                        )}
                    </div>

                    {isDataReady && (
                        <>
                            <KpiGrid isLoading={isLoading} kpiData={kpiData} kpiDefinitions={KPI_DEFINITIONS} kpiVisibility={kpiVisibility} kpiGroupOrder={kpiGroupOrder} renderComparison={renderComparison} kpiGoals={kpiGoals} />
                            <ChartsSection chartData={chartData} activePeriodLabel={activeDateRangeLabel} dateRange={dateRange} />
                        </>
                    )}
                </main>

                <aside className={styles.sidebarColumn}>
                    <ActivitySidebar activityData={activityData} insightsData={insightsData} isLoading={isLoading} onOpenCreateModal={() => {}} onViewAppointmentDetails={() => {}} />
                </aside>
            </div>

            <CustomDateRangeModal isOpen={showCustomDateModal} onClose={() => setShowCustomDateModal(false)} onApply={handleApplyCustomDateRange} startDate={customStartDate} setStartDate={setCustomStartDate} endDate={customEndDate} setEndDate={setCustomEndDate} />
        </div>
    );
}

export default AdminDashboardStats;