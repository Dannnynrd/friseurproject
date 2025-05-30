// friseursalon-frontend/src/pages/BookingPage.js
import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
// useNavigate wird hier nicht mehr primär für die Navigation innerhalb der Buchung verwendet,
// aber ggf. für andere Aktionen (z.B. nach Login)
import { useNavigate } from 'react-router-dom';
import api from '../services/api.service';
import AuthService from '../services/auth.service';
import AppointmentForm from '../components/AppointmentForm';
import styles from './BookingPage.module.css'; // Dein CSS-Modul
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faExclamationCircle, faCheckCircle, faCalendarAlt, faClock, faUserEdit, faCreditCard, faChevronLeft, faChevronRight, faHouseUser, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';

// Props: isOpen, onClose, serviceName, servicePrice, serviceDuration
function BookingPage({ isOpen, onClose, serviceName, servicePrice, serviceDuration }) {
    console.log("BookingPage props:", { isOpen, onClose, serviceName, servicePrice, serviceDuration }); // DEBUG

    const [currentStep, setCurrentStep] = useState(1); // 1: Date/Time, 2: Details, 3: Confirm/Pay
    const [selectedDate, setSelectedDate] = useState(null);
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState('');
    const [customerDetails, setCustomerDetails] = useState(null); // Für die Daten aus AppointmentForm

    const currentUser = AuthService.getCurrentUser();
    const navigate = useNavigate();

    const STEPS_CONFIG_GUEST = [
        { number: "01", label: "Datum & Zeit" },
        { number: "02", label: "Ihre Daten" },
        { number: "03", label: "Bestätigung" },
    ];
    const STEPS_CONFIG_USER = [
        { number: "01", label: "Datum & Zeit" },
        { number: "02", label: "Bestätigung" },
    ];
    const steps = currentUser ? STEPS_CONFIG_USER : STEPS_CONFIG_GUEST;
    const MAX_STEPS = steps.length;

    const resetBookingState = useCallback(() => {
        console.log("BookingPage: resetBookingState called"); // DEBUG
        setCurrentStep(1);
        setSelectedDate(null);
        setAvailableTimeSlots([]);
        setSelectedTimeSlot('');
        setBookingError('');
        setBookingSuccess('');
        setCustomerDetails(null);
    }, []);

    useEffect(() => {
        console.log("BookingPage: isOpen effect triggered. isOpen:", isOpen); // DEBUG
        if (!isOpen) {
            setTimeout(resetBookingState, 300); // Reset mit Verzögerung beim Schließen
        } else {
            resetBookingState(); // Sofortiger Reset beim Öffnen
        }
    }, [isOpen, serviceName, resetBookingState]); // serviceName als Abhängigkeit hinzugefügt, falls sich der Service bei offenem Modal ändert

    const fetchAvailableTimeSlots = async (date) => {
        if (!date || !serviceDuration) {
            console.log("fetchAvailableTimeSlots: date or serviceDuration missing"); //DEBUG
            return;
        }
        setIsLoadingSlots(true);
        setBookingError('');
        try {
            const formattedDate = date.toISOString().split('T')[0];
            console.log("Fetching slots for date:", formattedDate, "duration:", serviceDuration); // DEBUG
            const response = await api.get('/api/appointments/available-slots', {
                params: { date: formattedDate, duration: serviceDuration },
            });
            console.log("Available slots response:", response.data); // DEBUG
            setAvailableTimeSlots(response.data || []);
        } catch (error) {
            console.error('Error fetching time slots:', error);
            setBookingError('Fehler beim Laden der Zeiten.');
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
        if (date) {
            fetchAvailableTimeSlots(date);
        } else {
            setAvailableTimeSlots([]);
        }
    };

    const handleTimeSlotSelect = (slot) => {
        setSelectedTimeSlot(slot);
        setBookingSuccess('');
        setBookingError('');
    };

    const handleNextStep = () => {
        console.log("handleNextStep called. currentStep:", currentStep); // DEBUG
        if (currentStep === 1 && (!selectedDate || !selectedTimeSlot)) {
            setBookingError("Bitte wählen Sie zuerst Datum und Uhrzeit aus.");
            return;
        }
        setBookingError('');
        if (currentStep < MAX_STEPS) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrevStep = () => {
        console.log("handlePrevStep called. currentStep:", currentStep); // DEBUG
        setBookingError('');
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleFormSubmit = (formData) => {
        console.log("handleFormSubmit called with data:", formData); // DEBUG
        setCustomerDetails(formData);
        if (currentUser) {
            setCurrentStep(MAX_STEPS);
        } else {
            handleNextStep();
        }
    };

    const handleFinalBooking = async () => {
        console.log("handleFinalBooking called"); // DEBUG
        if (!selectedDate || !selectedTimeSlot || !serviceName || (!currentUser && !customerDetails)) {
            setBookingError('Ein Fehler ist aufgetreten. Bitte überprüfen Sie Ihre Eingaben.');
            console.error("Final booking validation failed:", {selectedDate, selectedTimeSlot, serviceName, currentUser, customerDetails}); // DEBUG
            return;
        }
        setBookingError('');
        setBookingSuccess('');

        const appointmentDateTime = new Date(selectedDate);
        const [hours, minutes] = selectedTimeSlot.split(':');
        appointmentDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        const appointmentData = {
            serviceName: serviceName,
            appointmentTime: appointmentDateTime.toISOString(),
            duration: serviceDuration,
            price: servicePrice,
            customer: currentUser ? {
                name: currentUser.username,
                email: currentUser.email,
                phone: currentUser.phone || ''
            } : customerDetails,
            userId: currentUser ? currentUser.id : null,
        };
        console.log("Submitting appointment data:", appointmentData); // DEBUG

        try {
            await api.post('/api/appointments/book', appointmentData);
            setBookingSuccess(`Ihr Termin für ${serviceName} wurde erfolgreich gebucht!`);
            setCurrentStep(MAX_STEPS + 1);
            setTimeout(() => {
                onClose();
            }, 4000);
        } catch (error) {
            console.error('Error creating appointment:', error.response?.data || error.message);
            setBookingError(error.response?.data?.message || 'Fehler bei der Terminbuchung.');
        }
    };

    const isWeekday = (date) => {
        const day = date.getDay();
        return day !== 0 && day !== 6; // So & Sa ausschließen
    };

    if (!isOpen) {
        console.log("BookingPage: isOpen is false, returning null."); // DEBUG
        return null;
    }
    console.log("BookingPage rendering modal, isOpen is true. Current step:", currentStep); // DEBUG

    const renderStepContent = () => {
        // Erfolgs-Schritt
        if (currentStep > MAX_STEPS) {
            return (
                <div className={`text-center p-6 ${styles.bookingConfirmation}`}>
                    <FontAwesomeIcon icon={faCheckCircle} className={`${styles.confirmationIcon} text-green-500`} />
                    <h3 className={styles.bookingStepHeading}>Termin bestätigt!</h3>
                    <p>{bookingSuccess}</p>
                    <p className="text-sm text-gray-600">Sie erhalten in Kürze eine Bestätigungs-E-Mail.</p>
                </div>
            );
        }

        // Reguläre Schritte
        switch (currentStep) {
            case 1: // Datum & Zeit
                return (
                    <>
                        <div className={styles.bookingStepSubheading}>
                            <div className={styles.serviceInfoText}>
                                <strong>{serviceName}</strong>
                                <span className={styles.servicePriceDuration}>
                                    Dauer: {serviceDuration} Min. / Preis: {typeof servicePrice === 'number' ? `${servicePrice.toFixed(2)} €` : servicePrice}
                                </span>
                            </div>
                        </div>
                        <div className={styles.datepickerTimeContainer}>
                            <div className={styles.datepickerWrapperOuter}>
                                <h3 className={styles.subHeading}>
                                    <FontAwesomeIcon icon={faCalendarAlt} /> Datum wählen
                                </h3>
                                <div className={styles.datepickerWrapper}>
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={handleDateChange}
                                        dateFormat="dd.MM.yyyy"
                                        minDate={new Date()}
                                        filterDate={isWeekday}
                                        placeholderText="Datum auswählen"
                                        inline
                                    />
                                </div>
                            </div>
                            <div className={styles.timeSlotsWrapperOuter}>
                                <h3 className={styles.subHeading}>
                                    <FontAwesomeIcon icon={faClock} /> Uhrzeit wählen
                                </h3>
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
                        {selectedDate && selectedTimeSlot && (
                            <div className={`${styles.selectedDatetimeInfo} mt-4`}>
                                Gewählt: <strong>{selectedDate.toLocaleDateString('de-DE')}</strong> um <strong>{selectedTimeSlot} Uhr</strong>
                            </div>
                        )}
                    </>
                );
            case 2: // Details (für Gäste) oder Bestätigung (für eingeloggte User)
                if (!currentUser) { // Gast: Detailformular
                    return (
                        <>
                            <h3 className={styles.bookingStepHeading}>Ihre Kontaktdaten</h3>
                            <AppointmentForm
                                onSubmit={handleFormSubmit}
                                user={null}
                                serviceName={serviceName}
                                selectedDate={selectedDate}
                                selectedTimeSlot={selectedTimeSlot}
                                isGuestBooking={true}
                                submitButtonText="Weiter zur Bestätigung"
                            />
                        </>
                    );
                }
            // Eingeloggter User: Direkte Bestätigung - Fallthrough
            case 3: // Bestätigung (für Gäste nach Formular, oder für eingeloggte User als Schritt 2)
                const finalCustomerDetails = currentUser ? {
                    name: currentUser.username,
                    email: currentUser.email,
                    phone: currentUser.phone || 'Nicht angegeben'
                } : customerDetails;

                // Sicherstellen, dass customerDetails für Gäste vorhanden ist, bevor gerendert wird
                if (!currentUser && !customerDetails && currentStep === MAX_STEPS) {
                    console.log("DEBUG: Guest in confirmation step but no customerDetails yet. currentStep:", currentStep, "MAX_STEPS:", MAX_STEPS);
                    // Optional: Zeige eine Ladeanzeige oder eine Meldung, oder gehe zurück zum Formular
                    // Fürs Erste, um einen leeren Render zu vermeiden, wenn das Formular noch nicht gesendet wurde:
                    if (currentStep === MAX_STEPS && !currentUser) { // Nur für Gäste im letzten Schritt vor der Buchung
                        return (
                            <>
                                <h3 className={styles.bookingStepHeading}>Ihre Kontaktdaten</h3>
                                <p className="text-sm text-gray-500 mb-4">Bitte füllen Sie Ihre Kontaktdaten aus, um fortzufahren.</p>
                                <AppointmentForm
                                    onSubmit={handleFormSubmit}
                                    user={null}
                                    serviceName={serviceName}
                                    selectedDate={selectedDate}
                                    selectedTimeSlot={selectedTimeSlot}
                                    isGuestBooking={true}
                                    submitButtonText="Weiter zur Bestätigung"
                                />
                            </>
                        );
                    }
                }


                return (
                    <div className={styles.appointmentSummaryFinal}>
                        <h3 className={styles.bookingStepHeading}>Terminübersicht</h3>
                        <p><FontAwesomeIcon icon={faCalendarCheck} /> <strong>Dienstleistung:</strong> {serviceName}</p>
                        <p><FontAwesomeIcon icon={faCalendarAlt} /> <strong>Datum:</strong> {selectedDate?.toLocaleDateString('de-DE')}</p>
                        <p><FontAwesomeIcon icon={faClock} /> <strong>Uhrzeit:</strong> {selectedTimeSlot} Uhr</p>
                        <p><FontAwesomeIcon icon={faCreditCard} /> <strong>Preis:</strong> {typeof servicePrice === 'number' ? `${servicePrice.toFixed(2)} €` : servicePrice}</p>

                        {finalCustomerDetails && (
                            <>
                                <h3 className="mt-6">Ihre Daten:</h3>
                                <p><FontAwesomeIcon icon={faUserEdit} /> <strong>Name:</strong> {finalCustomerDetails.name}</p>
                                <p><FontAwesomeIcon icon={faHouseUser} /> <strong>E-Mail:</strong> {finalCustomerDetails.email}</p>
                                {finalCustomerDetails.phone && <p><strong>Telefon:</strong> {finalCustomerDetails.phone}</p>}
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1055] p-4 animate-fadeInModalOverlay backdrop-blur-sm">
            {/* DEBUGGING: Prominente Testüberschrift */}
            <h1 style={{ position: 'absolute', top: '10px', left: '10px', color: 'red', backgroundColor: 'white', padding: '10px', zIndex: 9999 }}>MODAL TEST RENDER</h1>

            <div className={`bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col animate-slideInModalContent ${styles.bookingFormContainer}`}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200">
                    <h2 className={`text-xl font-serif font-semibold text-dark-text ${styles.bookingPageMainHeading} mb-0`}>
                        Termin für: {serviceName}
                    </h2>
                    <button onClick={onClose} aria-label="Modal schließen" className="text-gray-400 hover:text-gray-700 transition-colors">
                        <FontAwesomeIcon icon={faTimes} size="lg" />
                    </button>
                </div>

                {currentStep <= MAX_STEPS && (
                    <ul className={`${styles.bookingStepIndicators} ${steps.length === 3 ? styles.threeSteps : ''} px-5 pt-5`}>
                        {steps.map((step, index) => (
                            <li key={step.number} className={`
                                ${styles.bookingStepIndicator}
                                ${currentStep === (index + 1) ? styles.active : ''}
                                ${currentStep > (index + 1) || currentStep > MAX_STEPS ? styles.completed : ''}
                            `}>
                                <div className={styles.stepNumberWrapper}>
                                    {currentStep > (index + 1) || currentStep > MAX_STEPS ? (
                                        <FontAwesomeIcon icon={faCheckCircle} className={styles.svgInlineFa} />
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
                            disabled={currentStep === 1}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 flex items-center"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} className="mr-2 h-4 w-4"/> Zurück
                        </button>
                        {currentStep < MAX_STEPS && (
                            <button
                                onClick={handleNextStep}
                                className="bg-dark-text hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center"
                            >
                                Weiter <FontAwesomeIcon icon={faChevronRight} className="ml-2 h-4 w-4"/>
                            </button>
                        )}
                        {currentStep === MAX_STEPS && (
                            <button
                                onClick={handleFinalBooking}
                                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center"
                            >
                                <FontAwesomeIcon icon={faCheckCircle} className="mr-2 h-4 w-4"/> Jetzt verbindlich buchen
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

