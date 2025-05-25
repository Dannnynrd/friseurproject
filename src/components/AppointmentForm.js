import React, { useState, useEffect } from 'react';
import api from '../services/api.service'; // WICHTIG: Hier api importieren


// initialService, onRegisterAttempt, currentUser als Props
function AppointmentForm({ onAppointmentAdded, initialService, onRegisterAttempt, currentUser }) {
    const [services, setServices] = useState([]);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [firstName, setFirstName] = useState(currentUser ? currentUser.firstName : '');
    const [lastName, setLastName] = useState(currentUser ? currentUser.lastName : '');
    const [email, setEmail] = useState(currentUser ? currentUser.email : '');
    const [phoneNumber, setPhoneNumber] = useState(currentUser ? currentUser.phoneNumber : '');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');
    const [message, setMessage] = useState('');

    // NEU: useEffect zum Setzen des initialen Services und evtl. Kundeninfos
    useEffect(() => {
        // Initialer Service aus URL-Parameter
        if (initialService && services.length > 0) {
            const serviceToSelect = services.find(s => s.name === initialService);
            if (serviceToSelect) {
                setSelectedServiceId(serviceToSelect.id.toString());
            }
        }
        // Vorausfüllen der Kundendaten, wenn angemeldet
        if (currentUser) {
            // Achtung: currentUser hat nur username, email, id, roles. Keine firstName, lastName, phoneNumber.
            // Diese müssten separat im User-Modell gespeichert werden, um sie hier vorab zu befüllen.
            // Fürs Erste lassen wir es leer, oder füllen nur E-Mail aus, falls sie im User-Objekt wäre.
            // Falls du firstName/lastName im User-Objekt speichern möchtest, musst du die User-Entität und JWT Response anpassen.
            // Beispiel: setFirstName(currentUser.firstName || '');
            setEmail(currentUser.email || ''); // E-Mail ist im currentUser vorhanden
        }
    }, [initialService, services, currentUser]);


    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await api.get('services');
                setServices(response.data);
                // Setze initialService nach dem Laden der Services
                if (initialService && response.data.length > 0) {
                    const serviceToSelect = response.data.find(s => s.name === initialService);
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
    }, [initialService]); // initialService als Abhängigkeit, um es beim ersten Laden zu prüfen


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedServiceId || !firstName || !lastName || !email || !date || !time) {
            setMessage('Bitte füllen Sie alle erforderlichen Felder aus (Dienstleistung, Vorname, Nachname, E-Mail, Datum, Uhrzeit).');
            return;
        }

        const dateTimeString = `${date}T${time}:00`;

        try {
            const newAppointment = {
                startTime: dateTimeString,
                service: { id: parseInt(selectedServiceId) },
                customer: {
                    firstName,
                    lastName,
                    email,
                    phoneNumber
                },
                notes
            };

            const appointmentResponse = await api.post('appointments', newAppointment);

            setMessage(`Termin erfolgreich gebucht für ${firstName} ${lastName} mit Dienstleistung "${appointmentResponse.data.service.name}" am ${new Date(appointmentResponse.data.startTime).toLocaleString()}.`);

            if (!currentUser && onRegisterAttempt) {
                onRegisterAttempt(email, firstName, lastName);
            }

            // Formularfelder zurücksetzen
            setSelectedServiceId('');
            setFirstName(currentUser ? (currentUser.firstName || '') : ''); // Nur zurücksetzen, wenn nicht vorab befüllt
            setLastName(currentUser ? (currentUser.lastName || '') : '');
            setEmail(currentUser ? (currentUser.email || '') : '');
            setPhoneNumber(currentUser ? (currentUser.phoneNumber || '') : '');
            setDate('');
            setTime('');
            setNotes('');
            onAppointmentAdded();

        } catch (error) {
            console.error("Fehler beim Buchen des Termins:", error);
            if (error.response && error.response.status === 400) {
                setMessage('Fehler bei der Anfrage: Bitte überprüfen Sie Ihre Eingaben (z.B. Datums-/Zeitformat, fehlende IDs).');
            } else {
                setMessage('Fehler beim Buchen des Termins. Bitte versuchen Sie es erneut.');
            }
        }
    };

    return (
        <div className="appointment-form-container">
            <h2>Termin buchen</h2>
            <form onSubmit={handleSubmit} className="appointment-form">
                <div className="form-group">
                    <label htmlFor="service">Dienstleistung:</label>
                    <select
                        id="service"
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                        required
                    >
                        <option value="">Bitte wählen Sie eine Dienstleistung</option>
                        {services.map(service => (
                            <option key={service.id} value={service.id}>
                                {service.name} ({service.durationMinutes} Min, {service.price.toFixed(2)} €)
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="firstName">Vorname:</label>
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
                    <label htmlFor="lastName">Nachname:</label>
                    <input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        disabled={!!currentUser}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">E-Mail:</label>
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
                    <label htmlFor="phoneNumber">Telefonnummer:</label>
                    <input
                        type="tel"
                        id="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={!!currentUser}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="date">Datum:</label>
                    <input
                        type="date"
                        id="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="time">Uhrzeit:</label>
                    <input
                        type="time"
                        id="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="notes">Notizen (optional):</label>
                    <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                </div>

                <button type="submit" className="submit-button">Termin buchen</button>
            </form>
            {message && <p className="form-message">{message}</p>}
        </div>
    );
}

export default AppointmentForm;