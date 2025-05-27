import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faInfoCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

// Assuming BookingPage.css or a global CSS file provides styles for
// .booking-step-content, .booking-step-heading, .loading-message, .services-grid, .service-card, etc.

function ServiceSelectionStep({
    services,
    selectedService,
    onServiceSelect,
    loadingServices,
    serviceError,
    step // Prop to conditionally render the heading number, or handle it internally
}) {
    return (
        <div className="booking-step-content animate-step">
            {/* It might be better to have a generic StepLayout component that handles the heading and animation */}
            <h2 className="booking-step-heading">1. Dienstleistung auswählen</h2>

            {loadingServices && (
                <p className="loading-message small"><FontAwesomeIcon icon={faSpinner} spin /> Lade Dienste...</p>
            )}

            {serviceError && !loadingServices && (
                <p className="form-message error mb-4"><FontAwesomeIcon icon={faExclamationCircle} /> {serviceError}</p>
            )}
            
            {!loadingServices && !serviceError && services.length === 0 && (
                <p className="form-message info"><FontAwesomeIcon icon={faInfoCircle} /> Aktuell sind keine Dienstleistungen online buchbar.</p>
            )}

            <div className="services-grid">
                {services.map(service => (
                    <div
                        key={service.id}
                        onClick={() => onServiceSelect(service)}
                        className={`service-card ${selectedService?.id === service.id ? 'selected' : ''}`}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') { onServiceSelect(service); }}}
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
    );
}

export default ServiceSelectionStep;
