import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheckCircle, faExclamationCircle, faSpinner, faArrowLeft,
    faCalendarAlt, faClock, faUser, faEnvelope, faPhone, faStickyNote, faCalendarPlus, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import AuthService from '../../services/auth.service'; // Needed for checking current user for button display

// Assuming BookingPage.css provides styles for .booking-step-content, .appointment-summary-final, etc.

function BookingConfirmationStep({
    selectedService,
    selectedDate,
    selectedTime,
    customerDetails,
    finalBookingMessage,
    isSubmittingFinal,
    onConfirmBooking, // Callback for "Termin verbindlich buchen"
    onPrevStep,       // Callback for "Zurück" button
    onResetBookingProcess, // Callback for "Neuen Termin buchen"
    generateICal,
    currentUser // For conditional rendering of "Meine Termine" button
}) {
    if (!selectedService || !selectedDate || !selectedTime) {
        // Should not happen if steps are followed, but good as a guard
        return (
            <div className="booking-step-content animate-step">
                <p className="form-message error">Fehler: Buchungsdetails sind unvollständig. Bitte starten Sie den Prozess neu.</p>
                <button type="button" onClick={onResetBookingProcess} className="button-link-outline">
                    Buchung neu starten
                </button>
            </div>
        );
    }
    
    return (
        <div className="booking-step-content animate-step">
            {finalBookingMessage && finalBookingMessage.type === 'success' ? (
                <div className="booking-confirmation">
                    <FontAwesomeIcon icon={faCheckCircle} className="confirmation-icon" />
                    <h2 className="booking-step-heading">Termin erfolgreich gebucht!</h2>
                    <p>
                        Vielen Dank für Ihre Buchung. 
                        {(AuthService.getCurrentUser() || customerDetails.email) ? ' Eine Bestätigung wurde an Ihre E-Mail-Adresse gesendet und Sie finden den Termin ggf. unter "Meine Termine".' : ''}
                    </p>
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
                        <button type="button" onClick={onResetBookingProcess} className="button-link-outline">Neuen Termin buchen</button>
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

                    {/* Display for messages that are not errors, e.g. successful registration before booking attempt */}
                    {finalBookingMessage && finalBookingMessage.type && finalBookingMessage.type !== 'error' && finalBookingMessage.type !== 'success' && (
                         <p className={`form-message ${finalBookingMessage.type} mt-4`}>
                            <FontAwesomeIcon icon={finalBookingMessage.type === 'info' ? faInfoCircle : faCheckCircle} />
                            {finalBookingMessage.text}
                        </p>
                    )}
                    {/* Display for error messages */}
                    {finalBookingMessage && finalBookingMessage.type === 'error' && (
                        <p className={`form-message ${finalBookingMessage.type} mt-4`}>
                            <FontAwesomeIcon icon={faExclamationCircle} />
                            {finalBookingMessage.text}
                        </p>
                    )}

                    <div className="booking-navigation-buttons">
                        <button type="button" onClick={onPrevStep} className="button-link-outline" disabled={isSubmittingFinal}>
                            <FontAwesomeIcon icon={faArrowLeft} /> Zurück {currentUser ? "zu Datum und Zeit" : "zu Ihren Daten"}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirmBooking}
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
    );
}

export default BookingConfirmationStep;
