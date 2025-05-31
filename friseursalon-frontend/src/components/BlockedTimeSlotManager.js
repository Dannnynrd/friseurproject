// friseursalon-frontend/src/components/BlockedTimeSlotManager.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
// HIER den Import ändern:
import styles from './BlockedTimeSlotManager.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashAlt, faSpinner, faExclamationTriangle, faCheckCircle, faCalendarTimes, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import ConfirmModal from './ConfirmModal'; // Wiederverwendung des ConfirmModals

function BlockedTimeSlotManager() {
    const [blockedSlots, setBlockedSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // States für das Formular zum Erstellen neuer Sperrzeiten
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null); // Optional, für Zeiträume
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [slotToDelete, setSlotToDelete] = useState(null);


    const fetchBlockedSlots = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage('');
        try {
            const response = await api.get('/api/blockedtimeslots'); // Dein Backend-Endpunkt
            setBlockedSlots(response.data || []);
        } catch (err) {
            console.error("Error fetching blocked time slots:", err);
            setError(err.response?.data?.message || "Sperrzeiten konnten nicht geladen werden.");
            setBlockedSlots([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBlockedSlots();
    }, [fetchBlockedSlots]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!startDate || !startTime || !endTime) {
            setFormError("Bitte wählen Sie Datum, Start- und Endzeit aus.");
            return;
        }
        // Validierung, dass Endzeit nach Startzeit liegt
        if (endTime <= startTime) {
            setFormError("Die Endzeit muss nach der Startzeit liegen.");
            return;
        }

        setIsSubmitting(true);
        setFormError('');
        setSuccessMessage('');

        const slotData = {
            // Das Backend erwartet wahrscheinlich ein LocalDateTime oder ähnliches.
            // Wir müssen Datum und Zeit kombinieren.
            // Annahme: startDate ist ein Date-Objekt, startTime/endTime sind "HH:mm" Strings.
            // endDate ist optional und könnte für mehrtägige Sperrungen verwendet werden.

            // Start-Datum und -Zeit kombinieren
            startDateTime: `${startDate.toISOString().split('T')[0]}T${startTime}:00`,
            // End-Datum und -Zeit kombinieren (wenn endDate gesetzt ist, sonst gleicher Tag wie startDate)
            endDateTime: `${(endDate || startDate).toISOString().split('T')[0]}T${endTime}:00`,
            reason: reason || "Geblockt", // Standardgrund, falls keiner angegeben
        };

        try {
            await api.post('/api/blockedtimeslots', slotData); // Dein Backend-Endpunkt zum Erstellen
            setSuccessMessage("Sperrzeit erfolgreich erstellt.");
            fetchBlockedSlots(); // Liste neu laden
            // Formular zurücksetzen
            setStartDate(null);
            setEndDate(null);
            setStartTime('');
            setEndTime('');
            setReason('');
        } catch (err) {
            console.error("Error creating blocked time slot:", err);
            setFormError(err.response?.data?.message || "Fehler beim Erstellen der Sperrzeit.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = (slotId) => {
        setSlotToDelete(slotId);
        setShowConfirmDeleteModal(true);
    };

    const handleDelete = async () => {
        if (!slotToDelete) return;
        // Hier könnte man den Ladezustand spezifisch für den Löschvorgang setzen
        setError(null);
        setSuccessMessage('');
        try {
            await api.delete(`/api/blockedtimeslots/${slotToDelete}`); // Dein Backend-Endpunkt zum Löschen
            setSuccessMessage("Sperrzeit erfolgreich gelöscht.");
            fetchBlockedSlots(); // Liste neu laden
        } catch (err) {
            console.error("Error deleting blocked time slot:", err);
            setError(err.response?.data?.message || "Fehler beim Löschen der Sperrzeit.");
        } finally {
            setShowConfirmDeleteModal(false);
            setSlotToDelete(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleString('de-DE', options);
    };

    const formatTime = (timeString) => { // Für den Fall, dass nur Zeit als String kommt
        if (!timeString || !timeString.includes('T')) return timeString; // Wenn es schon HH:mm ist oder leer
        return timeString.split('T')[1].substring(0, 5);
    };


    if (loading && blockedSlots.length === 0) {
        return (
            <div className="flex justify-center items-center p-10 text-gray-600">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-indigo-500" />
                <p className="ml-3 text-md">Lade Sperrzeiten...</p>
            </div>
        );
    }

    return (
        <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-lg ${styles.blockedTimeSlotManagerContainer}`}>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 font-serif mb-6 pb-4 border-b border-gray-200">
                Sperrzeiten verwalten
            </h2>

            {/* Formular zum Erstellen neuer Sperrzeiten */}
            <form onSubmit={handleFormSubmit} className={`mb-8 p-6 bg-slate-50 rounded-lg shadow ${styles.addSlotForm}`}>
                <h3 className="text-lg font-medium text-gray-700 mb-4">Neue Sperrzeit hinzufügen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <div className={styles.formGroup}>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Startdatum*</label>
                        <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            dateFormat="dd.MM.yyyy"
                            minDate={new Date()}
                            placeholderText="Datum wählen"
                            id="startDate"
                            className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Startzeit*</label>
                        <input
                            type="time"
                            id="startTime"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">Endzeit*</label>
                        <input
                            type="time"
                            id="endTime"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                        />
                    </div>
                    {/* Optional: Enddatum für mehrtägige Sperrungen */}
                    {/* <div className={styles.formGroup}>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Enddatum (optional)</label>
                        <DatePicker
                            selected={endDate}
                            onChange={(date) => setEndDate(date)}
                            dateFormat="dd.MM.yyyy"
                            minDate={startDate || new Date()}
                            placeholderText="Optional"
                            id="endDate"
                            className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    */}
                    <div className={`md:col-span-2 lg:col-span-1 ${styles.formGroup}`}>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Grund (optional)</label>
                        <input
                            type="text"
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="z.B. Urlaub, Team-Meeting"
                            className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div className="lg:col-start-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
                        >
                            {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faPlus} className="mr-2" />}
                            Sperrzeit hinzufügen
                        </button>
                    </div>
                </div>
                {formError && (
                    <p className={`mt-2 text-xs text-red-600 flex items-center ${styles.formErrorMessage}`}>
                        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" /> {formError}
                    </p>
                )}
            </form>

            {error && (
                <div className={`mb-4 p-3 rounded-md bg-red-50 text-red-600 border border-red-200 text-sm flex items-center ${styles.message}`}>
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 flex-shrink-0" /> {error}
                </div>
            )}
            {successMessage && (
                <div className={`mb-4 p-3 rounded-md bg-green-50 text-green-600 border border-green-200 text-sm flex items-center ${styles.message}`}>
                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2 flex-shrink-0" /> {successMessage}
                </div>
            )}

            {blockedSlots.length === 0 && !loading && !error && (
                <div className={`text-center py-8 px-6 bg-slate-50 rounded-lg ${styles.noSlots}`}>
                    <FontAwesomeIcon icon={faCalendarTimes} size="2x" className="text-gray-400 mb-3" />
                    <p className="text-gray-500 text-md">
                        Es sind keine Sperrzeiten definiert.
                    </p>
                </div>
            )}

            {blockedSlots.length > 0 && (
                <div className={`overflow-x-auto shadow rounded-lg ${styles.tableContainer}`}>
                    <table className={`min-w-full divide-y divide-gray-200 ${styles.appTable}`}>
                        <thead className="bg-slate-50">
                        <tr>
                            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
                            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ende</th>
                            <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Grund</th>
                            <th scope="col" className="relative px-5 py-3">
                                <span className="sr-only">Aktionen</span>
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {blockedSlots.map((slot) => (
                            <tr key={slot.id} className={`hover:bg-slate-50 transition-colors duration-150 ${styles.tableRow}`}> {/* KORREKTUR HIER */}
                                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(slot.startDateTime)}</td>
                                <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(slot.endDateTime)}</td>
                                <td className="px-5 py-4 text-sm text-gray-600 hidden sm:table-cell">
                                    <p className="truncate w-64" title={slot.reason}>{slot.reason || '-'}</p>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => confirmDelete(slot.id)} className={`text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors ${styles.actionButton}`} title="Löschen">
                                        <FontAwesomeIcon icon={faTrashAlt} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showConfirmDeleteModal && (
                <ConfirmModal
                    isOpen={showConfirmDeleteModal}
                    onClose={() => setShowConfirmDeleteModal(false)}
                    onConfirm={handleDelete}
                    title="Sperrzeit löschen"
                    message="Möchten Sie diese Sperrzeit wirklich endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden."
                    confirmButtonText="Ja, löschen"
                    icon={faTrashAlt}
                    iconColorClass="text-red-500"
                />
            )}
        </div>
    );
}

export default BlockedTimeSlotManager;
