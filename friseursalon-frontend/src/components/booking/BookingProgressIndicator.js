import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

// Assuming BookingPage.css contains the styles for .booking-step-indicators, .booking-step-indicator etc.
// If not, those styles would need to be moved or made available globally.
// For now, we rely on BookingPage.css being imported by the parent BookingPage.js

function BookingProgressIndicator({ currentStep, currentUser, stepLabels, finalBookingMessage }) {
    // Determine the actual internal step number based on visibility (currentUser affects step 3)
    const getInternalStepForVisibleStep = (visibleStep) => {
        if (currentUser && visibleStep >= 3) return visibleStep + 1; // User details step is skipped for logged-in users
        return visibleStep;
    };

    return (
        <div className={`booking-step-indicators ${currentUser ? 'three-steps' : ''}`}>
            {stepLabels.map((label, index) => {
                const visibleStepNumber = index + 1;
                const internalStepForIndicator = getInternalStepForVisibleStep(visibleStepNumber);

                const isCurrentStepActive = currentStep === internalStepForIndicator;
                let isStepCompleted = currentStep > internalStepForIndicator;

                // Special conditions for the last step based on booking success
                if (internalStepForIndicator === 4 && finalBookingMessage) { // Step 4 is confirmation
                    if (finalBookingMessage.type === 'success') {
                        isStepCompleted = true;
                    } else {
                        isStepCompleted = false; // If there's a message but not success, it's not "completed"
                    }
                }
                // If we are on step 4 (confirmation) and it was successful, all previous steps are completed
                if (internalStepForIndicator < 4 && currentStep === 4 && finalBookingMessage && finalBookingMessage.type === 'success') {
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
    );
}

export default BookingProgressIndicator;
