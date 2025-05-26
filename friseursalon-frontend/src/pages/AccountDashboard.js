import React, { useState } from 'react';
import AppointmentForm from '../components/AppointmentForm'; // Zum Buchen auf dem Dashboard
import AppointmentList from '../components/AppointmentList'; // Für eigene Termine / alle Termine
import ServiceForm from '../components/ServiceForm'; // Für Admin-Service-Verwaltung
import ServiceList from '../components/ServiceList'; // Für Admin-Service-Verwaltung
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus, faClipboardList, faUser, faTools, faSignOutAlt, faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import './AccountDashboard.css'; // Importiere die Dashboard-spezifische CSS-Datei

function AccountDashboard({ currentUser, logOut, onAppointmentAdded, refreshAppointmentsList, onServiceAdded, refreshServicesList }) {
    const [activeTab, setActiveTab] = useState('bookings'); // Standard-Tab: 'Meine Termine'
    const [activeAccordion, setActiveAccordion] = useState(null); // Für Akkordeon-Funktionalität auf Mobilgeräten

    const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes("ROLE_ADMIN");

    // Akkordeon-Funktion für mobile Ansicht
    const toggleAccordion = (tabName) => {
        setActiveAccordion(activeAccordion === tabName ? null : tabName);
    };

    // Hilfsfunktion zum Rendern eines Navigations-Buttons
    const renderNavButton = (tabName, icon, label, condition = true) => {
        if (!condition) return null;

        const isActive = activeTab === tabName;
        const isAccordionOpen = activeAccordion === tabName;

        return (
            <li key={tabName} className="dashboard-nav-item">
                <button
                    onClick={() => {
                        setActiveTab(tabName);
                        // Akkordeon umschalten nur, wenn auf Mobilgerät
                        if (window.innerWidth <= 768) { // Prüfen der Bildschirmbreite
                            toggleAccordion(tabName);
                        }
                    }}
                    className={`dashboard-nav-button ${isActive ? 'active' : ''}`}
                >
                    <FontAwesomeIcon icon={icon} /> {label}
                    {window.innerWidth <= 768 && ( // Chevron-Icon nur auf Mobilgeräten anzeigen
                        <FontAwesomeIcon icon={isAccordionOpen ? faChevronDown : faChevronRight} className="ml-auto" />
                    )}
                </button>
                {window.innerWidth <= 768 && isAccordionOpen && ( // Akkordeon-Inhalt nur auf Mobilgeräten anzeigen
                    <div className="dashboard-accordion-content">
                        {tabName === 'bookNew' && !isAdmin && (
                            <div className="dashboard-section-content">
                                <h2 className="dashboard-section-heading">Neuen Termin buchen</h2>
                                <AppointmentForm onAppointmentAdded={onAppointmentAdded} currentUser={currentUser} />
                            </div>
                        )}
                        {tabName === 'bookings' && (
                            <div className="dashboard-section-content">
                                <h2 className="dashboard-section-heading">Meine Termine</h2>
                                <AppointmentList refreshTrigger={refreshAppointmentsList} currentUser={currentUser} />
                            </div>
                        )}
                        {tabName === 'profile' && (
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
                        )}
                        {tabName === 'adminServices' && isAdmin && (
                            <div className="dashboard-section-content">
                                <h2 className="dashboard-section-heading">Dienstleistungen verwalten</h2>
                                <ServiceForm onServiceAdded={onServiceAdded} />
                                <hr className="dashboard-section-hr" />
                                <ServiceList key={refreshServicesList} />
                            </div>
                        )}
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

                    {/* Main Content Area (nur auf größeren Bildschirmen sichtbar) */}
                    {/* Auf Mobilgeräten wird der Inhalt im Akkordeon gerendert */}
                    {window.innerWidth > 768 && (
                        <div className="dashboard-content">
                            {/* Inhalt wird von renderContent() gerendert */}
                            {renderContent()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AccountDashboard;