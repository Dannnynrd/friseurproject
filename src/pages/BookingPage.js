import React, { useState, useEffect } from 'react';
import AppointmentForm from '../components/AppointmentForm';
import AppointmentList from '../components/AppointmentList';
import AuthService from '../services/auth.service'; // Für Registrierung
import { useParams } from 'react-router-dom';
// import './BookingPage.css'; // Optional: Styling für diese Seite

// BookingPage bekommt jetzt currentUser und die Refresh-Callbacks
function BookingPage({ onAppointmentAdded, refreshAppointmentsList, currentUser }) { // currentUser als Prop
    const { serviceName: initialServiceNameParam } = useParams();
    const [initialService, setInitialService] = useState(initialServiceNameParam || null);

    // States für Registrierung während der Buchung
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [showRegisterOption, setShowRegisterOption] = useState(false); // Flag, um Option anzuzeigen
    const [registerMessage, setRegisterMessage] = useState('');

    // Aktualisiere initialService, wenn URL-Parameter sich ändert
    useEffect(() => {
        if (initialServiceNameParam) {
            setInitialService(initialServiceNameParam);
        }
    }, [initialServiceNameParam]);

    // Funktion für die automatische Registrierung (mit Kunden-E-Mail und einem zufälligen Passwort)
    const handleRegisterDuringBooking = async (customerEmail, customerFirstName, customerLastName) => {
        if (!customerEmail || !customerFirstName || !customerLastName) {
            setRegisterMessage("Bitte füllen Sie die Kundendaten im Buchungsformular aus, um sich zu registrieren.");
            return;
        }
        // Generiere einen einfachen Benutzernamen und ein temporäres Passwort
        const username = `<span class="math-inline">\{customerFirstName\.toLowerCase\(\)\}\.</span>{customerLastName.toLowerCase()}`;
        const tempPassword = Math.random().toString(36).substring(2, 15); // Zufälliges Passwort

        try {
            await AuthService.register(username, customerEmail, tempPassword, ["user"]);
            setRegisterMessage(`Konto für ${username} erstellt! Ihr temporäres Passwort ist: ${tempPassword}. Bitte ändern Sie es nach dem Login.`);
            // Hier könnte man den Benutzer auch direkt einloggen oder zur Login-Seite leiten.
            // Für jetzt zeigen wir nur die Nachricht.
        } catch (error) {
            console.error("Fehler bei der Registrierung während der Buchung:", error);
            setRegisterMessage(`Fehler bei der Registrierung: ${error.response?.data?.message || error.message}`);
        }
    };


    return (
        <div className="booking-page-container" style={{paddingTop: '8rem', paddingBottom: '4rem', backgroundColor: 'var(--light-bg)'}}>
            <section id="booking-main">
                <div className="container">
                    <h1 style={{textAlign: 'center', marginBottom: '2rem', fontFamily: 'var(--font-serif)', fontSize: '3rem', color: 'var(--dark-text)'}}>Termin buchen</h1>
                    <p style={{textAlign: 'center', maxWidth: '700px', margin: '0 auto 4rem auto', color: 'var(--grey-text)'}}>Wählen Sie Ihre gewünschte Dienstleistung, Datum und Uhrzeit, um Ihren Termin zu vereinbaren.</p>

                    {/* Buchungsformular: Immer sichtbar */}
                    <AppointmentForm
                        onAppointmentAdded={onAppointmentAdded}
                        initialService={initialService}
                        // Optionale Props, um Kundendaten vorab auszufüllen, wenn angemeldet
                        currentUser={currentUser} // Übergeben, um ggf. Felder vorab auszufüllen
                        onRegisterAttempt={handleRegisterDuringBooking} // Callback für Registrierungsversuch
                    />

                    {registerMessage && (
                        <div style={{textAlign: 'center', marginTop: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#e9e9e9'}}>
                            <p>{registerMessage}</p>
                        </div>
                    )}

                    <hr style={{margin: '4rem 0'}} />

                    {/* Terminübersicht: Nur für angemeldete Benutzer (oder Admin) sichtbar */}
                    {currentUser && (
                        <>
                            <h2 style={{textAlign: 'center', marginBottom: '2rem', fontFamily: 'var(--font-serif)', fontSize: '2.5rem', color: 'var(--dark-text)'}}>
                                {currentUser.roles.includes("ROLE_ADMIN") ? "Alle Gebuchten Termine" : "Ihre Gebuchten Termine"}
                            </h2>
                            <AppointmentList refreshTrigger={refreshAppointmentsList} currentUser={currentUser} /> {/* currentUser an AppointmentList übergeben */}
                        </>
                    )}

                </div>
            </section>
        </div>
    );
}

export default BookingPage;