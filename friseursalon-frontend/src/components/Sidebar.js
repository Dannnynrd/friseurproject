import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faBolt, faBullseye, faBell, faListAlt, faSpinner, faDownload } from '@fortawesome/free-solid-svg-icons';
import { parseISO, format as formatDateFns } from 'date-fns';
import styles from './Sidebar.module.css';

// Eine Hilfsfunktion für den CSV-Export
const exportToCsv = (filename, rows) => {
    if (!rows || rows.length === 0) {
        return;
    }
    const headers = Object.keys(rows[0]);
    const csvContent = [
        headers.join(','),
        ...rows.map(row => headers.map(header => {
            let cell = row[header];
            if (typeof cell === 'string' && cell.includes(',')) {
                return `"${cell}"`;
            }
            return cell;
        }).join(','))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const Sidebar = ({
                     onOpenCreateModal,
                     activityData,
                     keyChanges,
                     dashboardAlerts,
                     dailyAppointments,
                     isLoading,
                     onViewAppointmentDetails,
                 }) => {
    return (
        <aside className={styles.sidebarColumn}>
            {/* Schnellzugriff */}
            <div className={styles.sidebarSection}>
                <h3 className={styles.sidebarTitle}><FontAwesomeIcon icon={faBolt} /> Schnellzugriff</h3>
                <button onClick={onOpenCreateModal} className={styles.quickCreateButton}>
                    <FontAwesomeIcon icon={faPlusCircle} /> Termin anlegen
                </button>
                <div className={styles.activityWidget}>
                    <h4>Buchungsaktivität</h4>
                    {isLoading ? <p>Lade...</p> : <>
                        <p>Heute: <span>{activityData?.newBookingsToday ?? 'N/A'}</span></p>
                        <p>Gestern: <span>{activityData?.newBookingsYesterday ?? 'N/A'}</span></p>
                    </>}
                </div>
            </div>

            {/* Highlights */}
            <div className={styles.sidebarSection}>
                <h3 className={styles.sidebarTitle}><FontAwesomeIcon icon={faBullseye} /> Wichtige Veränderungen</h3>
                {isLoading ? <p>Lade...</p> : (
                    <ul className={styles.highlightsList}>
                        {keyChanges.length > 0 ? keyChanges.map(change => (
                            <li key={change.label} className={styles[change.isGood ? 'positive' : 'negative']}>
                                {change.label}: <strong>{change.value > 0 ? '+' : ''}{change.value.toFixed(1)}%</strong>
                            </li>
                        )) : <li>Keine signifikanten Änderungen.</li>}
                    </ul>
                )}
                <h3 className={`${styles.sidebarTitle} ${styles.marginTop}`}><FontAwesomeIcon icon={faBell} /> Hinweise</h3>
                {isLoading ? <p>Lade...</p> : (
                    <ul className={styles.highlightsList}>
                        {dashboardAlerts.length > 0 ? dashboardAlerts.map((alert, i) => (
                            <li key={i} className={styles.alert}>{alert.message}</li>
                        )) : <li>Keine aktuellen Hinweise.</li>}
                    </ul>
                )}
            </div>

            {/* Zukünftige Termine */}
            <div className={styles.sidebarSection}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sidebarTitle}><FontAwesomeIcon icon={faListAlt} /> Heutige & Nächste Termine</h3>
                    <button
                        onClick={() => exportToCsv('tagesliste.csv', dailyAppointments.map(apt => ({
                            Datum: apt.appointmentDate,
                            Zeit: apt.startTime,
                            Service: apt.serviceName,
                            Kunde: `${apt.customerFirstName} ${apt.customerLastName}`,
                            Status: apt.status
                        })))}
                        className={styles.exportButton}
                        title="Tagesliste exportieren"
                    >
                        <FontAwesomeIcon icon={faDownload} />
                    </button>
                </div>
                {isLoading ? <div className={styles.loadingSmall}><FontAwesomeIcon icon={faSpinner} spin /> Lade Termine...</div> : (
                    <ul className={styles.appointmentList}>
                        {dailyAppointments.length > 0 ? dailyAppointments.map(apt => (
                            <li key={apt.appointmentId} onClick={() => onViewAppointmentDetails(apt)}>
                                <span className={styles.appointmentTime}>
                                    {formatDateFns(parseISO(`${apt.appointmentDate}T${apt.startTime}`), 'HH:mm')}
                                </span>
                                <div className={styles.appointmentDetails}>
                                    <span>{apt.serviceName}</span>
                                    <span>{apt.customerFirstName} {apt.customerLastName}</span>
                                </div>
                                <span className={styles.appointmentStatus}>{apt.status}</span>
                            </li>
                        )) : <p className={styles.noDataSmall}>Keine anstehenden Termine.</p>}
                    </ul>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;