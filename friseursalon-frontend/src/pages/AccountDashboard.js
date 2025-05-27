import React, { useState, useEffect } from 'react';
import AppointmentList from '../components/AppointmentList';
import ServiceForm from '../components/ServiceForm';
import ServiceList from '../components/ServiceList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClipboardList, faUserCog, faTools, faSignOutAlt,
    faChevronRight, faChevronDown, faPlusCircle, faMinusCircle,
    faChartBar, faUser, faTimesCircle // faTimesCircle hinzugefügt
} from '@fortawesome/free-solid-svg-icons';
import './AccountDashboard.css';


function AccountDashboard({ currentUser, logOut, onAppointmentAdded, refreshAppointmentsList, onServiceAdded, refreshServicesList }) {
    const initialTab = currentUser?.roles?.includes("ROLE_ADMIN") ? 'adminServices' : 'bookings';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [activeMainMenu, setActiveMainMenu] = useState(currentUser?.roles?.includes("ROLE_ADMIN") ? 'verwaltung' : 'user');


    const [activeAccordion, setActiveAccordion] = useState(null);
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
        const newInitialTab = currentUser?.roles?.includes("ROLE_ADMIN") ? 'adminServices' : 'bookings';
        const newActiveMainMenu = currentUser?.roles?.includes("ROLE_ADMIN") ? 'verwaltung' : 'user';

        setActiveTab(newInitialTab);
        setActiveMainMenu(newActiveMainMenu);

        setActiveAccordion(null);
        setShowServiceForm(false);
    }, [currentUser]);

    const handleServiceAddedCallback = () => {
        if (onServiceAdded) {
            onServiceAdded();
        }
        setShowServiceForm(false);
        setIsSubmittingService(false);
    };

    const toggleAccordion = (itemName) => {
        const newActiveAccordion = activeAccordion === itemName ? null : itemName;
        setActiveAccordion(newActiveAccordion);

        if (itemName !== 'adminServices' && !itemName.startsWith('verwaltung-')) {
            setShowServiceForm(false);
        }
    };

    const handleMainMenuClick = (mainMenuKey) => {
        setActiveMainMenu(mainMenuKey);
        if (mainMenuKey === 'verwaltung' && isAdmin) {
            handleTabClick('adminServices', mainMenuKey);
        } else if (mainMenuKey === 'user') {
            handleTabClick('bookings', mainMenuKey);
        }

        if(isMobileView) {
            toggleAccordion(mainMenuKey);
        }
    };

    const handleTabClick = (tabName, mainMenuKey) => {
        setActiveTab(tabName);
        if (mainMenuKey) { // Nur setzen, wenn explizit übergeben (z.B. von handleMainMenuClick)
            setActiveMainMenu(mainMenuKey);
        } else {
            // Logik um mainMenuKey basierend auf tabName zu finden, falls nötig
            if (['bookings', 'profile'].includes(tabName)) setActiveMainMenu('user');
            if (['adminServices', 'adminAnalytics'].includes(tabName)) setActiveMainMenu('verwaltung');
        }

        if (isMobileView) {
            if (mainMenuKey && activeAccordion !== mainMenuKey) {
                setActiveAccordion(mainMenuKey)
            }
            setMobileNavOpen(false); // Menü nach Klick schließen
        }
        if (tabName !== 'adminServices') {
            setShowServiceForm(false);
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
            case 'adminAnalytics':
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Analysen</h2>
                        <p className="text-center text-gray-600 py-4">Dieser Bereich ist in Entwicklung.</p>
                    </div>
                );
            default:
                if (isAdmin && activeMainMenu === 'verwaltung' && tabName !== 'adminServices' && tabName !== 'adminAnalytics') return renderTabContent('adminServices');
                if (activeMainMenu === 'user' && tabName !== 'bookings' && tabName !== 'profile') return renderTabContent('bookings');
                return <p>Bitte wählen Sie eine Option aus dem Menü.</p>;
        }
    };

    const renderNavItem = (tabName, icon, label, mainMenuKeyForClick) => ( // mainMenuKeyForClick hinzugefügt
        <li key={tabName} className="dashboard-nav-item">
            <button
                onClick={() => handleTabClick(tabName, mainMenuKeyForClick)} // mainMenuKeyForClick verwenden
                className={`dashboard-nav-button ${activeTab === tabName ? 'active' : ''}`}
            >
                <FontAwesomeIcon icon={icon} fixedWidth /> <span>{label}</span>
            </button>
        </li>
    );


    if (!currentUser) {
        return <p>Laden...</p>;
    }

    const DesktopNav = () => (
        <aside className="dashboard-sidebar">
            <nav>
                <ul>
                    <li className="nav-category-title">Mein Bereich</li>
                    {renderNavItem('bookings', faClipboardList, 'Meine Termine', 'user')}
                    {renderNavItem('profile', faUser, 'Meine Daten', 'user')}

                    {isAdmin && (
                        <>
                            <li className="nav-category-title mt-4">Verwaltung</li>
                            {renderNavItem('adminServices', faTools, 'Services', 'verwaltung')}
                            {renderNavItem('adminAnalytics', faChartBar, 'Analysen', 'verwaltung')}
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
        <div className={`mobile-dashboard-nav ${mobileNavOpen ? 'open' : ''}`}>
            <button className="mobile-nav-close-button" onClick={() => setMobileNavOpen(false)}>
                <FontAwesomeIcon icon={faTimesCircle} /> Menü schließen
            </button>
            <nav>
                <ul>
                    <li className="nav-category-title">Mein Bereich</li>
                    {renderNavItem('bookings', faClipboardList, 'Meine Termine', 'user')}
                    {renderNavItem('profile', faUser, 'Meine Daten', 'user')}

                    {isAdmin && (
                        <>
                            <li className="nav-category-title mt-4">Verwaltung</li>
                            {renderNavItem('adminServices', faTools, 'Services', 'verwaltung')}
                            {renderNavItem('adminAnalytics', faChartBar, 'Analysen', 'verwaltung')}
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
                            aria-controls="mobile-dashboard-navigation" // ID für mobile Nav
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