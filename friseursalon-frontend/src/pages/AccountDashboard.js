import React, { useState, useEffect } from 'react';
import AppointmentList from '../components/AppointmentList';
import ServiceForm from '../components/ServiceForm';
import ServiceList from '../components/ServiceList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClipboardList, faUser, faTools, faSignOutAlt,
    faChevronRight, faChevronDown, faPlusCircle, faMinusCircle,
    faSpinner // Hinzugefügt für den Fall, dass wir es hier direkt brauchen
} from '@fortawesome/free-solid-svg-icons';

function AccountDashboard({ currentUser, logOut, onAppointmentAdded, refreshAppointmentsList, onServiceAdded, refreshServicesList }) {
    const initialTab = currentUser?.roles?.includes("ROLE_ADMIN") ? 'adminServices' : 'bookings';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [activeAccordion, setActiveAccordion] = useState(null);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 992);

    const [showServiceForm, setShowServiceForm] = useState(false);
    const [isSubmittingService, setIsSubmittingService] = useState(false); // Für Ladezustand ServiceForm

    const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes("ROLE_ADMIN");

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 992);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setActiveTab(currentUser?.roles?.includes("ROLE_ADMIN") ? 'adminServices' : 'bookings');
        setActiveAccordion(null);
        setShowServiceForm(false);
    }, [currentUser]);

    const handleServiceAddedCallback = () => {
        if (onServiceAdded) {
            onServiceAdded();
        }
        setShowServiceForm(false);
        setIsSubmittingService(false); // Ladezustand zurücksetzen
    };

    const toggleAccordion = (tabName) => {
        const newActiveAccordion = activeAccordion === tabName ? null : tabName;
        setActiveAccordion(newActiveAccordion);
        // Wenn ein *anderes* Akkordeon geöffnet wird oder das aktuelle geschlossen, Formular im Services-Tab schließen
        if (tabName !== 'adminServices' || newActiveAccordion !== 'adminServices') {
            setShowServiceForm(false);
        }
    };

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        if (isMobileView) {
            // Logik für Akkordeon-Öffnen/Schließen ist schon in toggleAccordion
            if (activeAccordion !== tabName) {
                toggleAccordion(tabName);
            }
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
                                    setIsSubmitting={setIsSubmittingService} // Um Ladezustand vom Formular zu steuern
                                    isSubmitting={isSubmittingService}
                                />
                            </div>
                        )}
                        <hr className="dashboard-section-hr" />
                        <ServiceList key={refreshServicesList} currentUser={currentUser} />
                    </div>
                );
            default:
                return <p>Bitte wählen Sie eine Option aus dem Menü.</p>;
        }
    };

    const renderNavButton = (tabName, icon, label, condition = true) => {
        if (!condition) return null;
        const isActive = activeTab === tabName;
        const isAccordionOpen = activeAccordion === tabName;

        return (
            <li key={tabName} className="dashboard-nav-item">
                <button
                    onClick={() => handleTabClick(tabName)}
                    className={`dashboard-nav-button ${isActive && !isMobileView ? 'active' : ''} ${isMobileView && isAccordionOpen ? 'active-accordion-header' : ''}`}
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

    if (!currentUser) {
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