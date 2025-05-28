// src/pages/AccountDashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import "./AccountDashboard.css"; // Stile für das Dashboard UND AppointmentList
// import "../components/AppointmentList.css"; // ENTFERNT - Stile sind in AccountDashboard.css
import AdminCalendarView from '../components/AdminCalendarView';
import AppointmentList from '../components/AppointmentList';
import ServiceForm from '../components/ServiceForm';
import ServiceList from '../components/ServiceList';
import WorkingHoursManager from '../components/WorkingHoursManager';
import BlockedTimeSlotManager from '../components/BlockedTimeSlotManager';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClipboardList, faUserCog, faTools, faSignOutAlt,
    faChevronRight, faChevronDown, faPlusCircle, faMinusCircle,
    faChartBar, faUser, faTimesCircle, faClock, faCalendarTimes,
    faCalendarAlt, faListAlt // Neues Icon für Terminliste
} from '@fortawesome/free-solid-svg-icons';


function AccountDashboard({
                              currentUser,
                              logOut,
                              onAppointmentAdded, // Wird an Kalender/Liste weitergegeben, um refresh zu triggern
                              refreshAppointmentsList, // Wird vom Kalender/Liste genutzt
                              onServiceAdded,
                              refreshServicesList
                          }) {
    // Wenn Admin, starte auf Kalender-Tab, sonst auf "Meine Termine" (Liste)
    const initialAdminTab = 'adminCalendar'; // Admin startet standardmäßig im Kalender
    const initialUserTab = 'bookings';       // User startet standardmäßig in "Meine Termine" (Liste)

    const [activeTab, setActiveTab] = useState(
        currentUser?.roles?.includes("ROLE_ADMIN") ? initialAdminTab : initialUserTab
    );

    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 992);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    // States für Admin-spezifische Formulare
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [isSubmittingService, setIsSubmittingService] = useState(false);

    const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes("ROLE_ADMIN");

    // Callback, der vom AdminCalendarView oder AppointmentList aufgerufen wird,
    // wenn ein Termin geändert wurde.
    // Dies triggert den refreshAppointmentsList State in App.js.
    const handleAppointmentChangeInCalendarOrList = useCallback(() => {
        if (onAppointmentAdded) { // onAppointmentAdded ist der Callback, der refreshAppointmentsList erhöht
            onAppointmentAdded();
        }
    }, [onAppointmentAdded]);


    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 992;
            setIsMobileView(mobile);
            if (!mobile) setMobileNavOpen(false); // Schließe mobiles Menü bei Vergrößerung
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Initialer Check beim Laden
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Stellt sicher, dass der Tab gültig ist, wenn sich currentUser oder isAdmin-Status ändert.
        if (currentUser) {
            const adminTabs = ['adminCalendar', 'adminAppointmentList', 'adminServices', 'adminWorkingHours', 'adminBlockedSlots', 'adminAnalytics', 'profile'];
            const userTabs = ['bookings', 'profile'];

            if (isAdmin) {
                // Wenn der aktuelle Tab kein gültiger Admin-Tab ist (oder ein reiner User-Tab außer 'profile'),
                // setze auf den initialen Admin-Tab.
                if (!adminTabs.includes(activeTab)) {
                    setActiveTab(initialAdminTab);
                }
            } else { // Ist User
                if (!userTabs.includes(activeTab)) {
                    setActiveTab(initialUserTab); // User Fallback zur Terminliste
                }
            }
        } else {
            // Sollte nicht passieren, da dies eine geschützte Route ist, aber als Fallback
            setActiveTab(initialUserTab);
        }

        // Service-Formular schließen, wenn der Tab gewechselt wird und es nicht der Service-Tab ist
        if (activeTab !== 'adminServices') {
            setShowServiceForm(false);
        }
    }, [currentUser, isAdmin, activeTab, initialAdminTab, initialUserTab]);


    const handleServiceAddedCallback = () => {
        if (onServiceAdded) {
            onServiceAdded(); // Triggert refreshServicesList in App.js
        }
        setShowServiceForm(false); // Schließt das Formular nach erfolgreichem Hinzufügen
        setIsSubmittingService(false); // Setzt den Ladezustand zurück
    };

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        if (isMobileView) {
            setMobileNavOpen(false); // Schließt das mobile Menü nach Auswahl eines Tabs
        }
    };


    const renderTabContent = (tabName) => {
        switch (tabName) {
            case 'bookings': // Für normale User, zeigt die Terminliste
                return (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Meine Termine</h2>
                        <AppointmentList
                            refreshTrigger={refreshAppointmentsList}
                            currentUser={currentUser}
                            // onAppointmentUpdated wird hier nicht direkt benötigt,
                            // da Aktionen (Löschen) in AppointmentList selbst einen Refetch auslösen sollten
                            // oder über refreshAppointmentsList global getriggert werden.
                        />
                    </div>
                );
            case 'adminCalendar': // NEU: Für Admin, zeigt den Kalender
                return isAdmin && (
                    <div className="dashboard-section-content admin-calendar-tab-content">
                        <h2 className="dashboard-section-heading">Terminkalender</h2>
                        <AdminCalendarView
                            currentUser={currentUser}
                            refreshTrigger={refreshAppointmentsList} // Wird genutzt, um Kalender neu zu laden bei globalen Änderungen
                            onAppointmentUpdated={handleAppointmentChangeInCalendarOrList} // Callback, um refresh zu triggern
                        />
                    </div>
                );
            case 'adminAppointmentList': // NEUER TAB für Admin Terminliste
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Terminübersicht (Liste)</h2>
                        <AppointmentList
                            refreshTrigger={refreshAppointmentsList}
                            currentUser={currentUser} // Stellt sicher, dass Admin-Ansicht geladen wird
                        />
                    </div>
                );
            case 'profile':
                return (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Meine Daten</h2>
                        <div className="dashboard-profile-info">
                            <p><strong>Vorname:</strong> {currentUser?.firstName || '-'}</p>
                            <p><strong>Nachname:</strong> {currentUser?.lastName || '-'}</p>
                            <p><strong>E-Mail:</strong> {currentUser?.email || '-'}</p>
                            <p><strong>Telefon:</strong> {currentUser?.phoneNumber || 'Nicht angegeben'}</p>
                            <p><strong>Rollen:</strong> {currentUser?.roles?.join(', ') || '-'}</p>
                        </div>
                    </div>
                );
            case 'adminServices':
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <div className="dashboard-section-header-controls">
                            <h2 className="dashboard-section-heading">Dienstleistungen verwalten</h2>
                            <button
                                onClick={() => setShowServiceForm(!showServiceForm)}
                                className="button-link-outline toggle-service-form-button" // Klasse für Styling
                                aria-expanded={showServiceForm}
                            >
                                <FontAwesomeIcon icon={showServiceForm ? faMinusCircle : faPlusCircle} />
                                {showServiceForm ? ' Formular schließen' : ' Neuen Service hinzufügen'}
                            </button>
                        </div>
                        {showServiceForm && (
                            <div className="service-form-wrapper"> {/* Wrapper für Styling des Formularbereichs */}
                                <ServiceForm
                                    onServiceAdded={handleServiceAddedCallback}
                                    setIsSubmitting={setIsSubmittingService} // Übergabe der Setter-Funktion
                                    isSubmitting={isSubmittingService}     // Übergabe des Ladezustands
                                />
                            </div>
                        )}
                        <hr className="dashboard-section-hr" /> {/* Trennlinie */}
                        <ServiceList key={refreshServicesList} currentUser={currentUser} />
                    </div>
                );
            case 'adminWorkingHours':
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Arbeitszeiten verwalten</h2>
                        <WorkingHoursManager />
                    </div>
                );
            case 'adminBlockedSlots':
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Abwesenheiten & Pausen</h2>
                        <BlockedTimeSlotManager />
                    </div>
                );
            case 'adminAnalytics':
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Analysen</h2>
                        <p className="text-center text-gray-600 py-4">Dieser Bereich ist in Entwicklung.</p>
                    </div>
                );
            default:
                // Fallback-Logik, falls ein ungültiger Tab aktiv ist
                if (isAdmin) return renderTabContent('adminCalendar');
                return renderTabContent('bookings');
        }
    };

    const renderNavItem = (tabName, icon, label) => (
        <li key={tabName} className="dashboard-nav-item">
            <button
                onClick={() => handleTabClick(tabName)}
                className={`dashboard-nav-button ${activeTab === tabName ? 'active' : ''}`}
            >
                <FontAwesomeIcon icon={icon} fixedWidth /> <span>{label}</span>
            </button>
        </li>
    );


    if (!currentUser) {
        // Sollte durch ProtectedRoute in App.js abgefangen werden, aber als Sicherheit
        return <div className="page-center-content"><p>Laden...</p></div>;
    }

    // Desktop Navigation
    const DesktopNav = () => (
        <aside className="dashboard-sidebar">
            <nav>
                <ul>
                    {!isAdmin && ( // User spezifische Tabs zuerst
                        <>
                            <li className="nav-category-title">Mein Bereich</li>
                            {renderNavItem('bookings', faClipboardList, 'Meine Termine')}
                            {renderNavItem('profile', faUser, 'Meine Daten')}
                        </>
                    )}

                    {isAdmin && (
                        <>
                            <li className="nav-category-title">Terminplanung</li>
                            {renderNavItem('adminCalendar', faCalendarAlt, 'Kalender')}
                            {renderNavItem('adminAppointmentList', faListAlt, 'Terminliste')} {/* NEUER TAB */}

                            <li className="nav-category-title mt-4">Verwaltung</li>
                            {renderNavItem('adminServices', faTools, 'Services')}
                            {renderNavItem('adminWorkingHours', faClock, 'Arbeitszeiten')}
                            {renderNavItem('adminBlockedSlots', faCalendarTimes, 'Abwesenheiten')}
                            {renderNavItem('adminAnalytics', faChartBar, 'Analysen')}

                            {/* Admin kann auch sein Profil sehen, daher unter einer eigenen Kategorie */}
                            <li className="nav-category-title mt-4">Mein Account (Admin)</li>
                            {renderNavItem('profile', faUser, 'Meine Daten')}
                        </>
                    )}
                    <li className="dashboard-nav-item logout-button-container">
                        <button onClick={logOut} className="dashboard-nav-button logout-button">
                            <FontAwesomeIcon icon={faSignOutAlt} fixedWidth /> <span>Abmelden</span>
                        </button>
                    </li>
                </ul>
            </nav>
        </aside>
    );

    // Mobile Navigation
    const MobileNav = () => (
        <div className={`mobile-dashboard-nav ${mobileNavOpen ? 'open' : ''}`} id="mobile-dashboard-navigation">
            <button className="mobile-nav-close-button" onClick={() => setMobileNavOpen(false)}>
                <FontAwesomeIcon icon={faTimesCircle} /> Menü schließen
            </button>
            <nav>
                <ul>
                    {/* Die Logik für User und Admin Tabs ist identisch zur Desktop-Nav */}
                    {!isAdmin && (
                        <>
                            <li className="nav-category-title">Mein Bereich</li>
                            {renderNavItem('bookings', faClipboardList, 'Meine Termine')}
                            {renderNavItem('profile', faUser, 'Meine Daten')}
                        </>
                    )}

                    {isAdmin && (
                        <>
                            <li className="nav-category-title">Terminplanung</li>
                            {renderNavItem('adminCalendar', faCalendarAlt, 'Kalender')}
                            {renderNavItem('adminAppointmentList', faListAlt, 'Terminliste')} {/* NEUER TAB */}

                            <li className="nav-category-title mt-4">Verwaltung</li>
                            {renderNavItem('adminServices', faTools, 'Services')}
                            {renderNavItem('adminWorkingHours', faClock, 'Arbeitszeiten')}
                            {renderNavItem('adminBlockedSlots', faCalendarTimes, 'Abwesenheiten')}
                            {renderNavItem('adminAnalytics', faChartBar, 'Analysen')}

                            <li className="nav-category-title mt-4">Mein Account (Admin)</li>
                            {renderNavItem('profile', faUser, 'Meine Daten')}
                        </>
                    )}
                    <li className="dashboard-nav-item logout-button-container">
                        <button onClick={() => { logOut(); setMobileNavOpen(false); }} className="dashboard-nav-button logout-button">
                            <FontAwesomeIcon icon={faSignOutAlt} fixedWidth /> <span>Abmelden</span>
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );

    return (
        <div className="account-dashboard-container">
            <div className="container">
                <div className="dashboard-header">
                    <h1 className="dashboard-main-heading">Mein Account</h1>
                    {isMobileView && (
                        <button
                            className="mobile-nav-toggle-button button-link-outline small-button"
                            onClick={() => setMobileNavOpen(true)}
                            aria-expanded={mobileNavOpen}
                            aria-controls="mobile-dashboard-navigation"
                        >
                            <FontAwesomeIcon icon={faChevronRight} /> Menü
                        </button>
                    )}
                </div>
                <p className="dashboard-welcome-message">
                    Hallo, {currentUser.firstName || currentUser.email}! Hier verwalten Sie Ihre Daten und Termine.
                </p>

                <div className="dashboard-layout">
                    {isMobileView ? <MobileNav /> : <DesktopNav />}

                    <section className="dashboard-content" aria-live="polite">
                        {renderTabContent(activeTab)}
                    </section>
                </div>
            </div>
        </div>
    );
}

export default AccountDashboard;
