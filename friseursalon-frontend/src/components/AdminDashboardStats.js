// src/components/AdminDashboardStats.js
import React, { useState, useEffect } from 'react';
import api from '../services/api.service';
import './AdminDashboardStats.css'; // Erstellen wir gleich
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faCalendarDay, faTasks, faSpinner, faExclamationCircle, faClock } from '@fortawesome/free-solid-svg-icons';

function AdminDashboardStats() {
    const [stats, setStats] = useState(null);
    const [dailyAppointments, setDailyAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const statsResponse = await api.get('/statistics/appointment-counts');
                setStats(statsResponse.data);
            } catch (err) {
                console.error("Fehler beim Laden der Terminanzahlen:", err);
                setError(prev => prev + ' Terminanzahlen konnten nicht geladen werden. ');
            }
        };

        const fetchDailyAppointments = async () => {
            try {
                const dailyResponse = await api.get('/statistics/today-upcoming-appointments');
                setDailyAppointments(dailyResponse.data);
            } catch (err) {
                console.error("Fehler beim Laden der täglichen Termine:", err);
                setError(prev => prev + ' Tägliche Termine konnten nicht geladen werden. ');
            }
        };

        const loadData = async () => {
            setIsLoading(true);
            setError('');
            await Promise.all([fetchStats(), fetchDailyAppointments()]);
            setIsLoading(false);
        };

        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="loading-message-stats">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                <p>Lade Dashboard-Daten...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="stats-error-message">
                <FontAwesomeIcon icon={faExclamationCircle} size="2x" />
                <p>Fehler beim Laden der Dashboard-Daten:</p>
                <pre>{error}</pre>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-stats">
            <div className="stats-overview-cards">
                <div className="stat-card">
                    <FontAwesomeIcon icon={faCalendarDay} className="stat-icon today" />
                    <div className="stat-value">{stats?.todayCount ?? 'N/A'}</div>
                    <div className="stat-label">Termine Heute</div>
                </div>
                <div className="stat-card">
                    <FontAwesomeIcon icon={faTasks} className="stat-icon week" />
                    <div className="stat-value">{stats?.thisWeekCount ?? 'N/A'}</div>
                    <div className="stat-label">Termine diese Woche</div>
                </div>
                <div className="stat-card">
                    <FontAwesomeIcon icon={faChartBar} className="stat-icon month" />
                    <div className="stat-value">{stats?.thisMonthCount ?? 'N/A'}</div>
                    <div className="stat-label">Termine dieser Monat</div>
                </div>
                <div className="stat-card">
                    <FontAwesomeIcon icon={faClock} className="stat-icon upcoming" />
                    <div className="stat-value">{stats?.totalUpcomingCount ?? 'N/A'}</div>
                    <div className="stat-label">Alle Bevorstehenden</div>
                </div>
            </div>

            <div className="daily-appointments-section">
                <h3 className="daily-appointments-heading">Heutige & Nächste Termine</h3>
                {dailyAppointments.length > 0 ? (
                    <ul className="daily-appointments-list">
                        {dailyAppointments.map(apt => (
                            <li key={apt.appointmentId} className="daily-appointment-item">
                                <span className="appointment-time">{apt.startTime} Uhr</span>
                                <span className="appointment-service">{apt.serviceName}</span>
                                <span className="appointment-customer">{apt.customerFirstName} {apt.customerLastName}</span>
                                <span className={`appointment-status-tag status-${apt.status.toLowerCase()}`}>{apt.status}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>Keine anstehenden Termine für heute oder die nächsten Tage.</p>
                )}
            </div>
        </div>
    );
}

export default AdminDashboardStats;