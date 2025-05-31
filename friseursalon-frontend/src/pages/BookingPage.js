// friseursalon-frontend/src/pages/BookingPage.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.service';
import AuthService from '../services/auth.service';
import AppointmentForm from '../components/AppointmentForm';
import styles from './BookingPage.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes, faSpinner, faExclamationCircle, faCheckCircle,
    faCalendarAlt, faClock, faUserEdit, faCreditCard,
    faChevronLeft, faChevronRight, faConciergeBell
} from '@fortawesome/free-solid-svg-icons';
import { de } from 'date-fns/locale';
// import { parseISO, format as formatDateFns, isValid as isValidDateFns, addMinutes } from 'date-fns'; // Nicht mehr direkt genutzt, aber gut für Referenz

registerLocale('de', de);

function BookingPage({ onAppointmentAdded: onAppointmentAddedProp, currentUser: propCurrentUser, onLoginSuccess }) {
    const params = useParams();
    const navigate = useNavigate();
    const appointmentFormRef = useRef(null);

    // DEBUGGING START
    console.log('BookingPage - params from URL:', params);
    const serviceNameFromUrl = params.serviceName ? decodeURIComponent(params.serviceName) : null;
    console.log('BookingPage - decoded serviceNameFromUrl:', serviceNameFromUrl, 'Type:', typeof serviceNameFromUrl);
    // DEBUGGING END

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
    const [customerDetails, setCustomerDetails] = useState(null);

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

    useEffect(() => {
        const loadServicesAndSetInitial = async () => {
            setIsLoadingServices(true);
            setBookingError('');
            try {
                const response = await api.get('services');
                const servicesData = response.data || [];
                console.log('BookingPage - All services fetched:', servicesData); // DEBUG LOG
                setAllServices(servicesData);

                if (serviceNameFromUrl) {
                    if (typeof serviceNameFromUrl === 'string') {
                        console.log(`BookingPage - Trying to find service with name (lowercase): "${serviceNameFromUrl.toLowerCase()}"`); // DEBUG LOG
                        servicesData.forEach(s => { // DEBUG LOG
                            console.log(`BookingPage - Checking against service: ID=${s.id}, Name=${JSON.stringify(s.name)}, Typeof Name=${typeof s.name}, Duration=${s.durationMinutes}`);
                        });
                        const foundService = servicesData.find(s => s.name && typeof s.name === 'string' && s.name.toLowerCase() === serviceNameFromUrl.toLowerCase());
                        console.log('BookingPage - Service found by URL name:', foundService); // DEBUG LOG
                        if (foundService) {
                            setSelectedService(foundService);
                        } else {
                            setBookingError(`Dienstleistung "${serviceNameFromUrl}" nicht gefunden. Bitte wählen Sie eine aus der Liste.`);
                            setSelectedService(null);
                        }
                    } else {
                        setBookingError(`Ungültiger Servicename in der URL (Typ: ${typeof serviceNameFromUrl}). Bitte wählen Sie eine Dienstleistung aus der Liste.`);
                        console.warn("serviceNameFromUrl ist kein String:", serviceNameFromUrl);
                        setSelectedService(null);
                    }
                } else {
                    setSelectedService(null);
                }
            } catch (err) {
                console.error("Fehler beim Laden der Services für BookingPage:", err);
                setBookingError("Dienstleistungen konnten nicht geladen werden. Bitte versuchen Sie es später erneut.");
                setAllServices([]);
                setSelectedService(null);
            } finally {
                setIsLoadingServices(false);
            }
        };
        loadServicesAndSetInitial();
    }, [serviceNameFromUrl]);


    useEffect(() => {
        setSelectedDate(null);
        setAvailableTimeSlots([]);
        setSelectedTimeSlot('');
        // BookingError wird bereits in anderen Hooks/Funktionen behandelt
        setBookingSuccess('');
        setCustomerDetails(null);
        if(currentStep > 1 && !selectedService) { // Wenn Serviceauswahl (z.B. durch URL-Änderung) aufgehoben wurde, zurück zu Schritt 1
            setCurrentStep(1);
        }
    }, [selectedService, currentStep]); // currentStep hinzugefügt, um Re-Rendern bei Schrittwechsel zu berücksichtigen


    const fetchAvailableTimeSlots = async (date, serviceForSlots) => {
        if (!date || !serviceForSlots || !serviceForSlots.id) {
            setAvailableTimeSlots([]);
            return;
        }
        setIsLoadingSlots(true);
        setBookingError('');
        try {
            const formattedDate = date.toISOString().split('T')[0];
            const response = await api.get('appointments/available-slots', {
                params: {
                    serviceId: serviceForSlots.id,
                    date: formattedDate
                },
            });
            const slots = response.data || [];
            setAvailableTimeSlots(slots);
            if (slots.length === 0 && date) { // date-Check, um Meldung zu vermeiden, wenn Datum gerade gelöscht wurde
                setBookingError('Für den gewählten Tag und diese Dienstleistung sind leider keine Termine mehr verfügbar. Bitte wählen Sie ein anderes Datum.');
            }
        } catch (error) {
            console.error('Error fetching time slots:', error.response || error.message || error);
            if (error.response && error.response.data && typeof error.response.data.message === 'string') {
                setBookingError(error.response.data.message);
            } else if (error.response && error.response.data && Array.isArray(error.response.data.errors)) { // Für Validierungsfehler vom Backend (mit Feld-spezifischen Meldungen)
                const validationErrors = error.response.data.errors.join(', ');
                setBookingError(`Fehlerhafte Eingabe: ${validationErrors}`);
            } else if (error.response && typeof error.response.data === 'string') {
                setBookingError(error.response.data);
            } else if (error.message) {
                setBookingError(error.message);
            } else {
                setBookingError('Ein Fehler ist beim Laden der verfügbaren Zeiten aufgetreten. Bitte versuchen Sie es erneut.');
            }
            setAvailableTimeSlots([]);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setSelectedTimeSlot('');
        setBookingSuccess('');
        setBookingError(''); // Fehler löschen
        if (date && selectedService) {
            console.log('BookingPage handleDateChange - Calling fetchAvailableTimeSlots with service:', selectedService); // DEBUG LOG
            if (selectedService) { // DEBUG LOG
                console.log(`BookingPage handleDateChange - Service ID: ${selectedService.id}, Duration: ${selectedService.durationMinutes}`);
            }
            fetchAvailableTimeSlots(date, selectedService);
        } else {
            setAvailableTimeSlots([]);
        }
    };

    const handleServiceSelection = (service) => {
        setSelectedService(service); // Kann auch null sein, wenn "Auswahl ändern" geklickt wird
        // Beim Ändern des Services, Datum und Zeit zurücksetzen
        setSelectedDate(null);
        setSelectedTimeSlot('');
        setAvailableTimeSlots([]);
        setBookingError(''); // Fehler löschen
        setBookingSuccess('');
    };

    const handleTimeSlotSelect = (slot) => {
        setSelectedTimeSlot(slot);
        setBookingSuccess('');
        setBookingError(''); // Fehler löschen
    };

    const handleNextStep = () => {
        if (currentStep === 1 && (!selectedService || !selectedDate || !selectedTimeSlot)) {
            setBookingError("Bitte wählen Sie zuerst Dienstleistung, Datum und Uhrzeit aus.");
            return;
        }
        if (currentStep === (currentUser ? 1 : 2) && !currentUser) { // Für Gäste, vor dem Schritt "Ihre Daten"
            const formData = appointmentFormRef.current?.triggerSubmitAndGetData();
            if (!formData) { // Validierung im Formular fehlgeschlagen
                return; // AppointmentForm setzt eigene Fehler
            }
            setCustomerDetails(formData);
        }
        setBookingError(''); // Fehler löschen, bevor zum nächsten Schritt gegangen wird
        if (currentStep < MAX_STEPS) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrevStep = () => {
        setBookingError(''); // Fehler löschen
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleFormSubmitDetails = () => { // Nur für Gäste, um Formulardaten zu holen
        const formData = appointmentFormRef.current?.triggerSubmitAndGetData();
        if (formData) { // Nur wenn Formular gültig ist und Daten liefert
            setCustomerDetails(formData);
            setCurrentStep(prev => prev + 1); // Gehe zu Schritt 3 (Bestätigung für Gast)
        }
    };

    const handleFinalBooking = async () => {
        if (!selectedService || !selectedDate || !selectedTimeSlot) {
            setBookingError('Unvollständige Terminauswahl.'); return;
        }
        if (!currentUser && !customerDetails) {
            setBookingError('Kundendaten fehlen.'); return;
        }
        setBookingError('');
        setBookingSuccess('');
        setIsSubmittingBooking(true);

        const appointmentDateTime = new Date(selectedDate);
        const [hours, minutes] = selectedTimeSlot.split(':');
        appointmentDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        let customerPayload;
        if (currentUser) {
            customerPayload = {
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                email: currentUser.email,
                phoneNumber: currentUser.phoneNumber || ''
            };
        } else if (customerDetails) {
            customerPayload = {
                firstName: customerDetails.firstName,
                lastName: customerDetails.lastName,
                email: customerDetails.email,
                phoneNumber: customerDetails.phoneNumber,
                password: customerDetails.password, // Wird nur gesendet, wenn im AppointmentForm eingegeben
            };
        } else {
            setBookingError('Kundendaten konnten nicht ermittelt werden.');
            setIsSubmittingBooking(false);
            return;
        }

        const bookingPayload = {
            service: { id: selectedService.id },
            customer: customerPayload,
            startTime: appointmentDateTime.toISOString(),
            notes: customerDetails?.notes || '', // Nimmt Notizen vom Gast, falls vorhanden
        };

        try {
            await api.post('appointments', bookingPayload);
            setBookingSuccess(`Ihr Termin für ${typeof selectedService.name === 'string' ? selectedService.name : 'diese Dienstleistung'} wurde erfolgreich gebucht!`);
            if (onAppointmentAddedProp) onAppointmentAddedProp();
            setCurrentStep(MAX_STEPS + 1); // Gehe zum Erfolgs-Screen
            setTimeout(() => {
                navigate(currentUser ? '/account/dashboard' : '/'); // Weiterleitung je nach User-Status
            }, 4000);
        } catch (error) {
            console.error('Error creating appointment:', error.response?.data || error.message);
            const errMsg = error.response?.data?.message || (error.response?.data?.errors ? error.response.data.errors.join(', ') : error.response?.data) || 'Fehler bei der Terminbuchung.';
            setBookingError(errMsg);
        } finally {
            setIsSubmittingBooking(false);
        }
    };

    const isWeekday = (date) => {
        const day = date.getDay();
        return day !== 0 && day !== 6; // Sonntag (0) und Samstag (6) sind bei dir frei
    };

    const renderStepContent = () => {
        if (currentStep > MAX_STEPS) { // Erfolgs-Screen nach Buchung
            return (
                <div className={`text-center p-6 ${styles.bookingConfirmation}`}>
                    <FontAwesomeIcon icon={faCheckCircle} className={`${styles.confirmationIcon} text-green-500`} />
                    <h3 className={styles.bookingStepHeading}>Termin bestätigt!</h3>
                    <p>{bookingSuccess}</p>
                    <p className="text-sm text-gray-600">Sie erhalten in Kürze eine Bestätigungs-E-Mail.</p>
                    <button onClick={() => navigate(currentUser ? '/account/dashboard' : '/')} className={`button-link mt-6`}>
                        {currentUser ? 'Zum Dashboard' : 'Zur Startseite'}
                    </button>
                </div>
            );
        }

        switch (currentStep) {
            case 1: // Service, Datum, Zeit wählen
                return (
                    <>
                        <div className={styles.bookingStepSubheading}>
                            <div className={styles.serviceInfoText}>
                                {selectedService ? (
                                    <>
                                        <strong>{typeof selectedService.name === 'string' ? selectedService.name : 'Ungültiger Name'}</strong>
                                        <span className={styles.servicePriceDuration}>
                                            Dauer: {selectedService.durationMinutes > 0 ? selectedService.durationMinutes : 'N/A'} Min. / Preis: {typeof selectedService.price === 'number' ? `${selectedService.price.toFixed(2)} €` : selectedService.price}
                                        </span>
                                    </>
                                ) : (
                                    <strong>Bitte wählen Sie eine Dienstleistung</strong>
                                )}
                            </div>
                            {selectedService && <button onClick={() => handleServiceSelection(null)} className={`${styles.editSelectionButton} ${styles.smallEdit}`}><FontAwesomeIcon icon={faTimes} /> Auswahl ändern</button>}
                        </div>

                        {!selectedService ? (
                            <div className="mb-6">
                                <h3 className={styles.subHeading}><FontAwesomeIcon icon={faConciergeBell} /> Dienstleistung wählen</h3>
                                {isLoadingServices && <p className={styles.loadingMessage}><FontAwesomeIcon icon={faSpinner} spin /> Lade Services...</p>}
                                <div className={styles.servicesGrid}>
                                    {allServices.map(service => (
                                        <div key={service.id} onClick={() => handleServiceSelection(service)} className={`${styles.serviceCard} ${selectedService?.id === service.id ? styles.selected : ''}`}>
                                            <h4 className={styles.serviceName}>{typeof service.name === 'string' ? service.name : 'Ungültiger Name'}</h4>
                                            <p className={styles.serviceDescription}>{service.description}</p>
                                            <p className={styles.serviceDetails}>
                                                {service.durationMinutes > 0 ? service.durationMinutes : 'N/A'} Min. - {typeof service.price === 'number' ? `${service.price.toFixed(2)} €` : service.price}
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
                                            filterDate={isWeekday} // Nur Wochentage (Mo-Fr), wenn Sa/So frei sind
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
                                        {!isLoadingSlots && !selectedDate && !bookingError && <div className={styles.selectDateMessage}>Bitte zuerst ein Datum wählen.</div>}
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
                                        {/* Nachricht für keine Zeiten wird jetzt über bookingError angezeigt, wenn fetchAvailableTimeSlots den Fehler setzt */}
                                        {!isLoadingSlots && selectedDate && availableTimeSlots.length === 0 && !bookingError && (
                                            <div className={styles.noTimesMessage}>Keine freien Zeiten für diesen Tag. Bitte wählen Sie ein anderes Datum.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {selectedDate && selectedTimeSlot && selectedService && (
                            <div className={`${styles.selectedDatetimeInfo} mt-4`}>
                                Gewählt: <strong>{typeof selectedService.name === 'string' ? selectedService.name : 'Fehlerhafter Service'}</strong> am <strong>{selectedDate.toLocaleDateString('de-DE')}</strong> um <strong>{selectedTimeSlot} Uhr</strong>
                            </div>
                        )}
                    </>
                );
            case 2: // Kontaktdaten für Gast ODER Bestätigung für eingeloggten User
                if (!currentUser) { // Gast: Kontaktdaten eingeben
                    return (
                        <>
                            <h3 className={styles.bookingStepHeading}>Ihre Kontaktdaten</h3>
                            {/* Stelle sicher, dass initialData an AppointmentForm übergeben wird, wenn vorhanden */}
                            <AppointmentForm ref={appointmentFormRef} currentUser={null} initialData={customerDetails || {}} />
                        </>
                    );
                }
            // Für eingeloggte User: Direkt zu Fall 3 (Bestätigung)
            case 3: // Bestätigung
                const summaryCustomer = currentUser ? {
                    name: `${currentUser.firstName} ${currentUser.lastName}`,
                    email: currentUser.email,
                    phone: currentUser.phoneNumber || 'Nicht angegeben'
                } : customerDetails;

                // Sicherheitsprüfung, ob alle Daten für die Zusammenfassung da sind
                if (!selectedService || !selectedDate || !selectedTimeSlot || (!currentUser && !summaryCustomer)) {
                    // Setze Fehler nur, wenn er nicht schon gesetzt ist, um Endlosschleifen zu vermeiden, falls setCurrentStep den Effekt auslöst.
                    if (!bookingError) {
                        setBookingError("Daten für die Zusammenfassung sind unvollständig. Bitte überprüfen Sie Ihre Auswahl.");
                    }
                    // Zurück zu Schritt 1, wenn Kerndaten fehlen und der aktuelle Schritt nicht schon 1 ist
                    if (currentStep !== 1) setCurrentStep(1);
                    return null; // Fehler wird oben angezeigt
                }

                return (
                    <div className={styles.appointmentSummaryFinal}>
                        <h3 className={styles.bookingStepHeading}>Terminübersicht</h3>
                        <p><FontAwesomeIcon icon={faConciergeBell} /> <strong>Dienstleistung:</strong> {typeof selectedService.name === 'string' ? selectedService.name : 'Fehlerhafter Service'}</p>
                        <p><FontAwesomeIcon icon={faCalendarAlt} /> <strong>Datum:</strong> {selectedDate.toLocaleDateString('de-DE')}</p>
                        <p><FontAwesomeIcon icon={faClock} /> <strong>Uhrzeit:</strong> {selectedTimeSlot} Uhr</p>
                        <p><FontAwesomeIcon icon={faCreditCard} /> <strong>Preis:</strong> {typeof selectedService.price === 'number' ? `${selectedService.price.toFixed(2)} €` : selectedService.price}</p>

                        {summaryCustomer && (
                            <>
                                <h4 className="mt-6 text-lg font-semibold text-dark-text">Ihre Daten:</h4>
                                <p><FontAwesomeIcon icon={faUserEdit} /> <strong>Name:</strong> {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : `${summaryCustomer.firstName} ${summaryCustomer.lastName}`}</p>
                                <p><FontAwesomeIcon icon={faUserEdit} /> <strong>E-Mail:</strong> {currentUser ? currentUser.email : summaryCustomer.email}</p>
                                {(currentUser?.phoneNumber || summaryCustomer?.phoneNumber) && <p><strong>Telefon:</strong> {currentUser ? currentUser.phoneNumber : summaryCustomer.phoneNumber}</p>}
                                {(!currentUser && summaryCustomer?.notes) && <p><strong>Notizen:</strong> {summaryCustomer.notes}</p> }
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
                    {bookingError && currentStep <= MAX_STEPS && (
                        <div className={`p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md ${styles.formMessage} ${styles.error}`}>
                            <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" /> {bookingError}
                        </div>
                    )}
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

                        {/* Nächster Button:
                            - Wenn Gast und aktueller Schritt ist vor dem Kontaktdatenformular -> handleFormSubmitDetails (validiert und holt Daten)
                            - Sonst -> handleNextStep
                        */}
                        {currentStep < MAX_STEPS && (
                            <button
                                onClick={!currentUser && currentStep === (MAX_STEPS -1) ? handleFormSubmitDetails : handleNextStep}
                                disabled={isSubmittingBooking || (currentStep === 1 && (!selectedService || !selectedDate || !selectedTimeSlot))}
                                className="bg-dark-text hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center disabled:opacity-50"
                            >
                                {/* Text anpassen, ob es der Schritt vor der Dateneingabe ist */}
                                {!currentUser && currentStep === (MAX_STEPS -1) ? 'Weiter zur Bestätigung' : 'Weiter'}
                                <FontAwesomeIcon icon={faChevronRight} className="ml-2 h-4 w-4"/>
                            </button>
                        )}

                        {/* Buchungsbutton nur im letzten Schritt (Bestätigung) */}
                        {currentStep === MAX_STEPS && (
                            <button
                                onClick={handleFinalBooking}
                                disabled={isSubmittingBooking || (!selectedService || !selectedDate || !selectedTimeSlot) || (!currentUser && !customerDetails) }
                                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center"
                            >
                                {isSubmittingBooking ? <><FontAwesomeIcon icon={faSpinner} spin className="mr-2 h-4 w-4"/>Wird gebucht...</> : <><FontAwesomeIcon icon={faCheckCircle} className="mr-2 h-4 w-4"/> Jetzt verbindlich buchen</>}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default BookingPage;