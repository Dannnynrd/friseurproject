import React, { useState, useEffect } from 'react';
import api from '../../services/api.service'; // Assuming api.service.js is in ../../services/
import './ReportView.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faChartBar, faSpinner, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    subWeeks,
    subMonths
} from 'date-fns';
import { de } from 'date-fns/locale'; // For German day/month names if needed in formatting

// Helper to format date to YYYY-MM-DD
const formatDateForApi = (date) => format(date, 'yyyy-MM-dd');

function ReportView() {
    const [startDate, setStartDate] = useState(formatDateForApi(startOfMonth(new Date())));
    const [endDate, setEndDate] = useState(formatDateForApi(endOfMonth(new Date())));
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleDateChange = (setter) => (e) => {
        setter(e.target.value);
        setReportData(null); // Clear previous report when dates change
    };

    const setPredefinedRange = (rangeType) => {
        const today = new Date();
        let start, end;

        switch (rangeType) {
            case 'thisWeek':
                start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
                end = endOfWeek(today, { weekStartsOn: 1 });
                break;
            case 'lastWeek':
                const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
                start = lastWeekStart;
                end = endOfWeek(lastWeekStart, { weekStartsOn: 1 });
                break;
            case 'thisMonth':
                start = startOfMonth(today);
                end = endOfMonth(today);
                break;
            case 'lastMonth':
                const lastMonthStart = startOfMonth(subMonths(today, 1));
                start = lastMonthStart;
                end = endOfMonth(lastMonthStart);
                break;
            default:
                return;
        }
        setStartDate(formatDateForApi(start));
        setEndDate(formatDateForApi(end));
        setReportData(null);
    };

    const fetchReport = async () => {
        if (!startDate || !endDate) {
            setError("Bitte Start- und Enddatum auswählen.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setReportData(null);
        try {
            // Ensure dates are in YYYY-MM-DD format
            const formattedStartDate = format(new Date(startDate + 'T00:00:00'), 'yyyy-MM-dd'); // Add time to avoid timezone issues with new Date()
            const formattedEndDate = format(new Date(endDate + 'T00:00:00'), 'yyyy-MM-dd');

            if (new Date(formattedEndDate) < new Date(formattedStartDate)) {
                setError("Das Enddatum darf nicht vor dem Startdatum liegen.");
                setIsLoading(false);
                return;
            }

            const response = await api.get('/reports', {
                params: { startDate: formattedStartDate, endDate: formattedEndDate }
            });
            setReportData(response.data);
        } catch (err) {
            console.error("Fehler beim Abrufen des Berichts:", err);
            setError(err.response?.data?.message || "Fehler beim Abrufen des Berichts.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Effect to fetch report when dates change automatically, or remove if manual "Generate" button is preferred.
    // For V1, let's use a manual button.
    // useEffect(() => {
    //     if (startDate && endDate) {
    //         // fetchReport(); // Decide if auto-fetch or manual button
    //     }
    // }, [startDate, endDate]);

    return (
        <div className="report-view-container">
            <div className="report-controls">
                <h3><FontAwesomeIcon icon={faCalendarAlt} /> Berichtszeitraum auswählen</h3>
                
                {error && (!reportData || isLoading) && <p className="form-message error mb-3">{error}</p>}

                <div className="date-range-selectors">
                    <div className="date-input-group">
                        <label htmlFor="reportStartDate">Startdatum:</label>
                        <input
                            type="date"
                            id="reportStartDate"
                            value={startDate}
                            onChange={handleDateChange(setStartDate)}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="date-input-group">
                        <label htmlFor="reportEndDate">Enddatum:</label>
                        <input
                            type="date"
                            id="reportEndDate"
                            value={endDate}
                            onChange={handleDateChange(setEndDate)}
                            disabled={isLoading}
                        />
                    </div>
                </div>
                <div className="predefined-ranges">
                    <p>Schnellauswahl:</p>
                    <button onClick={() => setPredefinedRange('thisWeek')} className="button-link-outline small-button" disabled={isLoading}>Diese Woche</button>
                    <button onClick={() => setPredefinedRange('lastWeek')} className="button-link-outline small-button" disabled={isLoading}>Letzte Woche</button>
                    <button onClick={() => setPredefinedRange('thisMonth')} className="button-link-outline small-button" disabled={isLoading}>Dieser Monat</button>
                    <button onClick={() => setPredefinedRange('lastMonth')} className="button-link-outline small-button" disabled={isLoading}>Letzter Monat</button>
                </div>
                <button onClick={fetchReport} className="button-link generate-report-button" disabled={isLoading || !startDate || !endDate}>
                    {isLoading ? <><FontAwesomeIcon icon={faSpinner} spin /> Bericht wird generiert...</> : <><FontAwesomeIcon icon={faChartBar} /> Bericht generieren</>}
                </button>
            </div>

            {isLoading && !reportData && (
                <div className="report-message">
                    <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                    <p>Bericht wird geladen...</p>
                </div>
            )}

            {error && !isLoading && !reportData && ( // Show error only if no data is shown and not loading
                 <p className="form-message error text-center">{error}</p>
            )}


            {reportData && !isLoading && (
                <div className="report-display">
                    <h3>Bericht für Zeitraum: {format(new Date(reportData.reportStartDate+'T00:00:00'), 'dd.MM.yyyy', { locale: de })} - {format(new Date(reportData.reportEndDate+'T00:00:00'), 'dd.MM.yyyy', { locale: de })}</h3>
                    
                    <div className="report-summary-cards">
                        <div className="summary-card">
                            <h4>Gesamte Termine</h4>
                            <p className="value">{reportData.totalAppointments}</p>
                        </div>
                        <div className="summary-card">
                            <h4>Gesamteinnahmen</h4>
                            <p className="value">{reportData.totalRevenue?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) || '0,00 €'}</p>
                        </div>
                    </div>

                    <h3>Dienstleistungs-Aufschlüsselung</h3>
                    {reportData.serviceBreakdown && reportData.serviceBreakdown.length > 0 ? (
                        <div className="report-table-container table-responsive-container">
                            <table className="app-table report-table">
                                <thead>
                                    <tr>
                                        <th>Dienstleistung</th>
                                        <th>Anzahl Termine</th>
                                        <th>Einnahmen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.serviceBreakdown.map(item => (
                                        <tr key={item.serviceId}>
                                            <td>{item.serviceName}</td>
                                            <td>{item.appointmentCount}</td>
                                            <td>{item.revenue?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) || '0,00 €'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="report-message">Keine Daten für die Dienstleistungs-Aufschlüsselung im ausgewählten Zeitraum.</p>
                    )}
                </div>
            )}
            {!isLoading && !reportData && !error && (
                 <p className="report-message">Bitte wählen Sie einen Zeitraum und klicken Sie auf "Bericht generieren".</p>
            )}
        </div>
    );
}

export default ReportView;
