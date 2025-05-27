import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom'; // Link might not be needed directly here anymore
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './BookingPage.css';
import { de } from 'date-fns/locale/de';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSpinner, faExclamationCircle, faInfoCircle
    // Other icons are likely used within the sub-components
} from '@fortawesome/free-solid-svg-icons';

import api from '../services/api.service';
import AuthService from '../services/auth.service';
// AppointmentForm is now used within CustomerDetailsStep
// import AppointmentForm from '../components/AppointmentForm'; 

// New Sub-Components
import BookingProgressIndicator from '../components/booking/BookingProgressIndicator';
import ServiceSelectionStep from '../components/booking/ServiceSelectionStep';
import DateTimeSelectionStep from '../components/booking/DateTimeSelectionStep';
import CustomerDetailsStep from '../components/booking/CustomerDetailsStep';
import BookingConfirmationStep from '../components/booking/BookingConfirmationStep';

registerLocale('de', de);
setDefaultLocale('de');

function BookingPage({ onAppointmentAdded, currentUser, onLoginSuccess }) {
    const { serviceName: initialServiceNameParam } = useParams();
    const [initialServiceParam, setInitialServiceParam] = useState(initialServiceNameParam ? decodeURIComponent(initialServiceNameParam) : null);

    const determineInitialStep = useCallback(() => {
        if (initialServiceParam && currentUser) return 2; // Service pre-selected, user logged in -> go to date/time
        if (initialServiceParam && !currentUser) return 2; // Service pre-selected, no user -> go to date/time
        if (currentUser && !initialServiceParam) return 1; // User logged in, no service -> go to service selection
        return 1; // Default: start with service selection
    }, [currentUser, initialServiceParam]);

    const [step, setStep] = useState(determineInitialStep());

    const [selectedService, setSelectedService] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState('');
    const [availableTimes, setAvailableTimes] = useState([]);
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [loadingAvailableTimes, setLoadingAvailableTimes] = useState(false);
    const [serviceError, setServiceError] = useState(null);
    const [timeError, setTimeError] = useState(null);
    const [registerMessage, setRegisterMessage] = useState({ type: '', text: '' });

    const [customerDetails, setCustomerDetails] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        notes: '',
        password: '' // For potential registration
    });
    const [isSubmittingForm, setIsSubmittingForm] = useState(false); // For step 3 (CustomerDetailsStep)
    const [isSubmittingFinal, setIsSubmittingFinal] = useState(false); // For step 4 (BookingConfirmationStep)
    const [finalBookingMessage, setFinalBookingMessage] = useState({ type: '', text: '' });
    
    const appointmentFormRef = useRef(null); // Ref for AppointmentForm within CustomerDetailsStep

    useEffect(() => {
        if (currentUser) {
            setCustomerDetails(prevDetails => ({
                ...prevDetails,
                firstName: currentUser.firstName || '',
                lastName: currentUser.lastName || '',
                email: currentUser.email || '',
                phoneNumber: currentUser.phoneNumber || '',
                password: '' // Clear password field
            }));
        } else {
            setCustomerDetails({ firstName: '', lastName: '', email: '', phoneNumber: '', notes: '', password: '' });
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
                        // Do not automatically advance step here, let user confirm or change
                    } else {
                        console.warn(`Preselected service "${initialServiceParam}" not found.`);
                        setServiceError(`Der ausgewählte Service "${initialServiceParam}" ist nicht verfügbar. Bitte wählen Sie einen anderen.`);
                        setInitialServiceParam(null); // Reset if not found
                    }
                } else if (initialServiceParam && fetchedServices.length === 0) {
                     setServiceError('Keine Dienstleistungen verfügbar.');
                     setInitialServiceParam(null);
                }
            } catch (error) {
                console.error("Error loading services:", error);
                setServiceError('Dienstleistungen konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
            } finally {
                setLoadingServices(false);
            }
        };
        fetchServices();
    }, [initialServiceParam]); // Re-fetch if param changes (e.g. direct navigation)

    useEffect(() => {
        if (selectedDate && selectedService && selectedService.id) {
            const fetchAvailableTimes = async () => {
                setLoadingAvailableTimes(true);
                setTimeError(null);
                setAvailableTimes([]);
                try {
                    const dateString = selectedDate.toISOString().split('T')[0];
                    const response = await api.get(`/appointments/available-slots?serviceId=${selectedService.id}&date=${dateString}`);
                    setAvailableTimes(response.data || []);
                    if (response.data.length === 0) {
                        setTimeError('Für diesen Tag sind online keine Termine für den gewählten Service verfügbar.');
                    }
                } catch (error) {
                    console.error("Error loading available times:", error);
                    setTimeError('Verfügbare Zeiten konnten nicht geladen werden.');
                } finally {
                    setLoadingAvailableTimes(false);
                }
            };
            fetchAvailableTimes();
        } else {
            setAvailableTimes([]);
            setTimeError(null);
        }
    }, [selectedDate, selectedService]);

    const handleServiceSelection = (service) => {
        setSelectedService(service);
        setSelectedDate(null); // Reset date/time when service changes
        setSelectedTime('');
        setTimeError(null);
        setAvailableTimes([]);
        setStep(2); // Move to date/time selection
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setSelectedTime(''); // Reset time when date changes
        setTimeError(null);
        setAvailableTimes([]);
    };

    const handleTimeChange = (time) => {
        setSelectedTime(time);
    };
    
    const handleRegisterDuringBooking = async (email, firstName, lastName, phoneNumber, password) => {
        setRegisterMessage({ type: '', text: '' });
        setIsSubmittingFinal(true); 
        try {
            await AuthService.register(firstName, lastName, email, password, phoneNumber, ["user"]);
            return true; // Registration successful
        } catch (error) {
            const errMsg = error.response?.data?.message || error.message || "Unbekannter Fehler bei der Registrierung.";
            console.error("Error during registration in booking:", error);
            setRegisterMessage({ type: 'error', text: `Registrierung fehlgeschlagen: ${errMsg}`});
            // This message will be displayed in CustomerDetailsStep or BookingConfirmationStep
            return false; // Registration failed
        } finally {
             // setIsSubmittingFinal is primarily for the final booking step,
             // but registration is part of that if it occurs.
             // If registration fails here, the final booking won't proceed immediately.
             // The calling function (handleFinalBooking) should manage setIsSubmittingFinal based on overall success.
        }
    };

    const handleDataFromAppointmentForm = (dataFromForm) => {
        setCustomerDetails(dataFromForm);
        setRegisterMessage({ type: '', text: '' }); // Clear any previous registration messages
        setFinalBookingMessage({ type: '', text: '' }); // Clear final booking messages
        setStep(4); // Proceed to confirmation step
        setIsSubmittingForm(false); // Submission from AppointmentForm complete
    };

    const handleNextStep = () => {
        setFinalBookingMessage({ type: '', text: '' });
        setRegisterMessage({ type: '', text: '' });

        if (step === 1 && selectedService) { // From ServiceSelection to DateTimeSelection
            setStep(2);
        } else if (step === 2 && selectedService && selectedDate && selectedTime) { // From DateTimeSelection
            if (currentUser) {
                setStep(4); // Logged-in user, skip to confirmation
            } else {
                setStep(3); // Guest user, go to customer details
            }
        } else if (step === 3) { // From CustomerDetails to Confirmation (validation handled by CustomerDetailsStep)
            // This case is now primarily handled by CustomerDetailsStep's internal "Next" button
            // which calls its onFormSubmit prop (handleDataFromAppointmentForm)
            // For safety, ensure isSubmittingForm is managed if direct calls happen.
            // setIsSubmittingForm(true); // This will be set in CustomerDetailsStep
            // appointmentFormRef.current?.triggerSubmitAndGetData(); // This is also called within CustomerDetailsStep
        }
        // No direct step increment like setStep(prev => prev + 1) anymore for these transitions
    };

    const handlePrevStep = () => {
        setFinalBookingMessage({ type: '', text: '' });
        setRegisterMessage({ type: '', text: '' });

        if (step === 2) { // From DateTimeSelection back to ServiceSelection
            setStep(1);
        } else if (step === 3) { // From CustomerDetails back to DateTimeSelection
            setStep(2);
        } else if (step === 4) { // From Confirmation back
            if (currentUser) {
                setStep(2); // Logged-in user, back to DateTimeSelection
            } else {
                setStep(3); // Guest user, back to CustomerDetails
            }
        }
    };
    
    const handleFinalBooking = async () => {
        setIsSubmittingFinal(true);
        setFinalBookingMessage({ type: '', text: '' });
        // Clear register message for final booking attempt,
        // it might have success/info from a registration that is now part of the final success message.
        // setRegisterMessage({ type: '', text: '' }); 
    
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
                phoneNumber: customerDetails.phoneNumber?.trim() || null,
            },
            notes: customerDetails.notes?.trim() || '',
        };
    
        let userJustRegisteredAndLoggedIn = false;
        let localRegisterMessage = { type: '', text: '' }; // Temporary holder for registration messages

        if (!currentUser && customerDetails.password) {
            const registrationSuccessful = await handleRegisterDuringBooking(
                customerDetails.email,
                customerDetails.firstName,
                customerDetails.lastName,
                customerDetails.phoneNumber,
                customerDetails.password
            );

            localRegisterMessage = registerMessage; // Capture message from handleRegisterDuringBooking

            if (!registrationSuccessful) {
                setFinalBookingMessage({type: 'error', text: localRegisterMessage.text || 'Registrierung fehlgeschlagen. Bitte überprüfen Sie Ihre Daten.'});
                setIsSubmittingFinal(false);
                setStep(3); // Go back to customer details step if registration failed
                return;
            }
            // If registration was successful, try to log in
            try {
                const loginData = await AuthService.login(customerDetails.email, customerDetails.password);
                if (loginData.token && onLoginSuccess) {
                    onLoginSuccess(); // This updates currentUser globally
                    userJustRegisteredAndLoggedIn = true;
                    // Update localRegisterMessage for success, this will be merged into finalBookingMessage
                    localRegisterMessage = { type: 'success', text: `Konto für ${customerDetails.email} erfolgreich erstellt und Sie wurden angemeldet!`};
                }
            } catch (loginError) {
                console.warn("Automatic login after registration failed:", loginError);
                localRegisterMessage = {type: 'info', text: 'Konto erstellt, aber automatischer Login fehlgeschlagen. Ihre Buchung wird dennoch versucht.'};
            }
        }
    
        try {
            await api.post('/appointments', appointmentData);
            if (onAppointmentAdded) {
                onAppointmentAdded();
            }
            let successMsg = 'Termin erfolgreich gebucht!';
            if(userJustRegisteredAndLoggedIn && localRegisterMessage.type === 'success') {
                successMsg = localRegisterMessage.text + " " + successMsg;
            } else if (userJustRegisteredAndLoggedIn && localRegisterMessage.type === 'info') {
                 successMsg = localRegisterMessage.text + " " + successMsg;
            } else if (localRegisterMessage.text) { // If there was a registration attempt with a message (even if not logged in)
                 successMsg = localRegisterMessage.text + (localRegisterMessage.type === 'error' ? " Dennoch: " : " ") + successMsg;
            }
            setFinalBookingMessage({type: 'success', text: successMsg});
        } catch (error) {
            console.error("Error booking appointment:", error);
            let errorMsg = "Ein Fehler ist beim Buchen des Termins aufgetreten. Bitte versuchen Sie es erneut.";
            if (error.response) {
                errorMsg = error.response.data?.message || errorMsg;
                if (error.response.status === 409 && !userJustRegisteredAndLoggedIn) { // 409 Conflict (e.g. email exists)
                    errorMsg = `${errorMsg} Diese E-Mail ist bereits registriert. Bitte melden Sie sich an oder gehen Sie zurück, um Ihre Daten zu ändern.`;
                } else if (userJustRegisteredAndLoggedIn && error.response.status !== 409) {
                     errorMsg = `Ihr Konto wurde erstellt und Sie sind angemeldet, aber die Terminbuchung schlug fehl: ${errorMsg}`;
                }
            }
            setFinalBookingMessage({ type: 'error', text: errorMsg });
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
                d.setHours(d.getHours() + 1); // Default to 1 hour if duration is invalid
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
            "LOCATION:Friseursalon IMW, Musterstraße 1, 12345 Musterstadt", // Consider making this configurable
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
        setInitialServiceParam(null); // Reset initial service param if it was used
        setSelectedService(null);
        setSelectedDate(null);
        setSelectedTime('');
        setCustomerDetails({ firstName: '', lastName: '', email: '', phoneNumber: '', notes: '', password: '' });
        setRegisterMessage({ type: '', text: '' });
        setFinalBookingMessage({ type: '', text: '' });
        setServiceError(null);
        setTimeError(null);
        setAvailableTimes([]);
        // Determine step based on current user and if an initial service was passed (which is now reset)
        setStep(currentUser ? 1 : 1); // Always go back to step 1 for service selection
    };
    
    // Initial loading message for services (step 1)
    if (loadingServices && !initialServiceParam && step === 1) {
        return <div className="page-center-content"><p className="loading-message"><FontAwesomeIcon icon={faSpinner} spin /> Dienstleistungen werden geladen...</p></div>;
    }
    // Error message if services fail to load and no services are available (step 1)
    if (serviceError && services.length === 0 && !loadingServices && step === 1) {
        return <div className="page-center-content"><p className="form-message error"><FontAwesomeIcon icon={faExclamationCircle} /> {serviceError}</p></div>;
    }

    const visibleStepLabels = currentUser
        ? ["Dienstleistung", "Datum und Zeit", "Bestätigung"]
        : ["Dienstleistung", "Datum und Zeit", "Ihre Daten", "Bestätigung"];

    return (
        <div className="booking-page-container container">
            <div className="booking-form-container">
                <h1 className="booking-page-main-heading">Termin buchen</h1>

                <BookingProgressIndicator
                    currentStep={step}
                    currentUser={currentUser}
                    stepLabels={visibleStepLabels}
                    finalBookingMessage={finalBookingMessage}
                />

                {/* Display general service error if services were loaded but a preselected one was not found, and we are before customer details */}
                {serviceError && services.length > 0 && step < (currentUser ? 4 : 3) && (
                    <p className="form-message error mb-4"><FontAwesomeIcon icon={faExclamationCircle} /> {serviceError}</p>
                )}

                {step === 1 && (
                    <ServiceSelectionStep
                        services={services}
                        selectedService={selectedService}
                        onServiceSelect={handleServiceSelection}
                        loadingServices={loadingServices}
                        serviceError={serviceError && services.length === 0 ? serviceError : null} // Only pass error if no services displayed
                    />
                )}

                {step === 2 && selectedService && (
                    <DateTimeSelectionStep
                        selectedService={selectedService}
                        selectedDate={selectedDate}
                        selectedTime={selectedTime}
                        availableTimes={availableTimes}
                        onDateChange={handleDateChange}
                        onTimeChange={handleTimeChange}
                        loadingAvailableTimes={loadingAvailableTimes}
                        timeError={timeError}
                        onResetBookingProcess={resetBookingProcess} // To go back to step 1
                        onNextStep={handleNextStep} // To proceed to step 3 or 4
                        currentUser={currentUser}
                    />
                )}

                {step === 3 && !currentUser && selectedService && selectedDate && selectedTime && (
                    <CustomerDetailsStep
                        appointmentFormRef={appointmentFormRef}
                        currentUser={currentUser}
                        initialData={customerDetails}
                        onFormSubmit={handleDataFromAppointmentForm}
                        isSubmittingForm={isSubmittingForm}
                        onPrevStep={handlePrevStep}
                        // onNextStep is handled by the component's own submit button triggering onFormSubmit
                        selectedService={selectedService}
                        selectedDate={selectedDate}
                        selectedTime={selectedTime}
                        onNavigateToDateTimeStep={() => setStep(2)} // For the "Ändern" link
                        registerMessage={registerMessage} // Pass register message for display
                    />
                )}

                {step === 4 && selectedService && selectedDate && selectedTime && (
                    <BookingConfirmationStep
                        selectedService={selectedService}
                        selectedDate={selectedDate}
                        selectedTime={selectedTime}
                        customerDetails={customerDetails}
                        finalBookingMessage={finalBookingMessage}
                        isSubmittingFinal={isSubmittingFinal}
                        onConfirmBooking={handleFinalBooking}
                        onPrevStep={handlePrevStep}
                        onResetBookingProcess={resetBookingProcess}
                        generateICal={generateICal}
                        currentUser={currentUser}
                        // registerMessage={registerMessage} // Pass register message for display
                    />
                )}
            </div>
        </div>
    );
}

export default BookingPage;
