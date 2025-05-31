import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const AppointmentForm = forwardRef(({
                                        currentUser,
                                        initialData,
                                        onFormSubmit, // Prop, um das Formular von außen abzusenden (optional)
                                    }, ref) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState(''); // Nur für Neukunden ohne currentUser
    const [notes, setNotesState] = useState(''); // Umbenannt von setNotes zu setNotesState, um Konflikt zu vermeiden
    const [message, setMessage] = useState({ type: '', text: '' }); // Für Validierungsnachrichten

    // Hilfsfunktion zur E-Mail-Validierung
    const isValidEmail = (emailToValidate) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(emailToValidate);
    };

    // useImperativeHandle, um eine Methode von außen aufrufbar zu machen (z.B. von BookingPage)
    useImperativeHandle(ref, () => ({
        triggerSubmitAndGetData: () => {
            setMessage({ type: '', text: '' }); // Fehlermeldung bei jedem Versuch zurücksetzen

            if (!firstName.trim() || !lastName.trim() || !email.trim()) {
                setMessage({ type: 'error', text: 'Bitte füllen Sie Vorname, Nachname und E-Mail aus.' });
                return null;
            }
            if (!isValidEmail(email.trim())) {
                setMessage({ type: 'error', text: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' });
                return null;
            }
            if (!currentUser && !password.trim()) { // Passwort nur für Neukunden erforderlich
                setMessage({ type: 'error', text: 'Als neuer Kunde legen Sie bitte ein Passwort für Ihr Konto fest.' });
                return null;
            }
            if (!currentUser && password.trim().length < 6) { // Passwortlänge prüfen
                setMessage({ type: 'error', text: 'Das Passwort muss mindestens 6 Zeichen lang sein.' });
                return null;
            }

            // Wenn alles gültig ist, Datenobjekt zurückgeben
            return {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                phoneNumber: phoneNumber.trim(),
                password: !currentUser ? password.trim() : '', // Passwort nur wenn kein currentUser
                notes: notes.trim(),
            };
        }
    }));

    useEffect(() => {
        // Setze initiale Werte basierend auf currentUser oder initialData
        const effectiveInitialData = initialData || {};
        if (currentUser) {
            setFirstName(currentUser.firstName || effectiveInitialData.firstName || '');
            setLastName(currentUser.lastName || effectiveInitialData.lastName || '');
            setEmail(currentUser.email || effectiveInitialData.email || '');
            setPhoneNumber(currentUser.phoneNumber || effectiveInitialData.phoneNumber || '');
            setPassword(''); // Kein Passwortfeld für eingeloggte Benutzer
            setNotesState(effectiveInitialData.notes || '');
        } else {
            // Für Gäste oder neue Benutzer aus AppointmentCreateModal
            setFirstName(effectiveInitialData.firstName || '');
            setLastName(effectiveInitialData.lastName || '');
            setEmail(effectiveInitialData.email || '');
            setPhoneNumber(effectiveInitialData.phoneNumber || '');
            setPassword(effectiveInitialData.password || ''); // Passwortfeld für Neukunden
            setNotesState(effectiveInitialData.notes || '');
        }
    }, [currentUser, initialData]);

    // Diese Funktion wird benötigt, wenn das Formular ein eigenes Submit-Button hätte
    // oder wenn onFormSubmit direkt durch das Formular ausgelöst werden soll.
    // In deinem Fall wird es meist durch triggerSubmitAndGetData von außen gesteuert.
    const handleFormInternalSubmit = (e) => {
        if (e) e.preventDefault(); // Verhindert Standard-Formular-Submit
        const formData = ref.current?.triggerSubmitAndGetData();
        if(formData && onFormSubmit) {
            onFormSubmit(formData); // Ruft die übergebene onFormSubmit-Funktion auf
        }
    };


    // CSS-Klassen aus Tailwind oder deinem globalen CSS für einheitliches Styling
    const formInputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
    const formLabelClass = "block text-sm font-medium text-gray-700";
    const formHintClass = "mt-1 text-xs text-gray-500";

    return (
        <div className="appointment-form-fields"> {/* Hauptcontainer für Styling über CSS-Modul oder global */}
            {/* Das <form>-Tag ist nützlich für Semantik und Zugänglichkeit, auch wenn der Submit programmatisch erfolgt */}
            <form onSubmit={handleFormInternalSubmit} className="space-y-4 md:space-y-5" id="appointment-data-form"> {/* Tailwind für Abstände */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5"> {/* Tailwind für Grid-Layout */}
                    <div> {/* Gruppe für Vorname */}
                        <label htmlFor="firstName" className={formLabelClass}>Vorname*</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            className={formInputClass}
                            disabled={!!currentUser && !!currentUser.firstName} // Deaktiviert, wenn currentUser vorhanden und Feld gesetzt
                        />
                    </div>
                    <div> {/* Gruppe für Nachname */}
                        <label htmlFor="lastName" className={formLabelClass}>Nachname*</label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                            className={formInputClass}
                            disabled={!!currentUser && !!currentUser.lastName}
                        />
                    </div>
                </div>

                <div> {/* Gruppe für E-Mail */}
                    <label htmlFor="email" className={formLabelClass}>E-Mail*</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={formInputClass}
                        disabled={!!currentUser && !!currentUser.email}
                    />
                </div>

                <div> {/* Gruppe für Telefonnummer */}
                    <label htmlFor="phoneNumber" className={formLabelClass}>Telefonnummer (optional)</label>
                    <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className={formInputClass}
                        disabled={!!currentUser && !!currentUser.phoneNumber}
                        placeholder="Für Rückfragen oder Terminänderungen"
                    />
                </div>

                {/* Passwortfeld nur anzeigen, wenn kein currentUser (also Gast/Neukunde) */}
                {!currentUser && (
                    <div>
                        <label htmlFor="password" className={formLabelClass}>Passwort für neues Konto*</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required={!currentUser} // Nur erforderlich, wenn kein currentUser
                            className={formInputClass}
                            placeholder="Mindestens 6 Zeichen"
                        />
                        <p className={formHintClass}>Wird benötigt, um Ihre Buchungen später zu verwalten.</p>
                    </div>
                )}

                <div> {/* Gruppe für Anmerkungen */}
                    <label htmlFor="notes" className={formLabelClass}>Anmerkungen (optional)</label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={notes}
                        onChange={(e) => setNotesState(e.target.value)}
                        rows="3"
                        className={formInputClass}
                        placeholder="Haben Sie spezielle Wünsche oder Informationen für uns?"
                    />
                </div>

                {/* Nachrichtenanzeige für Validierungsfehler oder Erfolg */}
                {message.text && (
                    <p className={`p-3 rounded-md text-sm text-center ${
                        message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                                'bg-blue-50 text-blue-700 border border-blue-200' // Default für 'info'
                    }`}>
                        <FontAwesomeIcon
                            icon={message.type === 'success' ? faCheckCircle : (message.type === 'info' ? faInfoCircle : faExclamationCircle)}
                            className="mr-2"
                        />
                        {message.text}
                    </p>
                )}

                {/* Versteckter Submit-Button, falls das Formular explizit per Enter abgeschickt werden soll
                    oder wenn onFormSubmit direkt durch einen Button im Formular getriggert werden soll. */}
                <button type="submit" style={{ display: 'none' }} aria-hidden="true">Formular absenden</button>
            </form>
        </div>
    );
});

export default AppointmentForm;
