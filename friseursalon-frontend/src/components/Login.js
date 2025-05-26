import React, { useState } from "react";
import AuthService from "../services/auth.service";
import "./Login.css";

function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [isRegisterMode, setIsRegisterMode] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        if (email && password) {
            AuthService.login(email, password)
                .then(() => {
                    if (onLoginSuccess) {
                        onLoginSuccess();
                    }
                })
                .catch(error => {
                    const resMessage =
                        (error.response &&
                            error.response.data &&
                            error.response.data.message) ||
                        error.message ||
                        error.toString();
                    setLoading(false);
                    setMessage(resMessage || "Fehler beim Login. Bitte versuchen Sie es erneut.");
                });
        } else {
            setLoading(false);
            setMessage("Bitte E-Mail und Passwort eingeben.");
        }
    };

    const handleRegister = (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        if (firstName && lastName && email && password) {
            AuthService.register(firstName, lastName, email, password, phoneNumber, ["user"])
                .then(response => {
                    setMessage(response.data.message || "Registrierung erfolgreich!");
                    setLoading(false);
                    setIsRegisterMode(false);
                    setFirstName("");
                    setLastName("");
                    setEmail("");
                    setPassword("");
                    setPhoneNumber("");
                })
                .catch(error => {
                    const resMessage =
                        (error.response &&
                            error.response.data &&
                            error.response.data.message) ||
                        error.message ||
                        error.toString();
                    setLoading(false);
                    setMessage(resMessage || "Fehler bei der Registrierung. Bitte versuchen Sie es erneut.");
                });
        } else {
            setLoading(false);
            setMessage("Bitte alle Felder ausfüllen.");
        }
    };


    return (
        <div className="auth-container">
            <h2>{isRegisterMode ? "Registrieren" : "Login"}</h2>

            {isRegisterMode ? (
                <form onSubmit={handleRegister} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="regFirstName">Vorname:</label>
                        <input type="text" id="regFirstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="regLastName">Nachname:</label>
                        <input type="text" id="regLastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="regEmail">E-Mail:</label>
                        <input type="email" id="regEmail" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="regPassword">Passwort:</label>
                        <input type="password" id="regPassword" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="regPhoneNumber">Telefonnummer (Optional):</label>
                        <input type="tel" id="regPhoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                    </div>
                    <button type="submit" className="auth-button" disabled={loading}>{loading ? "Registriert..." : "Registrieren"}</button>
                    {message && <div className="auth-message">{message}</div>}
                    <button type="button" className="switch-button" onClick={() => setIsRegisterMode(false)}>Bereits registriert? Anmelden</button>
                </form>
            ) : (
                <form onSubmit={handleLogin} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">E-Mail:</label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Passwort:</label>
                        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="auth-button" disabled={loading}>{loading ? "Lädt..." : "Anmelden"}</button>
                    {message && <div className="auth-message">{message}</div>}
                    <button type="button" className="switch-button" onClick={() => setIsRegisterMode(true)}>Noch nicht registriert? Konto erstellen</button>
                </form>
            )}
        </div>
    );
}

export default Login;
