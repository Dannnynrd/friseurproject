// friseursalon-frontend/src/components/WorkingHoursManager.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import styles from './WorkingHoursManager.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimesCircle, faSpinner, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

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
    const [workingHours, setWorkingHours] = useState([]);
    const [initialWorkingHours, setInitialWorkingHours] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const fetchWorkingHours = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.get('/api/workinghours');
            const data = response.data.sort((a, b) => daysOfWeek.indexOf(a.dayOfWeek) - daysOfWeek.indexOf(b.dayOfWeek));
            setWorkingHours(data);
            setInitialWorkingHours(JSON.parse(JSON.stringify(data)));
        } catch (err) {
            console.error("Error fetching working hours:", err);
            setError("Arbeitszeiten konnten nicht geladen werden.");
            setWorkingHours([]);
            setInitialWorkingHours([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWorkingHours();
    }, [fetchWorkingHours]);

    const handleInputChange = (index, field, value) => {
        const updatedHours = [...workingHours];
        updatedHours[index] = { ...updatedHours[index], [field]: value };

        if (field === 'isClosed' && value === true) {
            updatedHours[index].startTime = "";
            updatedHours[index].endTime = "";
        }
        setWorkingHours(updatedHours);
        setIsEditing(true);
        setSuccessMessage('');
    };

    const handleSaveChanges = async () => {
        setIsLoading(true);
        setError(null);
        setSuccessMessage('');
        try {
            await api.put('/api/workinghours/batch', workingHours);
            setSuccessMessage("Arbeitszeiten erfolgreich gespeichert!");
            setInitialWorkingHours(JSON.parse(JSON.stringify(workingHours)));
            setIsEditing(false);
        } catch (err) {
            console.error("Error saving working hours:", err);
            setError(err.response?.data?.message || "Fehler beim Speichern der Arbeitszeiten.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelChanges = () => {
        setWorkingHours(JSON.parse(JSON.stringify(initialWorkingHours)));
        setIsEditing(false);
        setError(null);
        setSuccessMessage('');
    };

    if (isLoading && workingHours.length === 0) {
        return (
            <div className="flex justify-center items-center p-10">
                <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-indigo-600" />
                <p className="ml-4 text-lg text-gray-700">Lade Arbeitszeiten...</p>
            </div>
        );
    }

    if (error && workingHours.length === 0) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-md text-red-700">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                {error}
            </div>
        );
    }

    return (
        <div className={`p-4 sm:p-6 bg-white rounded-xl shadow-lg ${styles.workingHoursManager}`}>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">
                Öffnungszeiten verwalten
            </h2>

            {error && (
                <div className={`mb-4 p-3 rounded-md bg-red-100 text-red-700 border border-red-300 text-sm flex items-center ${styles.messageContainer}`}>
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" /> {error}
                </div>
            )}
            {successMessage && (
                <div className={`mb-4 p-3 rounded-md bg-green-100 text-green-700 border border-green-300 text-sm flex items-center ${styles.messageContainer}`}>
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2" /> {successMessage}
                </div>
            )}

            <div className="space-y-6">
                {workingHours.map((wh, index) => (
                    <div key={wh.id || wh.dayOfWeek} className={`p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50 ${styles.dayConfig} ${wh.isClosed ? styles.dayClosed : ''}`}>
                        <h3 className="text-lg font-medium text-gray-700 mb-3 capitalize">
                            {germanDays[wh.dayOfWeek] || wh.dayOfWeek}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-center">
                            <div className={styles.formGroup}>
                                <label htmlFor={`startTime-${wh.dayOfWeek}`} className="block text-sm font-medium text-gray-600 mb-1">
                                    Öffnet um
                                </label>
                                <input
                                    type="time"
                                    id={`startTime-${wh.dayOfWeek}`}
                                    value={wh.startTime || ""}
                                    onChange={(e) => handleInputChange(index, 'startTime', e.target.value)}
                                    disabled={wh.isClosed || isLoading}
                                    className={`w-full p-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${wh.isClosed ? 'bg-gray-200 cursor-not-allowed' : 'border-gray-300 bg-white'}`}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor={`endTime-${wh.dayOfWeek}`} className="block text-sm font-medium text-gray-600 mb-1">
                                    Schließt um
                                </label>
                                <input
                                    type="time"
                                    id={`endTime-${wh.dayOfWeek}`}
                                    value={wh.endTime || ""}
                                    onChange={(e) => handleInputChange(index, 'endTime', e.target.value)}
                                    disabled={wh.isClosed || isLoading}
                                    className={`w-full p-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${wh.isClosed ? 'bg-gray-200 cursor-not-allowed' : 'border-gray-300 bg-white'}`}
                                />
                            </div>

                            <div className={`flex items-center sm:col-span-2 md:col-span-1 md:justify-self-start md:pt-6 ${styles.checkboxGroup}`}>
                                <input
                                    type="checkbox"
                                    id={`isClosed-${wh.dayOfWeek}`}
                                    checked={wh.isClosed}
                                    onChange={(e) => handleInputChange(index, 'isClosed', e.target.checked)}
                                    disabled={isLoading}
                                    className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor={`isClosed-${wh.dayOfWeek}`} className="ml-2 text-sm text-gray-700">
                                    Geschlossen
                                </label>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isEditing && (
                <div className="mt-8 pt-6 border-t border-gray-300 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                    <button
                        onClick={handleCancelChanges}
                        disabled={isLoading}
                        className={`px-6 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 disabled:opacity-50 ${styles.actionButton} ${styles.cancelButton}`}
                    >
                        <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
                        Abbrechen
                    </button>
                    <button
                        onClick={handleSaveChanges}
                        disabled={isLoading}
                        className={`px-6 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 disabled:opacity-50 ${styles.actionButton} ${styles.saveButton}`}
                    >
                        {isLoading ? (
                            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                        ) : (
                            <FontAwesomeIcon icon={faSave} className="mr-2" />
                        )}
                        Änderungen speichern
                    </button>
                </div>
            )}
        </div>
    );
}

export default WorkingHoursManager;
