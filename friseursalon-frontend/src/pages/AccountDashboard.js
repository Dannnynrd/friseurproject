import React, { useState, useEffect } from 'react';
import AppointmentList from '../components/AppointmentList';
import ServiceForm from '../components/ServiceForm';
import ServiceList from '../components/ServiceList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList, faUser, faTools, faSignOutAlt, faChevronRight, faChevronDown } from '@fortawesome/free-solid-svg-icons';
// './AccountDashboard.css' wird jetzt von App.css gehandhabt

function AccountDashboard({ currentUser, logOut, onAppointmentAdded, refreshAppointmentsList, onServiceAdded, refreshServicesList }) {
    // Setzt den Standard-Tab: Wenn Admin, dann 'adminServices', sonst 'bookings'.
    const initialTab = currentUser?.roles?.includes("ROLE_ADMIN") ? 'adminServices' : 'bookings';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [activeAccordion, setActiveAccordion] = useState(null); // Für mobile Akkordeon-Ansicht
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 992);

    const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes("ROLE_ADMIN");

    // Effekt zum Aktualisieren von isMobileView bei Größenänderung des Fensters
    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 992);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Wenn sich currentUser ändert (z.B. nach Logout/Login), setze den activeTab neu
    useEffect(() => {
        setActiveTab(currentUser?.roles?.includes("ROLE_ADMIN") ? 'adminServices' : 'bookings');
        setActiveAccordion(null); // Akkordeon schließen bei Benutzerwechsel
    }, [currentUser]);


    const toggleAccordion = (tabName) => {
        setActiveAccordion(activeAccordion === tabName ? null : tabName);
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
                        <h2 className="dashboard-section-heading">Dienstleistungen verwalten</h2>
                        <ServiceForm onServiceAdded={onServiceAdded} />
                        <hr className="dashboard-section-hr" />
                        <ServiceList key={refreshServicesList} currentUser={currentUser} />
                    </div>
                );
            default:
                return <p>Bitte wählen Sie eine Option aus dem Menü.</p>; // Fallback
        }
    };

    const renderNavButton = (tabName, icon, label, condition = true) => {
        if (!condition) return null;
        const isActive = activeTab === tabName;
        const isAccordionOpen = activeAccordion === tabName;

        return (
            <li key={tabName} className="dashboard-nav-item">
                <button
                    onClick={() => {
                        setActiveTab(tabName);
                        if (isMobileView) toggleAccordion(tabName);
                    }}
                    className={`dashboard-nav-button ${isActive ? 'active' : ''}`}
                    aria-expanded={isMobileView ? isAccordionOpen : undefined}
                    aria-controls={isMobileView ? `accordion-content-${tabName}` : undefined}
                >
                    <FontAwesomeIcon icon={icon} fixedWidth /> <span>{label}</span>
                    {isMobileView && (
                        <FontAwesomeIcon icon={isAccordionOpen ? faChevronDown : faChevronRight} className="accordion-chevron" />
                    )}
                </button>
                {isMobileView && isAccordionOpen && (
                    <div className="dashboard-accordion-content" id={`accordion-content-${tabName}`} role="region">
                        {renderTabContent(tabName)}
                    </div>
                )}
            </li>
        );
    };

    if (!currentUser) { // Sollte nicht passieren, da durch ProtectedRoute geschützt
        return <p>Laden...</p>;
    }

    return (
        <div className="account-dashboard-container">
            <div className="container">
                <h1 className="dashboard-main-heading">Mein Account</h1>
                <p className="dashboard-welcome-message">
                    Hallo, {currentUser.firstName || currentUser.email}! Hier verwalten Sie Ihre Daten.
                </p>

                <div className="dashboard-layout">
                    <aside className="dashboard-sidebar">
                        <nav>
                            <ul>
                                {renderNavButton('bookings', faClipboardList, 'Meine Termine')}
                                {renderNavButton('profile', faUser, 'Meine Daten')}
                                {renderNavButton('adminServices', faTools, 'Services (Admin)', isAdmin)}
                                <li className="dashboard-nav-item logout-button-container">
                                    <button onClick={logOut} className="dashboard-nav-button logout-button">
                                        <FontAwesomeIcon icon={faSignOutAlt} fixedWidth /> <span>Abmelden</span>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </aside>

                    {!isMobileView && (
                        <section className="dashboard-content" aria-live="polite">
                            {renderTabContent(activeTab)}
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AccountDashboard;
