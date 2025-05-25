import React, { useState } from "react";
import AuthService from "../services/auth.service"; // Auth Service importieren
import "./Login.css"; // Styling für Login und Registrierung

function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState(""); // Für Registrierung
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [isRegisterMode, setIsRegisterMode] = useState(false); // NEU: Steuert Login/Register-Ansicht

    // Handler für Login
    const handleLogin = (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        if (username && password) {
            AuthService.login(username, password)
                .then(() => {
                    if (onLoginSuccess) {
                        onLoginSuccess(); // Erfolgreichen Login an App.js melden
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
            setMessage("Bitte Benutzername und Passwort eingeben.");
        }
    };

    // NEU: Handler für Registrierung
    const handleRegister = (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        if (username && email && password) {
            AuthService.register(username, email, password) // Standardrolle "user" wird im AuthService gesetzt
                .then(response => {
                    setMessage(response.data.message || "Registrierung erfolgreich!");
                    setLoading(false);
                    // Optional: Nach der Registrierung direkt einloggen oder zur Login-Ansicht wechseln
                    setIsRegisterMode(false); // Wechsel zur Login-Ansicht
                    setUsername(""); // Felder leeren
                    setEmail("");
                    setPassword("");
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
        <div className="auth-container"> {/* Container-Klasse geändert */}
            <h2>{isRegisterMode ? "Registrieren" : "Login"}</h2>

            {/* Optionale Nachricht, wenn von geschützter Route umgeleitet */}
            {/* Dies müsste als State über die URL oder Context übergeben werden */}
            {/* <p style={{textAlign: 'center', marginBottom: '1rem', color: 'red'}}>Bitte melden Sie sich an, um einen Termin zu buchen.</p> */}

            {isRegisterMode ? (
                // Registrierungsformular
                <form onSubmit={handleRegister} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="regUsername">Benutzername:</label>
                        <input type="text" id="regUsername" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="regEmail">E-Mail:</label>
                        <input type="email" id="regEmail" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="regPassword">Passwort:</label>
                        <input type="password" id="regPassword" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="auth-button" disabled={loading}>{loading ? "Registriert..." : "Registrieren"}</button>
                    {message && <div className="auth-message">{message}</div>}
                    <button type="button" className="switch-button" onClick={() => setIsRegisterMode(false)}>Bereits registriert? Anmelden</button>
                </form>
            ) : (
                // Login-Formular
                <form onSubmit={handleLogin} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username">Benutzername:</label>
                        <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
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
