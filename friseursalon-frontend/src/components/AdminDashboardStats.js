// src/components/AdminDashboardStats.js
import React, { useState, useMemo } from 'react';
import styles from './AdminDashboardStats.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faExclamationCircle, faSpinner, faArrowUp, faArrowDown, faEquals } from '@fortawesome/free-solid-svg-icons';
import { parseISO, format as formatDateFns, subDays, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, startOfYear as dateFnsStartOfYear, formatISO } from 'date-fns';
import { de as deLocale } from 'date-fns/locale';
import { registerLocale } from 'react-datepicker';

// KORREKTUR: Der Pfad wurde angepasst, um direkt vom 'src'-Verzeichnis auszugehen.
import { useDashboardData } from '../hooks/useDashboardData';
import KpiGrid from './KpiGrid';
import ChartsSection from './ChartsSection';
import ActivitySidebar from './ActivitySidebar';
import CustomDateRangeModal from './CustomDateRangeModal';
import AppointmentEditModal from './AppointmentEditModal';
import AppointmentCreateModal from './AppointmentCreateModal';

registerLocale('de', deLocale);

// Konstanten und Hilfsfunktionen bleiben unverändert
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
        kpis: [
            { id: 'termine', label: "Termine", icon: faChartLine, isMain: true, dtoKey: 'totalAppointmentsInPeriod', comparisonKey: 'appointmentCountChangePercentage', previousPeriodKey: 'previousPeriodTotalAppointments', goalKey: 'monthlyAppointmentsGoal' },
            { id: 'umsatz', label: "Umsatz", icon: faChartLine, isMain: true, dtoKey: 'totalRevenueInPeriod', comparisonKey: 'revenueChangePercentage', previousPeriodKey: 'previousPeriodTotalRevenue', goalKey: 'monthlyRevenueGoal' },
        ]
    },
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
        case PERIOD_OPTIONS.THIS_MONTH:
        default:
            startDate = startOfMonth(today); endDate = endOfMonth(today);
    }
    return { startDate: formatISO(startDate, { representation: 'date' }), endDate: formatISO(endDate, { representation: 'date' }) };
};

