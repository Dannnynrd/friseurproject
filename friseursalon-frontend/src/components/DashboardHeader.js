import React, { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDown, faAngleUp, faFilter, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { format as formatDateFns } from 'date-fns';
import styles from './DashboardHeader.module.css';

// Konstanten außerhalb der Komponente definieren, um Neu-Deklarationen zu vermeiden
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

const DashboardHeader = ({
                             selectedPeriod,
                             onPeriodChange,
                             activeDateRangeLabel,
                             lastUpdated,
                             showMorePeriodsDropdown,
                             setShowMorePeriodsDropdown,
                             isLoading,
                             showCustomDatePickersModal
                         }) => {
    const morePeriodsDropdownRef = useRef(null);

    // Dropdown schließen, wenn außerhalb geklickt wird
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (morePeriodsDropdownRef.current && !morePeriodsDropdownRef.current.contains(event.target)) {
                setShowMorePeriodsDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setShowMorePeriodsDropdown]);

    return (
        <>
            <div className={styles.statsPeriodFilterBar}>
                <div className={styles.periodButtonsMain}>
                    {MAIN_PERIOD_OPTIONS.map(key => (
                        <button
                            key={key}
                            onClick={() => onPeriodChange(key)}
                            className={`${styles.periodButton} ${selectedPeriod === key && !showCustomDatePickersModal ? styles.active : ''}`}
                            aria-pressed={selectedPeriod === key && !showCustomDatePickersModal}
                            disabled={isLoading}
                        >
                            {PERIOD_LABELS[key]}
                        </button>
                    ))}
                </div>
                <div className={styles.periodButtonsMore} ref={morePeriodsDropdownRef}>
                    <button
                        onClick={() => setShowMorePeriodsDropdown(prev => !prev)}
                        className={`${styles.periodButton} ${styles.morePeriodsBtn}`}
                        aria-expanded={showMorePeriodsDropdown}
                        disabled={isLoading}
                    >
                        Mehr <FontAwesomeIcon icon={showMorePeriodsDropdown ? faAngleUp : faAngleDown} className={styles.moreIcon} />
                    </button>
                    {showMorePeriodsDropdown && (
                        <div className={styles.morePeriodsDropdown}>
                            {MORE_PERIOD_OPTIONS.map(key => (
                                <button
                                    key={key}
                                    onClick={() => onPeriodChange(key)}
                                    className={`${styles.dropdownItem} ${selectedPeriod === key ? styles.active : ''}`}
                                    aria-pressed={selectedPeriod === key}
                                >
                                    {PERIOD_LABELS[key]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    onClick={() => onPeriodChange(PERIOD_OPTIONS.CUSTOM)}
                    className={`${styles.periodButton} ${styles.customPeriodBtn} ${selectedPeriod === PERIOD_OPTIONS.CUSTOM ? styles.active : ''}`}
                    aria-pressed={selectedPeriod === PERIOD_OPTIONS.CUSTOM}
                    disabled={isLoading}
                >
                    <FontAwesomeIcon icon={faFilter} className={styles.filterIcon} />
                    {activeDateRangeLabel.startsWith("Custom:") || activeDateRangeLabel.startsWith("Zeitraum:") ? activeDateRangeLabel.replace(/Custom:|Zeitraum:/g, "").trim() : PERIOD_LABELS[PERIOD_OPTIONS.CUSTOM]}
                </button>
            </div>

            {lastUpdated && (
                <div className={styles.lastUpdatedTimestamp}>
                    <FontAwesomeIcon icon={faSyncAlt} />
                    Datenstand: {formatDateFns(lastUpdated, 'dd.MM.yyyy HH:mm:ss')}
                </div>
            )}
        </>
    );
};

export default DashboardHeader;