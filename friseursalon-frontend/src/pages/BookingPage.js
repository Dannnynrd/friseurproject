import React, { useState, useEffect, useCallback } from 'react';
// Alle 'import'-Anweisungen zuerst und gruppiert:
import { useParams, useNavigate, Link } from 'react-router-dom';
import DatePicker, { registerLocale, setDefaultLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { de } from 'date-fns/locale/de';
import api from '../services/api.service'; // Import für die konfigurierte Axios-Instanz
import AuthService from '../services/auth.service';
import AppointmentForm from '../components/AppointmentForm';

// Funktionsaufrufe NACH allen Imports:
registerLocale('de', de);
setDefaultLocale('de');

function BookingPage({ onAppointmentAdded, currentUser, onLoginSuccess }) {
    const { serviceName: initialServiceNameParam } = useParams();
    // initialService wird jetzt direkt aus dem dekodierten Parameter gesetzt oder ist null
    const [initialService, setInitialService] = useState(initialServiceNameParam ? decodeURIComponent(initialServiceNameParam) : null);
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState('');
    const [availableTimes, setAvailableTimes] = useState([]);
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [serviceError, setServiceError] = useState(null);
    const [registerMessage, setRegisterMessage] = useState('');

    // WICHTIG: 'notes' State-Variable definieren
    const [notes, setNotes] = useState('');

    // Effekt zum Laden der Dienstleistungen
    useEffect(() => {
        const fetchServices = async () => {
            setLoadingServices(true);
            setServiceError(null);
            try {
                const response = await api.get('/services'); // Korrekter API-Aufruf
                const fetchedServices = response.data || [];
                setServices(fetchedServices);

                if (initialService && fetchedServices.length > 0) {
                    const service = fetchedServices.find(s => s.name === initialService);
                    if (service) {
                        setSelectedService(service);
                        setStep(2);
                    } else {
                        console.warn(`Vorausgewählter Service "${initialService}" nicht in der geladenen Liste gefunden.`);
                        // Optional: initialService zurücksetzen, wenn nicht gefunden, um Verwirrung zu vermeiden
                        // setInitialService(null); // oder eine Fehlermeldung setzen
                    }
                }
            } catch (error) {
                console.error("Fehler beim Laden der Dienstleistungen:", error);
                setServiceError('Dienstleistungen konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
            } finally {
                setLoadingServices(false);
            }
        };
        fetchServices();
    }, [initialService]); // Abhängigkeit von initialService ist korrekt hier

    // Funktion zum Generieren von Zeit-Slots (Beispiel, muss ggf. an Backend angepasst werden)
    const generateTimeSlots = useCallback((serviceDurationMinutes) => {
        const slots = [];
        if (!selectedDate || !serviceDurationMinutes) return slots;

        const openingHour = 9; const closingHour = 18;
        const slotInterval = 30;
        const dayOfWeek = selectedDate.getDay();

        if (dayOfWeek === 0) return slots; // Sonntag geschlossen

        for (let hour = openingHour; hour < closingHour; hour++) {
            for (let minute = 0; minute < 60; minute += slotInterval) {
                const slotTime = new Date(selectedDate);
                slotTime.setHours(hour, minute, 0, 0);
                const endTime = new Date(slotTime.getTime() + serviceDurationMinutes * 60000);
                if (endTime.getHours() < closingHour || (endTime.getHours() === closingHour && endTime.getMinutes() === 0)) {
                    slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
                }
            }
        }
        return slots;
    }, [selectedDate]); // selectedDate als Abhängigkeit

    // Effekt zum Aktualisieren der verfügbaren Zeiten
    useEffect(() => {
        if (selectedDate && selectedService) {
            setAvailableTimes(generateTimeSlots(selectedService.durationMinutes));
        } else {
            setAvailableTimes([]);
        }
    }, [selectedDate, selectedService, generateTimeSlots]);

    // Callback für die Registrierung während der Buchung
    const handleRegisterDuringBooking = async (customerEmail, customerFirstName, customerLastName, customerPhoneNumber, password) => {
        setRegisterMessage('');
        try {
            // Hinweis: AuthService.register wurde in deinem Code nicht direkt verwendet,
            // aber wenn es für Gast-Registrierung gedacht ist, hier der Aufruf:
            await AuthService.register(customerFirstName, customerLastName, customerEmail, password, customerPhoneNumber, ["user"]);
            setRegisterMessage(`Konto für ${customerEmail} erstellt! Sie können sich jetzt anmelden.`);
            return true;
        } catch (error) {
            console.error("Fehler bei der Registrierung während der Buchung:", error);
            setRegisterMessage(`Fehler bei der Registrierung: ${error.response?.data?.message || error.message}`);
            return false;
        }
    };

    const isPastDate = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    // JSX Struktur (aus deinem "code vorher" übernommen und leicht angepasst)
    return (
        <div className="booking-page-container container"> {/* Globale Klasse aus App.css nutzen */}
            <div className="booking-form-container"> {/* Spezifischer Container für das Formular */}
                <h1 className="booking-page-main-heading">Termin buchen</h1>
                <p className="booking-page-subheading">Wählen Sie Ihre gewünschte Dienstleistung, Datum und Uhrzeit.</p>

                <div className="booking-step-indicators">
                    <div className={`booking-step-indicator ${step >= 1 ? 'active' : ''}`}><span>1</span>Dienstleistung</div>
                    <div className={`booking-step-indicator ${step >= 2 ? 'active' : ''}`}><span>2</span>Datum & Zeit</div>
                    <div className={`booking-step-indicator ${step >= 3 ? 'active' : ''}`}><span>3</span>Ihre Daten</div>
                </div>

                {serviceError && <p className="form-message error">{serviceError}</p>}

                {step === 1 && (
                    <div className="booking-step-content">
                        <h2 className="booking-step-heading">Dienstleistung auswählen</h2>
                        {loadingServices && <p className="text-center text-gray-600 mb-4">Dienstleistungen werden geladen...</p>}
                        {!loadingServices && !serviceError && services.length === 0 && (
                            <p className="form-message info">Aktuell sind keine Dienstleistungen online buchbar.</p>
                        )}
                        <div className="services-grid">
                            {services.map(service => (
                                <div
                                    key={service.id}
                                    onClick={() => { setSelectedService(service); setSelectedDate(null); setSelectedTime(''); setStep(2); }}
                                    className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
                                    role="button" tabIndex={0}
                                    onKeyPress={(e) => { if (e.key === 'Enter') { setSelectedService(service); setSelectedDate(null); setSelectedTime(''); setStep(2); }}}
                                >
                                    <h3 className="service-name">{service.name}</h3>
                                    <p className="service-description">{service.description}</p>
                                    <p className="service-details">
                                        {service.price.toFixed(2)} € / {service.durationMinutes} Min
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && selectedService && (
                    <div className="booking-step-content">
                        <h2 className="booking-step-heading">Datum & Uhrzeit für "{selectedService.name}"</h2>
                        <div className="datepicker-time-container">
                            <div className="datepicker-wrapper">
                                <h3 className="sub-heading">Datum wählen:</h3>
                                <DatePicker
                                    selected={selectedDate}
                                    onChange={(date) => { setSelectedDate(date); setSelectedTime(''); }}
                                    locale="de"
                                    dateFormat="dd.MM.yyyy"
                                    minDate={new Date()}
                                    filterDate={date => !isPastDate(date)}
                                    inline
                                    calendarClassName="booking-datepicker"
                                />
                            </div>
                            <div className="time-slots-wrapper">
                                <h3 className="sub-heading">Verfügbare Zeiten:</h3>
                                {selectedDate ? (
                                    availableTimes.length > 0 ? (
                                        <div className="time-slots-grid">
                                            {availableTimes.map(time => (
                                                <button
                                                    key={time} type="button"
                                                    onClick={() => setSelectedTime(time)}
                                                    className={`time-slot-button ${selectedTime === time ? 'selected' : ''}`}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="no-times-message">Keine Zeiten für diesen Tag verfügbar.</p>
                                    )
                                ) : (
                                    <p className="select-date-message">Bitte wählen Sie zuerst ein Datum.</p>
                                )}
                                {selectedTime && selectedDate && ( // Sicherstellen, dass selectedDate auch existiert
                                    <p className="selected-datetime-info">
                                        Ausgewählt: {selectedDate.toLocaleDateString('de-DE')} um {selectedTime} Uhr
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="booking-navigation-buttons">
                            <button type="button" onClick={() => { setSelectedService(null); setSelectedDate(null); setSelectedTime(''); setStep(1);}} className="button-link-outline">Zurück</button>
                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                disabled={!selectedDate || !selectedTime}
                                className="button-link"
                            >
                                Weiter zu Ihren Daten
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && selectedService && selectedDate && selectedTime && (
                    <div className="booking-step-content">
                        <h2 className="booking-step-heading">Ihre Daten & Bestätigung</h2>
                        {!currentUser && (
                            <div className="login-prompt-booking">
                                <p>Bereits Kunde? <Link to="/login" state={{
                                    fromBooking: true,
                                    bookingDetails: {
                                        serviceId: selectedService?.id,
                                        serviceName: selectedService?.name,
                                        date: selectedDate?.toISOString().substring(0,10),
                                        time: selectedTime,
                                        notes: notes // notes ist hier jetzt korrekt definiert
                                    }
                                }}>Hier einloggen</Link>, um schneller zu buchen.</p>
                            </div>
                        )}
                        {registerMessage && (
                            <p className={`form-message ${registerMessage.includes("erfolgreich") ? 'success' : 'error'}`}>{registerMessage}</p>
                        )}
                        <AppointmentForm
                            onAppointmentAdded={onAppointmentAdded} // Wird von App.js übergeben
                            currentUser={currentUser}
                            onRegisterAttempt={handleRegisterDuringBooking}
                            onLoginSuccess={onLoginSuccess} // Wird von App.js übergeben
                            selectedServiceProp={selectedService}
                            selectedDateProp={selectedDate}
                            selectedTimeProp={selectedTime}
                            initialNotes={notes} // notes als Prop
                            onNotesChange={setNotes} // Callback für notes
                        />
                        <div className="booking-navigation-buttons">
                            <button type="button" onClick={() => setStep(2)} className="button-link-outline">Zurück zu Datum & Zeit</button>
                            {/* Der eigentliche Submit-Button ist in AppointmentForm */}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default BookingPage;
