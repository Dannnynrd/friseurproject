import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DatePicker, { registerLocale, setDefaultLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // CSS-Import
import { de } from 'date-fns/locale/de';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSpinner, faExclamationCircle, faCheckCircle,
    faArrowLeft, faArrowRight, faCalendarAlt,
    faClock, faInfoCircle, faEdit,
    faCheck // Benötigt für das Häkchen im Step Indicator
} from '@fortawesome/free-solid-svg-icons';

import api from '../services/api.service';
import AuthService from '../services/auth.service';
import AppointmentForm from '../components/AppointmentForm';
// import './BookingPage.css'; // Auskommentiert, da wir Stile in App.css haben

registerLocale('de', de);
setDefaultLocale('de');

function BookingPage({ onAppointmentAdded, currentUser, onLoginSuccess }) {
    const { serviceName: initialServiceNameParam } = useParams();
    const [initialService, setInitialService] = useState(initialServiceNameParam ? decodeURIComponent(initialServiceNameParam) : null);
    // const navigate = useNavigate(); // Wird aktuell nicht verwendet, daher auskommentiert für ESLint

    const [step, setStep] = useState(1);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState('');
    const [availableTimes, setAvailableTimes] = useState([]);
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [serviceError, setServiceError] = useState(null);
    const [registerMessage, setRegisterMessage] = useState({ type: '', text: '' });
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const fetchServices = async () => {
            setLoadingServices(true);
            setServiceError(null);
            try {
                const response = await api.get('/services');
                const fetchedServices = response.data || [];
                setServices(fetchedServices);

                if (initialService && fetchedServices.length > 0) {
                    const service = fetchedServices.find(s => s.name.toLowerCase() === initialService.toLowerCase());
                    if (service) {
                        setSelectedService(service);
                        setStep(2);
                    } else {
                        console.warn(`Vorausgewählter Service "${initialService}" nicht in der geladenen Liste gefunden.`);
                        setInitialService(null);
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
    }, [initialService]);


    const generateTimeSlots = useCallback((serviceDurationMinutes) => {
        const slots = [];
        if (!selectedDate || !serviceDurationMinutes) return slots;

        const openingHour = 9; const closingHour = 18;
        const slotInterval = 30;
        const dayOfWeek = selectedDate.getDay();

        if (dayOfWeek === 0) { // Sonntag
            return [];
        }

        for (let hour = openingHour; hour < closingHour; hour++) {
            for (let minute = 0; minute < 60; minute += slotInterval) {
                const slotTime = new Date(selectedDate);
                slotTime.setHours(hour, minute, 0, 0);

                const now = new Date();
                if (selectedDate.toDateString() === now.toDateString() && slotTime < now) {
                    continue;
                }

                const endTime = new Date(slotTime.getTime() + serviceDurationMinutes * 60000);
                if (endTime.getHours() < closingHour || (endTime.getHours() === closingHour && endTime.getMinutes() === 0)) {
                    slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
                }
            }
        }
        return slots;
    }, [selectedDate]);

    useEffect(() => {
        if (selectedDate && selectedService) {
            const times = generateTimeSlots(selectedService.durationMinutes);
            setAvailableTimes(times);
        } else {
            setAvailableTimes([]);
        }
    }, [selectedDate, selectedService, generateTimeSlots]);

    const handleRegisterDuringBooking = async (customerEmail, customerFirstName, customerLastName, customerPhoneNumber, password) => {
        setRegisterMessage({ type: '', text: '' });
        try {
            await AuthService.register(customerFirstName, customerLastName, customerEmail, password, customerPhoneNumber, ["user"]);
            setRegisterMessage({ type: 'success', text: `Konto für ${customerEmail} erfolgreich erstellt! Sie können sich jetzt anmelden oder die Buchung abschließen.`});
            return true;
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message || "Unbekannter Fehler bei der Registrierung.";
            console.error("Fehler bei der Registrierung während der Buchung:", error);
            setRegisterMessage({ type: 'error', text: `Fehler bei der Registrierung: ${errMsg}`});
            return false;
        }
    };

    const isPastDate = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const handleNextStep = () => setStep(prev => prev < 4 ? prev + 1 : 4);
    const handlePrevStep = () => setStep(prev => prev > 1 ? prev - 1 : 1);

    const handleAppointmentBooked = () => {
        if (onAppointmentAdded) {
            onAppointmentAdded();
        }
        setStep(4);
    };

    const resetBookingProcess = () => {
        setInitialService(null);
        setSelectedService(null);
        setSelectedDate(null);
        setSelectedTime('');
        setNotes('');
        setRegisterMessage({ type: '', text: '' });
        setServiceError(null);
        setStep(1);
    };


    if (loadingServices) {
        return <div className="page-center-content"><p className="loading-message"><FontAwesomeIcon icon={faSpinner} spin /> Dienstleistungen werden geladen...</p></div>;
    }
    if (serviceError && services.length === 0) {
        return <div className="page-center-content"><p className="form-message error"><FontAwesomeIcon icon={faExclamationCircle} /> {serviceError}</p></div>;
    }


    return (
        <div className="booking-page-container container">
            <div className="booking-form-container">
                <h1 className="booking-page-main-heading">Termin buchen</h1>

                <div className="booking-step-indicators">
                    {[1, 2, 3, 4].map(s_idx => {
                        let label = "";
                        const isCurrentStepActive = step === s_idx;
                        const isStepCompleted = (step > s_idx) || (step === 4 && s_idx < 4);

                        if (s_idx === 1) label = "Dienstleistung";
                        else if (s_idx === 2) label = "Datum & Zeit";
                        else if (s_idx === 3) label = "Ihre Daten";
                        else if (s_idx === 4) label = "Bestätigung";

                        return (
                            <div key={s_idx} className={`booking-step-indicator ${isCurrentStepActive ? 'active' : ''} ${isStepCompleted ? 'completed' : ''}`}>
                                <div className="step-number-wrapper">
                                    <span className="step-number">
                                        {isStepCompleted ? <FontAwesomeIcon icon={faCheck} /> : s_idx}
                                    </span>
                                </div>
                                <span className="step-label">{label}</span>
                            </div>
                        );
                    })}
                </div>

                {serviceError && services.length > 0 && (
                    <p className="form-message error mb-4"><FontAwesomeIcon icon={faExclamationCircle} /> {serviceError}</p>
                )}


                {step === 1 && (
                    <div className="booking-step-content animate-step">
                        <h2 className="booking-step-heading">1. Dienstleistung auswählen</h2>
                        {!loadingServices && !serviceError && services.length === 0 && (
                            <p className="form-message info"><FontAwesomeIcon icon={faInfoCircle} /> Aktuell sind keine Dienstleistungen online buchbar.</p>
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
                                    {service.description && <p className="service-description">{service.description}</p>}
                                    <p className="service-details">
                                        {service.price ? service.price.toFixed(2) : 'N/A'} €
                                        <span className="service-duration">/ {service.durationMinutes || '-'} Min</span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && selectedService && (
                    <div className="booking-step-content animate-step">
                        <h2 className="booking-step-heading">2. Datum & Uhrzeit für "{selectedService.name}"</h2>
                        <p className="booking-step-subheading">
                            Gewählte Dienstleistung: <strong>{selectedService.name}</strong>
                            ({selectedService.price ? selectedService.price.toFixed(2) : 'N/A'} € / {selectedService.durationMinutes || '-'} Min)
                            <button type="button" onClick={resetBookingProcess} className="edit-selection-button small-edit">
                                <FontAwesomeIcon icon={faEdit} /> Ändern
                            </button>
                        </p>
                        <div className="datepicker-time-container">
                            <div className="datepicker-wrapper">
                                <h3 className="sub-heading"><FontAwesomeIcon icon={faCalendarAlt} /> Datum wählen:</h3>
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
                                <h3 className="sub-heading">
                                    <FontAwesomeIcon icon={faClock} /> Verfügbare Zeiten
                                    {selectedDate ? ` für den ${selectedDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}` : ''}:
                                </h3>
                                {selectedDate ? ( availableTimes.length > 0 ? (
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
                                    ) : <p className="no-times-message">Keine Online-Zeiten für diesen Tag verfügbar.</p>
                                ) : <p className="select-date-message">Bitte wählen Sie zuerst ein Datum.</p>
                                }

                                {selectedDate && selectedTime && (
                                    <div className="selected-datetime-info">
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                        Ihr Termin: <strong>{selectedDate.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</strong> um <strong>{selectedTime} Uhr</strong>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="booking-navigation-buttons">
                            <button type="button" onClick={resetBookingProcess} className="button-link-outline">
                                <FontAwesomeIcon icon={faArrowLeft} /> Dienstleistung ändern
                            </button>
                            <button type="button" onClick={handleNextStep} disabled={!selectedDate || !selectedTime} className="button-link">
                                Weiter zu Ihren Daten <FontAwesomeIcon icon={faArrowRight} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && selectedService && selectedDate && selectedTime && (
                    <div className="booking-step-content animate-step">
                        <h2 className="booking-step-heading">3. Ihre Daten & Buchung abschließen</h2>

                        <div className="appointment-summary-inline">
                            <p>
                                <FontAwesomeIcon icon={faCheckCircle} className="summary-icon" />
                                Ihre Auswahl: <strong>{selectedService.name}</strong>
                                {selectedService.price !== undefined && ` (${selectedService.price.toFixed(2)} €)`}
                                {selectedDate && ` am ${selectedDate.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}`}
                                {selectedTime && ` um ${selectedTime} Uhr`}.
                                <button type="button" onClick={() => setStep(2)} className="edit-selection-button subtle-edit">
                                    <FontAwesomeIcon icon={faEdit} /> Ändern
                                </button>
                            </p>
                        </div>

                        {!currentUser && (
                            <div className="login-prompt-booking">
                                <p>Bereits Kunde? <Link to="/login" state={{
                                    fromBooking: true,
                                    bookingDetails: {
                                        serviceId: selectedService?.id,
                                        serviceName: selectedService?.name,
                                        date: selectedDate?.toISOString().substring(0,10),
                                        time: selectedTime,
                                        notes: notes
                                    }
                                }}>Hier einloggen</Link> für eine schnellere Buchung oder als Gast fortfahren.</p>
                            </div>
                        )}
                        {registerMessage.text && (
                            <p className={`form-message ${registerMessage.type} mb-4`}>
                                <FontAwesomeIcon icon={registerMessage.type === 'success' ? faCheckCircle : faExclamationCircle} /> {registerMessage.text}
                            </p>
                        )}

                        <AppointmentForm
                            onAppointmentBooked={handleAppointmentBooked}
                            currentUser={currentUser}
                            onRegisterAttempt={handleRegisterDuringBooking}
                            onLoginSuccess={onLoginSuccess}
                            selectedServiceProp={selectedService}
                            selectedDateProp={selectedDate}
                            selectedTimeProp={selectedTime}
                            initialNotes={notes}
                            onNotesChange={setNotes}
                        />
                        <div className="booking-navigation-buttons">
                            <button type="button" onClick={handlePrevStep} className="button-link-outline"><FontAwesomeIcon icon={faArrowLeft} /> Zurück zu Datum & Zeit</button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="booking-step-content animate-step booking-confirmation">
                        <FontAwesomeIcon icon={faCheckCircle} className="confirmation-icon" />
                        <h2 className="booking-step-heading">Termin erfolgreich gebucht!</h2>
                        <p>Vielen Dank für Ihre Buchung. {currentUser ? 'Eine Bestätigung finden Sie auch unter "Meine Termine".' : 'Eine Bestätigung wurde an Ihre E-Mail-Adresse gesendet (falls angegeben).'}</p>
                        {selectedService && selectedDate && selectedTime && (
                            <div className="appointment-summary light">
                                <h4>Ihre Buchungsdetails:</h4>
                                <p><strong>Dienstleistung:</strong> {selectedService.name}</p>
                                <p><strong>Datum:</strong> {selectedDate.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                <p><strong>Uhrzeit:</strong> {selectedTime} Uhr</p>
                                {notes && <p><strong>Anmerkungen:</strong> {notes}</p>}
                            </div>
                        )}
                        <div className="booking-navigation-buttons confirmation-buttons">
                            {currentUser && <Link to="/my-account" className="button-link">Meine Termine</Link>}
                            <button type="button" onClick={resetBookingProcess} className="button-link-outline">Neuen Termin buchen</button>
                            {!currentUser && <Link to="/" className="button-link-outline">Zur Startseite</Link>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default BookingPage;
