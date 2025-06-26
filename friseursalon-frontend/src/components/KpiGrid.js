// src/components/KpiGrid.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import styles from './KpiGrid.module.css';

const KpiCard = ({ label, value, icon, comparison, tooltipText, isMain = false, progressPercent, goalText }) => {
    const cardTitleTooltip = tooltipText || label;

    return (
        <div className={`${styles.statCard} ${isMain ? styles.mainKpi : ''}`} title={cardTitleTooltip}>
            <div className={styles.statCardHeader}>
                <span className={styles.statLabel}>{label}</span>
                <FontAwesomeIcon icon={icon} className={styles.statIcon} />
                {tooltipText && (
                    <span className={styles.kpiTooltipWrapper} data-tooltip={tooltipText}>
                        <FontAwesomeIcon icon={faQuestionCircle} className={styles.statTooltipIcon} />
                    </span>
                )}
            </div>
            <div className={styles.statValue}>{value ?? 'N/A'}</div>
            {comparison && <div className={styles.statComparison}>{comparison}</div>}
            {progressPercent !== null && (
                <div className={styles.kpiGoalProgress}>
                    <div className={styles.progressBarContainer}>
                        <div className={styles.progressBar} style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    {goalText && <span className={styles.goalText}>{goalText}</span>}
                </div>
            )}
        </div>
    );
};


const KpiGrid = ({ isLoading, kpiData, kpiDefinitions, kpiVisibility, kpiGroupOrder, renderComparison, kpiGoals }) => {
    if (isLoading && !kpiData) {
        return (
            <div className={styles.kpiGridSkeleton}>
                {Array(8).fill(0).map((_, i) => (
                    <div key={i} className={styles.skeletonCard}>
                        <div className={styles.skeletonHeader}></div>
                        <div className={styles.skeletonValue}></div>
                        <div className={styles.skeletonFooter}></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!kpiData) return <p className={styles.noData}>Keine Kennzahlen verfügbar.</p>;

    return (
        <>
            {kpiGroupOrder.map(groupKey => {
                if (!kpiVisibility[groupKey]?.visible) return null;
                const groupDef = kpiDefinitions[groupKey];
                if (!groupDef) return null;

                const visibleKpis = groupDef.kpis.filter(kpiDef => kpiVisibility[groupKey]?.kpis[kpiDef.id] ?? true);
                if (visibleKpis.length === 0) return null;

                return (
                    <React.Fragment key={groupKey}>
                        <h4 className={styles.statsSectionSubtitle}>{groupDef.label}</h4>
                        <div className={styles.kpiGrid}>
                            {visibleKpis.map(kpiDef => {
                                const comparisonValue = (kpiDef.comparisonKey && kpiData[kpiDef.comparisonKey] != null)
                                    ? renderComparison(kpiData[kpiDef.comparisonKey], kpiData[kpiDef.previousPeriodKey], kpiDef.label !== 'Stornoquote')
                                    : null;

                                const goalValue = kpiGoals[kpiDef.goalKey];
                                const currentValue = kpiData.numeric[kpiDef.dtoKey];
                                let progressPercent = null;
                                let goalText = null;

                                if (goalValue != null && currentValue != null && goalValue > 0) {
                                    progressPercent = Math.min((currentValue / goalValue) * 100, 100);
                                    goalText = `${kpiData.formatted[kpiDef.dtoKey].replace('€','').trim()} / ${goalValue}`;
                                }

                                return (
                                    <KpiCard
                                        key={kpiDef.id}
                                        label={kpiDef.label}
                                        value={kpiData.formatted[kpiDef.dtoKey]}
                                        icon={kpiDef.icon}
                                        comparison={comparisonValue}
                                        tooltipText={kpiDef.tooltip}
                                        isMain={kpiDef.isMain}
                                        progressPercent={progressPercent}
                                        goalText={goalText}
                                    />
                                );
                            })}
                        </div>
                    </React.Fragment>
                );
            })}
        </>
    );
};

export default KpiGrid;