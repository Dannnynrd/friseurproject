import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const AppointmentForm = forwardRef(({
                                        currentUser,
                                        initialData,
                                        onFormSubmit,
                                    }, ref) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [notes, setNotesState] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    useImperativeHandle(ref, () => ({
        triggerSubmitAndGetData: () => {
            setMessage({ type: '', text: '' });
            if (!firstName.trim() || !lastName.trim() || !email.trim()) {
                setMessage({ type: 'error', text: 'Bitte füllen Sie Vorname, Nachname und E-Mail aus.' });
                return null;
            }
            if (!currentUser && !password.trim()) {
                setMessage({ type: 'error', text: 'Als neuer Kunde legen Sie bitte ein Passwort für Ihr Konto fest.' });
                return null;
            }
            if (!currentUser && password.trim().length < 6) {
                setMessage({ type: 'error', text: 'Das Passwort muss mindestens 6 Zeichen lang sein.' });
                return null;
            }
            return {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                phoneNumber: phoneNumber.trim(),
                password: !currentUser ? password.trim() : '',
                notes: notes.trim(),
            };
        }
    }));

    useEffect(() => {
        const effectiveInitialData = initialData || {};
        if (currentUser) {
            setFirstName(currentUser.firstName || effectiveInitialData.firstName || '');
            setLastName(currentUser.lastName || effectiveInitialData.lastName || '');
            setEmail(currentUser.email || effectiveInitialData.email || '');
            setPhoneNumber(currentUser.phoneNumber || effectiveInitialData.phoneNumber || '');
            setPassword('');
            setNotesState(effectiveInitialData.notes || ''); // Notizen aus initialData, falls vorhanden, sonst leer
        } else {
            setFirstName(effectiveInitialData.firstName || '');
            setLastName(effectiveInitialData.lastName || '');
            setEmail(effectiveInitialData.email || '');
            setPhoneNumber(effectiveInitialData.phoneNumber || '');
            setPassword(effectiveInitialData.password || '');
            setNotesState(effectiveInitialData.notes || '');
        }
    }, [currentUser, initialData]);

    const handleFormInternalSubmit = (e) => {
        if (e) e.preventDefault();
        const formData = ref.current?.triggerSubmitAndGetData();
        if(formData && onFormSubmit) { // Nur aufrufen, wenn Validierung erfolgreich war
            onFormSubmit(formData);
        }
    };

    return (
        <div className="appointment-form-fields">
            <form onSubmit={handleFormInternalSubmit} className="space-y-form" id="appointment-data-form">
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="firstName">Vorname*</label>
                        <input
                            type="text"
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                            disabled={!!currentUser && !!currentUser.firstName}
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
                <button type="submit" style={{ display: 'none' }} aria-hidden="true">Submit Form</button>
            </form>
        </div>
    );
});

export default AppointmentForm;
