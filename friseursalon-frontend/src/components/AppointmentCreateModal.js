import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus, faTimes, faSpinner, faUserPlus, faConciergeBell } from '@fortawesome/free-solid-svg-icons';
import { format as formatDateFns, parseISO, addMinutes, isValid as isValidDate } from 'date-fns'; // isValid as isValidDate hinzugefügt

function AppointmentCreateModal({ isOpen, onClose, onAppointmentCreated, selectedSlot }) {
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [customerFirstName, setCustomerFirstName] = useState('');
    const [customerLastName, setCustomerLastName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhoneNumber, setCustomerPhoneNumber] = useState('');
    const [notes, setNotes] = useState('');

    const [availableServices, setAvailableServices] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Initialisiere Datum und Zeit basierend auf selectedSlot
    // Stelle sicher, dass selectedSlot und selectedSlot.start existieren und gültig sind
    const initialDate = selectedSlot && selectedSlot.start && isValidDate(new Date(selectedSlot.start))
        ? formatDateFns(new Date(selectedSlot.start), 'yyyy-MM-dd')
        : '';
    const initialTime = selectedSlot && selectedSlot.start && isValidDate(new Date(selectedSlot.start))
        ? formatDateFns(new Date(selectedSlot.start), 'HH:mm')
        : '';

    const [appointmentDate, setAppointmentDate] = useState(initialDate);
    const [appointmentTime, setAppointmentTime] = useState(initialTime);

    useEffect(() => {
        if (isOpen) {
            // Formularfelder zurücksetzen, wenn das Modal geöffnet wird
            setSelectedServiceId('');
            setCustomerFirstName('');
            setCustomerLastName('');
            setCustomerEmail('');
            setCustomerPhoneNumber('');
            setNotes('');
            setError('');
            setSuccessMessage('');

            // Datum und Zeit basierend auf dem ausgewählten Slot vorfüllen
            const newInitialDate = selectedSlot && selectedSlot.start && isValidDate(new Date(selectedSlot.start))
                ? formatDateFns(new Date(selectedSlot.start), 'yyyy-MM-dd')
                : '';
            const newInitialTime = selectedSlot && selectedSlot.start && isValidDate(new Date(selectedSlot.start))
                ? formatDateFns(new Date(selectedSlot.start), 'HH:mm')
                : '';
            setAppointmentDate(newInitialDate);
            setAppointmentTime(newInitialTime);

            // Dienstleistungen abrufen
            const fetchServices = async () => {
                setIsLoading(true);
                try {
                    const response = await api.get('/services');
                    setAvailableServices(response.data || []);
                } catch (err) {
                    console.error("Fehler beim Laden der Dienstleistungen für CreateModal:", err);
                    setError("Dienstleistungen konnten nicht geladen werden.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchServices();
        }
    }, [isOpen, selectedSlot]); // Abhängigkeiten für den useEffect

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        if (!selectedServiceId || !customerFirstName || !customerLastName || !customerEmail || !appointmentDate || !appointmentTime) {
            setError('Bitte alle Pflichtfelder ausfüllen (Dienstleistung, Kundenname, E-Mail, Datum, Uhrzeit).');
            setIsLoading(false);
            return;
        }

        const startTime = `${appointmentDate}T${appointmentTime}:00`;

        const appointmentData = {
            service: { id: parseInt(selectedServiceId) },
            customer: {
                firstName: customerFirstName,
                lastName: customerLastName,
                email: customerEmail,
                phoneNumber: customerPhoneNumber,
            },
            startTime: startTime,
            notes: notes,
        };

        console.log("Sende Termin-Daten:", appointmentData);

        try {
            await api.post('/appointments', appointmentData);
            setSuccessMessage('Termin erfolgreich erstellt!');
            if (onAppointmentCreated) {
                onAppointmentCreated();
            }
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            console.error("Fehler beim Erstellen des Termins:", err.response?.data || err.message);
            setError(err.response?.data?.message || 'Termin konnte nicht erstellt werden.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content appointment-create-modal-content">
                <div className="modal-header">
                    <h3><FontAwesomeIcon icon={faCalendarPlus} /> Neuen Termin erstellen</h3>
                    <button onClick={onClose} className="modal-close-button" disabled={isLoading}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="appointment-create-form">
                    <div className="form-section">
                        <h4><FontAwesomeIcon icon={faConciergeBell} /> Dienstleistung & Zeit</h4>
                        <div className="form-group">
                            <label htmlFor="createService">Dienstleistung *</label>
                            <select
                                id="createService"
                                value={selectedServiceId}
                                onChange={(e) => setSelectedServiceId(e.target.value)}
                                required
                                disabled={isLoading}
                            >
                                <option value="">Wählen...</option>
                                {availableServices.map(service => (
                                    <option key={service.id} value={service.id}>
                                        {service.name} ({service.durationMinutes} Min. - {service.price?.toFixed(2)} €)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-grid-halved">
                            <div className="form-group">
                                <label htmlFor="appointmentDate">Datum *</label>
                                <input
                                    type="date"
                                    id="appointmentDate"
                                    value={appointmentDate}
                                    onChange={(e) => setAppointmentDate(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="appointmentTime">Uhrzeit *</label>
                                <input
                                    type="time"
                                    id="appointmentTime"
                                    value={appointmentTime}
                                    onChange={(e) => setAppointmentTime(e.target.value)}
                                    required
                                    step="900"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h4><FontAwesomeIcon icon={faUserPlus} /> Kundendaten</h4>
                        <div className="form-grid-halved">
                            <div className="form-group">
                                <label htmlFor="customerFirstName">Vorname *</label>
                                <input type="text" id="customerFirstName" value={customerFirstName} onChange={(e) => setCustomerFirstName(e.target.value)} required disabled={isLoading} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="customerLastName">Nachname *</label>
                                <input type="text" id="customerLastName" value={customerLastName} onChange={(e) => setCustomerLastName(e.target.value)} required disabled={isLoading} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="customerEmail">E-Mail *</label>
                            <input type="email" id="customerEmail" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required disabled={isLoading} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="customerPhoneNumber">Telefon (optional)</label>
                            <input type="tel" id="customerPhoneNumber" value={customerPhoneNumber} onChange={(e) => setCustomerPhoneNumber(e.target.value)} disabled={isLoading} />
                        </div>
                    </div>

                    <div className="form-section">
                        <h4>Notizen (optional)</h4>
                        <div className="form-group">
                            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" disabled={isLoading}></textarea>
                        </div>
                    </div>

                    {error && <p className="form-message error small mt-3">{error}</p>}
                    {successMessage && <p className="form-message success small mt-3">{successMessage}</p>}

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="button-link-outline" disabled={isLoading}>
                            Abbrechen
                        </button>
                        <button type="submit" className="button-link" disabled={isLoading}>
                            {isLoading ? <><FontAwesomeIcon icon={faSpinner} spin /> Erstelle...</> : 'Termin erstellen'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AppointmentCreateModal;
