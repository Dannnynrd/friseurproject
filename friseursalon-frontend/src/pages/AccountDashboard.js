// src/pages/AccountDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import "./AccountDashboard.css"; // Stellt sicher, dass die CSS-Datei importiert wird
import AdminCalendarView from '../components/AdminCalendarView';
import AppointmentList from '../components/AppointmentList';
import ServiceForm from '../components/ServiceForm';
import ServiceList from '../components/ServiceList';
import WorkingHoursManager from '../components/WorkingHoursManager';
import BlockedTimeSlotManager from '../components/BlockedTimeSlotManager';
import AdminDashboardStats from '../components/AdminDashboardStats'; // Import der neuen Statistik-Komponente
import AppointmentEditModal from '../components/AppointmentEditModal';
import CustomerManagement from '../components/CustomerManagement'; // Import für Kundenverwaltung
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClipboardList, faUserCog, faTools, faSignOutAlt,
    faChevronRight, faChevronDown, faPlusCircle, faMinusCircle,
    faChartBar, faUser, faTimesCircle, faClock, faCalendarTimes,
    faCalendarAlt, faListAlt, faTachometerAlt, // Icon für Dashboard-Übersicht
    faUsers // Icon für Kundenverwaltung
} from '@fortawesome/free-solid-svg-icons';


function AccountDashboard({
                              currentUser,
                              logOut,
                              onAppointmentAdded, // Wird an AdminDashboardStats weitergegeben
                              refreshAppointmentsList, // Für AppointmentList und CustomerManagement (indirekt)
                              onServiceAdded, // Für ServiceForm
                              refreshServicesList // Für ServiceList
                          }) {

    // Bestimmt den initialen Tab basierend auf der Benutzerrolle
    const initialAdminTab = 'adminDashboardStats'; // Standard-Tab für Admins ist jetzt die Statistik-Übersicht
    const initialUserTab = 'bookings'; // Standard-Tab für normale Benutzer

    // State für den aktiven Tab
    const [activeTab, setActiveTab] = useState(
        currentUser?.roles?.includes("ROLE_ADMIN") ? initialAdminTab : initialUserTab
    );

    // States für die mobile Ansicht und das mobile Menü
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 992);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    // State für die Sichtbarkeit des Service-Formulars
    const [showServiceForm, setShowServiceForm] = useState(false);
    // State für den Ladezustand beim Absenden des Service-Formulars
    const [isSubmittingService, setIsSubmittingService] = useState(false);

    // Prüft, ob der aktuelle Benutzer ein Admin ist
    const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes("ROLE_ADMIN");

    // State für das Bearbeiten eines Termins, der aus den AdminDashboardStats ausgewählt wurde
    // (wird momentan nicht direkt in AdminDashboardStats verwendet, könnte aber für zukünftige Features nützlich sein)
    const [selectedAppointmentForEditFromStats, setSelectedAppointmentForEditFromStats] = useState(null);

    // Callback-Funktion, die aufgerufen wird, wenn eine Terminaktion in AdminDashboardStats ausgeführt wird
    // Dies dient dazu, die Terminliste (und damit indirekt die Statistiken) zu aktualisieren
    const handleAppointmentAction = useCallback(() => {
        if (onAppointmentAdded) {
            onAppointmentAdded(); // Löst die Aktualisierung in der App-Komponente aus
        }
    }, [onAppointmentAdded]);


    // Effekt zum Behandeln von Größenänderungen des Fensters für die mobile Ansicht
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 992;
            setIsMobileView(mobile);
            if (!mobile) setMobileNavOpen(false); // Mobiles Menü schließen, wenn nicht mehr in mobiler Ansicht
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Initialer Check
        return () => window.removeEventListener('resize', handleResize); // Aufräumen bei Unmount
    }, []);

    // Effekt zum Setzen des aktiven Tabs und Verwalten des Service-Formulars
    useEffect(() => {
        if (currentUser) {
            const adminTabs = ['adminDashboardStats', 'adminCalendar', 'adminAppointmentList', 'adminServices', 'adminWorkingHours', 'adminBlockedSlots', 'adminCustomerManagement', 'profile'];
            const userTabs = ['bookings', 'profile'];

            if (isAdmin) {
                if (!adminTabs.includes(activeTab)) {
                    setActiveTab(initialAdminTab); // Setzt auf Statistik-Übersicht, falls aktueller Tab ungültig
                }
            } else {
                if (!userTabs.includes(activeTab)) {
                    setActiveTab(initialUserTab); // Setzt auf "Meine Termine", falls aktueller Tab ungültig
                }
            }
        } else {
            // Fallback, falls currentUser aus irgendeinem Grund null ist (sollte durch ProtectedRoute verhindert werden)
            setActiveTab(initialUserTab);
        }

        // Service-Formular ausblenden, wenn der Service-Tab nicht aktiv ist
        if (activeTab !== 'adminServices') {
            setShowServiceForm(false);
        }
        // Termin für Bearbeitung zurücksetzen, wenn Tab gewechselt wird
        setSelectedAppointmentForEditFromStats(null);
    }, [currentUser, isAdmin, activeTab, initialAdminTab, initialUserTab]);


    // Callback, wenn ein Service hinzugefügt wurde
    const handleServiceAddedCallback = () => {
        if (onServiceAdded) {
            onServiceAdded(); // Löst Aktualisierung in App.js aus
        }
        setShowServiceForm(false); // Formular ausblenden
        setIsSubmittingService(false); // Ladezustand zurücksetzen
    };

    // Handler für Klick auf einen Navigations-Tab
    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        if (isMobileView) {
            setMobileNavOpen(false); // Mobiles Menü bei Tab-Wechsel schließen
        }
    };

    // Schließen des Termin-Bearbeitungsmodals (falls es aus AdminDashboardStats geöffnet wurde)
    const handleCloseAppointmentEditModalFromStats = () => {
        setSelectedAppointmentForEditFromStats(null);
    };

    // Callback, wenn ein Termin im Modal (geöffnet aus AdminDashboardStats) aktualisiert wurde
    const handleAppointmentUpdatedFromStatsModal = () => {
        handleCloseAppointmentEditModalFromStats();
        if (onAppointmentAdded) { // onAppointmentAdded wird hier als generischer Trigger verwendet
            onAppointmentAdded();
        }
    };

    // Funktion zum Rendern des Inhalts des aktiven Tabs
    const renderTabContent = (tabName) => {
        switch (tabName) {
            case 'adminDashboardStats': // Tab für die Statistik-Übersicht
                return isAdmin && (
                    <div className="dashboard-section-content admin-stats-tab-content">
                        {/* Die Überschrift ist jetzt Teil der AdminDashboardStats Komponente */}
                        <AdminDashboardStats
                            currentUser={currentUser}
                            onAppointmentAction={handleAppointmentAction}
                        />
                    </div>
                );
            case 'bookings': // Tab für "Meine Termine" (Benutzeransicht)
                return (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Meine Termine</h2>
                        <AppointmentList
                            refreshTrigger={refreshAppointmentsList}
                            currentUser={currentUser}
                        />
                    </div>
                );
            case 'adminCalendar': // Tab für den Admin-Kalender
                return isAdmin && (
                    <div className="dashboard-section-content admin-calendar-tab-content">
                        <h2 className="dashboard-section-heading">Terminkalender</h2>
                        <AdminCalendarView
                            currentUser={currentUser}
                            refreshTrigger={refreshAppointmentsList} // Aktualisiert Kalender bei neuen/geänderten Terminen
                            onAppointmentUpdated={handleAppointmentAction} // Prop für Aktionen aus dem Kalender
                        />
                    </div>
                );
            case 'adminAppointmentList': // Tab für die Admin-Terminliste
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Terminübersicht (Liste)</h2>
                        <AppointmentList
                            refreshTrigger={refreshAppointmentsList}
                            currentUser={currentUser}
                        />
                    </div>
                );
            case 'profile': // Tab für Benutzerprofildaten
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
                        {/* Hier könnte später ein Button zum Bearbeiten des Profils hinzukommen */}
                    </div>
                );
            case 'adminServices': // Tab für die Service-Verwaltung
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <div className="dashboard-section-header-controls">
                            <h2 className="dashboard-section-heading">Dienstleistungen verwalten</h2>
                            <button
                                onClick={() => setShowServiceForm(!showServiceForm)}
                                className="button-link-outline toggle-service-form-button"
                                aria-expanded={showServiceForm}
                            >
                                <FontAwesomeIcon icon={showServiceForm ? faMinusCircle : faPlusCircle} />
                                {showServiceForm ? ' Formular schließen' : ' Neuen Service hinzufügen'}
                            </button>
                        </div>
                        {showServiceForm && (
                            <div className="service-form-wrapper">
                                <ServiceForm
                                    onServiceAdded={handleServiceAddedCallback}
                                    setIsSubmitting={setIsSubmittingService}
                                    isSubmitting={isSubmittingService}
                                />
                            </div>
                        )}
                        <hr className="dashboard-section-hr" />
                        <ServiceList key={refreshServicesList} currentUser={currentUser} />
                    </div>
                );
            case 'adminCustomerManagement': // Tab für die Kundenverwaltung
                return isAdmin && (
                    <div className="dashboard-section-content">
                        {/* Die Überschrift ist Teil der CustomerManagement Komponente */}
                        <CustomerManagement currentUser={currentUser} refreshTrigger={refreshAppointmentsList} />
                    </div>
                );
            case 'adminWorkingHours': // Tab für Arbeitszeitenverwaltung
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Arbeitszeiten verwalten</h2>
                        <WorkingHoursManager />
                    </div>
                );
            case 'adminBlockedSlots': // Tab für Abwesenheiten/Pausen
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Abwesenheiten & Pausen</h2>
                        <BlockedTimeSlotManager />
                    </div>
                );
            default: // Fallback: Zeigt den initialen Tab basierend auf der Rolle an
                if (isAdmin) return renderTabContent(initialAdminTab);
                return renderTabContent(initialUserTab);
        }
    };

    // Funktion zum Rendern eines einzelnen Navigationselements
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

    // Ladeanzeige, wenn currentUser noch nicht verfügbar ist (sollte selten passieren wegen ProtectedRoute)
    if (!currentUser) {
        return <div className="page-center-content"><p>Laden...</p></div>;
    }

    // Desktop-Navigation
    const DesktopNav = () => (
        <aside className="dashboard-sidebar">
            <nav>
                <ul>
                    {!isAdmin && ( // Navigation für normale Benutzer
                        <>
                            <li className="nav-category-title">Mein Bereich</li>
                            {renderNavItem('bookings', faClipboardList, 'Meine Termine')}
                            {renderNavItem('profile', faUser, 'Meine Daten')}
                        </>
                    )}

                    {isAdmin && ( // Navigation für Administratoren
                        <>
                            {renderNavItem('adminDashboardStats', faTachometerAlt, 'Übersicht')}
                            <li className="nav-category-title mt-4">Terminplanung</li>
                            {renderNavItem('adminCalendar', faCalendarAlt, 'Kalender')}
                            {renderNavItem('adminAppointmentList', faListAlt, 'Terminliste')}
                            <li className="nav-category-title mt-4">Verwaltung</li>
                            {renderNavItem('adminServices', faTools, 'Services')}
                            {renderNavItem('adminCustomerManagement', faUsers, 'Kunden')}
                            {renderNavItem('adminWorkingHours', faClock, 'Arbeitszeiten')}
                            {renderNavItem('adminBlockedSlots', faCalendarTimes, 'Abwesenheiten')}
                            <li className="nav-category-title mt-4">Mein Account (Admin)</li>
                            {renderNavItem('profile', faUser, 'Meine Daten')}
                        </>
                    )}
                    {/* Logout-Button für alle angemeldeten Benutzer */}
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
                {/* Inhalt der mobilen Navigation ist identisch zur Desktop-Navigation,
                    wird aber anders dargestellt (Slide-In). */}
                <ul>
                    {!isAdmin && (
                        <>
                            <li className="nav-category-title">Mein Bereich</li>
                            {renderNavItem('bookings', faClipboardList, 'Meine Termine')}
                            {renderNavItem('profile', faUser, 'Meine Daten')}
                        </>
                    )}
                    {isAdmin && (
                        <>
                            {renderNavItem('adminDashboardStats', faTachometerAlt, 'Übersicht')}
                            <li className="nav-category-title mt-4">Terminplanung</li>
                            {renderNavItem('adminCalendar', faCalendarAlt, 'Kalender')}
                            {renderNavItem('adminAppointmentList', faListAlt, 'Terminliste')}
                            <li className="nav-category-title mt-4">Verwaltung</li>
                            {renderNavItem('adminServices', faTools, 'Services')}
                            {renderNavItem('adminCustomerManagement', faUsers, 'Kunden')}
                            {renderNavItem('adminWorkingHours', faClock, 'Arbeitszeiten')}
                            {renderNavItem('adminBlockedSlots', faCalendarTimes, 'Abwesenheiten')}
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

    // Haupt-JSX der Komponente
    return (
        <div className="account-dashboard-container">
            <div className="container">
                <div className="dashboard-header">
                    <h1 className="dashboard-main-heading">Mein Account</h1>
                    {isMobileView && ( // Button zum Öffnen des mobilen Menüs
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
                    {/* Wählt zwischen Desktop- und Mobile-Navigation */}
                    {isMobileView ? <MobileNav /> : <DesktopNav />}

                    {/* Hauptinhaltsbereich, der den aktiven Tab rendert */}
                    <section className="dashboard-content" aria-live="polite">
                        {renderTabContent(activeTab)}
                    </section>
                </div>
            </div>
            {/* Modal für Terminbearbeitung (falls aus AdminDashboardStats geöffnet) */}
            {selectedAppointmentForEditFromStats && currentUser?.roles?.includes("ROLE_ADMIN") && (
                <AppointmentEditModal
                    appointment={selectedAppointmentForEditFromStats}
                    onClose={handleCloseAppointmentEditModalFromStats}
                    onAppointmentUpdated={handleAppointmentUpdatedFromStatsModal}
                />
            )}
        </div>
    );
}

export default AccountDashboard;
