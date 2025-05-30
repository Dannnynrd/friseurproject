import React, { useState } from "react";
import AuthService from "../services/auth.service";
import "./Login.module.css"; // Stelle sicher, dass die CSS-Datei existiert und korrekt verlinkt ist

function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [message, setMessage] = useState(""); // Kann ein String oder ein Array von Fehlern sein
    const [loading, setLoading] = useState(false);
    const [isRegisterMode, setIsRegisterMode] = useState(false);

    // Hilfsfunktion zur Anzeige von Fehlern
    const processAndSetErrorMessage = (error) => {
        if (error && error.errors && Array.isArray(error.errors)) {
            // Strukturierte Fehler vom GlobalExceptionHandler (MethodArgumentNotValidException)
            setMessage(error.errors.join(", ")); // Zeigt alle Feldfehler, durch Komma getrennt
        } else if (error && error.message) {
            // Einfache MessageResponse oder andere Fehler mit 'message'-Property
            setMessage(error.message);
        } else if (typeof error === 'string') {
            setMessage(error);
        }
        else {
            setMessage("Ein unbekannter Fehler ist aufgetreten.");
        }
    };

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
                    // Kein setLoading(false) hier, da bei Erfolg navigiert wird
                })
                .catch(error => {
                    setLoading(false);
                    processAndSetErrorMessage(error);
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
                .then(response => { // AuthService.register gibt bei Erfolg response.data zurück
                    setMessage(response.message || "Registrierung erfolgreich! Sie können sich jetzt anmelden.");
                    setLoading(false);
                    setIsRegisterMode(false); // Zum Login-Modus wechseln nach erfolgreicher Registrierung
                    // Felder leeren für den Fall, dass der Benutzer im Login-Modus bleibt
                    setFirstName("");
                    setLastName("");
                    // Email und Passwort könnten für den direkten Login beibehalten werden,
                    // aber es ist oft besser, sie zu leeren, um eine erneute Eingabe zu erzwingen.
                    setEmail(""); // Zurücksetzen oder Wert aus Registrierung für Login-Vorausfüllung
                    setPassword("");
                    setPhoneNumber("");
                })
                .catch(error => {
                    setLoading(false);
                    processAndSetErrorMessage(error);
                });
        } else {
            setLoading(false);
            setMessage("Bitte alle Pflichtfelder (*) ausfüllen.");
        }
    };

    return (
        <div className="auth-container">
            <h2>{isRegisterMode ? "Registrieren" : "Login"}</h2>

            {isRegisterMode ? (
                <form onSubmit={handleRegister} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="regFirstName">Vorname*:</label>
                        <input type="text" id="regFirstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="regLastName">Nachname*:</label>
                        <input type="text" id="regLastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="regEmail">E-Mail*:</label>
                        <input type="email" id="regEmail" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="regPassword">Passwort*:</label>
                        <input type="password" id="regPassword" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="regPhoneNumber">Telefonnummer (Optional):</label>
                        <input type="tel" id="regPhoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                    </div>
                    <button type="submit" className="auth-button" disabled={loading}>{loading ? "Registriert..." : "Konto erstellen"}</button>
                    {message && (
                        <div className={`auth-message ${message.includes("erfolgreich") ? 'success' : 'error'}`}>
                            {message}
                        </div>
                    )}
                    <button type="button" className="switch-button" onClick={() => { setIsRegisterMode(false); setMessage(""); }}>Bereits registriert? Anmelden</button>
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
                    {message && (
                        <div className={`auth-message ${message.includes("erfolgreich") ? 'success' : 'error'}`}>
                            {/* Hier könnten wir die Fehlerliste hübscher formatieren, falls es ein Array ist */}
                            {message}
                        </div>
                    )}
                    <button type="button" className="switch-button" onClick={() => { setIsRegisterMode(true); setMessage(""); }}>Noch nicht registriert? Konto erstellen</button>
                </form>
            )}
        </div>
    );
}

export default Login;