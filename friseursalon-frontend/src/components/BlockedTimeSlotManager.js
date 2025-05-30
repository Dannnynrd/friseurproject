import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faSave, faExclamationCircle, faCheckCircle, faPlusCircle, faTrashAlt, faEdit, faTimes } from '@fortawesome/free-solid-svg-icons';
import ConfirmModal from './ConfirmModal';
import './BlockedTimeSlotManager.module.css';

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

const initialSlotState = {
    description: '',
    specificDate: '',
    recurringDayOfWeek: 'MONDAY',
    startTime: '12:00',
    endTime: '13:00',
    repeating: false, // <<<--- UM BENANNT VON isRecurring
    id: null
};

function BlockedTimeSlotManager() {
    const [blockedSlots, setBlockedSlots] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formError, setFormError] = useState(null);
    const [listError, setListError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [currentSlot, setCurrentSlot] = useState({...initialSlotState});
    const [isEditing, setIsEditing] = useState(false);

    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [slotToDelete, setSlotToDelete] = useState(null);

    const fetchBlockedSlots = useCallback(async () => {
        setIsLoading(true);
        setListError(null);
        try {
            const response = await api.get('/blockedtimeslots');
            // Anpassung an den neuen Feldnamen 'repeating' vom Backend
            const formattedSlots = response.data.map(slot => ({
                ...slot,
                isRecurring: slot.repeating // Intern im Frontend weiter isRecurring nennen für Konsistenz der Logik
            }));
            setBlockedSlots(formattedSlots || []);
        } catch (err) {
            console.error("Fehler beim Laden der geblockten Zeiten:", err);
            setListError("Geblockte Zeiten konnten nicht geladen werden.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBlockedSlots().catch(err => {
            console.error("Fehler beim initialen Laden der geblockten Zeiten (useEffect):", err);
        });
    }, [fetchBlockedSlots]);

    const handleInputChange = (field, value) => {
        setCurrentSlot(prev => ({ ...prev, [field]: value }));
        setFormError(null);
        setSuccessMessage('');
    };

    // Interne Logik verwendet weiterhin 'isRecurring' für den State,
    // aber der Payload wird 'repeating' verwenden.
    const handleIsRecurringChange = (e) => {
        const isChecked = e.target.checked;
        setCurrentSlot(prev => {
            const newState = {
                ...prev,
                isRecurring: isChecked, // State-Feld bleibt isRecurring
            };
            if (isChecked) {
                newState.specificDate = '';
                newState.recurringDayOfWeek = prev.recurringDayOfWeek || 'MONDAY';
            } else {
                newState.recurringDayOfWeek = '';
            }
            return newState;
        });
        setFormError(null);
        setSuccessMessage('');
    };

    const validateSlot = (slotToValidate) => {
        if (!slotToValidate.description.trim()) return "Beschreibung darf nicht leer sein.";
        if (!slotToValidate.startTime || !slotToValidate.endTime) return "Start- und Endzeit sind erforderlich.";
        if (slotToValidate.startTime >= slotToValidate.endTime) return "Endzeit muss nach Startzeit liegen.";

        if (slotToValidate.isRecurring) { // Interne State-Prüfung
            if (!slotToValidate.recurringDayOfWeek) return "Für wiederkehrende Blockaden muss ein Wochentag ausgewählt werden.";
        } else {
            if (!slotToValidate.specificDate) return "Für einmalige Blockaden muss ein Datum angegeben werden.";
        }
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        setSuccessMessage('');

        const slotDataForSubmission = { ...currentSlot };

        const validationError = validateSlot(slotDataForSubmission);
        if (validationError) {
            setFormError(validationError);
            return;
        }

        setIsSubmitting(true);

        const payload = {
            description: slotDataForSubmission.description.trim(),
            startTime: slotDataForSubmission.startTime,
            endTime: slotDataForSubmission.endTime,
            repeating: slotDataForSubmission.isRecurring, // <<<--- HIER WIRD isRecurring zu repeating gemappt
            specificDate: slotDataForSubmission.isRecurring ? null : slotDataForSubmission.specificDate,
            recurringDayOfWeek: slotDataForSubmission.isRecurring ? slotDataForSubmission.recurringDayOfWeek : null,
            id: (isEditing && slotDataForSubmission.id) ? slotDataForSubmission.id : undefined
        };

        if (payload.id === null || payload.id === undefined) {
            delete payload.id;
        }

        console.log("FINAL PAYLOAD TO BE SENT (BlockedTimeSlotManager.js):", JSON.stringify(payload, null, 2));
        console.log("Wert von currentSlot.isRecurring vor API Call:", currentSlot.isRecurring);
        console.log("Wert von payload.repeating vor API Call:", payload.repeating);

        try {
            if (isEditing && payload.id) {
                await api.put(`/blockedtimeslots/${payload.id}`, payload);
                setSuccessMessage('Blockade erfolgreich aktualisiert!');
            } else {
                await api.post('/blockedtimeslots', payload);
                setSuccessMessage('Blockade erfolgreich erstellt!');
            }
            setShowForm(false);
            setCurrentSlot({...initialSlotState, repeating: false, isRecurring: false}); // Zurücksetzen
            setIsEditing(false);
            await fetchBlockedSlots();
        } catch (err) {
            console.error("Fehler beim Speichern der Blockade:", err.response || err);
            const message = err.response?.data?.message || err.message || "Ein Fehler ist beim Speichern aufgetreten.";
            if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                setFormError(`Fehler: ${err.response.data.errors.join(', ')}`);
            } else {
                setFormError(message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (slot) => { // slot kommt vom Backend mit 'repeating'
        setCurrentSlot({
            id: slot.id,
            description: slot.description || '',
            // Hier verwenden wir 'repeating' vom Backend, um 'isRecurring' für den Frontend-State zu setzen
            specificDate: (!slot.repeating && slot.specificDate) ? slot.specificDate.split('T')[0] : '',
            recurringDayOfWeek: slot.repeating ? slot.recurringDayOfWeek : 'MONDAY',
            startTime: slot.startTime || '12:00',
            endTime: slot.endTime || '13:00',
            isRecurring: !!slot.repeating,  // Frontend-State-Feld
            repeating: !!slot.repeating // Behalte es für den Fall, aber Logik basiert auf isRecurring
        });
        setIsEditing(true);
        setShowForm(true);
        setFormError(null);
        setSuccessMessage('');
    };

    // ... (Rest der Funktionen: handleDeleteClick, confirmDelete, toggleShowForm, formatDate)
    const handleDeleteClick = (slot) => {
        setSlotToDelete(slot);
        setShowConfirmDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!slotToDelete) return;
        setIsSubmitting(true);
        try {
            await api.delete(`/blockedtimeslots/${slotToDelete.id}`);
            setSuccessMessage(`Blockade "${slotToDelete.description}" erfolgreich gelöscht.`);
            await fetchBlockedSlots();
        } catch (err) {
            console.error("Fehler beim Löschen der Blockade:", err);
            setListError(err.response?.data?.message || err.message || "Fehler beim Löschen.");
        } finally {
            setIsSubmitting(false);
            setShowConfirmDeleteModal(false);
            setSlotToDelete(null);
        }
    };

    const toggleShowForm = () => {
        const wasShowingForm = showForm;
        setShowForm(!wasShowingForm);
        if (!wasShowingForm) {
            setCurrentSlot({...initialSlotState, repeating: false, isRecurring: false });
            setIsEditing(false);
        } else {
            setCurrentSlot({...initialSlotState, repeating: false, isRecurring: false });
            setIsEditing(false);
        }
        setFormError(null);
        setSuccessMessage('');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const parts = dateString.split('T')[0].split('-');
        if (parts.length === 3) {
            return `${parts[2]}.${parts[1]}.${parts[0]}`;
        }
        return dateString;
    };


    return (
        <div className="blocked-time-slot-manager">
            <div className="dashboard-section-header-controls">
                <h3 className="form-section-heading-compact" style={{ margin: 0 }}>
                    {showForm ? (isEditing ? 'Blockade bearbeiten' : 'Neue Blockade hinzufügen') : 'Blockierte Zeiten'}
                </h3>
                <button
                    onClick={toggleShowForm}
                    className="button-link-outline small-button"
                >
                    <FontAwesomeIcon icon={showForm ? faTimes : faPlusCircle} className="mr-1" />
                    {showForm ? 'Formular schließen' : 'Neue Blockade'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="blocked-slot-form card-style">
                    {formError && (
                        <p className="form-message error mb-3">
                            <FontAwesomeIcon icon={faExclamationCircle} /> {formError}
                        </p>
                    )}
                    <div className="form-group">
                        <label htmlFor="description">Beschreibung*:</label>
                        <input
                            type="text"
                            id="description"
                            name="description"
                            value={currentSlot.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group form-group-checkbox mb-3">
                        <input
                            type="checkbox"
                            id="isRecurring"
                            name="isRecurring"
                            checked={currentSlot.isRecurring} // Bindet an den internen State
                            onChange={handleIsRecurringChange}
                            disabled={isSubmitting}
                        />
                        <label htmlFor="isRecurring">Wiederkehrend (wöchentlich)</label>
                    </div>

                    {currentSlot.isRecurring ? ( // Logik basiert auf internem isRecurring
                        <div className="form-group">
                            <label htmlFor="recurringDayOfWeek">Wochentag*:</label>
                            <select
                                id="recurringDayOfWeek"
                                name="recurringDayOfWeek"
                                value={currentSlot.recurringDayOfWeek}
                                onChange={(e) => handleInputChange('recurringDayOfWeek', e.target.value)}
                                disabled={isSubmitting || !currentSlot.isRecurring}
                                required={currentSlot.isRecurring}
                            >
                                {daysOfWeek.map(day => (
                                    <option key={day} value={day}>{germanDays[day]}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="form-group">
                            <label htmlFor="specificDate">Datum*:</label>
                            <input
                                type="date"
                                id="specificDate"
                                name="specificDate"
                                value={currentSlot.specificDate}
                                onChange={(e) => handleInputChange('specificDate', e.target.value)}
                                disabled={isSubmitting || currentSlot.isRecurring}
                                required={!currentSlot.isRecurring}
                            />
                        </div>
                    )}

                    <div className="form-grid-halved">
                        <div className="form-group">
                            <label htmlFor="startTime">Startzeit*:</label>
                            <input
                                type="time"
                                id="startTime"
                                name="startTime"
                                value={currentSlot.startTime}
                                onChange={(e) => handleInputChange('startTime', e.target.value)}
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="endTime">Endzeit*:</label>
                            <input
                                type="time"
                                id="endTime"
                                name="endTime"
                                value={currentSlot.endTime}
                                onChange={(e) => handleInputChange('endTime', e.target.value)}
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={toggleShowForm} className="button-link-outline" disabled={isSubmitting}>
                            Abbrechen
                        </button>
                        <button type="submit" className="button-link" disabled={isSubmitting}>
                            {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />}
                            {isEditing ? ' Änderungen speichern' : ' Blockade erstellen'}
                        </button>
                    </div>
                </form>
            )}

            <hr className="dashboard-section-hr" />

            {isLoading && !showForm && <div className="loading-message"><FontAwesomeIcon icon={faSpinner} spin /> Lade Blockaden...</div>}
            {listError && <p className="form-message error"><FontAwesomeIcon icon={faExclamationCircle} /> {listError}</p>}
            {successMessage && !formError && (
                <p className="form-message success mb-3">
                    <FontAwesomeIcon icon={faCheckCircle} /> {successMessage}
                </p>
            )}

            {!isLoading && !listError && blockedSlots.length === 0 && !showForm && (
                <p className="text-center text-gray-600 py-4">Keine Blockaden vorhanden.</p>
            )}

            {!isLoading && !listError && blockedSlots.length > 0 && (
                <div className="table-responsive-container">
                    <table className="app-table blocked-slots-table">
                        <thead>
                        <tr>
                            <th>Beschreibung</th>
                            <th>Typ</th>
                            <th>Datum/Tag</th>
                            <th>Start</th>
                            <th>Ende</th>
                            <th>Aktionen</th>
                        </tr>
                        </thead>
                        <tbody>
                        {blockedSlots.sort((a,b) => { // Sortierung verwendet jetzt isRecurring (das vom Backend als repeating kam)
                            if (a.isRecurring && !b.isRecurring) return -1;
                            if (!a.isRecurring && b.isRecurring) return 1;
                            if (a.isRecurring && b.isRecurring) {
                                return daysOfWeek.indexOf(a.recurringDayOfWeek) - daysOfWeek.indexOf(b.recurringDayOfWeek);
                            }
                            try {
                                const dateA = a.specificDate ? new Date(a.specificDate.split('T')[0]).getTime() : 0;
                                const dateB = b.specificDate ? new Date(b.specificDate.split('T')[0]).getTime() : 0;
                                if (dateA !== dateB) return dateA - dateB;
                            } catch(e) {
                                console.warn("Fehler beim Parsen des Datums für Sortierung in BlockedTimeSlotManager:", a.specificDate, b.specificDate, e);
                            }
                            return (a.startTime || "").localeCompare(b.startTime || "");
                        }).map(slot => (
                            <tr key={slot.id}>
                                <td data-label="Beschreibung:">{slot.description}</td>
                                <td data-label="Typ:">{slot.isRecurring ? "Wiederkehrend" : "Einmalig"}</td>
                                <td data-label="Datum/Tag:">{slot.isRecurring ? germanDays[slot.recurringDayOfWeek] : formatDate(slot.specificDate)}</td>
                                <td data-label="Start:">{slot.startTime}</td>
                                <td data-label="Ende:">{slot.endTime}</td>
                                <td data-label="Aktionen:">
                                    <div className="action-buttons-table">
                                        <button onClick={() => handleEdit(slot)} className="button-link-outline small-button icon-button" title="Blockade bearbeiten">
                                            <FontAwesomeIcon icon={faEdit} />
                                            <span className="button-text-desktop">Bearbeiten</span>
                                        </button>
                                        <button onClick={() => handleDeleteClick(slot)} className="button-link-outline small-button danger icon-button" title="Blockade löschen">
                                            <FontAwesomeIcon icon={faTrashAlt} />
                                            <span className="button-text-desktop">Löschen</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
            <ConfirmModal
                isOpen={showConfirmDeleteModal}
                onClose={() => { setShowConfirmDeleteModal(false); setSlotToDelete(null); }}
                onConfirm={confirmDelete}
                title="Blockade löschen"
                message={`Möchten Sie die Blockade "${slotToDelete?.description}" wirklich löschen?`}
                confirmText="Ja, löschen"
                type="danger"
            />
        </div>
    );
}

export default BlockedTimeSlotManager;