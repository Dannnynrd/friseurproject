import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCheckCircle, faExclamationCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons'; // faInfoCircle für alle Fälle importiert
import api from '../services/api.service';
import AuthService from '../services/auth.service';

function AppointmentForm({
                             onAppointmentBooked,
                             currentUser,
                             onRegisterAttempt,
                             onLoginSuccess,
                             selectedServiceProp,
                             selectedDateProp,
                             selectedTimeProp,
                             initialNotes,
                             onNotesChange
                         }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [notes, setNotesState] = useState(initialNotes || '');

    const [message, setMessage] = useState({ type: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setFirstName(currentUser.firstName || '');
            setLastName(currentUser.lastName || '');
            setEmail(currentUser.email || '');
            setPhoneNumber(currentUser.phoneNumber || '');
            setPassword('');
        } else {
            setFirstName('');
            setLastName('');
            setEmail('');
            setPhoneNumber('');
            setPassword('');
        }
        setNotesState(initialNotes || '');
    }, [currentUser, initialNotes]);

    const handleNotesChangeInternal = (e) => {
        const newNotes = e.target.value;
        setNotesState(newNotes);
        if (onNotesChange) {
            onNotesChange(newNotes);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!selectedServiceProp || !selectedDateProp || !selectedTimeProp) {
            setMessage({ type: 'error', text: 'Fehler: Dienstleistung, Datum oder Uhrzeit fehlen. Bitte gehen Sie zurück.' });
            return;
        }

        if (!firstName.trim() || !lastName.trim() || !email.trim()) {
            setMessage({ type: 'error', text: 'Bitte füllen Sie Vorname, Nachname und E-Mail aus.' });
            return;
        }
        if (!currentUser && !password.trim()) {
            setMessage({ type: 'error', text: 'Als neuer Kunde legen Sie bitte ein Passwort für Ihr Konto fest.' });
            return;
        }
        if (!currentUser && password.trim() && password.length < 6) {
            setMessage({ type: 'error', text: 'Das Passwort muss mindestens 6 Zeichen lang sein.' });
            return;
        }

        setIsSubmitting(true);

        const year = selectedDateProp.getFullYear();
        const month = String(selectedDateProp.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDateProp.getDate()).padStart(2, '0');
        const dateTimeString = `${year}-${month}-${day}T${selectedTimeProp}:00`;

        const appointmentData = {
            startTime: dateTimeString,
            service: { id: parseInt(selectedServiceProp.id) },
            customer: {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                phoneNumber: phoneNumber.trim() || null,
            },
            notes: notes.trim(),
        };

        let userRegisteredAndLoggedIn = false;

        if (!currentUser && password && onRegisterAttempt) {
            const registrationSuccessful = await onRegisterAttempt(email.trim(), firstName.trim(), lastName.trim(), phoneNumber.trim(), password);
            if (!registrationSuccessful) {
                setIsSubmitting(false);
                return;
            }
            try {
                const loginData = await AuthService.login(email.trim(), password);
                if (loginData.token && onLoginSuccess) {
                    onLoginSuccess();
                    userRegisteredAndLoggedIn = true;
                }
            } catch (loginError) {
                console.warn("Automatischer Login nach Registrierung fehlgeschlagen:", loginError);
                // Die Nachricht über erfolgreiche Registrierung, aber fehlgeschlagenen Login
                // wird idealerweise in BookingPage gesetzt, da dort der Kontext (z.B. currentUser) aktualisiert wird.
                // Hier setzen wir eine Fallback-Nachricht, falls onLoginSuccess keine eigene Nachricht setzt.
                if (!message.text) { // Nur setzen, wenn nicht schon eine spezifischere Nachricht von onRegisterAttempt kam
                    setMessage({type: 'info', text: 'Konto erstellt. Automatischer Login fehlgeschlagen. Bitte loggen Sie sich ein, um Ihre Buchungen zu sehen.'});
                }
            }
        }

        try {
            await api.post('/appointments', appointmentData);
            if (onAppointmentBooked) {
                onAppointmentBooked(); // Navigiert zu Schritt 4 in BookingPage
            }
            // Formular-Reset ist nicht mehr nötig, da die Komponente bei Erfolg durch Step-Wechsel unmounted wird
            // oder die übergeordnete Komponente den Reset übernimmt.
        } catch (error) {
            console.error("Fehler beim Buchen des Termins:", error);
            let errorMsg = "Ein Fehler ist beim Buchen des Termins aufgetreten. Bitte versuchen Sie es erneut.";
            if (error.response) {
                errorMsg = error.response.data?.message || errorMsg;
                if (error.response.status === 409 && !userRegisteredAndLoggedIn) {
                    errorMsg = `${errorMsg} Diese E-Mail ist bereits registriert. Bitte melden Sie sich an.`;
                } else if (userRegisteredAndLoggedIn && error.response.status !== 409) {
                    errorMsg = `Ihr Konto wurde erstellt, aber die Terminbuchung schlug fehl: ${errorMsg}`;
                }
            }
            setMessage({ type: 'error', text: errorMsg });
            setIsSubmitting(false); // Wichtig, um den Button wieder freizugeben
        }
        // setIsSubmitting(false) wird im Erfolgsfall nicht hier gesetzt, da onAppointmentBooked navigiert
    };

    return (
        // Die Klasse "appointment-form-container" wird nicht mehr benötigt,
        // da das Styling über die globalen .form-group etc. in App.css erfolgt.
        // Der äußere Container ist .appointment-form-fields in BookingPage.js
        <div className="appointment-form-fields">
            {/* Die Überschrift "Ihre Daten" wird jetzt in BookingPage.js gerendert */}
            {/* <p className="text-gray-600 mb-6 text-center">Bitte überprüfen oder ergänzen Sie Ihre Daten für die Buchung.</p> */}

            <form onSubmit={handleSubmit} className="space-y-form">
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="firstName">Vorname*</label>
                        <input
                            type="text"
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            disabled={!!currentUser}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="lastName">Nachname*</label>
                        <input
                            type="text"
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            disabled={!!currentUser}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="email">E-Mail*</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={!!currentUser}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="phoneNumber">Telefonnummer (optional)</label>
                    <input
                        type="tel"
                        id="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={!!currentUser}
                        placeholder="Für Rückfragen oder Terminänderungen"
                    />
                </div>

                {!currentUser && (
                    <div className="form-group">
                        <label htmlFor="password">Passwort für neues Konto*</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Mindestens 6 Zeichen"
                        />
                        <p className="form-hint">Wird benötigt, um Ihre Buchungen später zu verwalten.</p>
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="notes">Anmerkungen (optional)</label>
                    <textarea
                        id="notes"
                        value={notes}
                        onChange={handleNotesChangeInternal} // Interne Handler-Funktion verwenden
                        rows="3"
                        placeholder="Haben Sie spezielle Wünsche oder Informationen für uns?"
                    />
                </div>

                {message.text && (
                    <p className={`form-message ${message.type} text-center`}> {/* text-center hinzugefügt */}
                        <FontAwesomeIcon icon={message.type === 'success' ? faCheckCircle : (message.type === 'info' ? faInfoCircle : faExclamationCircle)} />
                        {message.text}
                    </p>
                )}

                <button
                    type="submit"
                    className="button-link submit-appointment-button" // Standard Button-Styling
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <><FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Termin wird gebucht...</>
                    ) : (
                        "Termin verbindlich buchen"
                    )}
                </button>
            </form>
        </div>
    );
}

export default AppointmentForm;
