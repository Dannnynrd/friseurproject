import React, { useState, useEffect } from 'react';
import AppointmentForm from '../components/AppointmentForm';
import AppointmentList from '../components/AppointmentList';
import ServiceForm from '../components/ServiceForm';
import ServiceList from '../components/ServiceList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus, faClipboardList, faUser, faTools, faSignOutAlt, faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import './AccountDashboard.css'; // Deine Dashboard-spezifische CSS-Datei [cite: dannnynrd/friseurproject/friseurproject-3ba4766c73e0414802ba8d6734f09adb9ffbc074/friseursalon-frontend/src/pages/AccountDashboard.css]

function AccountDashboard({ currentUser, logOut, onAppointmentAdded, refreshAppointmentsList, onServiceAdded, refreshServicesList }) {
    // State für den aktuell aktiven Tab. Standardmäßig 'bookings' (Meine Termine).
    const [activeTab, setActiveTab] = useState('bookings');
    // State für das aktuell geöffnete Akkordeon-Element in der mobilen Ansicht.
    const [activeAccordion, setActiveAccordion] = useState(null);
    // State, um zu erkennen, ob die mobile Ansicht aktiv ist.
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

    // Bestimmt, ob der aktuelle Benutzer ein Administrator ist.
    const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes("ROLE_ADMIN");

    // useEffect-Hook, um auf Änderungen der Fenstergröße zu reagieren und isMobileView zu aktualisieren.
    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        // Cleanup-Funktion: Entfernt den EventListener, wenn die Komponente unmounted wird.
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Leeres Abhängigkeitsarray bedeutet, dass dieser Effekt nur beim Mounten und Unmounten ausgeführt wird.

    // Funktion zum Umschalten des Akkordeon-Status in der mobilen Ansicht.
    const toggleAccordion = (tabName) => {
        setActiveAccordion(activeAccordion === tabName ? null : tabName);
    };

    // Zentrale Funktion zum Rendern des Inhalts basierend auf dem aktiven Tab.
    // Wird sowohl für die Desktop-Ansicht als auch für das mobile Akkordeon verwendet.
    const renderTabContent = (tabName) => {
        switch (tabName) {
            case 'bookNew': // Tab: Neuen Termin buchen
                return !isAdmin && ( // Nur anzeigen, wenn der Benutzer kein Admin ist.
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Neuen Termin buchen</h2>
                        <AppointmentForm onAppointmentAdded={onAppointmentAdded} currentUser={currentUser} />
                    </div>
                );
            case 'bookings': // Tab: Meine Termine
                return (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Meine Termine</h2>
                        {/* AppointmentList zeigt Termine basierend auf currentUser (eigene oder alle für Admin) */}
                        <AppointmentList refreshTrigger={refreshAppointmentsList} currentUser={currentUser} />
                    </div>
                );
            case 'profile': // Tab: Mein Profil
                return (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Mein Profil</h2>
                        <div className="dashboard-profile-info">
                            <p><strong>Vorname:</strong> {currentUser?.firstName}</p>
                            <p><strong>Nachname:</strong> {currentUser?.lastName}</p>
                            <p><strong>E-Mail:</strong> {currentUser?.email}</p>
                            <p><strong>Telefon:</strong> {currentUser?.phoneNumber || 'Nicht angegeben'}</p>
                            <p><strong>Rollen:</strong> {currentUser?.roles?.join(', ')}</p>
                        </div>
                    </div>
                );
            case 'adminServices': // Tab: Dienstleistungen verwalten (nur für Admins)
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Dienstleistungen verwalten</h2>
                        <ServiceForm onServiceAdded={onServiceAdded} />
                        <hr className="dashboard-section-hr" />
                        {/* ServiceList zeigt alle Services zur Bearbeitung an */}
                        <ServiceList key={refreshServicesList} currentUser={currentUser} />
                    </div>
                );
            default: // Fallback, falls kein gültiger Tab-Name übergeben wird.
                return null;
        }
    };

    // Hilfsfunktion zum Rendern der Navigations-Buttons in der Sidebar/Akkordeon.
    const renderNavButton = (tabName, icon, label, condition = true) => {
        if (!condition) return null; // Button nicht rendern, wenn die Bedingung nicht erfüllt ist.

        const isActive = activeTab === tabName; // Ist dieser Button der aktuell aktive Tab?
        const isAccordionOpen = activeAccordion === tabName; // Ist das zugehörige Akkordeon geöffnet?

        return (
            <li key={tabName} className="dashboard-nav-item">
                <button
                    onClick={() => {
                        setActiveTab(tabName); // Setzt den aktiven Tab.
                        if (isMobileView) { // Wenn mobile Ansicht, Akkordeon umschalten.
                            toggleAccordion(tabName);
                        }
                    }}
                    className={`dashboard-nav-button ${isActive ? 'active' : ''}`}
                >
                    <FontAwesomeIcon icon={icon} /> {label}
                    {isMobileView && ( // Zeigt Chevron-Icon nur in mobiler Ansicht.
                        <FontAwesomeIcon icon={isAccordionOpen ? faChevronDown : faChevronRight} className="ml-auto" />
                    )}
                </button>
                {isMobileView && isAccordionOpen && ( // Zeigt Akkordeon-Inhalt nur in mobiler Ansicht, wenn geöffnet.
                    <div className="dashboard-accordion-content">
                        {renderTabContent(tabName)}
                    </div>
                )}
            </li>
        );
    };

    return (
        <div className="account-dashboard-container">
            <div className="container">
                <h1 className="dashboard-main-heading">Mein Account</h1>
                <p className="dashboard-welcome-message">
                    Hallo, {currentUser?.firstName && currentUser?.lastName ? `${currentUser.firstName} ${currentUser.lastName}` : currentUser?.email}! Hier verwalten Sie Ihr Profil und Ihre Termine.
                </p>

                <div className="dashboard-layout">
                    {/* Sidebar Navigation */}
                    <div className="dashboard-sidebar">
                        <ul>
                            {renderNavButton('bookNew', faCalendarPlus, 'Termin buchen', !isAdmin)}
                            {renderNavButton('bookings', faClipboardList, 'Meine Termine')}
                            {renderNavButton('profile', faUser, 'Meine Daten')}
                            {renderNavButton('adminServices', faTools, 'Services verwalten', isAdmin)}
                            <li className="dashboard-nav-item logout-button-container">
                                <button onClick={logOut} className="dashboard-nav-button logout-button">
                                    <FontAwesomeIcon icon={faSignOutAlt} /> Abmelden
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Hauptinhaltsbereich (nur auf Desktop sichtbar) */}
                    {!isMobileView && (
                        <div className="dashboard-content">
                            {renderTabContent(activeTab)} {/* Rendert den Inhalt des aktiven Tabs */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AccountDashboard;
