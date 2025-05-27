import React, { useState } from 'react';
import api from '../services/api.service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

// Assuming global CSS from App.css or AccountDashboard.css styles forms.

function ServiceForm({ onServiceAdded, isSubmitting, setIsSubmitting }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '', // Optional based on requirements, current validation makes it required
        price: '',
        durationMinutes: '',
    });
    const [errors, setErrors] = useState({});
    const [backendMessage, setBackendMessage] = useState('');

    const validateField = (name, value) => {
        let errorMsg = "";
        switch (name) {
            case "name":
                if (!value.trim()) errorMsg = "Name ist erforderlich.";
                break;
            case "description": // Assuming description is required as per old logic
                if (!value.trim()) errorMsg = "Beschreibung ist erforderlich.";
                break;
            case "price":
                if (!value.trim()) errorMsg = "Preis ist erforderlich.";
                else if (isNaN(value) || parseFloat(value) <= 0) errorMsg = "Preis muss eine positive Zahl sein.";
                break;
            case "durationMinutes":
                if (!value.trim()) errorMsg = "Dauer ist erforderlich.";
                else if (isNaN(value) || parseInt(value) <= 0 || !Number.isInteger(Number(value))) errorMsg = "Dauer muss eine positive ganze Zahl sein.";
                break;
            default:
                break;
        }
        setErrors(prev => ({ ...prev, [name]: errorMsg }));
        return errorMsg === "";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        validateField(name, value);
    };

    const validateForm = () => {
        let isValid = true;
        const newErrors = {};
        if (!validateField("name", formData.name)) { isValid = false; newErrors.name = errors.name || "Name ist erforderlich."; }
        if (!validateField("description", formData.description)) { isValid = false; newErrors.description = errors.description || "Beschreibung ist erforderlich."; }
        if (!validateField("price", formData.price)) { isValid = false; newErrors.price = errors.price || "Preis ist erforderlich."; }
        if (!validateField("durationMinutes", formData.durationMinutes)) { isValid = false; newErrors.durationMinutes = errors.durationMinutes || "Dauer ist erforderlich."; }
        
        setErrors(prev => ({ ...prev, ...newErrors }));
        return isValid;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setBackendMessage('');
        if (!validateForm()) return;

        setIsSubmitting(true);
        let submissionError = null;

        const newService = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            price: parseFloat(formData.price),
            durationMinutes: parseInt(formData.durationMinutes)
        };

        try {
            await api.post('services', newService);
            setFormData({ name: '', description: '', price: '', durationMinutes: '' }); // Reset form
            setErrors({}); // Clear errors
            if (onServiceAdded) {
                onServiceAdded(); // This should also handle setIsSubmitting(false)
            }
             setBackendMessage('Dienstleistung erfolgreich hinzugefügt!'); // Success message
            setTimeout(() => setBackendMessage(''), 3000); // Clear message after 3s

        } catch (error) {
            submissionError = error;
            console.error("Fehler beim Hinzufügen der Dienstleistung:", error);
            const errMsg = error.response?.data?.message || error.response?.data?.errors?.join(', ') || 'Fehler beim Hinzufügen der Dienstleistung.';
            setBackendMessage(`Fehler: ${errMsg}`);
        } finally {
            if (submissionError) { // Only if not handled by onServiceAdded
                setIsSubmitting(false);
            }
        }
    };
    
    const commonInputProps = (fieldName) => ({
        name: fieldName,
        value: formData[fieldName],
        onChange: handleChange,
        onBlur: handleBlur,
        disabled: isSubmitting,
        "aria-invalid": !!errors[fieldName],
        "aria-describedby": errors[fieldName] ? `${fieldName}-error-svc` : undefined,
        className: errors[fieldName] ? "input-error" : ""
    });

    return (
        <div className="service-form-container">
            {/* Using h3 for consistency with AccountDashboard structure, can be changed */}
            {/* <h3>Neue Dienstleistung hinzufügen</h3> */}
            <form onSubmit={handleSubmit} className="service-form space-y-form" noValidate>
                <div className="form-group">
                    <label htmlFor="serviceName">Name*:</label> {/* Changed id for uniqueness */}
                    <input type="text" id="serviceName" {...commonInputProps("name")} />
                    {errors.name && <span id="name-error-svc" className="error-message">{errors.name}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="serviceDescription">Beschreibung*:</label> {/* Changed id */}
                    <textarea id="serviceDescription" {...commonInputProps("description")} rows="3"></textarea>
                    {errors.description && <span id="description-error-svc" className="error-message">{errors.description}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="servicePrice">Preis (€)*:</label> {/* Changed id */}
                    <input type="number" id="servicePrice" {...commonInputProps("price")} step="0.01" />
                    {errors.price && <span id="price-error-svc" className="error-message">{errors.price}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="serviceDurationMinutes">Dauer (Minuten)*:</label> {/* Changed id */}
                    <input type="number" id="serviceDurationMinutes" {...commonInputProps("durationMinutes")} />
                    {errors.durationMinutes && <span id="durationMinutes-error-svc" className="error-message">{errors.durationMinutes}</span>}
                </div>
                <button type="submit" className="button-link submit-button" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <><FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Wird hinzugefügt...</>
                    ) : (
                        "Dienstleistung hinzufügen"
                    )}
                </button>
            </form>
            {backendMessage && 
                <p className={`form-message mt-3 ${backendMessage.includes("erfolgreich") ? 'success' : 'error'}`}>
                    {backendMessage}
                </p>
            }
        </div>
    );
}

export default ServiceForm;