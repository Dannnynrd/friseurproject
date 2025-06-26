// src/components/ActivitySidebar.js
import React from 'react';
import styles from './ActivitySidebar.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus, faCalendarCheck, faBoxOpen, faLightbulb, faExclamationTriangle,
    faInfoCircle, faChartLine
} from '@fortawesome/free-solid-svg-icons';

const insightConfig = {
    alert: { icon: faExclamationTriangle, className: styles.alert },
    warning: { icon: faExclamationTriangle, className: styles.warning },
    info: { icon: faInfoCircle, className: styles.info },
    success: { icon: faChartLine, className: styles.success },
};

const ActivitySidebar = ({ activityData, insightsData, isLoading, onOpenCreateModal, onViewAppointmentDetails }) => {
    const { dailyAppointments = [] } = activityData || {};

    return (
        <div className={styles.activitySidebar}>
            <button className={styles.newAppointmentButton} onClick={onOpenCreateModal}>
                <FontAwesomeIcon icon={faPlus} />
                <span>Neuer Termin</span>
            </button>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    <FontAwesomeIcon icon={faLightbulb} />
                    <span>Einblicke & Trends</span>
                </h3>
                <div className={styles.insightsList}>
                    {insightsData && insightsData.length > 0 ? (
                        insightsData.map(insight => {
                            const config = insightConfig[insight.type] || insightConfig.info;
                            return (
                                <div key={insight.id} className={`${styles.insightCard} ${config.className}`}>
                                    <FontAwesomeIcon icon={config.icon} className={styles.insightIcon} />
                                    <div className={styles.insightContent}>
                                        <h4 className={styles.insightTitle}>{insight.title}</h4>
                                        <p className={styles.insightDescription}>{insight.description}</p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className={styles.emptyState}>Keine aktuellen Einblicke.</div>
                    )}
                </div>
            </div>

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    <FontAwesomeIcon icon={faCalendarCheck} />
                    <span>Heutige & nächste Termine</span>
                </h3>
                {isLoading ? (
                    <div className={styles.loadingState}>Lade Termine...</div>
                ) : dailyAppointments.length > 0 ? (
                    <div className={styles.appointmentsList}>
                        {dailyAppointments.map(app => (
                            <div key={app.appointmentId} className={styles.appointmentItem} onClick={() => onViewAppointmentDetails(app.appointmentId)}>
                                <div className={styles.timelineDot}></div>
                                <div className={styles.appointmentDetails}>
                                    <div className={styles.appointmentHeader}>
                                        <span className={styles.appointmentTime}>{app.startTime}</span>
                                        <span className={`${styles.appointmentStatus} ${app.status === 'Heute' ? styles.today : ''}`}>{app.status}</span>
                                    </div>
                                    <p className={styles.appointmentService}>{app.serviceName}</p>
                                    <p className={styles.appointmentCustomer}>{app.customerFirstName} {app.customerLastName}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <FontAwesomeIcon icon={faBoxOpen} />
                        <p>Keine bevorstehenden Termine.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivitySidebar;