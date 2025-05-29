// Datei: friseursalon-frontend/src/pages/AccountDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import "./AccountDashboard.css"; // CSS für das Dashboard-Layout
// Importiere die Statistik-Komponente
import AdminDashboardStats from '../components/AdminDashboardStats'; // NEU
import AdminCalendarView from '../components/AdminCalendarView';
import AppointmentList from '../components/AppointmentList';
import ServiceForm from '../components/ServiceForm';
import ServiceList from '../components/ServiceList';
import WorkingHoursManager from '../components/WorkingHoursManager';
import BlockedTimeSlotManager from '../components/BlockedTimeSlotManager';
import CustomerManagement from '../components/CustomerManagement';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClipboardList, faUserCog, faTools, faSignOutAlt,
    faPlusCircle, faMinusCircle,
    faChartBar, faUser, faTimesCircle, faClock, faCalendarTimes,
    faCalendarAlt, faListAlt, faTachometerAlt, faUsers, faBars // faBars für Mobile-Menü-Toggle
} from '@fortawesome/free-solid-svg-icons';

function AccountDashboard({
                              currentUser,
                              logOut,
                              onAppointmentAdded, // Wird für Stats und Kalender benötigt
                              refreshAppointmentsList, // Wird für Stats und Kalender benötigt
                              onServiceAdded,
                              refreshServicesList
                          }) {
    const initialAdminTab = 'adminDashboardStats'; // Statistik-Dashboard als Standard für Admins
    const initialUserTab = 'bookings';

    const [activeTab, setActiveTab] = useState(
        currentUser?.roles?.includes("ROLE_ADMIN") ? initialAdminTab : initialUserTab
    );

    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 992);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const [showServiceForm, setShowServiceForm] = useState(false);
    const [isSubmittingService, setIsSubmittingService] = useState(false);

    const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes("ROLE_ADMIN");

    // Callback, der von AdminDashboardStats aufgerufen werden kann, wenn eine Aktion (z.B. Termin erstellen)
    // eine Aktualisierung der Daten (z.B. in AppointmentList oder AdminCalendarView) erfordert.
    const handleAppointmentAction = useCallback(() => {
        if (onAppointmentAdded) {
            onAppointmentAdded(); // Dies löst den refreshAppointmentsList Trigger in App.js aus
        }
    }, [onAppointmentAdded]);


    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 992;
            setIsMobileView(mobile);
            if (!mobile && mobileNavOpen) { // Schließe Mobile-Nav, wenn auf Desktop-Größe gewechselt wird
                setMobileNavOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Initialer Check
        return () => window.removeEventListener('resize', handleResize);
    }, [mobileNavOpen]);

    // Setzt den aktiven Tab basierend auf der Rolle und stellt sicher, dass keine ungültigen Tabs ausgewählt sind
    useEffect(() => {
        if (currentUser) {
            const adminTabs = ['adminDashboardStats', 'adminCalendar', 'adminAppointmentList', 'adminServices', 'adminCustomerManagement', 'adminWorkingHours', 'adminBlockedSlots', 'profile'];
            const userTabs = ['bookings', 'profile'];

            if (isAdmin) {
                if (!adminTabs.includes(activeTab)) {
                    setActiveTab(initialAdminTab);
                }
            } else {
                if (!userTabs.includes(activeTab)) {
                    setActiveTab(initialUserTab);
                }
            }
        } else {
            // Fallback, sollte nicht passieren, da ProtectedRoute dies abfängt
            setActiveTab(initialUserTab);
        }

        // Service-Formular ausblenden, wenn der Tab gewechselt wird
        if (activeTab !== 'adminServices') {
            setShowServiceForm(false);
        }
    }, [currentUser, isAdmin, activeTab, initialAdminTab, initialUserTab]);


    const handleServiceAddedCallback = () => {
        if (onServiceAdded) {
            onServiceAdded(); // Trigger refresh in App.js
        }
        setShowServiceForm(false);
        setIsSubmittingService(false);
    };

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        if (isMobileView) {
            setMobileNavOpen(false); // Schließe Mobile-Nav bei Tab-Klick
        }
    };

    const renderTabContent = (tabName) => {
        switch (tabName) {
            case 'adminDashboardStats': // NEUER CASE für die Statistik-Übersicht
                return isAdmin && (
                    <div className="dashboard-section-content admin-stats-tab-content">
                        {/* Kein separater H2 hier, da AdminDashboardStats einen eigenen Titel hat */}
                        <AdminDashboardStats
                            currentUser={currentUser}
                            onAppointmentAction={handleAppointmentAction} // Weitergabe des Callbacks
                        />
                    </div>
                );
            case 'bookings':
                return (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading"><FontAwesomeIcon icon={faClipboardList} /> Meine Termine</h2>
                        <AppointmentList
                            refreshTrigger={refreshAppointmentsList}
                            currentUser={currentUser}
                        />
                    </div>
                );
            case 'adminCalendar':
                return isAdmin && (
                    <div className="dashboard-section-content admin-calendar-tab-content">
                        <h2 className="dashboard-section-heading"><FontAwesomeIcon icon={faCalendarAlt} /> Terminkalender</h2>
                        <AdminCalendarView
                            currentUser={currentUser}
                            refreshTrigger={refreshAppointmentsList}
                            onAppointmentUpdated={handleAppointmentAction} // Callback für Aktualisierungen aus dem Kalender
                        />
                    </div>
                );
            case 'adminAppointmentList':
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading"><FontAwesomeIcon icon={faListAlt} /> Terminübersicht (Liste)</h2>
                        <AppointmentList
                            refreshTrigger={refreshAppointmentsList}
                            currentUser={currentUser}
                        />
                    </div>
                );
            case 'profile':
                return (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading"><FontAwesomeIcon icon={faUser} /> Meine Daten</h2>
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
                            <h2 className="dashboard-section-heading" style={{marginBottom: 0, borderBottom: 'none'}}><FontAwesomeIcon icon={faTools} /> Dienstleistungen</h2>
                            <button
                                onClick={() => setShowServiceForm(!showServiceForm)}
                                className="button-link-outline toggle-service-form-button"
                                aria-expanded={showServiceForm}
                            >
                                <FontAwesomeIcon icon={showServiceForm ? faMinusCircle : faPlusCircle} />
                                {showServiceForm ? ' Formular schließen' : ' Neuer Service'}
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
                        <ServiceList refreshTrigger={refreshServicesList} currentUser={currentUser} />
                    </div>
                );
            case 'adminCustomerManagement': // Neuer Case für Kundenverwaltung
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <CustomerManagement currentUser={currentUser} refreshTrigger={refreshAppointmentsList} />
                    </div>
                );
            case 'adminWorkingHours':
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading"><FontAwesomeIcon icon={faClock} /> Arbeitszeiten</h2>
                        <WorkingHoursManager />
                    </div>
                );
            case 'adminBlockedSlots':
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading"><FontAwesomeIcon icon={faCalendarTimes} /> Abwesenheiten & Pausen</h2>
                        <BlockedTimeSlotManager />
                    </div>
                );
            default:
                if (isAdmin) return renderTabContent(initialAdminTab);
                return renderTabContent(initialUserTab);
        }
    };

    const renderNavItem = (tabName, icon, label) => (
        <li key={tabName} className="dashboard-nav-item">
            <button
                onClick={() => handleTabClick(tabName)}
                className={`dashboard-nav-button ${activeTab === tabName ? 'active' : ''}`}
                aria-current={activeTab === tabName ? 'page' : undefined}
            >
                <FontAwesomeIcon icon={icon} fixedWidth /> <span>{label}</span>
            </button>
        </li>
    );


    if (!currentUser) {
        return <div className="page-center-content"><p>Laden...</p></div>; // Sollte durch ProtectedRoute abgefangen werden
    }

    // Struktur für Desktop-Navigation
    const DesktopNav = () => (
        <aside className="dashboard-sidebar">
            <nav aria-label="Dashboard Navigation">
                <ul>
                    {isAdmin && (
                        <>
                            {renderNavItem('adminDashboardStats', faTachometerAlt, 'Übersicht')}
                            <li className="nav-category-title">Terminplanung</li>
                            {renderNavItem('adminCalendar', faCalendarAlt, 'Kalender')}
                            {renderNavItem('adminAppointmentList', faListAlt, 'Terminliste')}
                            <li className="nav-category-title">Verwaltung</li>
                            {renderNavItem('adminServices', faTools, 'Services')}
                            {renderNavItem('adminCustomerManagement', faUsers, 'Kunden')}
                            {renderNavItem('adminWorkingHours', faClock, 'Arbeitszeiten')}
                            {renderNavItem('adminBlockedSlots', faCalendarTimes, 'Sperrzeiten')}
                        </>
                    )}
                    {!isAdmin && (
                        <>
                            <li className="nav-category-title">Mein Bereich</li>
                            {renderNavItem('bookings', faClipboardList, 'Meine Termine')}
                        </>
                    )}
                    <li className="nav-category-title">{isAdmin ? 'Mein Account (Admin)' : 'Mein Account'}</li>
                    {renderNavItem('profile', faUser, 'Meine Daten')}
                    <li className="dashboard-nav-item logout-button-container">
                        <button onClick={logOut} className="dashboard-nav-button logout-button">
                            <FontAwesomeIcon icon={faSignOutAlt} fixedWidth /> <span>Abmelden</span>
                        </button>
                    </li>
                </ul>
            </nav>
        </aside>
    );

    // Struktur für Mobile-Navigation (Off-Canvas)
    const MobileNav = () => (
        <div className={`mobile-dashboard-nav ${mobileNavOpen ? 'open' : ''}`} id="mobile-dashboard-navigation" aria-hidden={!mobileNavOpen}>
            <button className="mobile-nav-close-button" onClick={() => setMobileNavOpen(false)} aria-label="Menü schließen">
                <FontAwesomeIcon icon={faTimesCircle} /> Menü schließen
            </button>
            <nav aria-label="Mobile Dashboard Navigation">
                {/* Inhalt identisch zu DesktopNav, wird aber anders dargestellt/gesteuert */}
                <ul>
                    {isAdmin && (
                        <>
                            {renderNavItem('adminDashboardStats', faTachometerAlt, 'Übersicht')}
                            <li className="nav-category-title">Terminplanung</li>
                            {renderNavItem('adminCalendar', faCalendarAlt, 'Kalender')}
                            {renderNavItem('adminAppointmentList', faListAlt, 'Terminliste')}
                            <li className="nav-category-title">Verwaltung</li>
                            {renderNavItem('adminServices', faTools, 'Services')}
                            {renderNavItem('adminCustomerManagement', faUsers, 'Kunden')}
                            {renderNavItem('adminWorkingHours', faClock, 'Arbeitszeiten')}
                            {renderNavItem('adminBlockedSlots', faCalendarTimes, 'Sperrzeiten')}
                        </>
                    )}
                    {!isAdmin && (
                        <>
                            <li className="nav-category-title">Mein Bereich</li>
                            {renderNavItem('bookings', faClipboardList, 'Meine Termine')}
                        </>
                    )}
                    <li className="nav-category-title">{isAdmin ? 'Mein Account (Admin)' : 'Mein Account'}</li>
                    {renderNavItem('profile', faUser, 'Meine Daten')}
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
                            aria-controls="mobile-dashboard-navigation" // Verweist auf die ID des Nav-Elements
                        >
                            <FontAwesomeIcon icon={faBars} /> Menü
                        </button>
                    )}
                </div>
                <p className="dashboard-welcome-message">
                    Willkommen zurück, {currentUser.firstName || currentUser.email}! Hier verwalten Sie Ihre Daten und Termine.
                </p>

                <div className="dashboard-layout">
                    {isMobileView ? <MobileNav /> : <DesktopNav />}
                    <main className="dashboard-content" id="dashboard-main-content" role="main" aria-live="polite">
                        {renderTabContent(activeTab)}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default AccountDashboard;