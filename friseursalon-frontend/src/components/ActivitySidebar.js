// src/components/ActivitySidebar.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faRss, faCalendarDay, faExclamationTriangle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import { de as deLocale } from 'date-fns/locale';
import styles from './ActivitySidebar.module.css';

const ActivitySidebar = ({ onOpenCreateModal, activityData, isLoading, onViewAppointmentDetails }) => {
    return (
        <aside className={styles.sidebarStatsColumn}>
            <div className={styles.statsSectionBox}>
                <button
                    onClick={onOpenCreateModal}
                    className={styles.newAppointmentButton}
                >
                    <FontAwesomeIcon icon={faPlus} /> Neuer Termin
                </button>
            </div>

            <div className={styles.statsSectionBox}>
                <h3 className={styles.statsSectionTitle}>
                    <span><FontAwesomeIcon icon={faRss} /> Aktivitäten</span>
                </h3>
                {isLoading ? (
                    <div className={styles.loadingSmall}><FontAwesomeIcon icon={faSpinner} spin /> Lade Aktivitäten...</div>
                ) : activityData ? (
                    <div className={styles.activityFeed}>
                        <div className={styles.activityItem}>
                            <span>Neue Buchungen (Heute)</span>
                            <span className={styles.activityValue}>{activityData.newBookingsToday ?? 'N/A'}</span>
                        </div>
                        <div className={styles.activityItem}>
                            <span>Neue Buchungen (Gestern)</span>
                            <span className={styles.activityValue}>{activityData.newBookingsYesterday ?? 'N/A'}</span>
                        </div>
                    </div>
                ) : (
                    <p className={styles.noData}>Keine Aktivitätsdaten.</p>
                )}
            </div>

            <div className={styles.statsSectionBox}>
                <h3 className={styles.statsSectionTitle}>
                    <span><FontAwesomeIcon icon={faCalendarDay} /> Heutige & nächste Termine</span>
                </h3>
                {isLoading ? (
                    <div className={styles.loadingSmall}><FontAwesomeIcon icon={faSpinner} spin /> Lade Termine...</div>
                ) : (activityData.dailyAppointments && activityData.dailyAppointments.length > 0) ? (
                    <ul className={styles.appointmentList}>
                        {activityData.dailyAppointments.map(apt => (
                            <li key={apt.appointmentId} className={styles.appointmentItem} onClick={() => onViewAppointmentDetails(apt.resource)}>
                                <div className={styles.appointmentTime}>{format(new Date(apt.appointmentDate + 'T' + apt.startTime), 'HH:mm', { locale: deLocale })}</div>
                                <div className={styles.appointmentDetails}>
                                    <span className={styles.appointmentCustomer}>{`${apt.customerFirstName} ${apt.customerLastName}`}</span>
                                    <span className={styles.appointmentService}>{apt.serviceName}</span>
                                </div>
                                <span className={styles.appointmentStatusBadge}>{apt.status}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className={styles.noData}>Keine bevorstehenden Termine.</p>
                )}
            </div>
        </aside>
    );
};

export default ActivitySidebar;