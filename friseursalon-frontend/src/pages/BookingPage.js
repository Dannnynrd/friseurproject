import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import DatePicker, { registerLocale, setDefaultLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { de } from 'date-fns/locale/de';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSpinner, faExclamationCircle, faCheckCircle,
    faArrowLeft, faArrowRight, faCalendarAlt,
    faClock, faInfoCircle, faEdit,
    faCheck, faUser, faEnvelope, faPhone, faStickyNote, faCalendarPlus
} from '@fortawesome/free-solid-svg-icons';

import api from '../services/api.service';
import AuthService from '../services/auth.service';
import AppointmentForm from '../components/AppointmentForm';

registerLocale('de', de);
setDefaultLocale('de');

function BookingPage({ onAppointmentAdded, currentUser, onLoginSuccess }) {
    const { serviceName: initialServiceNameParam } = useParams();
    const [initialServiceParam, setInitialServiceParam] = useState(initialServiceNameParam ? decodeURIComponent(initialServiceNameParam) : null);

    const determineInitialStep = useCallback(() => {
        if (initialServiceParam && currentUser) return 2;
        if (initialServiceParam && !currentUser) return 2;
        if (currentUser && !initialServiceParam) return 1;
        return 1;
    }, [currentUser, initialServiceParam]);

    const [step, setStep] = useState(determineInitialStep());

    const [selectedService, setSelectedService] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState('');
    const [availableTimes, setAvailableTimes] = useState([]);
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [serviceError, setServiceError] = useState(null);

    // registerMessage und finalBookingMessage können jetzt Strings oder Arrays sein
    const [registerMessage, setRegisterMessage] = useState({ type: '', text: '' });
    const [finalBookingMessage, setFinalBookingMessage] = useState({type: '', text: ''});


    const [customerDetails, setCustomerDetails] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        notes: '',
        password: ''
    });
    const [isSubmittingForm, setIsSubmittingForm] = useState(false);
    const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
    const appointmentFormRef = useRef(null);

    useEffect(() => {
        if (currentUser) {
            setCustomerDetails(prevDetails => ({
                ...prevDetails,
                firstName: currentUser.firstName || '',
                lastName: currentUser.lastName || '',
                email: currentUser.email || '',
                phoneNumber: currentUser.phoneNumber || '',
                password: '' // Passwort sollte bei eingeloggten Usern nicht vorausgefüllt sein
            }));
        } else {
            // Wenn der Benutzer ausgeloggt ist, die Kundendetails auf den ursprünglichen Zustand zurücksetzen,
            // es sei denn, sie wurden bereits durch das Formular geändert.
            setCustomerDetails(prevDetails => ({
                firstName: prevDetails.firstName || '',
                lastName: prevDetails.lastName || '',
                email: prevDetails.email || '',
                phoneNumber: prevDetails.phoneNumber || '',
                notes: prevDetails.notes || '',
                password: prevDetails.password || ''
            }));
        }
    }, [currentUser]);


    useEffect(() => {
        const fetchServices = async () => {
            setLoadingServices(true);
            setServiceError(null);
            try {
                const response = await api.get('/services');
                const fetchedServices = response.data || [];
                setServices(fetchedServices);

                if (initialServiceParam && fetchedServices.length > 0) {
                    const service = fetchedServices.find(s => s.name.toLowerCase() === initialServiceParam.toLowerCase());
                    if (service) {
                        setSelectedService(service);
                    } else {
                        console.warn(`Vorausgewählter Service "${initialServiceParam}" nicht in der geladenen Liste gefunden.`);
                        setInitialServiceParam(null);
                    }
                } else if (initialServiceParam) {
                    console.warn(`Vorausgewählter Service "${initialServiceParam}" kann nicht gefunden werden, da keine Services geladen wurden.`);
                    setInitialServiceParam(null);
                    setServiceError('Keine Dienstleistungen verfügbar, um den vorausgewählten Service zu prüfen.');
                }
            } catch (error) {
                console.error("Fehler beim Laden der Dienstleistungen:", error);
                setServiceError('Dienstleistungen konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
            } finally {
                setLoadingServices(false);
            }
        };
        fetchServices();
    }, [initialServiceParam]);


    const generateTimeSlots = useCallback((serviceDurationMinutes) => {
        const slots = [];
        if (!selectedDate || !serviceDurationMinutes) return slots;
        const openingHour = 9; const closingHour = 18;
        const slotInterval = 30;
        const dayOfWeek = selectedDate.getDay();
        if (dayOfWeek === 0) return slots;

        for (let hour = openingHour; hour < closingHour; hour++) {
            for (let minute = 0; minute < 60; minute += slotInterval) {
                const slotTime = new Date(selectedDate);
                slotTime.setHours(hour, minute, 0, 0);
                const now = new Date();
                if (selectedDate.toDateString() === now.toDateString() && slotTime < now) continue;
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

    // Hilfsfunktion zur Verarbeitung und Anzeige von Fehlermeldungen
    const formatErrorMessage = (error) => {
        if (error && error.errors && Array.isArray(error.errors)) {
            // Strukturierte Fehler vom GlobalExceptionHandler
            return error.errors.join("; "); // Zeigt alle Feldfehler, durch Semikolon getrennt
        } else if (error && error.message) {
            // Einfache MessageResponse oder andere Fehler mit 'message'-Property
            return error.message;
        } else if (typeof error === 'string') {
            return error;
        }
        return "Ein unbekannter Fehler ist aufgetreten.";
    };


    const handleRegisterDuringBooking = async (email, firstName, lastName, phoneNumber, password) => {
        setRegisterMessage({ type: '', text: '' });
        try {
            // AuthService.register gibt bei Erfolg response.data zurück
            const response = await AuthService.register(firstName, lastName, email, password, phoneNumber, ["user"]);
            // Erfolgsmeldung aus der Antwort nehmen, falls vorhanden
            setRegisterMessage({ type: 'success', text: response.message || "Registrierung erfolgreich!" });
            return true;
        } catch (error) {
            console.error("Fehler bei der Registrierung während der Buchung:", error);
            const formattedError = formatErrorMessage(error);
            setRegisterMessage({ type: 'error', text: `Registrierung fehlgeschlagen: ${formattedError}`});
            return false;
        }
    };

    const handleDataFromAppointmentForm = (dataFromForm) => {
        setCustomerDetails(dataFromForm);
        setRegisterMessage({ type: '', text: '' }); // Zurücksetzen, da hier keine Registrierung erfolgt
        setFinalBookingMessage({ type: '', text: '' }); // Zurücksetzen für den nächsten Schritt
        setStep(4);
        setIsSubmittingForm(false);
    };


    const isPastDate = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const handleNextStep = () => {
        if (step === 2 && currentUser && selectedService && selectedDate && selectedTime) {
            setStep(4);
        } else if (step === 3) {
            setIsSubmittingForm(true);
            if (appointmentFormRef.current) {
                const formData = appointmentFormRef.current.triggerSubmitAndGetData();
                if (formData) {
                    handleDataFromAppointmentForm(formData);
                } else {
                    // Fehlermeldung wird im AppointmentForm selbst durch setMessage gesetzt
                    setIsSubmittingForm(false);
                }
            } else {
                setIsSubmittingForm(false);
            }
        } else if (step < 4) {
            setStep(prev => prev + 1);
        }
    };
    const handlePrevStep = () => {
        if (step === 4 && currentUser) {
            setStep(2);
        } else if (step > 1) {
            setStep(prev => prev - 1);
        }
        setFinalBookingMessage({ type: '', text: '' });
        setRegisterMessage({ type: '', text: '' });
    };

    const handleFinalBooking = async () => {
        setIsSubmittingFinal(true);
        setFinalBookingMessage({ type: '', text: '' });
        // registerMessage wird in handleRegisterDuringBooking gesetzt und hier ggf. angezeigt/verwendet

        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateTimeString = `${year}-${month}-${day}T${selectedTime}:00`;

        const appointmentData = {
            startTime: dateTimeString,
            service: { id: parseInt(selectedService.id) },
            customer: {
                firstName: customerDetails.firstName.trim(),
                lastName: customerDetails.lastName.trim(),
                email: customerDetails.email.trim(),
                phoneNumber: customerDetails.phoneNumber.trim() || null,
            },
            notes: customerDetails.notes.trim(),
        };

        let userJustRegisteredAndLoggedIn = false;
        if (!currentUser && customerDetails.password) {
            const registrationSuccessful = await handleRegisterDuringBooking(
                customerDetails.email,
                customerDetails.firstName,
                customerDetails.lastName,
                customerDetails.phoneNumber,
                customerDetails.password
            );
            if (!registrationSuccessful) {
                setIsSubmittingFinal(false);
                // registerMessage enthält bereits die detaillierte Fehlermeldung
                setFinalBookingMessage({type: 'error', text: registerMessage.text || 'Registrierung fehlgeschlagen. Bitte überprüfen Sie Ihre Daten.'})
                setStep(3); // Zurück zu Schritt 3, um Fehler anzuzeigen/zu korrigieren
                return;
            }
            // Wenn Registrierung erfolgreich war, versuche Login
            try {
                const loginData = await AuthService.login(customerDetails.email, customerDetails.password);
                if (loginData.token && onLoginSuccess) {
                    onLoginSuccess();
                    userJustRegisteredAndLoggedIn = true;
                    // Kombiniere Erfolgsmeldung der Registrierung mit Login-Info
                    setRegisterMessage(prev => ({
                        type: 'success',
                        text: (prev.text ? prev.text + " " : "") + "Sie wurden erfolgreich angemeldet!"
                    }));
                }
            } catch (loginError) {
                console.warn("Automatischer Login nach Registrierung fehlgeschlagen:", loginError);
                const formattedLoginError = formatErrorMessage(loginError);
                setRegisterMessage({type: 'info', text: `Konto erstellt, aber automatischer Login fehlgeschlagen: ${formattedLoginError}. Ihre Buchung wird dennoch versucht.`});
            }
        }

        try {
            await api.post('/appointments', appointmentData);
            if (onAppointmentAdded) {
                onAppointmentAdded();
            }
            let successMsg = 'Termin erfolgreich gebucht!';
            if(userJustRegisteredAndLoggedIn && registerMessage.type === 'success' && registerMessage.text) {
                successMsg = registerMessage.text + " " + successMsg;
            } else if (userJustRegisteredAndLoggedIn && registerMessage.type === 'info' && registerMessage.text) {
                successMsg = registerMessage.text + " " + successMsg;
            }
            setFinalBookingMessage({type: 'success', text: successMsg});
        } catch (error) {
            console.error("Fehler beim Buchen des Termins:", error);
            let errorMsgText = "Ein Fehler ist beim Buchen des Termins aufgetreten. Bitte versuchen Sie es erneut.";
            if (error.response && error.response.data) { // Axios Fehler mit Backend-Antwort
                errorMsgText = formatErrorMessage(error.response.data);
            } else if (error.message) { // Generischer JS-Fehler oder Axios-Fehler ohne response.data
                errorMsgText = error.message;
            }

            if (error.response && error.response.status === 409 && !userJustRegisteredAndLoggedIn) {
                errorMsgText = `${errorMsgText} Diese E-Mail ist bereits registriert. Bitte melden Sie sich an oder gehen Sie zurück, um Ihre Daten zu ändern.`;
            } else if (userJustRegisteredAndLoggedIn && error.response && error.response.status !== 409) {
                errorMsgText = `Ihr Konto wurde erstellt und Sie sind angemeldet, aber die Terminbuchung schlug fehl: ${errorMsgText}`;
            }
            setFinalBookingMessage({ type: 'error', text: errorMsgText });
        } finally {
            setIsSubmittingFinal(false);
        }
    };

    const generateICal = () => {
        const formatDateForICal = (date, time) => {
            const [hours, minutes] = time.split(':');
            const d = new Date(date);
            d.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            return d.toISOString().replace(/-|:|\.\d{3}/g, "");
        };

        const calculateEndTime = (startDate, startTime, durationMinutes) => {
            const [hours, minutes] = startTime.split(':');
            const d = new Date(startDate);
            d.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            if (durationMinutes && !isNaN(parseInt(durationMinutes))) {
                d.setMinutes(d.getMinutes() + parseInt(durationMinutes));
            } else {
                d.setHours(d.getHours() + 1);
            }
            return d.toISOString().replace(/-|:|\.\d{3}/g, "");
        };

        const startDateStr = formatDateForICal(selectedDate, selectedTime);
        const endDateStr = calculateEndTime(selectedDate, selectedTime, selectedService.durationMinutes);

        const icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Friseursalon IMW//Terminbuchung v1.0//DE",
            "BEGIN:VEVENT",
            `UID:${Date.now()}-${selectedService.id}@friseursalon-imw.de`,
            `DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d{3}/g, "")}`,
            `DTSTART:${startDateStr}`,
            `DTEND:${endDateStr}`,
            `SUMMARY:Friseurtermin: ${selectedService.name}`,
            `DESCRIPTION:Ihr Termin für ${selectedService.name}.${customerDetails.notes ? ' Ihre Anmerkungen: ' + customerDetails.notes : ''}`,
            "LOCATION:Friseursalon IMW, Musterstraße 1, 12345 Musterstadt",
            "END:VEVENT",
            "END:VCALENDAR"
        ].join("\r\n");

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Friseurtermin_${selectedService.name.replace(/\s+/g, '_')}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };


    const resetBookingProcess = () => {
        setInitialServiceParam(null);
        setSelectedService(null);
        setSelectedDate(null);
        setSelectedTime('');
        setCustomerDetails({ firstName: '', lastName: '', email: '', phoneNumber: '', notes: '', password: '' });
        setRegisterMessage({ type: '', text: '' });
        setFinalBookingMessage({ type: '', text: '' });
        setServiceError(null);
        setStep(determineInitialStep());
    };


    if (loadingServices && !initialServiceParam && step === 1) {
        return <div className="page-center-content"><p className="loading-message"><FontAwesomeIcon icon={faSpinner} spin /> Dienstleistungen werden geladen...</p></div>;
    }
    if (serviceError && services.length === 0 && !loadingServices && step === 1) {
        return <div className="page-center-content"><p className="form-message error"><FontAwesomeIcon icon={faExclamationCircle} /> {serviceError}</p></div>;
    }

    const visibleStepLabels = currentUser
        ? ["Dienstleistung", "Datum und Zeit", "Bestätigung"]
        : ["Dienstleistung", "Datum und Zeit", "Ihre Daten", "Bestätigung"];

    const getInternalStepForVisibleStep = (visibleStep) => {
        if (currentUser && visibleStep >= 3) return visibleStep + 1;
        return visibleStep;
    };


    return (
        <div className="booking-page-container container">
            <div className="booking-form-container">
                <h1 className="booking-page-main-heading">Termin buchen</h1>

                <div className={`booking-step-indicators ${currentUser ? 'three-steps' : ''}`}>
                    {visibleStepLabels.map((label, index) => {
                        const visibleStepNumber = index + 1;
                        const internalStepForIndicator = getInternalStepForVisibleStep(visibleStepNumber);
                        const isCurrentStepActive = step === internalStepForIndicator;
                        let isStepCompleted = step > internalStepForIndicator;
                        if (internalStepForIndicator === 4 && finalBookingMessage.type === 'success') {
                            isStepCompleted = true;
                        } else if (internalStepForIndicator === 4 && finalBookingMessage.type !== 'success') {
                            isStepCompleted = false;
                        }
                        if (internalStepForIndicator < 4 && step === 4 && finalBookingMessage.type === 'success') {
                            isStepCompleted = true;
                        }

                        return (
                            <div key={visibleStepNumber} className={`booking-step-indicator ${isCurrentStepActive ? 'active' : ''} ${isStepCompleted ? 'completed' : ''}`}>
                                <div className="step-number-wrapper">
                                    <span className="step-number">
                                        {isStepCompleted ? <FontAwesomeIcon icon={faCheck} /> : visibleStepNumber}
                                    </span>
                                </div>
                                <span className="step-label">{label}</span>
                            </div>
                        );
                    })}
                </div>

                {serviceError && services.length > 0 && step < (currentUser ? 4 : 3) && (
                    <p className="form-message error mb-4"><FontAwesomeIcon icon={faExclamationCircle} /> {serviceError}</p>
                )}


                {step === 1 && (
                    <div className="booking-step-content animate-step">
                        <h2 className="booking-step-heading">1. Dienstleistung auswählen</h2>
                        {loadingServices && <p className="loading-message small"><FontAwesomeIcon icon={faSpinner} spin /> Lade Dienste...</p>}
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
                                    onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedService(service); setSelectedDate(null); setSelectedTime(''); setStep(2); }}}
                                >
                                    <h3 className="service-name">{service.name}</h3>
                                    {service.description && <p className="service-description">{service.description}</p>}
                                    <p className="service-details">
                                        {typeof service.price === 'number' ? service.price.toFixed(2) : 'N/A'} €
                                        <span className="service-duration">/ {service.durationMinutes || '-'} Min</span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && selectedService && (
                    <div className="booking-step-content animate-step">
                        <h2 className="booking-step-heading">2. Datum und Uhrzeit wählen</h2>
                        <div className="booking-step-subheading">
                            <div className="service-info-text">
                                <strong>{selectedService.name}</strong>
                                <span className="service-price-duration">
                                    ({typeof selectedService.price === 'number' ? selectedService.price.toFixed(2) : 'N/A'} € / {selectedService.durationMinutes || '-'} Min)
                                </span>
                            </div>
                            <button type="button" onClick={resetBookingProcess} className="edit-selection-button small-edit">
                                <FontAwesomeIcon icon={faEdit} /> Ändern
                            </button>
                        </div>

                        <div className={`selected-datetime-info summary-above-datepicker ${!(selectedDate && selectedTime) ? 'placeholder' : ''}`}>
                            {selectedDate && selectedTime ? (
                                <>
                                    Ihr Termin: <strong>{selectedDate.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</strong> um <strong>{selectedTime} Uhr</strong>
                                </>
                            ) : (
                                <>
                                    Bitte Datum und Uhrzeit auswählen.
                                </>
                            )}
                        </div>


                        <div className="datepicker-time-container">
                            <div className="datepicker-wrapper-outer">
                                <h3 className="sub-heading"><FontAwesomeIcon icon={faCalendarAlt} /> Datum wählen:</h3>
                                <div className="datepicker-wrapper">
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
                            </div>
                            <div className="time-slots-wrapper-outer">
                                <h3 className="sub-heading">
                                    <FontAwesomeIcon icon={faClock} /> Verfügbare Zeiten
                                    {selectedDate ? ` für den ${selectedDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}` : ''}:
                                </h3>
                                <div className="time-slots-wrapper">
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
                                </div>
                            </div>
                        </div>
                        <div className="booking-navigation-buttons">
                            <button type="button" onClick={resetBookingProcess} className="button-link-outline">
                                <FontAwesomeIcon icon={faArrowLeft} /> Dienstleistung ändern
                            </button>
                            <button
                                type="button"
                                onClick={handleNextStep}
                                disabled={!selectedDate || !selectedTime}
                                className="button-link"
                            >
                                {currentUser ? "Weiter zur Bestätigung" : "Weiter zu Ihren Daten"} <FontAwesomeIcon icon={faArrowRight} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && !currentUser && selectedService && selectedDate && selectedTime && (
                    <div className="booking-step-content animate-step">
                        <h2 className="booking-step-heading">3. Ihre persönlichen Daten</h2>
                        <div className="appointment-summary-inline">
                            <p>
                                <FontAwesomeIcon icon={faCheckCircle} className="summary-icon" />
                                Termin für: <strong>{selectedService.name}</strong>
                                am {selectedDate.toLocaleDateString('de-DE')} um {selectedTime} Uhr.
                                <button type="button" onClick={() => setStep(2)} className="edit-selection-button subtle-edit">
                                    <FontAwesomeIcon icon={faEdit} /> Ändern
                                </button>
                            </p>
                        </div>
                        {/* Fehlermeldung von AppointmentForm wird direkt im Formular angezeigt */}
                        {/* registerMessage wird erst in Schritt 4 relevant oder wenn handleFinalBooking fehlschlägt */}
                        <AppointmentForm
                            ref={appointmentFormRef}
                            currentUser={currentUser}
                            initialData={customerDetails}
                            onFormSubmit={handleDataFromAppointmentForm}
                        />
                        <div className="booking-navigation-buttons">
                            <button type="button" onClick={handlePrevStep} className="button-link-outline" disabled={isSubmittingForm}>
                                <FontAwesomeIcon icon={faArrowLeft} /> Zurück zu Datum und Zeit
                            </button>
                            <button
                                type="button"
                                onClick={handleNextStep} // Dieser Button löst triggerSubmitAndGetData aus
                                className="button-link"
                                disabled={isSubmittingForm}
                            >
                                {isSubmittingForm ? <><FontAwesomeIcon icon={faSpinner} spin /> Verarbeite...</> : <>Weiter zur Zusammenfassung <FontAwesomeIcon icon={faArrowRight} /></> }
                            </button>
                        </div>
                    </div>
                )}

                {step === 4 && selectedService && selectedDate && selectedTime && (
                    <div className="booking-step-content animate-step">
                        {finalBookingMessage.type === 'success' ? (
                            <div className="booking-confirmation">
                                <FontAwesomeIcon icon={faCheckCircle} className="confirmation-icon" />
                                <h2 className="booking-step-heading">Termin erfolgreich gebucht!</h2>
                                <p>{finalBookingMessage.text}</p>
                                <div className="appointment-summary light">
                                    <h4>Ihre Buchungsdetails:</h4>
                                    <p><strong>Dienstleistung:</strong> {selectedService.name}</p>
                                    <p><strong>Datum:</strong> {selectedDate.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    <p><strong>Uhrzeit:</strong> {selectedTime} Uhr</p>
                                    {customerDetails.notes && <p><strong>Anmerkungen:</strong> {customerDetails.notes}</p>}
                                </div>
                                <div className="calendar-actions">
                                    <button type="button" onClick={generateICal} className="button-link-outline small-button">
                                        <FontAwesomeIcon icon={faCalendarPlus} /> Zum Kalender hinzufügen (.ics)
                                    </button>
                                </div>
                                <div className="booking-navigation-buttons confirmation-buttons">
                                    {AuthService.getCurrentUser() && <Link to="/my-account" className="button-link">Meine Termine</Link>}
                                    <button type="button" onClick={resetBookingProcess} className="button-link-outline">Neuen Termin buchen</button>
                                    {!AuthService.getCurrentUser() && <Link to="/" className="button-link-outline">Zur Startseite</Link>}
                                </div>
                            </div>
                        ) : (
                            <>
                                <h2 className="booking-step-heading">4. Buchung überprüfen und bestätigen</h2>
                                <div className="appointment-summary-final">
                                    <h3>Ihre Auswahl:</h3>
                                    <p><FontAwesomeIcon icon={faCheckCircle} /> <strong>Dienstleistung:</strong> {selectedService.name} ({typeof selectedService.price === 'number' ? selectedService.price.toFixed(2) : 'N/A'} € / {selectedService.durationMinutes || '-'} Min)</p>
                                    <p><FontAwesomeIcon icon={faCalendarAlt} /> <strong>Datum:</strong> {selectedDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    <p><FontAwesomeIcon icon={faClock} /> <strong>Uhrzeit:</strong> {selectedTime} Uhr</p>

                                    <h3 className="mt-4">Ihre Daten:</h3>
                                    <p><FontAwesomeIcon icon={faUser} /> <strong>Name:</strong> {customerDetails.firstName} {customerDetails.lastName}</p>
                                    <p><FontAwesomeIcon icon={faEnvelope} /> <strong>E-Mail:</strong> {customerDetails.email}</p>
                                    {customerDetails.phoneNumber && <p><FontAwesomeIcon icon={faPhone} /> <strong>Telefon:</strong> {customerDetails.phoneNumber}</p>}
                                    {customerDetails.notes && <p><FontAwesomeIcon icon={faStickyNote} /> <strong>Anmerkungen:</strong> {customerDetails.notes}</p>}
                                </div>

                                {/* Anzeige für Registrierungs-Feedback (Erfolg/Info, Fehler werden in Schritt 3 oder in finalBookingMessage angezeigt) */}
                                {registerMessage.text && registerMessage.type !== 'error' && (
                                    <p className={`form-message ${registerMessage.type} mt-4`}>
                                        <FontAwesomeIcon icon={registerMessage.type === 'success' ? faCheckCircle : faInfoCircle} /> {registerMessage.text}
                                    </p>
                                )}

                                {/* Anzeige für finale Buchungsfehler */}
                                {finalBookingMessage.text && finalBookingMessage.type === 'error' && (
                                    <p className={`form-message ${finalBookingMessage.type} mt-4`}>
                                        <FontAwesomeIcon icon={faExclamationCircle} />
                                        {finalBookingMessage.text}
                                    </p>
                                )}


                                <div className="booking-navigation-buttons">
                                    <button type="button" onClick={handlePrevStep} className="button-link-outline" disabled={isSubmittingFinal}>
                                        <FontAwesomeIcon icon={faArrowLeft} /> Zurück {currentUser ? "zu Datum und Zeit" : "zu Ihren Daten"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleFinalBooking}
                                        disabled={isSubmittingFinal}
                                        className="button-link"
                                    >
                                        {isSubmittingFinal ? (
                                            <><FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Wird gebucht...</>
                                        ) : (
                                            "Termin verbindlich buchen"
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default BookingPage;