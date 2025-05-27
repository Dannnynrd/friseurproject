import React from 'react';
import AppointmentForm from '../AppointmentForm'; // Assuming path is correct
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faEdit, faArrowLeft, faArrowRight, faSpinner, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

// Assuming BookingPage.css provides styles for .booking-step-content, .appointment-summary-inline, etc.

function CustomerDetailsStep({
    appointmentFormRef, // Ref for AppointmentForm
    currentUser,
    initialData,
    onFormSubmit, // Callback for when AppointmentForm is submitted successfully
    isSubmittingForm, // To disable buttons during submission
    onPrevStep, // Callback for "Back" button
    onNextStep, // Callback for "Next" button (which triggers form validation via ref)
    selectedService,
    selectedDate,
    selectedTime,
    onNavigateToDateTimeStep, // Callback to go back to step 2
    registerMessage // To display registration errors if any
}) {
    // This function will be triggered by the "Next" button in this step component
    const handleProceedToConfirmation = () => {
        if (appointmentFormRef.current) {
            // This will call the submit handler inside AppointmentForm,
            // which should then call its onFormSubmit prop (which is this component's onFormSubmit prop)
            appointmentFormRef.current.triggerSubmitAndGetData();
        }
    };

    return (
        <div className="booking-step-content animate-step">
            <h2 className="booking-step-heading">3. Ihre persönlichen Daten</h2>
            {selectedService && selectedDate && selectedTime && (
                <div className="appointment-summary-inline">
                    <p>
                        <FontAwesomeIcon icon={faCheckCircle} className="summary-icon" />
                        Termin für: <strong>{selectedService.name}</strong>
                        am {selectedDate.toLocaleDateString('de-DE')} um {selectedTime} Uhr.
                        <button type="button" onClick={onNavigateToDateTimeStep} className="edit-selection-button subtle-edit">
                            <FontAwesomeIcon icon={faEdit} /> Ändern
                        </button>
                    </p>
                </div>
            )}
            {registerMessage && registerMessage.text && registerMessage.type === 'error' && (
                <p className={`form-message ${registerMessage.type} mb-4`}>
                    <FontAwesomeIcon icon={faExclamationCircle} /> {registerMessage.text}
                </p>
            )}
            <AppointmentForm
                ref={appointmentFormRef}
                currentUser={currentUser}
                initialData={initialData}
                onFormSubmit={onFormSubmit} // This will be called by AppointmentForm upon successful internal validation & submission
                // isSubmitting can be handled internally by AppointmentForm or passed if needed
            />
            <div className="booking-navigation-buttons">
                <button type="button" onClick={onPrevStep} className="button-link-outline" disabled={isSubmittingForm}>
                    <FontAwesomeIcon icon={faArrowLeft} /> Zurück zu Datum und Zeit
                </button>
                <button
                    type="button"
                    onClick={handleProceedToConfirmation} // Use the new handler
                    className="button-link"
                    disabled={isSubmittingForm}
                >
                    {isSubmittingForm ? <><FontAwesomeIcon icon={faSpinner} spin /> Verarbeite...</> : <>Weiter zur Zusammenfassung <FontAwesomeIcon icon={faArrowRight} /></>}
                </button>
            </div>
        </div>
    );
}

export default CustomerDetailsStep;
