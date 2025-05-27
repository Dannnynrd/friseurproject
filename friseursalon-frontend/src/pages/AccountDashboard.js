import React, { useState, useEffect } from 'react';
import "./AccountDashboard.css";
import AppointmentList from '../components/AppointmentList';
import ServiceForm from '../components/ServiceForm';
import ServiceList from '../components/ServiceList';
import ReportView from '../components/admin/ReportView'; // Import ReportView
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClipboardList, faUserCog, faTools, faSignOutAlt,
    faChevronRight, faPlusCircle, faMinusCircle, // faChevronDown might not be needed if accordion is removed
    faChartBar, faUser, faTimesCircle, faFileInvoiceDollar // Icon for Reports
} from '@fortawesome/free-solid-svg-icons';


function AccountDashboard({ currentUser, logOut, onAppointmentAdded, refreshAppointmentsList, onServiceAdded, refreshServicesList }) {
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
        const newInitialTab = isAdmin ? 'adminServices' : 'bookings';
        // Only reset activeTab if the user changes role or logs in/out
        // or if the current activeTab is not valid for the new user type
        if ( (isAdmin && (activeTab === 'bookings' || activeTab === 'profile')) || 
             (!isAdmin && (activeTab === 'adminServices' || activeTab === 'adminReports' || activeTab === 'adminAnalytics')) ) {
            setActiveTab(newInitialTab);
        } else if (!['bookings', 'profile', 'adminServices', 'adminReports', 'adminAnalytics'].includes(activeTab)) {
            // If current activeTab is somehow invalid, reset to default
            setActiveTab(newInitialTab);
        }

        // If not admin and current tab is an admin tab, switch to 'bookings'
        if (!isAdmin && (activeTab === 'adminServices' || activeTab === 'adminReports' || activeTab === 'adminAnalytics')) {
             setActiveTab('bookings');
        }


        setShowServiceForm(false); // Always hide form on user change
    }, [currentUser, isAdmin, activeTab]); // Added activeTab to dependencies for more robust logic

    const handleServiceAddedCallback = () => {
        if (onServiceAdded) {
            onServiceAdded();
        }
        setShowServiceForm(false);
        setIsSubmittingService(false);
    };

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        if (tabName !== 'adminServices') { 
            setShowServiceForm(false);
        }
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
            case 'adminReports': // New case for Reports
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Berichte</h2>
                        <ReportView currentUser={currentUser} />
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
                if (isAdmin) return renderTabContent('adminServices'); // Default for admin
                return renderTabContent('bookings'); // Default for user
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
        return <p className="loading-message text-center p-4">Laden...</p>; 
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
                            {renderNavItem('adminReports', faFileInvoiceDollar, 'Berichte')} 
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
                            {renderNavItem('adminReports', faFileInvoiceDollar, 'Berichte')}
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