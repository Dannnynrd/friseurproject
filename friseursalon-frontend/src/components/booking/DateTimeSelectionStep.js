import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // Already in BookingPage, but good for component independence
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faEdit, faArrowLeft, faArrowRight, faCalendarAlt, faClock } from '@fortawesome/free-solid-svg-icons';

// Assuming BookingPage.css provides styles for .booking-step-content, .datepicker-time-container, etc.

function DateTimeSelectionStep({
    selectedService,
    selectedDate,
    selectedTime,
    availableTimes,
    onDateChange,
    onTimeChange,
    loadingAvailableTimes,
    timeError,
    onResetBookingProcess, // For "Dienstleistung ändern"
    onNextStep, // For "Weiter zu Ihren Daten" / "Weiter zur Bestätigung"
    currentUser
}) {
    const isPastDate = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    return (
        <div className="booking-step-content animate-step">
            <h2 className="booking-step-heading">2. Datum und Uhrzeit wählen</h2>
            <div className="booking-step-subheading">
                <div className="service-info-text">
                    <strong>{selectedService.name}</strong>
                    <span className="service-price-duration">
                        ({typeof selectedService.price === 'number' ? selectedService.price.toFixed(2) : 'N/A'} € / {selectedService.durationMinutes || '-'} Min)
                    </span>
                </div>
                <button type="button" onClick={onResetBookingProcess} className="edit-selection-button small-edit">
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
                            onChange={(date) => {
                                onDateChange(date);
                                // selectedTime should be reset by parent when date changes
                            }}
                            locale="de"
                            dateFormat="dd.MM.yyyy"
                            minDate={new Date()}
                            filterDate={date => !isPastDate(date)}
                            inline
                            calendarClassName="booking-datepicker" // Ensure this class is styled in BookingPage.css
                        />
                    </div>
                </div>
                <div className="time-slots-wrapper-outer">
                    <h3 className="sub-heading">
                        <FontAwesomeIcon icon={faClock} /> Verfügbare Zeiten
                        {selectedDate ? ` für den ${selectedDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}` : ''}:
                    </h3>
                    <div className="time-slots-wrapper">
                        {loadingAvailableTimes && <p className="loading-message small"><FontAwesomeIcon icon={faSpinner} spin /> Lade Zeiten...</p>}
                        {!loadingAvailableTimes && timeError && <p className="form-message error small">{timeError}</p>}
                        {!loadingAvailableTimes && !timeError && selectedDate && availableTimes.length === 0 && (
                            <p className="no-times-message">Keine Online-Zeiten für diesen Tag verfügbar.</p>
                        )}
                        {!loadingAvailableTimes && !timeError && selectedDate && availableTimes.length > 0 && (
                            <div className="time-slots-grid">
                                {availableTimes.map(time => (
                                    <button
                                        key={time} type="button"
                                        onClick={() => onTimeChange(time)}
                                        className={`time-slot-button ${selectedTime === time ? 'selected' : ''}`}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        )}
                        {!selectedDate && !loadingAvailableTimes && <p className="select-date-message">Bitte wählen Sie zuerst ein Datum.</p>}
                    </div>
                </div>
            </div>
            <div className="booking-navigation-buttons">
                <button type="button" onClick={onResetBookingProcess} className="button-link-outline">
                    <FontAwesomeIcon icon={faArrowLeft} /> Dienstleistung ändern
                </button>
                <button
                    type="button"
                    onClick={onNextStep}
                    disabled={!selectedDate || !selectedTime || loadingAvailableTimes}
                    className="button-link"
                >
                    {currentUser ? "Weiter zur Bestätigung" : "Weiter zu Ihren Daten"} <FontAwesomeIcon icon={faArrowRight} />
                </button>
            </div>
        </div>
    );
}

export default DateTimeSelectionStep;
