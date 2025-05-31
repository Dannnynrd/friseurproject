// friseursalon-frontend/src/components/WorkingHoursManager.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api.service';
import styles from './WorkingHoursManager.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faSave, faSpinner, faExclamationTriangle, faCheckCircle, faBusinessTime, faRedo } from '@fortawesome/free-solid-svg-icons';

const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DAY_LABELS = {
    MONDAY: "Montag", TUESDAY: "Dienstag", WEDNESDAY: "Mittwoch", THURSDAY: "Donnerstag",
    FRIDAY: "Freitag", SATURDAY: "Samstag", SUNDAY: "Sonntag"
};

const DEFAULT_OPEN_START_TIME = "09:00";
const DEFAULT_OPEN_END_TIME = "17:00";

function WorkingHoursManager({ refreshTrigger }) {
    const [workingHours, setWorkingHours] = useState([]);
    const [initialWorkingHours, setInitialWorkingHours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const fetchWorkingHours = useCallback(async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const response = await api.get('workinghours');
            const fetchedHours = response.data || [];

            console.log("[FETCH] Fetched working hours from backend:", JSON.stringify(fetchedHours, null, 2));

            const completeHours = DAYS_OF_WEEK.map(day => {
                const existing = fetchedHours.find(h => h.dayOfWeek === day);
                if (existing) {
                    // Backend sendet 'closed' (boolean) und 'startTime'/'endTime' (String "HH:mm" oder null)
                    // Wir standardisieren auf 'isClosed' im Frontend.
                    const isDayActuallyClosed = existing.closed !== undefined ? !!existing.closed : !!existing.isClosed;

                    return {
                        id: existing.id,
                        dayOfWeek: existing.dayOfWeek,
                        startTime: isDayActuallyClosed ? "00:00" : (existing.startTime || DEFAULT_OPEN_START_TIME),
                        endTime: isDayActuallyClosed ? "00:00" : (existing.endTime || DEFAULT_OPEN_END_TIME),
                        isClosed: isDayActuallyClosed, // Verwende den korrekten Wert vom Backend
                    };
                }
                console.warn(`[FETCH] No data for ${day} from backend, using client-side default.`);
                return {
                    dayOfWeek: day,
                    id: null,
                    startTime: day === "SUNDAY" ? "00:00" : DEFAULT_OPEN_START_TIME,
                    endTime: day === "SUNDAY" ? "00:00" : DEFAULT_OPEN_END_TIME,
                    isClosed: day === "SUNDAY"
                };
            });
            console.log("[FETCH] Processed completeHours for frontend state:", JSON.stringify(completeHours, null, 2));
            setWorkingHours(completeHours);
            setInitialWorkingHours(JSON.parse(JSON.stringify(completeHours)));
        } catch (err) {
            console.error("Error fetching working hours:", err);
            setError(err.response?.data?.message || "Öffnungszeiten konnten nicht geladen werden.");
            const defaultHours = DAYS_OF_WEEK.map(day => ({
                dayOfWeek: day,
                id: null,
                startTime: day === "SUNDAY" ? "00:00" : DEFAULT_OPEN_START_TIME,
                endTime: day === "SUNDAY" ? "00:00" : DEFAULT_OPEN_END_TIME,
                isClosed: day === "SUNDAY"
            }));
            setWorkingHours(defaultHours);
            setInitialWorkingHours(JSON.parse(JSON.stringify(defaultHours)));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWorkingHours();
    }, [fetchWorkingHours, refreshTrigger]);

    const handleInputChange = (day, field, value) => {
        console.log(`[INPUT CHANGE] Day: ${day}, Field: ${field}, Value: ${value}`);
        setWorkingHours(prevHours =>
            prevHours.map(hour =>
                hour.dayOfWeek === day ? { ...hour, [field]: value } : hour
            )
        );
        setSuccessMessage('');
        setError('');
    };

    const handleToggleClosed = (dayToToggle) => {
        console.log(`[TOGGLE CLOSED] Attempting to toggle 'isClosed' for day: ${dayToToggle}`);
        setWorkingHours(prevHours => {
            const newHours = prevHours.map(hour => {
                if (hour.dayOfWeek === dayToToggle) {
                    const isNowClosed = !hour.isClosed; // Der neue Zustand von isClosed
                    console.log(`[TOGGLE CLOSED] Day: ${hour.dayOfWeek}, Previous isClosed: ${hour.isClosed}, New isClosed: ${isNowClosed}`);
                    return {
                        ...hour, // Behalte andere Properties wie id, dayOfWeek
                        isClosed: isNowClosed, // Setze den neuen isClosed Status
                        // Setze Zeiten basierend auf dem neuen isClosed Status
                        startTime: isNowClosed ? "00:00" : (hour.startTime && hour.startTime !== "00:00" ? hour.startTime : DEFAULT_OPEN_START_TIME),
                        endTime: isNowClosed ? "00:00" : (hour.endTime && hour.endTime !== "00:00" ? hour.endTime : DEFAULT_OPEN_END_TIME),
                    };
                }
                return hour;
            });
            console.log("[TOGGLE CLOSED] New workingHours state after toggle:", JSON.stringify(newHours, null, 2));
            return newHours;
        });
        setSuccessMessage('');
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        setSuccessMessage('');

        console.log("[SUBMIT] Current workingHours state before creating payload:", JSON.stringify(workingHours, null, 2));

        const payload = workingHours.map(wh => {
            // Erstelle ein sauberes Objekt für den Payload
            const itemToSend = {
                id: wh.id,
                dayOfWeek: wh.dayOfWeek,
                isClosed: wh.isClosed, // Sende IMMER den aktuellen isClosed Status
                startTime: wh.isClosed ? null : wh.startTime,
                endTime: wh.isClosed ? null : wh.endTime,
            };
            // Die 'closed' Property (falls sie vom Backend kam und noch im wh-Objekt ist)
            // wird hier nicht explizit mitgesendet, da wir uns auf 'isClosed' verlassen.
            return itemToSend;
        });

        console.log("[SUBMIT] Payload to be sent to backend:", JSON.stringify(payload, null, 2));

        for (const wh of payload) {
            if (!wh.isClosed && wh.endTime && wh.startTime && wh.endTime <= wh.startTime) {
                setError(`Für ${DAY_LABELS[wh.dayOfWeek]}: Endzeit muss nach der Startzeit liegen.`);
                setIsSaving(false);
                return;
            }
        }

        try {
            await api.put('workinghours', payload);
            setSuccessMessage('Öffnungszeiten erfolgreich gespeichert.');
            fetchWorkingHours();
        } catch (err) {
            console.error("Error saving working hours:", err);
            setError(err.response?.data?.message || 'Fehler beim Speichern der Öffnungszeiten.');
        } finally {
            setIsSaving(false);
        }
    };

    const generateTimeOptions = () => {
        const options = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 15) {
                options.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
            }
        }
        return options;
    };
    const timeOptions = generateTimeOptions();

    const isDirty = useMemo(() => {
        if (!initialWorkingHours || workingHours.length !== initialWorkingHours.length) {
            if (workingHours.length > 0) return true;
            return false;
        }
        for (let i = 0; i < workingHours.length; i++) {
            const current = workingHours[i];
            const initial = initialWorkingHours[i];
            if (current.isClosed !== initial.isClosed) return true;
            if (!current.isClosed && (current.startTime !== initial.startTime || current.endTime !== initial.endTime)) {
                return true;
            }
        }
        return false;
    }, [workingHours, initialWorkingHours]);


    if (loading) {
        return (
            <div className="flex justify-center items-center p-6 text-gray-500">
                <FontAwesomeIcon icon={faSpinner} spin size="lg" className="mr-2 text-indigo-500" />
                Lade Öffnungszeiten...
            </div>
        );
    }

    return (
        <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-lg ${styles.managerContainer}`}>
            <h3 className="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b border-gray-200 flex items-center">
                <FontAwesomeIcon icon={faBusinessTime} className="mr-2 text-indigo-500" />
                Öffnungszeiten verwalten
                <button onClick={fetchWorkingHours} className={`ml-auto p-1.5 text-xs text-indigo-600 hover:text-indigo-800 rounded-md hover:bg-indigo-50 ${styles.refreshButton}`} title="Daten neu laden">
                    <FontAwesomeIcon icon={faRedo} />
                </button>
            </h3>

            {error && (
                <div className={`p-3 mb-4 text-sm rounded-md flex items-center bg-red-50 text-red-700 border border-red-200 ${styles.message}`}>
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 flex-shrink-0" /> {error}
                </div>
            )}
            {successMessage && (
                <div className={`p-3 mb-4 text-sm rounded-md flex items-center bg-green-50 text-green-600 border border-green-200 ${styles.message}`}>
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2 flex-shrink-0" /> {successMessage}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {workingHours.map(wh => (
                    <div key={wh.dayOfWeek} className={`p-4 border border-gray-200 rounded-lg ${styles.dayRow} ${wh.isClosed ? styles.dayClosed : ''}`}>
                        <div className="flex flex-col sm:flex-row items-center justify-between">
                            <label className={`block text-md font-medium text-gray-700 sm:w-1/4 ${styles.dayLabel}`}>{DAY_LABELS[wh.dayOfWeek]}</label>
                            <div className="flex items-center mt-2 sm:mt-0">
                                <input
                                    type="checkbox"
                                    id={`closed-${wh.dayOfWeek}`}
                                    checked={wh.isClosed}
                                    onChange={() => handleToggleClosed(wh.dayOfWeek)}
                                    className={`h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-2 ${styles.checkbox}`}
                                />
                                <label htmlFor={`closed-${wh.dayOfWeek}`} className="text-sm text-gray-600 cursor-pointer">Geschlossen</label>
                            </div>
                        </div>
                        {!wh.isClosed && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
                                <div>
                                    <label htmlFor={`startTime-${wh.dayOfWeek}`} className="block text-xs font-medium text-gray-500 mb-1">Öffnet um</label>
                                    <select
                                        id={`startTime-${wh.dayOfWeek}`}
                                        value={wh.startTime || DEFAULT_OPEN_START_TIME}
                                        onChange={(e) => handleInputChange(wh.dayOfWeek, 'startTime', e.target.value)}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.timeSelect}`}
                                        disabled={wh.isClosed}
                                    >
                                        {timeOptions.map(time => <option key={`start-${wh.dayOfWeek}-${time}`} value={time}>{time}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor={`endTime-${wh.dayOfWeek}`} className="block text-xs font-medium text-gray-500 mb-1">Schließt um</label>
                                    <select
                                        id={`endTime-${wh.dayOfWeek}`}
                                        value={wh.endTime || DEFAULT_OPEN_END_TIME}
                                        onChange={(e) => handleInputChange(wh.dayOfWeek, 'endTime', e.target.value)}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.timeSelect}`}
                                        disabled={wh.isClosed}
                                    >
                                        {timeOptions.map(time => <option key={`end-${wh.dayOfWeek}-${time}`} value={time}>{time}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving || !isDirty}
                        className={`inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 ${styles.saveButton}`}
                    >
                        <FontAwesomeIcon icon={isSaving ? faSpinner : faSave} spin={isSaving} className="mr-2" />
                        {isSaving ? 'Speichert...' : 'Änderungen speichern'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default WorkingHoursManager;
