import React, { useState, useEffect } from "react";
import AuthService from "../services/auth.service";
import "./Login.css"; 

function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    
    const [backendMessage, setBackendMessage] = useState(""); // For messages from backend
    const [errors, setErrors] = useState({}); // For field-specific errors
    const [loading, setLoading] = useState(false);
    const [isRegisterMode, setIsRegisterMode] = useState(false);

    // Clear errors and backend messages when switching mode
    useEffect(() => {
        setErrors({});
        setBackendMessage("");
    }, [isRegisterMode]);

    const validateEmail = (value) => {
        if (!value.trim()) return "E-Mail ist erforderlich.";
        if (!/\S+@\S+\.\S+/.test(value)) return "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
        return "";
    };

    const validatePassword = (value) => {
        if (!value) return "Passwort ist erforderlich.";
        if (isRegisterMode && value.length < 6) return "Passwort muss mindestens 6 Zeichen lang sein.";
        return "";
    };

    const validateRequiredField = (value, fieldName) => {
        if (!value.trim()) return `${fieldName} ist erforderlich.`;
        return "";
    };
    
    const validatePhoneNumber = (value) => {
        if (value && !/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/.test(value)) {
            return "Bitte geben Sie eine gültige Telefonnummer ein.";
        }
        return "";
    };


    const handleBlur = (field, value) => {
        let errorMsg = "";
        switch (field) {
            case "email":
                errorMsg = validateEmail(value);
                break;
            case "password":
                errorMsg = validatePassword(value);
                break;
            case "firstName":
                errorMsg = validateRequiredField(value, "Vorname");
                break;
            case "lastName":
                errorMsg = validateRequiredField(value, "Nachname");
                break;
            case "phoneNumber":
                errorMsg = validatePhoneNumber(value);
                break;
            default:
                break;
        }
        setErrors(prev => ({ ...prev, [field]: errorMsg }));
    };
    
    const processAndSetBackendErrorMessage = (error) => {
        if (error && error.errors && Array.isArray(error.errors)) {
            setBackendMessage(error.errors.join(", ")); 
        } else if (error && error.message) {
            setBackendMessage(error.message);
        } else if (typeof error === 'string') {
            setBackendMessage(error);
        } else {
            setBackendMessage("Ein unbekannter Fehler ist aufgetreten.");
        }
    };

    const validateForm = () => {
        const newErrors = {};
        let isValid = true;

        const emailError = validateEmail(email);
        if (emailError) { newErrors.email = emailError; isValid = false; }

        const passwordError = validatePassword(password);
        if (passwordError) { newErrors.password = passwordError; isValid = false; }

        if (isRegisterMode) {
            const firstNameError = validateRequiredField(firstName, "Vorname");
            if (firstNameError) { newErrors.firstName = firstNameError; isValid = false; }

            const lastNameError = validateRequiredField(lastName, "Nachname");
            if (lastNameError) { newErrors.lastName = lastNameError; isValid = false; }
            
            const phoneNumberError = validatePhoneNumber(phoneNumber);
            if (phoneNumberError) { newErrors.phoneNumber = phoneNumberError; isValid = false; }
        }
        
        setErrors(newErrors);
        return isValid;
    };

    const handleLogin = (e) => {
        e.preventDefault();
        setBackendMessage("");
        if (!validateForm()) return;

        setLoading(true);
        AuthService.login(email, password)
            .then(() => {
                if (onLoginSuccess) {
                    onLoginSuccess();
                }
            })
            .catch(error => {
                setLoading(false);
                processAndSetBackendErrorMessage(error.response?.data || error);
            });
    };

    const handleRegister = (e) => {
        e.preventDefault();
        setBackendMessage("");
        if (!validateForm()) return;
        
        setLoading(true);
        AuthService.register(firstName, lastName, email, password, phoneNumber, ["user"])
            .then(response => {
                setBackendMessage(response.message || "Registrierung erfolgreich! Sie können sich jetzt anmelden.");
                setLoading(false);
                setIsRegisterMode(false); 
                setFirstName("");
                setLastName("");
                // Keep email and clear password for potential login attempt
                // setEmail(""); 
                setPassword("");
                setPhoneNumber("");
                setErrors({}); // Clear errors after successful registration
            })
            .catch(error => {
                setLoading(false);
                processAndSetBackendErrorMessage(error.response?.data || error);
            });
    };
    
    const commonInputProps = (fieldName, value, specificValidation) => ({
        value: value,
        onChange: (e) => {
            const { value: val } = e.target;
            if (fieldName === 'email') setEmail(val);
            else if (fieldName === 'password') setPassword(val);
            else if (fieldName === 'firstName') setFirstName(val);
            else if (fieldName === 'lastName') setLastName(val);
            else if (fieldName === 'phoneNumber') setPhoneNumber(val);
            
            // Clear error for this field on change
            if (errors[fieldName]) {
                setErrors(prev => ({ ...prev, [fieldName]: "" }));
            }
        },
        onBlur: (e) => handleBlur(fieldName, e.target.value),
        "aria-invalid": !!errors[fieldName],
        "aria-describedby": errors[fieldName] ? `${fieldName}-error` : undefined,
        className: errors[fieldName] ? "input-error" : ""
    });


    return (
        <div className="auth-container">
            <h2>{isRegisterMode ? "Registrieren" : "Login"}</h2>

            {isRegisterMode ? (
                <form onSubmit={handleRegister} className="auth-form" noValidate>
                    <div className="form-group">
                        <label htmlFor="regFirstName">Vorname*:</label>
                        <input type="text" id="regFirstName" {...commonInputProps("firstName", firstName)} />
                        {errors.firstName && <span id="firstName-error" className="error-message">{errors.firstName}</span>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="regLastName">Nachname*:</label>
                        <input type="text" id="regLastName" {...commonInputProps("lastName", lastName)} />
                        {errors.lastName && <span id="lastName-error" className="error-message">{errors.lastName}</span>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="regEmail">E-Mail*:</label>
                        <input type="email" id="regEmail" {...commonInputProps("email", email)} />
                        {errors.email && <span id="email-error" className="error-message">{errors.email}</span>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="regPassword">Passwort*:</label>
                        <input type="password" id="regPassword" {...commonInputProps("password", password)} />
                        {errors.password && <span id="password-error" className="error-message">{errors.password}</span>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="regPhoneNumber">Telefonnummer (Optional):</label>
                        <input type="tel" id="regPhoneNumber" {...commonInputProps("phoneNumber", phoneNumber)} />
                        {errors.phoneNumber && <span id="phoneNumber-error" className="error-message">{errors.phoneNumber}</span>}
                    </div>
                    <button type="submit" className="auth-button" disabled={loading}>{loading ? "Registriert..." : "Konto erstellen"}</button>
                    {backendMessage && (
                        <div className={`auth-message ${backendMessage.includes("erfolgreich") ? 'success' : 'error'}`}>
                            {backendMessage}
                        </div>
                    )}
                    <button type="button" className="switch-button" onClick={() => { setIsRegisterMode(false); }}>Bereits registriert? Anmelden</button>
                </form>
            ) : (
                <form onSubmit={handleLogin} className="auth-form" noValidate>
                    <div className="form-group">
                        <label htmlFor="loginEmail">E-Mail:</label> {/* Changed id to avoid conflict */}
                        <input type="email" id="loginEmail" {...commonInputProps("email", email)} />
                        {errors.email && <span id="email-error" className="error-message">{errors.email}</span>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="loginPassword">Passwort:</label> {/* Changed id to avoid conflict */}
                        <input type="password" id="loginPassword" {...commonInputProps("password", password)} />
                        {errors.password && <span id="password-error" className="error-message">{errors.password}</span>}
                    </div>
                    <button type="submit" className="auth-button" disabled={loading}>{loading ? "Lädt..." : "Anmelden"}</button>
                    {backendMessage && (
                        <div className={`auth-message ${backendMessage.includes("erfolgreich") ? 'success' : 'error'}`}>
                            {backendMessage}
                        </div>
                    )}
                    <button type="button" className="switch-button" onClick={() => { setIsRegisterMode(true); }}>Noch nicht registriert? Konto erstellen</button>
                </form>
            )}
        </div>
    );
}

export default Login;