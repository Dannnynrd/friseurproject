// File: src/components/WorkingHoursManager.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faSpinner, faExclamationCircle, faCheckCircle, faClock, faCopy, faCalendarWeek } from '@fortawesome/free-solid-svg-icons';
import './WorkingHoursManager.css';

const daysOfWeekMap = [
    { key: "MONDAY", label: "Montag" },
    { key: "TUESDAY", label: "Dienstag" },
    { key: "WEDNESDAY", label: "Mittwoch" },
    { key: "THURSDAY", label: "Donnerstag" },
    { key: "FRIDAY", label: "Freitag" },
    { key: "SATURDAY", label: "Samstag" },
    { key: "SUNDAY", label: "Sonntag" }
];

const defaultDayState = () => ({
    startTime: "09:00",
    endTime: "18:00",
    isClosed: false
});

function WorkingHoursManager() {
    const [workingHours, setWorkingHours] = useState(() => {
        const initialHours = {};
        daysOfWeekMap.forEach(day => {
            initialHours[day.key] = { ...defaultDayState(), dayOfWeek: day.key };
        });
        return initialHours;
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const fetchWorkingHours = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await api.get('/workinghours');
            const fetchedHours = {};
            daysOfWeekMap.forEach(dayMapEntry => {
                const foundDay = response.data.find(d => d.dayOfWeek === dayMapEntry.key);
                if (foundDay) {
                    fetchedHours[dayMapEntry.key] = {
                        ...foundDay,
                        startTime: foundDay.startTime || "09:00", // Fallback
                        endTime: foundDay.endTime || "18:00",   // Fallback
                    };
                } else {
                    fetchedHours[dayMapEntry.key] = { ...defaultDayState(), dayOfWeek: dayMapEntry.key };
                }
            });
            setWorkingHours(fetchedHours);
        } catch (err) {
            console.error("Fehler beim Laden der Arbeitszeiten:", err);
            setError(err.response?.data?.message || "Arbeitszeiten konnten nicht geladen werden.");
            const defaultHours = {};
            daysOfWeekMap.forEach(day => {
                defaultHours[day.key] = { ...defaultDayState(), dayOfWeek: day.key };
            });
            setWorkingHours(defaultHours);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWorkingHours();
    }, [fetchWorkingHours]);

    const handleTimeChange = (dayKey, field, value) => {
        setWorkingHours(prev => ({
            ...prev,
            [dayKey]: { ...prev[dayKey], [field]: value }
        }));
        setError('');
        setSuccessMessage('');
    };

    const handleToggleClosed = (dayKey) => {
        setWorkingHours(prev => ({
            ...prev,
            [dayKey]: { ...prev[dayKey], isClosed: !prev[dayKey].isClosed }
        }));
        setError('');
        setSuccessMessage('');
    };

    const applyMondayTimes = (applyToAllOpen = false) => {
        const mondayTimes = workingHours["MONDAY"];
        if (!mondayTimes) return;

        setWorkingHours(prev => {
            const newHours = { ...prev };
            const targetDays = applyToAllOpen
                ? daysOfWeekMap.map(d => d.key) // Alle Tage
                : ["TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]; // Nur Wochentage (Di-Fr)

            targetDays.forEach(dayKey => {
                if (dayKey === "MONDAY") return; // Montag nicht sich selbst überschreiben

                // Nur anwenden, wenn der Tag nicht explizit geschlossen ist (außer bei "applyToAllOpen")
                // oder wenn "applyToAllOpen" aktiv ist, dann auch den isClosed Status übernehmen
                if (applyToAllOpen) {
                    newHours[dayKey] = {
                        ...newHours[dayKey],
                        startTime: mondayTimes.startTime,
                        endTime: mondayTimes.endTime,
                        isClosed: mondayTimes.isClosed // Wichtig: Auch den Schließstatus von Montag übernehmen
                    };
                } else if (!newHours[dayKey]?.isClosed) { // Nur für geöffnete Tage, wenn nicht "applyToAllOpen"
                    newHours[dayKey] = {
                        ...newHours[dayKey],
                        startTime: mondayTimes.startTime,
                        endTime: mondayTimes.endTime,
                        // isClosed bleibt unberührt, da wir nur Zeiten für geöffnete Tage anpassen
                    };
                }
            });
            return newHours;
        });
        setSuccessMessage("Zeiten von Montag wurden übernommen.");
        setTimeout(() => setSuccessMessage(''), 3000);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        const payload = Object.values(workingHours).map(day => ({
            dayOfWeek: day.dayOfWeek,
            startTime: day.isClosed ? null : day.startTime,
            endTime: day.isClosed ? null : day.endTime,
            isClosed: day.isClosed
        }));

        try {
            await api.put('/workinghours', payload);
            setSuccessMessage('Arbeitszeiten erfolgreich gespeichert!');
        } catch (err) {
            console.error("Fehler beim Speichern der Arbeitszeiten:", err);
            setError(err.response?.data?.message || "Fehler beim Speichern der Arbeitszeiten.");
        } finally {
            setIsLoading(false);
            setTimeout(() => {
                setSuccessMessage('');
                setError('');
            }, 4000);
        }
    };

    if (isLoading && Object.keys(workingHours).every(key => workingHours[key].startTime === "09:00")) {
        return (
            <div className="wh-loading-container">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                <p>Arbeitszeiten werden geladen...</p>
            </div>
        );
    }

    return (
        <div className="working-hours-manager-container">
            <form onSubmit={handleSubmit}>
                {error && <p className="wh-message wh-error"><FontAwesomeIcon icon={faExclamationCircle} /> {error}</p>}
                {successMessage && <p className="wh-message wh-success"><FontAwesomeIcon icon={faCheckCircle} /> {successMessage}</p>}

                <div className="working-hours-grid">
                    {daysOfWeekMap.map(({ key, label }) => {
                        const daySetting = workingHours[key] || defaultDayState();
                        return (
                            <div key={key} className={`day-settings-card ${daySetting.isClosed ? 'is-closed' : ''}`}>
                                <div className="day-header">
                                    <h3 className="day-label">{label}</h3>
                                    <div className="day-toggle-switch">
                                        <input
                                            type="checkbox"
                                            id={`closed-${key}`}
                                            checked={daySetting.isClosed}
                                            onChange={() => handleToggleClosed(key)}
                                        />
                                        <label htmlFor={`closed-${key}`} className="slider"></label>
                                        <span className="toggle-label-text">{daySetting.isClosed ? 'Geschlossen' : 'Geöffnet'}</span>
                                    </div>
                                </div>
                                {!daySetting.isClosed && (
                                    <div className="time-inputs">
                                        <div className="form-group-wh">
                                            <label htmlFor={`startTime-${key}`}> <FontAwesomeIcon icon={faClock} /> Öffnet um</label>
                                            <input
                                                type="time"
                                                id={`startTime-${key}`}
                                                value={daySetting.startTime}
                                                onChange={(e) => handleTimeChange(key, 'startTime', e.target.value)}
                                                className="time-input-wh"
                                                required={!daySetting.isClosed}
                                                step="900" // 15-Minuten-Schritte
                                            />
                                        </div>
                                        <div className="form-group-wh">
                                            <label htmlFor={`endTime-${key}`}> <FontAwesomeIcon icon={faClock} /> Schließt um</label>
                                            <input
                                                type="time"
                                                id={`endTime-${key}`}
                                                value={daySetting.endTime}
                                                onChange={(e) => handleTimeChange(key, 'endTime', e.target.value)}
                                                className="time-input-wh"
                                                required={!daySetting.isClosed}
                                                step="900" // 15-Minuten-Schritte
                                            />
                                        </div>
                                    </div>
                                )}
                                {daySetting.isClosed && (
                                    <p className="closed-day-text">Ganztägig geschlossen</p>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="wh-actions">
                    <div className="wh-apply-buttons-group">
                        <button
                            type="button"
                            onClick={() => applyMondayTimes(false)}
                            className="button-link-outline small-button"
                            title="Zeiten von Montag auf Dienstag bis Freitag (nur geöffnete Tage) anwenden"
                            disabled={isLoading || workingHours["MONDAY"]?.isClosed}
                        >
                            <FontAwesomeIcon icon={faCalendarWeek} /> Mo. auf Wochentage
                        </button>
                        <button
                            type="button"
                            onClick={() => applyMondayTimes(true)}
                            className="button-link-outline small-button"
                            title="Zeiten und Schließstatus von Montag auf alle anderen Tage anwenden"
                            disabled={isLoading}
                        >
                            <FontAwesomeIcon icon={faCopy} /> Mo. auf Alle
                        </button>
                    </div>
                    <button type="submit" className="button-link primary" disabled={isLoading}>
                        {isLoading ? <><FontAwesomeIcon icon={faSpinner} spin /> Speichern...</> : <><FontAwesomeIcon icon={faSave} /> Arbeitszeiten Speichern</>}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default WorkingHoursManager;
