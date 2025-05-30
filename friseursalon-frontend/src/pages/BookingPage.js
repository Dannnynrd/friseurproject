// friseursalon-frontend/src/pages/BookingPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react'; // useRef hinzugefügt
import DatePicker, { registerLocale } from 'react-datepicker'; // registerLocale hinzugefügt
import 'react-datepicker/dist/react-datepicker.css';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.service';
import AuthService from '../services/auth.service';
import AppointmentForm from '../components/AppointmentForm'; // Sicherstellen, dass der Pfad korrekt ist
import styles from './BookingPage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes, faSpinner, faExclamationCircle, faCheckCircle,
    faCalendarAlt, faClock, faUserEdit, faCreditCard,
    faChevronLeft, faChevronRight, faConciergeBell // faConciergeBell für Serviceauswahl hinzugefügt
} from '@fortawesome/free-solid-svg-icons';
import { de } from 'date-fns/locale'; // Import für deutsche Lokalisierung

registerLocale('de', de); // Deutsche Lokalisierung für DatePicker registrieren

function BookingPage({ onAppointmentAdded: onAppointmentAddedProp, currentUser: propCurrentUser, onLoginSuccess }) {
    const params = useParams();
    const navigate = useNavigate();
    const appointmentFormRef = useRef(null); // Ref für AppointmentForm

    const serviceNameFromUrl = params.serviceName ? decodeURIComponent(params.serviceName) : null;

    const [currentStep, setCurrentStep] = useState(1);
    const [allServices, setAllServices] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    const [isLoadingServices, setIsLoadingServices] = useState(true);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState('');
    const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
    const [customerDetails, setCustomerDetails] = useState(null); // <<<< HIER IST DIE DEKLARATION

    const currentUser = propCurrentUser || AuthService.getCurrentUser();

    const STEPS_CONFIG_GUEST = [
        { number: "01", label: "Service & Zeit" },
        { number: "02", label: "Ihre Daten" },
        { number: "03", label: "Bestätigung" },
    ];
    const STEPS_CONFIG_USER = [
        { number: "01", label: "Service & Zeit" },
        { number: "02", label: "Bestätigung" },
    ];
    const steps = currentUser ? STEPS_CONFIG_USER : STEPS_CONFIG_GUEST;
    const MAX_STEPS = steps.length;

    const resetBookingState = useCallback(() => {
        setCurrentStep(1);
        setSelectedDate(null);
        setAvailableTimeSlots([]);
        setSelectedTimeSlot('');
        setBookingError('');
        setBookingSuccess('');
        setCustomerDetails(null); // Auch customerDetails zurücksetzen
    }, []);

    useEffect(() => {
        const loadServicesAndSetInitial = async () => {
            setIsLoadingServices(true);
            try {
                const response = await api.get('/api/services');
                const servicesData = response.data || [];
                setAllServices(servicesData);
                if (serviceNameFromUrl) {
                    const foundService = servicesData.find(s => s.name.toLowerCase() === serviceNameFromUrl.toLowerCase());
                    if (foundService) {
                        setSelectedService(foundService);
                    } else {
                        setBookingError(`Dienstleistung "${serviceNameFromUrl}" nicht gefunden.`);
                        setSelectedService(null); // explizit null setzen
                    }
                } else {
                    setSelectedService(null); // Kein Service via URL, also initial null
                }
            } catch (err) {
                console.error("Fehler beim Laden der Services für BookingPage:", err);
                setBookingError("Dienstleistungen konnten nicht geladen werden.");
            } finally {
                setIsLoadingServices(false);
            }
        };
        loadServicesAndSetInitial();
    }, [serviceNameFromUrl]);

    useEffect(() => {
        resetBookingState();
    }, [serviceNameFromUrl, resetBookingState]);


    const fetchAvailableTimeSlots = async (date, serviceForSlots) => {
        if (!date || !serviceForSlots || !serviceForSlots.id) {
            setAvailableTimeSlots([]);
            return;
        }
        setIsLoadingSlots(true);
        setBookingError('');
        try {
            const formattedDate = date.toISOString().split('T')[0];
            const response = await api.get('/api/appointments/available-slots', {
                params: {
                    serviceId: serviceForSlots.id,
                    date: formattedDate
                },
            });
            setAvailableTimeSlots(response.data || []);
        } catch (error) {
            console.error('Error fetching time slots:', error);
            setBookingError('Fehler beim Laden der verfügbaren Zeiten.');
            setAvailableTimeSlots([]);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setSelectedTimeSlot('');
        setBookingSuccess('');
        setBookingError('');
        if (date && selectedService) {
            fetchAvailableTimeSlots(date, selectedService);
        } else {
            setAvailableTimeSlots([]);
        }
    };

    const handleServiceSelection = (service) => {
        setSelectedService(service);
        setSelectedDate(null);
        setSelectedTimeSlot('');
        setAvailableTimeSlots([]);
        setBookingError('');
        setBookingSuccess('');
    };

    const handleTimeSlotSelect = (slot) => {
        setSelectedTimeSlot(slot);
        setBookingSuccess('');
        setBookingError('');
    };

    const handleNextStep = () => {
        if (currentStep === 1 && (!selectedService || !selectedDate || !selectedTimeSlot)) {
            setBookingError("Bitte wählen Sie zuerst Dienstleistung, Datum und Uhrzeit aus.");
            return;
        }
        // Wenn der aktuelle Schritt der ist, wo das AppointmentForm angezeigt wird (für Gäste)
        if (currentStep === (currentUser ? 1 : 2) && !currentUser) { // Schritt 2 für Gäste ist Detailformular
            const formData = appointmentFormRef.current?.triggerSubmitAndGetData();
            if (!formData) {
                // Fehler wird bereits im AppointmentForm oder durch triggerSubmitAndGetData gesetzt.
                return;
            }
            setCustomerDetails(formData); // Speichere die Formulardaten
        }

        setBookingError('');
        if (currentStep < MAX_STEPS) {
            setCurrentStep(prev => prev + 1);
        }
    };


    const handlePrevStep = () => {
        setBookingError('');
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // Diese Funktion wird jetzt vom "Weiter zur Bestätigung" Button im Gast-Detail-Schritt aufgerufen
    const handleFormSubmitDetails = () => {
        const formData = appointmentFormRef.current?.triggerSubmitAndGetData();
        if (formData) {
            setCustomerDetails(formData);
            setCurrentStep(prev => prev + 1); // Zum Bestätigungsschritt
        }
    };


    const handleFinalBooking = async () => {
        if (!selectedService || !selectedDate || !selectedTimeSlot) {
            setBookingError('Unvollständige Terminauswahl.'); return;
        }
        if (!currentUser && !customerDetails) { // Überprüfe customerDetails
            setBookingError('Kundendaten fehlen.'); return;
        }

        setBookingError('');
        setBookingSuccess('');
        setIsSubmittingBooking(true);

        const appointmentDateTime = new Date(selectedDate);
        const [hours, minutes] = selectedTimeSlot.split(':');
        appointmentDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        const bookingPayload = {
            service: { id: selectedService.id },
            customer: currentUser ? {
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                email: currentUser.email,
                phoneNumber: currentUser.phoneNumber || ''
            } : { // Für Gäste verwenden wir die gesammelten Daten
                firstName: customerDetails.firstName,
                lastName: customerDetails.lastName,
                email: customerDetails.email,
                phoneNumber: customerDetails.phoneNumber,
                // Falls Registrierung gewünscht, hier Passwort mitgeben
                // password: customerDetails.password, // Nur wenn AppointmentForm das Passwortfeld hat und es relevant ist
            },
            startTime: appointmentDateTime.toISOString(),
            notes: currentUser ? (selectedService.notes || '') : (customerDetails?.notes || ''),
        };

        try {
            await api.post('/api/appointments', bookingPayload);
            setBookingSuccess(`Ihr Termin für ${selectedService.name} wurde erfolgreich gebucht!`);
            if (onAppointmentAddedProp) onAppointmentAddedProp();
            setCurrentStep(MAX_STEPS + 1);
            setTimeout(() => {
                navigate('/');
            }, 4000);
        } catch (error) {
            console.error('Error creating appointment:', error.response?.data || error.message);
            setBookingError(error.response?.data?.message || 'Fehler bei der Terminbuchung.');
        } finally {
            setIsSubmittingBooking(false);
        }
    };

    const isWeekday = (date) => {
        const day = date.getDay();
        return day !== 0 && day !== 6;
    };

    const renderStepContent = () => {
        if (currentStep > MAX_STEPS) { // Erfolgs-Schritt
            return (
                <div className={`text-center p-6 ${styles.bookingConfirmation}`}>
                    <FontAwesomeIcon icon={faCheckCircle} className={`${styles.confirmationIcon} text-green-500`} />
                    <h3 className={styles.bookingStepHeading}>Termin bestätigt!</h3>
                    <p>{bookingSuccess}</p>
                    <p className="text-sm text-gray-600">Sie erhalten in Kürze eine Bestätigungs-E-Mail.</p>
                    <button onClick={() => navigate('/')} className={`button-link mt-6`}>Zur Startseite</button>
                </div>
            );
        }

        switch (currentStep) {
            case 1: // Service & Zeit
                return (
                    <>
                        <div className={styles.bookingStepSubheading}>
                            <div className={styles.serviceInfoText}>
                                {selectedService ? (
                                    <>
                                        <strong>{selectedService.name}</strong>
                                        <span className={styles.servicePriceDuration}>
                                            Dauer: {selectedService.durationMinutes} Min. / Preis: {typeof selectedService.price === 'number' ? `${selectedService.price.toFixed(2)} €` : selectedService.price}
                                        </span>
                                    </>
                                ) : (
                                    <strong>Bitte wählen Sie eine Dienstleistung</strong>
                                )}
                            </div>
                            {selectedService && <button onClick={() => { setSelectedService(null); setSelectedDate(null); setSelectedTimeSlot(''); setAvailableTimeSlots([]); }} className={`${styles.editSelectionButton} ${styles.smallEdit}`}><FontAwesomeIcon icon={faTimes} /> Auswahl ändern</button>}
                        </div>

                        {!selectedService ? (
                            <div className="mb-6">
                                <h3 className={styles.subHeading}><FontAwesomeIcon icon={faConciergeBell} /> Dienstleistung wählen</h3>
                                {isLoadingServices && <p className={styles.loadingMessage}><FontAwesomeIcon icon={faSpinner} spin /> Lade Services...</p>}
                                <div className={styles.servicesGrid}>
                                    {allServices.map(service => (
                                        <div key={service.id} onClick={() => handleServiceSelection(service)} className={`${styles.serviceCard} ${selectedService?.id === service.id ? styles.selected : ''}`}>
                                            <h4 className={styles.serviceName}>{service.name}</h4>
                                            <p className={styles.serviceDescription}>{service.description}</p>
                                            <p className={styles.serviceDetails}>
                                                {service.durationMinutes} Min. - {typeof service.price === 'number' ? `${service.price.toFixed(2)} €` : service.price}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className={styles.datepickerTimeContainer}>
                                <div className={styles.datepickerWrapperOuter}>
                                    <h3 className={styles.subHeading}><FontAwesomeIcon icon={faCalendarAlt} /> Datum wählen</h3>
                                    <div className={styles.datepickerWrapper}>
                                        <DatePicker
                                            selected={selectedDate}
                                            onChange={handleDateChange}
                                            dateFormat="dd.MM.yyyy"
                                            minDate={new Date()}
                                            filterDate={isWeekday}
                                            placeholderText="Datum auswählen"
                                            inline
                                            locale="de"
                                        />
                                    </div>
                                </div>
                                <div className={styles.timeSlotsWrapperOuter}>
                                    <h3 className={styles.subHeading}><FontAwesomeIcon icon={faClock} /> Uhrzeit wählen</h3>
                                    <div className={styles.timeSlotsWrapper}>
                                        {isLoadingSlots && <div className={`${styles.loadingMessage} ${styles.small}`}><FontAwesomeIcon icon={faSpinner} spin /> Zeiten laden...</div>}
                                        {!isLoadingSlots && !selectedDate && <div className={styles.selectDateMessage}>Bitte zuerst ein Datum wählen.</div>}
                                        {!isLoadingSlots && selectedDate && availableTimeSlots.length > 0 && (
                                            <div className={styles.timeSlotsGrid}>
                                                {availableTimeSlots.map((slot) => (
                                                    <button
                                                        key={slot}
                                                        onClick={() => handleTimeSlotSelect(slot)}
                                                        className={`${styles.timeSlotButton} ${selectedTimeSlot === slot ? styles.selected : ''}`}
                                                    >
                                                        {slot}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {!isLoadingSlots && selectedDate && availableTimeSlots.length === 0 && (
                                            <div className={styles.noTimesMessage}>Keine freien Zeiten für diesen Tag.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {selectedDate && selectedTimeSlot && selectedService && (
                            <div className={`${styles.selectedDatetimeInfo} mt-4`}>
                                Gewählt: <strong>{selectedService.name}</strong> am <strong>{selectedDate.toLocaleDateString('de-DE')}</strong> um <strong>{selectedTimeSlot} Uhr</strong>
                            </div>
                        )}
                    </>
                );
            case 2: // Details (Gäste) ODER Bestätigung (User)
                if (!currentUser) { // Gast: Detailformular
                    return (
                        <>
                            <h3 className={styles.bookingStepHeading}>Ihre Kontaktdaten</h3>
                            <AppointmentForm ref={appointmentFormRef} currentUser={null} />
                        </>
                    );
                }
            // Eingeloggter User: Direkte Bestätigung - Fallthrough zu case 3 (oder MAX_STEPS, wenn nur 2 Schritte für User)
            case 3: // Bestätigung (für Gäste nach Formular, oder für eingeloggte User als Schritt 2)
                const summaryCustomerDetails = currentUser ? {
                    name: `${currentUser.firstName} ${currentUser.lastName}`,
                    email: currentUser.email,
                    phone: currentUser.phoneNumber || 'Nicht angegeben'
                } : customerDetails; // Verwende die gespeicherten customerDetails für Gäste


                if (!summaryCustomerDetails && !currentUser) {
                    // Sollte nicht passieren, wenn Logik in handleNextStep greift
                    return <p>Fehler: Kundendetails nicht verfügbar für Zusammenfassung.</p>;
                }

                return (
                    <div className={styles.appointmentSummaryFinal}>
                        <h3 className={styles.bookingStepHeading}>Terminübersicht</h3>
                        <p><FontAwesomeIcon icon={faConciergeBell} /> <strong>Dienstleistung:</strong> {selectedService?.name}</p>
                        <p><FontAwesomeIcon icon={faCalendarAlt} /> <strong>Datum:</strong> {selectedDate?.toLocaleDateString('de-DE')}</p>
                        <p><FontAwesomeIcon icon={faClock} /> <strong>Uhrzeit:</strong> {selectedTimeSlot} Uhr</p>
                        <p><FontAwesomeIcon icon={faCreditCard} /> <strong>Preis:</strong> {typeof selectedService?.price === 'number' ? `${selectedService.price.toFixed(2)} €` : selectedService?.price}</p>

                        {summaryCustomerDetails && (
                            <>
                                <h3 className="mt-6">Ihre Daten:</h3>
                                <p><FontAwesomeIcon icon={faUserEdit} /> <strong>Name:</strong> {summaryCustomerDetails.name}</p>
                                <p><FontAwesomeIcon icon={faUserEdit} /> <strong>E-Mail:</strong> {summaryCustomerDetails.email}</p>
                                {summaryCustomerDetails.phone && <p><strong>Telefon:</strong> {summaryCustomerDetails.phone}</p>}
                                {summaryCustomerDetails.notes && !currentUser && <p><strong>Notizen:</strong> {summaryCustomerDetails.notes}</p> }
                            </>
                        )}
                        <p className="mt-4 text-sm text-gray-600">Bitte überprüfen Sie Ihre Angaben. Mit Klick auf "Jetzt buchen" wird Ihr Termin verbindlich reserviert.</p>
                    </div>
                );
            default:
                return <div>Unbekannter Schritt</div>;
        }
    };


    return (
        <div className={styles.bookingPageContainer}>
            <div className={styles.bookingFormContainer}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200 relative">
                    <h2 className={`text-xl font-serif font-semibold text-dark-text ${styles.bookingPageMainHeading} mb-0`}>
                        Termin buchen
                    </h2>
                    {/* Navigation erfolgt über Browser/Header oder Erfolgs-Button */}
                </div>

                {currentStep <= MAX_STEPS && (
                    <ul className={`${styles.bookingStepIndicators} ${steps.length === 3 ? styles.threeSteps : (steps.length === 2 ? styles.twoSteps : '')} px-5 pt-5`}>
                        {steps.map((step, index) => (
                            <li key={step.number} className={`
                                ${styles.bookingStepIndicator}
                                ${currentStep === (index + 1) ? styles.active : ''}
                                ${currentStep > (index + 1) || currentStep > MAX_STEPS ? styles.completed : ''}
                            `}>
                                <div className={styles.stepNumberWrapper}>
                                    {currentStep > (index + 1) || currentStep > MAX_STEPS ? (
                                        <FontAwesomeIcon icon={faCheckCircle} className="svg-inline--fa" />
                                    ) : (
                                        <span className={styles.stepNumber}>{step.number}</span>
                                    )}
                                </div>
                                <span className={styles.stepLabel}>{step.label}</span>
                            </li>
                        ))}
                    </ul>
                )}

                <div className={`${styles.bookingStepContent} p-5 overflow-y-auto flex-grow`}>
                    {renderStepContent()}
                </div>

                {currentStep <= MAX_STEPS && (
                    <div className={`${styles.bookingNavigationButtons} p-5 border-t border-gray-200`}>
                        <button
                            onClick={handlePrevStep}
                            disabled={currentStep === 1 || isSubmittingBooking}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 flex items-center"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} className="mr-2 h-4 w-4"/> Zurück
                        </button>

                        {/* "Weiter" Button oder "Weiter zur Bestätigung" für Gast-Details */}
                        {currentStep < MAX_STEPS && (
                            <button
                                onClick={currentStep === (currentUser ? 1 : 2) && !currentUser ? handleFormSubmitDetails : handleNextStep}
                                disabled={isSubmittingBooking || (currentStep === 1 && (!selectedService || !selectedDate || !selectedTimeSlot))}
                                className="bg-dark-text hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center disabled:opacity-50"
                            >
                                {currentStep === (currentUser ? 1 : 2) && !currentUser ? 'Weiter zur Bestätigung' : 'Weiter'}
                                <FontAwesomeIcon icon={faChevronRight} className="ml-2 h-4 w-4"/>
                            </button>
                        )}

                        {currentStep === MAX_STEPS && (
                            <button
                                onClick={handleFinalBooking}
                                disabled={isSubmittingBooking}
                                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center"
                            >
                                {isSubmittingBooking ? <><FontAwesomeIcon icon={faSpinner} spin className="mr-2 h-4 w-4"/>Wird gebucht...</> : <><FontAwesomeIcon icon={faCheckCircle} className="mr-2 h-4 w-4"/> Jetzt verbindlich buchen</>}
                            </button>
                        )}
                    </div>
                )}
                {bookingError && currentStep <= MAX_STEPS && (
                    <div className={`p-4 mx-5 mb-0 mt-0 text-sm text-red-700 bg-red-100 border border-red-300 rounded-b-md ${styles.formMessage} ${styles.error}`}>
                        <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" /> {bookingError}
                    </div>
                )}
            </div>
        </div>
    );
}

export default BookingPage;