import React, { useState, useEffect } from 'react';
// import AppointmentList from '../components/AppointmentList'; // DIESER IMPORT WIRD ENTFERNT (da AppointmentList im Dashboard ist)
import AppointmentForm from '../components/AppointmentForm';
import AuthService from '../services/auth.service';
import { useParams, useNavigate, Link } from 'react-router-dom';

// Import für Datepicker
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // Styling für Datepicker
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import de from 'date-fns/locale/de'; // Deutsche Lokalisierung
registerLocale('de', de);
setDefaultLocale('de');

function BookingPage({ onAppointmentAdded, refreshAppointmentsList, currentUser, onLoginSuccess }) {
    const { serviceName: initialServiceNameParam } = useParams();
    // initialService und setInitialService werden genutzt
    const [initialService, setInitialService] = useState(initialServiceNameParam || null);
    // navigate wird genutzt
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

    // Effekt zum Laden der Dienstleistungen beim ersten Rendern
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await AuthService.api.get('services');
                setServices(response.data);
                setLoadingServices(false);
                // Wenn ein initialer Service über die URL kommt, wähle ihn direkt aus
                if (initialServiceNameParam) {
                    const service = response.data.find(s => s.name === initialServiceNameParam);
                    if (service) {
                        setSelectedService(service);
                        setStep(2);
                    }
                }
            } catch (error) {
                console.error("Fehler beim Laden der Dienstleistungen:", error);
                setServiceError('Dienstleistungen konnten nicht geladen werden.');
                setLoadingServices(false);
            }
        };
        fetchServices();
    }, [initialServiceNameParam]);

    // Funktion zum Generieren von Zeit-Slots
    const generateTimeSlots = (durationMinutes) => {
        const slots = [];
        const startHour = 9;
        const endHour = 18;

        for (let h = startHour; h <= endHour; h++) {
            for (let m = 0; m < 60; m += 30) {
                const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                slots.push(time);
            }
        }
        return slots;
    };

    // Effekt zum Aktualisieren der verfügbaren Zeiten
    useEffect(() => {
        if (selectedDate && selectedService) {
            setAvailableTimes(generateTimeSlots(selectedService.durationMinutes));
        }
    }, [selectedDate, selectedService]);


    // Callback für die Registrierung während der Buchung
    const handleRegisterDuringBooking = async (customerEmail, customerFirstName, customerLastName, customerPhoneNumber, password) => {
        try {
            const isEmailTaken = await AuthService.checkEmailExists(customerEmail);
            if (isEmailTaken) {
                setRegisterMessage(`Die E-Mail-Adresse ${customerEmail} ist bereits registriert. Bitte melden Sie sich an, um Ihre Termine zu verwalten.`);
                return;
            }

            await AuthService.register(customerFirstName, customerLastName, customerEmail, password, customerPhoneNumber, ["user"]);
            setRegisterMessage(`Konto für ${customerEmail} erstellt! Sie können sich jetzt mit dieser E-Mail und dem gewählten Passwort anmelden.`);
        } catch (error) {
            console.error("Fehler bei der Registrierung während der Buchung:", error);
            setRegisterMessage(`Fehler bei der Registrierung: ${error.response?.data?.message || error.message}`);
        }
    };


    return (
        <div className="booking-page-container" style={{paddingTop: '8rem', paddingBottom: '4rem', backgroundColor: 'var(--light-bg)', minHeight: '100vh'}}>
            <section id="booking-main">
                <div className="container">
                    <h1 className="text-center text-5xl font-serif text-gray-800 mb-8">Termin buchen</h1>
                    <p className="text-center text-lg text-gray-600 mb-12">Wählen Sie Ihre gewünschte Dienstleistung, Datum und Uhrzeit, um Ihren Termin zu vereinbaren.</p>

                    {/* Schritt-Indikatoren */}
                    <div className="flex justify-center mb-8">
                        <div className={`flex items-center mx-2 ${step >= 1 ? 'text-accent-color' : 'text-gray-400'}`}>
                            <span className="text-xl font-bold mr-2">1</span>
                            <span className="text-lg">Dienstleistung</span>
                        </div>
                        <div className={`flex items-center mx-2 ${step >= 2 ? 'text-accent-color' : 'text-gray-400'}`}>
                            <span className="text-xl font-bold mr-2">2</span>
                            <span className="text-lg">Datum & Zeit</span>
                        </div>
                        <div className={`flex items-center mx-2 ${step >= 3 ? 'text-accent-color' : 'text-gray-400'}`}>
                            <span className="text-xl font-bold mr-2">3</span>
                            <span className="text-lg">Ihre Daten</span>
                        </div>
                    </div>

                    {/* Inhalt basierend auf dem Schritt */}
                    {serviceError && <p className="text-center text-red-500 mb-4">{serviceError}</p>}
                    {loadingServices && <p className="text-center text-gray-600 mb-4">Dienstleistungen werden geladen...</p>}

                    {/* Schritt 1: Dienstleistung auswählen */}
                    {step === 1 && !loadingServices && !serviceError && (
                        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
                            <h2 className="text-2xl font-serif text-gray-800 mb-6 text-center border-b pb-4">Dienstleistung auswählen</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {services.map(service => (
                                    <div
                                        key={service.id}
                                        onClick={() => { setSelectedService(service); setStep(2); }}
                                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${selectedService?.id === service.id ? 'border-accent-color bg-accent-color text-white' : 'border-gray-300 hover:border-accent-color hover:shadow-sm'}`}
                                        style={{fontFamily: 'var(--font-sans), sans-serif'}}
                                    >
                                        <h3 className="text-xl font-bold mb-1">{service.name}</h3>
                                        <p className="text-sm mb-2">{service.description}</p>
                                        <p className="text-lg font-semibold">{service.price.toFixed(2)} € / {service.durationMinutes} Min</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Schritt 2: Datum und Uhrzeit auswählen */}
                    {step === 2 && selectedService && (
                        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
                            <h2 className="text-2xl font-serif text-gray-800 mb-6 text-center border-b pb-4">Datum & Uhrzeit für "{selectedService.name}"</h2>

                            <div className="flex flex-col md:flex-row gap-6 justify-center items-start">
                                {/* Datepicker */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-bold text-gray-700 mb-3">Datum wählen:</h3>
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={(date) => setSelectedDate(date)}
                                        dateFormat="dd.MM.yyyy"
                                        minDate={new Date()}
                                        inline
                                        locale="de"
                                        className="w-full"
                                        calendarClassName="custom-datepicker-calendar" // Für Custom Styling
                                    />
                                </div>

                                {/* Zeit-Slots */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-bold text-gray-700 mb-3">Verfügbare Zeiten:</h3>
                                    {selectedDate ? (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-80 overflow-y-auto border p-2 rounded-lg bg-gray-50">
                                            {availableTimes.length > 0 ? (
                                                availableTimes.map(time => (
                                                    <button
                                                        key={time}
                                                        onClick={() => setSelectedTime(time)}
                                                        className={`px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${selectedTime === time ? 'bg-accent-color text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                                    >
                                                        {time}
                                                    </button>
                                                ))
                                            ) : (
                                                <p className="col-span-full text-center text-gray-500">Keine Zeiten verfügbar.</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-center text-gray-500">Bitte wählen Sie zuerst ein Datum.</p>
                                    )}
                                    {selectedTime && (
                                        <p className="text-center text-gray-700 mt-4 text-lg font-semibold">Ausgewählt: {selectedDate.toLocaleDateString('de-DE')} um {selectedTime}</p>
                                    )}
                                    <button
                                        onClick={() => setStep(3)}
                                        disabled={!selectedDate || !selectedTime}
                                        className="mt-6 bg-accent-color hover:bg-accent-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                                    >
                                        Weiter zu Ihren Daten
                                    </button>
                                </div>
                            </div>
                            <button onClick={() => setStep(1)} className="mt-6 text-accent-color hover:underline">Zurück zur Dienstleistungsauswahl</button>
                        </div>
                    )}

                    {/* Schritt 3: Persönliche Daten eingeben & Bestätigen */}
                    {step === 3 && selectedService && selectedDate && selectedTime && (
                        <div className="max-w-2xl mx-auto">
                            {/* Login/Registrierungs-Aufforderung, wenn nicht angemeldet */}
                            {!currentUser && (
                                <div className="text-center p-4 border border-gray-300 rounded-lg mb-6 bg-blue-50">
                                    <h3 className="text-xl font-serif text-gray-800 mb-2">Bereits Kunde? Jetzt anmelden.</h3>
                                    <p className="text-gray-600 mb-3">Melden Sie sich an, um Ihre Daten vorauszufüllen und Ihre Termine im Bereich "Mein Account" zu verwalten. Oder buchen Sie als Gast und erhalten Sie danach die Option zur Kontoerstellung.</p>
                                    <Link to="/login" className="bg-accent-color hover:bg-accent-dark text-white font-bold py-2 px-4 rounded">Jetzt anmelden</Link>
                                </div>
                            )}

                            {/* Nachricht nach Registrierungsversuch */}
                            {registerMessage && (
                                <div className="text-center p-3 rounded-lg bg-gray-100 mb-4">
                                    <p className="text-gray-700">{registerMessage}</p>
                                </div>
                            )}

                            <AppointmentForm
                                onAppointmentAdded={onAppointmentAdded}
                                initialService={selectedService.name} // Übergabe des Service-Namens
                                currentUser={currentUser}
                                onRegisterAttempt={handleRegisterDuringBooking}
                                onLoginSuccess={onLoginSuccess}
                                selectedService={selectedService} // NEU: Ausgewählten Service übergeben
                                selectedDate={selectedDate.toISOString().substring(0, 10)} // Datum als String
                                selectedTime={selectedTime} // Uhrzeit als String
                            />
                        </div>
                    )}

                    {/* Wenn kein Benutzer angemeldet ist, Hinweis auf Terminverwaltung im Account-Dashboard */}
                    {!currentUser && (
                        <p className="text-center text-gray-600 mt-8">Ihre Termine können Sie nach erfolgreicher Anmeldung im Bereich "Mein Account" verwalten.</p>
                    )}
                </div>
            </section>
        </div>
    );
}

export default BookingPage;
