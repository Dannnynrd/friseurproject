import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCheckCircle, faExclamationCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
// api und AuthService werden hier nicht mehr direkt für den Submit benötigt

function AppointmentForm({
                             currentUser,
                             initialData, // Wird von BookingPage übergeben, um Felder vorzufüllen (firstName, lastName, etc.)
                             onFormSubmit, // Callback, um die gesammelten Daten an BookingPage zu senden
                         }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [notes, setNotesState] = useState('');

    const [message, setMessage] = useState({ type: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setFirstName(currentUser.firstName || '');
            setLastName(currentUser.lastName || '');
            setEmail(currentUser.email || '');
            setPhoneNumber(currentUser.phoneNumber || '');
            setPassword('');
            // Notizen aus initialData übernehmen, auch wenn currentUser vorhanden ist,
            // falls der User zurück navigiert und Notizen bereits eingegeben hatte.
            setNotesState(initialData?.notes || '');
        } else if (initialData) {
            setFirstName(initialData.firstName || '');
            setLastName(initialData.lastName || '');
            setEmail(initialData.email || '');
            setPhoneNumber(initialData.phoneNumber || '');
            setPassword(initialData.password || '');
            setNotesState(initialData.notes || '');
        } else {
            // Reset für komplett neue Eingabe ohne initialData
            setFirstName('');
            setLastName('');
            setEmail('');
            setPhoneNumber('');
            setPassword('');
            setNotesState('');
        }
    }, [currentUser, initialData]);


    const handleInternalSubmit = (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!firstName.trim() || !lastName.trim() || !email.trim()) {
            setMessage({ type: 'error', text: 'Bitte füllen Sie Vorname, Nachname und E-Mail aus.' });
            return;
        }
        if (!currentUser && !password.trim()) {
            setMessage({ type: 'error', text: 'Als neuer Kunde legen Sie bitte ein Passwort für Ihr Konto fest.' });
            return;
        }
        if (!currentUser && password.trim().length < 6) {
            setMessage({ type: 'error', text: 'Das Passwort muss mindestens 6 Zeichen lang sein.' });
            return;
        }

        setIsSubmitting(true);

        onFormSubmit({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phoneNumber: phoneNumber.trim(),
            password: !currentUser ? password.trim() : '',
            notes: notes.trim(),
        });
        // setIsSubmitting(false) hier nicht setzen, da der Parent den Step wechselt
    };

    return (
        <div className="appointment-form-fields">
            <form onSubmit={handleInternalSubmit} className="space-y-form">
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="firstName">Vorname*</label>
                        <input
                            type="text"
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            disabled={!!currentUser && !!currentUser.firstName} // Nur deaktivieren, wenn Wert vom eingeloggten User kommt
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
                            disabled={!!currentUser && !!currentUser.lastName}
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
                        disabled={!!currentUser && !!currentUser.email}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="phoneNumber">Telefonnummer (optional)</label>
                    <input
                        type="tel"
                        id="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={!!currentUser && !!currentUser.phoneNumber}
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
                            required={!currentUser}
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
                        onChange={(e) => setNotesState(e.target.value)}
                        rows="3"
                        placeholder="Haben Sie spezielle Wünsche oder Informationen für uns?"
                    />
                </div>

                {message.text && (
                    <p className={`form-message ${message.type} text-center`}>
                        <FontAwesomeIcon icon={message.type === 'success' ? faCheckCircle : (message.type === 'info' ? faInfoCircle : faExclamationCircle)} />
                        {message.text}
                    </p>
                )}

                <button
                    type="submit"
                    className="button-link submit-appointment-button"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <><FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Wird verarbeitet...</>
                    ) : (
                        "Weiter zur Zusammenfassung"
                    )}
                </button>
            </form>
        </div>
    );
}

export default AppointmentForm;
