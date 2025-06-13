import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartPie, faDownload } from '@fortawesome/free-solid-svg-icons';
import styles from './ChartsSection.module.css';

// Importiere deine tatsächlichen Chart-Komponenten
import RevenueOverTimeRechart from './charts/RevenueOverTimeRechart';
import AppointmentsByDayRechart from './charts/AppointmentsByDayRechart';
import AppointmentsByServiceRechart from './charts/AppointmentsByServiceRechart';
import AppointmentsByHourRechart from './charts/AppointmentsByHourRechart';

// Eine Hilfsfunktion für den CSV-Export (kann in eine utils.js verschoben werden)
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


const ChartsSection = ({ chartData, topNServicesConfig, activePeriodLabel, dateRange }) => {
    // Jeder Chart erhält seinen eigenen Container für Styling und Aktionen wie den Export
    return (
        <div className={styles.statsSectionBox}>
            <h3 className={styles.statsSectionTitle}>
                <span><FontAwesomeIcon icon={faChartPie} /> Visuelle Analysen</span>
                <span className={styles.statsPeriodDisplay}>({activePeriodLabel})</span>
            </h3>
            <div className={styles.chartsGrid}>
                <div className={styles.chartCard}>
                    <RevenueOverTimeRechart chartData={chartData.revenueOverTime} />
                    <button
                        onClick={() => exportToCsv(`umsatz_${dateRange.startDate}_bis_${dateRange.endDate}.csv`, chartData.revenueOverTime)}
                        className={styles.exportButton}
                        title="Umsatzdaten exportieren"
                    >
                        <FontAwesomeIcon icon={faDownload} />
                    </button>
                </div>
                <div className={styles.chartCard}>
                    <AppointmentsByDayRechart chartData={chartData.appointmentsByDay} />
                    <button
                        onClick={() => exportToCsv(`termine_pro_wochentag_${dateRange.startDate}_bis_${dateRange.endDate}.csv`, chartData.appointmentsByDay.labels.map((l, i) => ({ Wochentag: l, Termine: chartData.appointmentsByDay.data[i] })))}
                        className={styles.exportButton}
                        title="Daten exportieren"
                    >
                        <FontAwesomeIcon icon={faDownload} />
                    </button>
                </div>
                <div className={styles.chartCard}>
                    <AppointmentsByServiceRechart chartData={chartData.appointmentsByService} title={`Top ${topNServicesConfig} Dienstleistungen`} />
                    <button
                        onClick={() => exportToCsv(`top_services_${dateRange.startDate}_bis_${dateRange.endDate}.csv`, chartData.appointmentsByService.labels.map((l, i) => ({ Service: l, Anzahl: chartData.appointmentsByService.data[i] })))}
                        className={styles.exportButton}
                        title="Daten exportieren"
                    >
                        <FontAwesomeIcon icon={faDownload} />
                    </button>
                </div>
                <div className={styles.chartCard}>
                    <AppointmentsByHourRechart chartData={chartData.appointmentsByHour} />
                    <button
                        onClick={() => exportToCsv(`termine_pro_stunde_${dateRange.startDate}_bis_${dateRange.endDate}.csv`, chartData.appointmentsByHour)}
                        className={styles.exportButton}
                        title="Daten exportieren"
                    >
                        <FontAwesomeIcon icon={faDownload} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChartsSection;