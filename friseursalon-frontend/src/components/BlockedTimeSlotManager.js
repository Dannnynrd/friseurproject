// friseursalon-frontend/src/components/BlockedTimeSlotManager.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { de } from 'date-fns/locale';
import { format, parseISO, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns';
import styles from './BlockedTimeSlotManager.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faPlus, faTrashAlt, faSpinner, faExclamationTriangle, faInfoCircle, faCalendarTimes, faRedo } from '@fortawesome/free-solid-svg-icons';
import ConfirmModal from './ConfirmModal';

registerLocale('de', de);

const timeToDate = (timeStr, dateObj = new Date()) => {
    if (!timeStr) return dateObj;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return setMilliseconds(setSeconds(setMinutes(setHours(dateObj, hours), minutes), 0), 0);
};

function BlockedTimeSlotManager({ refreshTrigger }) {
    const [blockedSlots, setBlockedSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [newSlotDate, setNewSlotDate] = useState(new Date());
    const [newSlotStartTime, setNewSlotStartTime] = useState('09:00');
    const [newSlotEndTime, setNewSlotEndTime] = useState('10:00');
    const [newSlotReason, setNewSlotReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [slotToDelete, setSlotToDelete] = useState(null);


    const fetchBlockedTimeSlots = useCallback(async () => {
        setLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            // KORREKTUR: Relativer Pfad
            const response = await api.get('blockedtimeslots');
            setBlockedSlots(response.data || []);
        } catch (err) {
            console.error("Error fetching blocked time slots:", err);
            setError(err.response?.data?.message || "Geblockte Zeiten konnten nicht geladen werden.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBlockedTimeSlots();
    }, [fetchBlockedTimeSlots, refreshTrigger]);

    const handleAddBlockedTimeSlot = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccessMessage('');

        if (!newSlotDate || !newSlotStartTime || !newSlotEndTime) {
            setError("Bitte füllen Sie Datum und Zeitfelder aus.");
            setIsSubmitting(false);
            return;
        }

        const startDateWithTime = timeToDate(newSlotStartTime, new Date(newSlotDate));
        const endDateWithTime = timeToDate(newSlotEndTime, new Date(newSlotDate));

        if (endDateWithTime <= startDateWithTime) {
            setError("Endzeit muss nach der Startzeit liegen.");
            setIsSubmitting(false);
            return;
        }

        const newSlot = {
            startTime: startDateWithTime.toISOString(),
            endTime: endDateWithTime.toISOString(),
            reason: newSlotReason || 'Geblockt',
        };

        try {
            // KORREKTUR: Relativer Pfad
            await api.post('blockedtimeslots', newSlot);
            setSuccessMessage('Zeit erfolgreich geblockt.');
            fetchBlockedTimeSlots(); // Liste neu laden
            setNewSlotReason('');
            // Optional: Datum und Zeiten zurücksetzen oder beibehalten für nächste Eingabe
        } catch (err) {
            console.error("Error adding blocked time slot:", err);
            setError(err.response?.data?.message || 'Fehler beim Blocken der Zeit.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDeleteSlot = (slotId) => {
        setSlotToDelete(slotId);
        setShowConfirmDeleteModal(true);
    };

    const handleDeleteBlockedTimeSlot = async () => {
        if (!slotToDelete) return;
        // Hier könnte man einen spezifischen Ladezustand für den Löschvorgang setzen
        setError('');
        setSuccessMessage('');
        try {
            // KORREKTUR: Relativer Pfad
            await api.delete(`blockedtimeslots/${slotToDelete}`);
            setSuccessMessage('Blockierung erfolgreich aufgehoben.');
            fetchBlockedTimeSlots(); // Liste neu laden
        } catch (err) {
            console.error("Error deleting blocked time slot:", err);
            setError(err.response?.data?.message || 'Fehler beim Aufheben der Blockierung.');
        } finally {
            setShowConfirmDeleteModal(false);
            setSlotToDelete(null);
        }
    };

    const generateTimeOptions = () => {
        const options = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 15) { // 15-Minuten-Intervalle
                options.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
            }
        }
        return options;
    };
    const timeOptions = generateTimeOptions();


    if (loading && blockedSlots.length === 0) {
        return (
            <div className="flex justify-center items-center p-6 text-gray-500">
                <FontAwesomeIcon icon={faSpinner} spin size="lg" className="mr-2 text-indigo-500" />
                Lade geblockte Zeiten...
            </div>
        );
    }

    return (
        <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-lg ${styles.managerContainer}`}>
            <h3 className="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b border-gray-200 flex items-center">
                <FontAwesomeIcon icon={faCalendarTimes} className="mr-2 text-red-500" />
                Zeiten blockieren/freigeben
            </h3>

            {error && (
                <div className={`p-3 mb-4 text-sm rounded-md flex items-center bg-red-50 text-red-700 border border-red-200 ${styles.message}`}>
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 flex-shrink-0" /> {error}
                </div>
            )}
            {successMessage && (
                <div className={`p-3 mb-4 text-sm rounded-md flex items-center bg-green-50 text-green-600 border border-green-200 ${styles.message}`}>
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2 flex-shrink-0" /> {successMessage}
                </div>
            )}

            <form onSubmit={handleAddBlockedTimeSlot} className={`space-y-4 mb-6 p-4 border border-gray-200 rounded-lg bg-slate-50 ${styles.addSlotForm}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="slotDate" className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
                        <DatePicker
                            selected={newSlotDate}
                            onChange={(date) => setNewSlotDate(date)}
                            dateFormat="dd.MM.yyyy"
                            locale="de"
                            id="slotDate"
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}
                            minDate={new Date()}
                        />
                    </div>
                    <div>
                        <label htmlFor="slotStartTime" className="block text-sm font-medium text-gray-700 mb-1">Startzeit</label>
                        <select id="slotStartTime" value={newSlotStartTime} onChange={(e) => setNewSlotStartTime(e.target.value)} className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}>
                            {timeOptions.map(time => <option key={`start-${time}`} value={time}>{time}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="slotEndTime" className="block text-sm font-medium text-gray-700 mb-1">Endzeit</label>
                        <select id="slotEndTime" value={newSlotEndTime} onChange={(e) => setNewSlotEndTime(e.target.value)} className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}>
                            {timeOptions.map(time => <option key={`end-${time}`} value={time}>{time}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2"> {/* Reason field spans 2 cols on md+ */}
                        <label htmlFor="slotReason" className="block text-sm font-medium text-gray-700 mb-1">Grund (optional)</label>
                        <input
                            type="text"
                            id="slotReason"
                            value={newSlotReason}
                            onChange={(e) => setNewSlotReason(e.target.value)}
                            placeholder="z.B. Mittagspause, Meeting"
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}
                        />
                    </div>
                    <div className="md:col-span-2 flex items-end"> {/* Button spans 2 cols on md+ and aligns with other items */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 ${styles.submitButton}`}
                        >
                            <FontAwesomeIcon icon={isSubmitting ? faSpinner : faLock} spin={isSubmitting} className="mr-2" />
                            {isSubmitting ? 'Blockiere...' : 'Zeit blockieren'}
                        </button>
                    </div>
                </div>
            </form>

            <h4 className="text-md font-semibold text-gray-700 mb-3 flex items-center">
                <FontAwesomeIcon icon={faRedo} className="mr-2 text-gray-500" /> Aktuell geblockte Zeiten
                <button onClick={fetchBlockedTimeSlots} className={`ml-auto p-1.5 text-xs text-indigo-600 hover:text-indigo-800 rounded-md hover:bg-indigo-50 ${styles.refreshButton}`} title="Liste aktualisieren">
                    <FontAwesomeIcon icon={faRedo} />
                </button>
            </h4>
            {blockedSlots.length === 0 && !loading && !error && (
                <div className={`text-center py-5 px-3 bg-slate-50 rounded-md ${styles.noSlotsMessage}`}>
                    <FontAwesomeIcon icon={faInfoCircle} size="lg" className="text-gray-400 mb-2" />
                    <p className="text-gray-600 text-sm">Derzeit sind keine Zeiten manuell geblockt.</p>
                </div>
            )}

            {blockedSlots.length > 0 && (
                <ul className={`space-y-2 ${styles.slotList}`}>
                    {blockedSlots.sort((a,b) => new Date(a.startTime) - new Date(b.startTime)).map(slot => (
                        <li key={slot.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border border-gray-200 rounded-md shadow-sm ${styles.slotItem}`}>
                            <div className="flex-grow">
                                <p className="text-sm font-medium text-gray-800">
                                    {format(parseISO(slot.startTime), 'dd.MM.yyyy')} : {format(parseISO(slot.startTime), 'HH:mm')} - {format(parseISO(slot.endTime), 'HH:mm')} Uhr
                                </p>
                                {slot.reason && <p className="text-xs text-gray-500 mt-0.5">Grund: {slot.reason}</p>}
                            </div>
                            <button
                                onClick={() => confirmDeleteSlot(slot.id)}
                                className={`mt-2 sm:mt-0 sm:ml-3 p-1.5 text-xs text-red-500 hover:text-red-700 rounded-md hover:bg-red-50 transition-colors ${styles.deleteButton}`}
                                title="Blockierung aufheben"
                            >
                                <FontAwesomeIcon icon={faTrashAlt} />
                                <span className="ml-1 hidden sm:inline">Freigeben</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {showConfirmDeleteModal && (
                <ConfirmModal
                    isOpen={showConfirmDeleteModal}
                    onClose={() => setShowConfirmDeleteModal(false)}
                    onConfirm={handleDeleteBlockedTimeSlot}
                    title="Blockierung aufheben"
                    message="Möchten Sie diese Zeit wirklich wieder freigeben?"
                    confirmButtonText="Ja, freigeben"
                />
            )}
        </div>
    );
}

export default BlockedTimeSlotManager;
