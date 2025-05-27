import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

// Assuming global CSS in App.css provides .form-group, .input-error, .error-message, etc.
// Or add specific styles to BookingPage.css if needed.

const AppointmentForm = forwardRef(({
    currentUser,
    initialData,
    onFormSubmit, // Called by parent (BookingPage -> CustomerDetailsStep)
}, ref) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        notes: '',
    });
    const [errors, setErrors] = useState({});
    const [backendMessage, setBackendMessage] = useState({ type: '', text: '' }); // For general messages from parent

    // Populate form with initial data or current user data
    useEffect(() => {
        const effectiveInitial = initialData || {};
        if (currentUser) {
            setFormData({
                firstName: currentUser.firstName || effectiveInitial.firstName || '',
                lastName: currentUser.lastName || effectiveInitial.lastName || '',
                email: currentUser.email || effectiveInitial.email || '',
                phoneNumber: currentUser.phoneNumber || effectiveInitial.phoneNumber || '',
                password: '', // Password not pre-filled
                notes: effectiveInitial.notes || '',
            });
        } else {
            setFormData({
                firstName: effectiveInitial.firstName || '',
                lastName: effectiveInitial.lastName || '',
                email: effectiveInitial.email || '',
                phoneNumber: effectiveInitial.phoneNumber || '',
                password: effectiveInitial.password || '',
                notes: effectiveInitial.notes || '',
            });
        }
    }, [currentUser, initialData]);

    const validateField = (name, value) => {
        let errorMsg = "";
        switch (name) {
            case "firstName":
                if (!value.trim()) errorMsg = "Vorname ist erforderlich.";
                break;
            case "lastName":
                if (!value.trim()) errorMsg = "Nachname ist erforderlich.";
                break;
            case "email":
                if (!value.trim()) errorMsg = "E-Mail ist erforderlich.";
                else if (!/\S+@\S+\.\S+/.test(value)) errorMsg = "Bitte eine gültige E-Mail-Adresse eingeben.";
                break;
            case "phoneNumber":
                if (value && !/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/.test(value)) {
                    errorMsg = "Bitte eine gültige Telefonnummer eingeben.";
                }
                break;
            case "password":
                if (!currentUser && !value.trim()) errorMsg = "Passwort ist erforderlich.";
                else if (!currentUser && value.trim().length < 6) errorMsg = "Passwort muss mindestens 6 Zeichen lang sein.";
                break;
            default:
                break;
        }
        setErrors(prev => ({ ...prev, [name]: errorMsg }));
        return errorMsg === ""; // Return true if valid
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) { // Clear error on change
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
        
        if (!validateField("firstName", formData.firstName)) { isValid = false; newErrors.firstName = errors.firstName || "Vorname ist erforderlich.";}
        if (!validateField("lastName", formData.lastName)) { isValid = false; newErrors.lastName = errors.lastName || "Nachname ist erforderlich.";}
        if (!validateField("email", formData.email)) { isValid = false; newErrors.email = errors.email || "E-Mail ist erforderlich.";}
        if (!validateField("phoneNumber", formData.phoneNumber)) { isValid = false; newErrors.phoneNumber = errors.phoneNumber || "Ungültige Telefonnummer."; } // It will be empty string if valid but optional
        
        if (!currentUser) {
            if (!validateField("password", formData.password)) { isValid = false; newErrors.password = errors.password || "Passwort ist erforderlich.";}
        }
        
        // Update errors state in one go to trigger re-render with all new errors
        setErrors(prev => ({
            ...prev, // Keep existing specific messages from validateField
            ...newErrors // Add messages for fields that were just found empty by validateForm
        }));
        return isValid;
    };

    useImperativeHandle(ref, () => ({
        triggerSubmitAndGetData: () => {
            setBackendMessage({ type: '', text: '' }); // Clear previous backend messages
            if (!validateForm()) {
                return null; // Indicate validation failure
            }
            // Return only trimmed data relevant for submission
            return {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim(),
                phoneNumber: formData.phoneNumber.trim(),
                password: !currentUser ? formData.password.trim() : '', // Only include password if not logged in
                notes: formData.notes.trim(),
            };
        }
    }));
    
    // This internal submit is primarily for testing or if the form were standalone.
    // In BookingPage, submission is triggered via ref.
    const handleFormInternalSubmit = (e) => {
        if (e) e.preventDefault();
        const validatedData = ref.current?.triggerSubmitAndGetData();
        if (validatedData && onFormSubmit) {
            onFormSubmit(validatedData);
        }
    };

    return (
        <div className="appointment-form-fields">
            {/* The form submission is handled by the parent via ref, no actual submit button here unless needed */}
            <form onSubmit={handleFormInternalSubmit} className="space-y-form" id="appointment-data-form" noValidate>
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="firstName">Vorname*</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={!!currentUser && !!currentUser.firstName}
                            aria-invalid={!!errors.firstName}
                            aria-describedby={errors.firstName ? "firstName-error" : undefined}
                            className={errors.firstName ? "input-error" : ""}
                        />
                        {errors.firstName && <span id="firstName-error" className="error-message">{errors.firstName}</span>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="lastName">Nachname*</label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={!!currentUser && !!currentUser.lastName}
                            aria-invalid={!!errors.lastName}
                            aria-describedby={errors.lastName ? "lastName-error" : undefined}
                            className={errors.lastName ? "input-error" : ""}
                        />
                        {errors.lastName && <span id="lastName-error" className="error-message">{errors.lastName}</span>}
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="aptEmail">E-Mail*</label> {/* Changed id to aptEmail */}
                    <input
                        type="email"
                        id="aptEmail"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={!!currentUser && !!currentUser.email}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? "email-error-apt" : undefined}
                        className={errors.email ? "input-error" : ""}
                    />
                    {errors.email && <span id="email-error-apt" className="error-message">{errors.email}</span>}
                </div>
                <div className="form-group">
                    <label htmlFor="aptPhoneNumber">Telefonnummer (optional)</label> {/* Changed id to aptPhoneNumber */}
                    <input
                        type="tel"
                        id="aptPhoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={!!currentUser && !!currentUser.phoneNumber}
                        placeholder="Für Rückfragen oder Terminänderungen"
                        aria-invalid={!!errors.phoneNumber}
                        aria-describedby={errors.phoneNumber ? "phoneNumber-error-apt" : undefined}
                        className={errors.phoneNumber ? "input-error" : ""}
                    />
                    {errors.phoneNumber && <span id="phoneNumber-error-apt" className="error-message">{errors.phoneNumber}</span>}
                </div>

                {!currentUser && (
                    <div className="form-group">
                        <label htmlFor="aptPassword">Passwort für neues Konto*</label> {/* Changed id to aptPassword */}
                        <input
                            type="password"
                            id="aptPassword"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Mindestens 6 Zeichen"
                            aria-invalid={!!errors.password}
                            aria-describedby={errors.password ? "password-error-apt" : undefined}
                            className={errors.password ? "input-error" : ""}
                        />
                        {errors.password && <span id="password-error-apt" className="error-message">{errors.password}</span>}
                        <p className="form-hint">Wird benötigt, um Ihre Buchungen später zu verwalten.</p>
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="notes">Anmerkungen (optional)</label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        onBlur={handleBlur} // Optional: validate notes if needed
                        rows="3"
                        placeholder="Haben Sie spezielle Wünsche oder Informationen für uns?"
                    />
                    {/* No error display for notes unless specific validation is added */}
                </div>

                {/* General backend messages can be shown by the parent component (CustomerDetailsStep) */}
                {/* This button is hidden and only for programmatic submission via ref from parent. */}
                <button type="submit" style={{ display: 'none' }} aria-hidden="true">Submit Form</button>
            </form>
        </div>
    );
});

export default AppointmentForm;