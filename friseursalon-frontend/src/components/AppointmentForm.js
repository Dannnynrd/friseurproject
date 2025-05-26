import React, { useState, useEffect } from 'react';
import api from '../services/api.service';
import AuthService from '../services/auth.service';


// initialService, onRegisterAttempt, currentUser als Props
function AppointmentForm({ onAppointmentAdded, initialService, onRegisterAttempt, currentUser, onLoginSuccess, selectedService, selectedDate, selectedTime }) {
    const [services, setServices] = useState([]);
    // HIER SIND DIE FEHLENDEN STATE-DEKLARATIONEN
    const [selectedServiceId, setSelectedServiceId] = useState(''); // Muss deklariert sein

    const [firstName, setFirstName] = useState(currentUser?.firstName || '');
    const [lastName, setLastName] = useState(currentUser?.lastName || '');
    const [email, setEmail] = useState(currentUser?.email || '');
    const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');

    const [password, setPassword] = useState(''); // Passwortfeld für Registrierung während der Buchung

    // HIER SIND DIE FEHLENDEN STATE-DEKLARATIONEN
    const [date, setDate] = useState(''); // Muss deklariert sein
    const [time, setTime] = useState(''); // Muss deklariert sein
    const [notes, setNotes] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (currentUser) {
            setFirstName(currentUser.firstName || '');
            setLastName(currentUser.lastName || '');
            setEmail(currentUser.email || '');
            setPhoneNumber(currentUser.phoneNumber || '');
        } else {
            setFirstName('');
            setLastName('');
            setEmail('');
            setPhoneNumber('');
        }

        // initialService wird jetzt direkt in BookingPage gehandhabt, aber wir brauchen services zum Mappen
        // Hier setzen wir selectedServiceId nur, wenn selectedService als Prop übergeben wird
        if (selectedService) {
            setSelectedServiceId(selectedService.id.toString());
        }
        // Setze Datum und Uhrzeit aus Props
        if (selectedDate) {
            setDate(selectedDate);
        }
        if (selectedTime) {
            setTime(selectedTime);
        }

    }, [initialService, services, currentUser, selectedService, selectedDate, selectedTime]); // Abhängigkeiten aktualisiert

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await api.get('services');
                setServices(response.data);
                // Setze initialServiceId, falls selectedService als Prop kommt und Services geladen sind
                if (selectedService && response.data.length > 0) {
                    const serviceToSelect = response.data.find(s => s.id === selectedService.id);
                    if (serviceToSelect) {
                        setSelectedServiceId(serviceToSelect.id.toString());
                    }
                }
            } catch (error) {
                console.error("Fehler beim Laden der Dienstleistungen:", error);
                setMessage('Fehler beim Laden der Dienstleistungen.');
            }
        };
        fetchServices();
    }, [selectedService]);


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedService || !selectedDate || !selectedTime || !firstName || !lastName || !email) {
            setMessage('Bitte füllen Sie alle erforderlichen Felder aus.');
            return;
        }
        if (!currentUser && !password) {
            setMessage('Bitte legen Sie ein Passwort für Ihr neues Konto fest.');
            return;
        }


        const dateTimeString = `${selectedDate}T${selectedTime}:00`;

        try {
            const newAppointment = {
                startTime: dateTimeString,
                service: { id: selectedService.id },
                customer: {
                    firstName,
                    lastName,
                    email,
                    phoneNumber
                },
                notes
            };

            const appointmentResponse = await api.post('appointments', newAppointment);

            setMessage(`Termin erfolgreich gebucht für ${firstName} ${lastName} mit Dienstleistung "${selectedService.name}" am ${new Date(appointmentResponse.data.startTime).toLocaleString('de-DE')}.`);

            if (!currentUser && password) {
                try {
                    await AuthService.register(firstName, lastName, email, password, phoneNumber, ["user"]);
                    await AuthService.login(email, password);
                    onLoginSuccess();
                    setMessage(prevMsg => `${prevMsg} Ihr Konto wurde erstellt und Sie sind jetzt angemeldet!`);
                } catch (regLoginError) {
                    console.error("Fehler bei Registrierung/Login nach Buchung:", regLoginError);
                    if (regLoginError.response && regLoginError.response.status === 409) {
                        setMessage(`Fehler: ${regLoginError.response.data.message || 'Diese E-Mail ist bereits registriert. Bitte melden Sie sich an oder verwenden Sie eine andere E-Mail.'}`);
                    } else {
                        setMessage(prevMsg => `${prevMsg} Fehler bei der Kontoerstellung/Anmeldung: ${regLoginError.message}`);
                    }
                }
            }

            setSelectedServiceId('');
            setFirstName(currentUser?.firstName || '');
            setLastName(currentUser?.lastName || '');
            setEmail(currentUser?.email || '');
            setPhoneNumber(currentUser?.phoneNumber || '');
            setDate('');
            setTime('');
            setNotes('');
            setPassword('');

            onAppointmentAdded();
        } catch (error) {
            console.error("Fehler beim Buchen des Termins:", error);
            if (error.response && error.response.status === 400) {
                setMessage('Fehler bei der Anfrage: Bitte überprüfen Sie Ihre Eingaben (z.B. Datums-/Zeitformat, fehlende IDs).');
            } else if (error.response && error.response.status === 401) {
                setMessage('Anmeldung erforderlich, um diesen Vorgang abzuschließen. Bitte melden Sie sich an.');
            } else if (error.response && error.response.status === 409) {
                setMessage(`Fehler: ${error.response.data.message || 'Diese E-Mail ist bereits registriert. Bitte melden Sie sich an oder verwenden Sie eine andere E-Mail.'}`);
            } else {
                setMessage('Fehler beim Buchen des Termins. Bitte versuchen Sie es erneut.');
            }
        }
    };

    return (
        <div className="appointment-form-container p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-serif text-gray-800 mb-4 text-center">Ihre Daten</h2>
            <p className="text-gray-600 mb-6 text-center">Bitte überprüfen oder ergänzen Sie Ihre Daten für die Buchung.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                    <label htmlFor="firstName" className="block text-gray-700 text-sm font-bold mb-2">Vorname:</label>
                    <input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                        disabled={!!currentUser}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="lastName">Nachname:</label>
                    <input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                        disabled={!!currentUser}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">E-Mail:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                        disabled={!!currentUser}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="phoneNumber">Telefonnummer:</label>
                    <input
                        type="tel"
                        id="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        disabled={!!currentUser}
                    />
                </div>

                {!currentUser && (
                    <div className="form-group">
                        <label htmlFor="password">Passwort festlegen (für Konto):</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                )}

                {/* Termin-Datum und -Uhrzeit (jetzt nur noch als Info, da in BookingPage ausgewählt) */}
                <div className="form-group">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Ausgewählte Dienstleistung:</label>
                    <p className="text-gray-800">{selectedService?.name} ({selectedService?.price?.toFixed(2)} € / {selectedService?.durationMinutes} Min)</p>
                </div>
                <div className="form-group">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Ausgewähltes Datum & Uhrzeit:</label>
                    <p className="text-gray-800">{selectedDate?.toLocaleDateString('de-DE')} um {selectedTime}</p>
                </div>


                <div className="form-group">
                    <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">Notizen (optional):</label>
                    <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24 resize-none"
                    ></textarea>
                </div>

                <button type="submit" className="bg-accent-color hover:bg-accent-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full">Termin buchen</button>
            </form>
            {message && <p className="text-center text-red-500 mt-4">{message}</p>}
        </div>
    );
}

export default AppointmentForm;
