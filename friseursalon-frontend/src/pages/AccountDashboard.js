import React, { useState, useEffect, useCallback } from 'react';
import "./AccountDashboard.css";
import AppointmentList from '../components/AppointmentList';
import ServiceForm from '../components/ServiceForm';
import ServiceList from '../components/ServiceList';
import WorkingHoursManager from '../components/WorkingHoursManager';
import BlockedTimeSlotManager from '../components/BlockedTimeSlotManager'; // NEU: Importieren
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClipboardList, faUserCog, faTools, faSignOutAlt,
    faChevronRight, faChevronDown, faPlusCircle, faMinusCircle,
    faChartBar, faUser, faTimesCircle, faClock, faCalendarTimes // NEU: Icon für Abwesenheiten
} from '@fortawesome/free-solid-svg-icons';


function AccountDashboard({
                              currentUser,
                              logOut,
                              onAppointmentAdded,
                              refreshAppointmentsList,
                              onServiceAdded,
                              refreshServicesList
                              // onWorkingHoursUpdated, // Falls benötigt für Arbeitszeiten
                              // onBlockedSlotsUpdated // NEU, falls benötigt
                          }) {
    const initialTab = currentUser?.roles?.includes("ROLE_ADMIN") ? 'adminServices' : 'bookings';
    const [activeTab, setActiveTab] = useState(initialTab);

    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 992);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const [showServiceForm, setShowServiceForm] = useState(false);
    const [isSubmittingService, setIsSubmittingService] = useState(false);

    const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes("ROLE_ADMIN");

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 992;
            setIsMobileView(mobile);
            if (!mobile) setMobileNavOpen(false);
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Setzt den initialen oder Fallback-Tab basierend auf der Rolle
        if (currentUser) {
            const adminTabs = ['adminServices', 'adminWorkingHours', 'adminBlockedSlots', 'adminAnalytics'];
            const userTabs = ['bookings', 'profile'];

            if (isAdmin) {
                if (!adminTabs.includes(activeTab) && !userTabs.includes(activeTab)) {
                    // Wenn ein Admin einen ungültigen Tab hat, auf den ersten Admin-Tab setzen
                    setActiveTab('adminServices');
                } else if (!adminTabs.includes(activeTab) && userTabs.includes(activeTab)){
                    // Admin ist auf einem User-Tab, das ist okay
                } else if (!adminTabs.includes(activeTab)) {
                    setActiveTab('adminServices'); // Fallback
                }
            } else { // Ist User
                if (!userTabs.includes(activeTab)) {
                    setActiveTab('bookings');
                }
            }
        } else {
            // Falls kein currentUser, was im ProtectedRoute eigentlich nicht passieren sollte
            setActiveTab('bookings');
        }

        // Schließe Formulare, wenn der Tab nicht passt
        if (activeTab !== 'adminServices') {
            setShowServiceForm(false);
        }

    }, [currentUser, isAdmin, activeTab]);


    const handleServiceAddedCallback = () => {
        if (onServiceAdded) {
            onServiceAdded();
        }
        setShowServiceForm(false);
        setIsSubmittingService(false);
    };

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        if (isMobileView) {
            setMobileNavOpen(false);
        }
    };


    const renderTabContent = (tabName) => {
        switch (tabName) {
            case 'bookings':
                return (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Meine Termine</h2>
                        <AppointmentList refreshTrigger={refreshAppointmentsList} currentUser={currentUser} />
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
                                className="button-link-outline toggle-service-form-button"
                                aria-expanded={showServiceForm}
                            >
                                <FontAwesomeIcon icon={showServiceForm ? faMinusCircle : faPlusCircle} />
                                {showServiceForm ? 'Formular schließen' : 'Neuen Service hinzufügen'}
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
            case 'adminWorkingHours':
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Arbeitszeiten verwalten</h2>
                        <WorkingHoursManager />
                    </div>
                );
            // NEU: Tab für Blockaden/Abwesenheiten
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
                if (isAdmin) return renderTabContent('adminServices');
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
        return <div className="page-center-content"><p>Laden...</p></div>;
    }

    const DesktopNav = () => (
        <aside className="dashboard-sidebar">
            <nav>
                <ul>
                    <li className="nav-category-title">Mein Bereich</li>
                    {renderNavItem('bookings', faClipboardList, 'Meine Termine')}
                    {renderNavItem('profile', faUser, 'Meine Daten')}

                    {isAdmin && (
                        <>
                            <li className="nav-category-title mt-4">Verwaltung</li>
                            {renderNavItem('adminServices', faTools, 'Services')}
                            {renderNavItem('adminWorkingHours', faClock, 'Arbeitszeiten')}
                            {renderNavItem('adminBlockedSlots', faCalendarTimes, 'Abwesenheiten')} {/* NEU */}
                            {renderNavItem('adminAnalytics', faChartBar, 'Analysen')}
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

    const MobileNav = () => (
        <div className={`mobile-dashboard-nav ${mobileNavOpen ? 'open' : ''}`} id="mobile-dashboard-navigation">
            <button className="mobile-nav-close-button" onClick={() => setMobileNavOpen(false)}>
                <FontAwesomeIcon icon={faTimesCircle} /> Menü schließen
            </button>
            <nav>
                <ul>
                    <li className="nav-category-title">Mein Bereich</li>
                    {renderNavItem('bookings', faClipboardList, 'Meine Termine')}
                    {renderNavItem('profile', faUser, 'Meine Daten')}

                    {isAdmin && (
                        <>
                            <li className="nav-category-title mt-4">Verwaltung</li>
                            {renderNavItem('adminServices', faTools, 'Services')}
                            {renderNavItem('adminWorkingHours', faClock, 'Arbeitszeiten')}
                            {renderNavItem('adminBlockedSlots', faCalendarTimes, 'Abwesenheiten')} {/* NEU */}
                            {renderNavItem('adminAnalytics', faChartBar, 'Analysen')}
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
                    Hallo, {currentUser.firstName || currentUser.email}! Hier verwalten Sie Ihre Daten.
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