function AdminDashboardStats({ currentUser, onAppointmentAction }) {
    const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_OPTIONS.THIS_MONTH);
    const [dateRange, setDateRange] = useState(getDatesForPeriod(PERIOD_OPTIONS.THIS_MONTH));
    const [activeDateRangeLabel, setActiveDateRangeLabel] = useState(PERIOD_LABELS[PERIOD_OPTIONS.THIS_MONTH]);
    const [topNServicesConfig, setTopNServicesConfig] = useState(() => parseInt(localStorage.getItem('topNServicesConfig'), 10) || 5);

    const { allData, isLoading, error } = useDashboardData(dateRange, topNServicesConfig, onAppointmentAction);

    const [showCustomDatePickersModal, setShowCustomDatePickersModal] = useState(false);
    const [customPickerStartDate, setCustomPickerStartDate] = useState(new Date());
    const [customPickerEndDate, setCustomPickerEndDate] = useState(new Date());
    const [kpiVisibility, setKpiVisibility] = useState(() => JSON.parse(localStorage.getItem('kpiVisibility')) || { main: { visible: true, kpis: { termine: true, umsatz: true } } });
    const [kpiGoals, setKpiGoals] = useState(() => JSON.parse(localStorage.getItem('kpiGoals')) || {});
    const [kpiGroupOrder, setKpiGroupOrder] = useState(() => JSON.parse(localStorage.getItem('kpiGroupOrder')) || ['main']);
    const [selectedAppointmentForEdit, setSelectedAppointmentForEdit] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const { kpiData, activityData, chartData } = useMemo(() => ({
        kpiData: allData?.kpiData || null,
        activityData: allData?.activityData || {},
        chartData: allData?.chartData || {},
    }), [allData]);

    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        if (period === PERIOD_OPTIONS.CUSTOM) {
            setCustomPickerStartDate(parseISO(dateRange.startDate));
            setCustomPickerEndDate(parseISO(dateRange.endDate));
            setShowCustomDatePickersModal(true);
        } else {
            setDateRange(getDatesForPeriod(period));
            setActiveDateRangeLabel(PERIOD_LABELS[period]);
        }
    };

    const handleApplyCustomDateRange = (start, end) => {
        const newStartDate = formatISO(start, { representation: 'date' });
        const newEndDate = formatISO(end, { representation: 'date' });
        setDateRange({ startDate: newStartDate, endDate: newEndDate });
        setActiveDateRangeLabel(`Custom: ${formatDateFns(start, 'dd.MM.yy')} - ${formatDateFns(end, 'dd.MM.yy')}`);
        setShowCustomDatePickersModal(false);
    };

    const handleViewAppointmentDetails = (appointment) => {
        setSelectedAppointmentForEdit(appointment);
    };

    const handleModalClose = () => {
        setSelectedAppointmentForEdit(null);
        setShowCreateModal(false);
    };

    const handleModalSave = () => {
        handleModalClose();
        if(onAppointmentAction) onAppointmentAction();
    };

    const renderComparison = (changePercentage) => {
        if (changePercentage == null) return null;
        const change = parseFloat(changePercentage);
        if(isNaN(change)) return null;

        const isGrowthGood = true;
        const colorClass = change === 0 ? styles.neutral : (change > 0 ? (isGrowthGood ? styles.positive : styles.negative) : (isGrowthGood ? styles.negative : styles.positive));
        const icon = change === 0 ? faEquals : (change > 0 ? faArrowUp : faArrowDown);

        return <span className={`${styles.comparisonData} ${colorClass}`}><FontAwesomeIcon icon={icon} /> {change.toFixed(1).replace('.', ',')}%</span>;
    };


    return (
        <div className={styles.adminDashboardStats}>
            {isLoading && !allData && <div className={styles.loadingIndicatorTop}><FontAwesomeIcon icon={faSpinner} spin /> Daten werden geladen...</div>}
            {error && <p className={styles.error}><FontAwesomeIcon icon={faExclamationCircle} /> {error}</p>}

            <div className={styles.dashboardGridLayout}>
                <main className={styles.mainStatsColumn}>
                    <div className={styles.statsSectionBox}>
                        <h3 className={styles.statsSectionTitle}><span><FontAwesomeIcon icon={faChartLine} /> Kennzahlen</span></h3>
                        <KpiGrid
                            isLoading={isLoading}
                            kpiData={kpiData}
                            kpiDefinitions={KPI_DEFINITIONS}
                            kpiVisibility={kpiVisibility}
                            kpiGroupOrder={kpiGroupOrder}
                            renderComparison={renderComparison}
                            kpiGoals={kpiGoals}
                        />
                    </div>

                    <ChartsSection
                        chartData={chartData}
                        topNServicesConfig={topNServicesConfig}
                        activePeriodLabel={activeDateRangeLabel}
                        dateRange={dateRange}
                    />
                </main>

                <ActivitySidebar
                    onOpenCreateModal={() => setShowCreateModal(true)}
                    activityData={activityData}
                    isLoading={isLoading}
                    onViewAppointmentDetails={handleViewAppointmentDetails}
                />
            </div>

            <CustomDateRangeModal
                isOpen={showCustomDatePickersModal}
                onClose={() => setShowCustomDatePickersModal(false)}
                onApply={handleApplyCustomDateRange}
                startDate={customPickerStartDate}
                setStartDate={setCustomPickerStartDate}
                endDate={customPickerEndDate}
                setEndDate={setCustomPickerEndDate}
                isLoading={isLoading}
            />
            {showCreateModal && (
                <AppointmentCreateModal isOpen={showCreateModal} onClose={handleModalClose} onSave={handleModalSave} currentUser={currentUser} />
            )}
            {selectedAppointmentForEdit && (
                <AppointmentEditModal isOpen={!!selectedAppointmentForEdit} onClose={handleModalClose} onSave={handleModalSave} appointmentData={selectedAppointmentForEdit} adminView={true} />
            )}
        </div>
    );
}

export default AdminDashboardStats;