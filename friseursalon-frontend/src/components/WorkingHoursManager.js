import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faSave, faExclamationCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import './WorkingHoursManager.css'; // Wir erstellen diese CSS-Datei gleich

const daysOfWeek = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const germanDays = {
    MONDAY: "Montag",
    TUESDAY: "Dienstag",
    WEDNESDAY: "Mittwoch",
    THURSDAY: "Donnerstag",
    FRIDAY: "Freitag",
    SATURDAY: "Samstag",
    SUNDAY: "Sonntag"
};

function WorkingHoursManager() {
    const [workingHours, setWorkingHours] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchWorkingHours = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/workinghours');
            const hoursMap = response.data.reduce((acc, dayConfig) => {
                acc[dayConfig.dayOfWeek] = {
                    startTime: dayConfig.startTime || '',
                    endTime: dayConfig.endTime || '',
                    isClosed: dayConfig.isClosed
                };
                return acc;
            }, {});
            // Sicherstellen, dass alle Tage initialisiert sind, auch wenn sie nicht vom Backend kommen
            daysOfWeek.forEach(day => {
                if (!hoursMap[day]) {
                    hoursMap[day] = { startTime: '09:00', endTime: '18:00', isClosed: day === 'SUNDAY' || day === 'MONDAY' };
                }
            });
            setWorkingHours(hoursMap);
        } catch (err) {
            console.error("Fehler beim Laden der Arbeitszeiten:", err);
            setError("Arbeitszeiten konnten nicht geladen werden. Bitte versuchen Sie es später erneut.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWorkingHours();
    }, [fetchWorkingHours]);

    const handleInputChange = (day, field, value) => {
        setWorkingHours(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [field]: value
            }
        }));
        setSuccessMessage(''); // Erfolgsmeldung zurücksetzen bei Änderung
    };

    const handleIsClosedChange = (day, isChecked) => {
        setWorkingHours(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                isClosed: isChecked,
                // Optional: Zeiten zurücksetzen, wenn geschlossen markiert wird
                startTime: isChecked ? '' : (prev[day]?.startTime || '09:00'),
                endTime: isChecked ? '' : (prev[day]?.endTime || '18:00'),
            }
        }));
        setSuccessMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccessMessage('');

        try {
            const promises = Object.entries(workingHours).map(([day, times]) => {
                // Validierung: Wenn nicht geschlossen, müssen Zeiten vorhanden sein
                if (!times.isClosed && (!times.startTime || !times.endTime)) {
                    throw new Error(`Für ${germanDays[day]} müssen Start- und Endzeiten angegeben werden, wenn der Tag nicht als geschlossen markiert ist.`);
                }
                // Validierung: Endzeit muss nach Startzeit liegen
                if (!times.isClosed && times.startTime && times.endTime && times.startTime >= times.endTime) {
                    throw new Error(`Bei ${germanDays[day]} muss die Endzeit nach der Startzeit liegen.`);
                }

                const payload = {
                    dayOfWeek: day,
                    startTime: times.isClosed ? null : times.startTime,
                    endTime: times.isClosed ? null : times.endTime,
                    isClosed: times.isClosed
                };
                return api.post('/workinghours', payload);
            });
            await Promise.all(promises);
            setSuccessMessage('Arbeitszeiten erfolgreich gespeichert!');
            fetchWorkingHours(); // Daten neu laden, um Konsistenz sicherzustellen
        } catch (err) {
            console.error("Fehler beim Speichern der Arbeitszeiten:", err);
            setError(err.message || "Ein Fehler ist beim Speichern aufgetreten.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="loading-message"><FontAwesomeIcon icon={faSpinner} spin /> Lade Arbeitszeiten...</div>;
    }

    return (
        <div className="working-hours-manager">
            {error && (
                <p className="form-message error mb-4">
                    <FontAwesomeIcon icon={faExclamationCircle} /> {error}
                </p>
            )}
            {successMessage && (
                <p className="form-message success mb-4">
                    <FontAwesomeIcon icon={faCheckCircle} /> {successMessage}
                </p>
            )}
            <form onSubmit={handleSubmit}>
                {daysOfWeek.map(day => (
                    <div key={day} className="day-config-row">
                        <h4 className="day-label">{germanDays[day]}</h4>
                        <div className="time-inputs">
                            <div className="form-group">
                                <label htmlFor={`startTime-${day}`}>Startzeit:</label>
                                <input
                                    type="time"
                                    id={`startTime-${day}`}
                                    value={workingHours[day]?.startTime || ''}
                                    onChange={(e) => handleInputChange(day, 'startTime', e.target.value)}
                                    disabled={workingHours[day]?.isClosed || isSubmitting}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor={`endTime-${day}`}>Endzeit:</label>
                                <input
                                    type="time"
                                    id={`endTime-${day}`}
                                    value={workingHours[day]?.endTime || ''}
                                    onChange={(e) => handleInputChange(day, 'endTime', e.target.value)}
                                    disabled={workingHours[day]?.isClosed || isSubmitting}
                                />
                            </div>
                        </div>
                        <div className="form-group-checkbox">
                            <input
                                type="checkbox"
                                id={`isClosed-${day}`}
                                checked={workingHours[day]?.isClosed || false}
                                onChange={(e) => handleIsClosedChange(day, e.target.checked)}
                                disabled={isSubmitting}
                            />
                            <label htmlFor={`isClosed-${day}`}>Geschlossen</label>
                        </div>
                    </div>
                ))}
                <div className="form-actions">
                    <button type="submit" className="button-link" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <><FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Speichern...</>
                        ) : (
                            <><FontAwesomeIcon icon={faSave} className="mr-2" /> Arbeitszeiten speichern</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default WorkingHoursManager;