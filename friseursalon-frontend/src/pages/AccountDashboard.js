// src/pages/AccountDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import "./AccountDashboard.css";
import AdminCalendarView from '../components/AdminCalendarView';
import AppointmentList from '../components/AppointmentList';
import ServiceForm from '../components/ServiceForm';
import ServiceList from '../components/ServiceList';
import WorkingHoursManager from '../components/WorkingHoursManager';
import BlockedTimeSlotManager from '../components/BlockedTimeSlotManager';
import AdminDashboardStats from '../components/AdminDashboardStats'; // NEUER IMPORT
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClipboardList, faUserCog, faTools, faSignOutAlt,
    faChevronRight, faChevronDown, faPlusCircle, faMinusCircle,
    faChartBar, faUser, faTimesCircle, faClock, faCalendarTimes,
    faCalendarAlt, faListAlt, faTachometerAlt // NEUE Icons
} from '@fortawesome/free-solid-svg-icons';


function AccountDashboard({
                              currentUser,
                              logOut,
                              onAppointmentAdded,
                              refreshAppointmentsList,
                              onServiceAdded,
                              refreshServicesList
                          }) {
    // Admin startet standardmäßig auf der neuen Übersichtsseite
    const initialAdminTab = 'adminDashboardStats'; // GEÄNDERT
    const initialUserTab = 'bookings';

    const [activeTab, setActiveTab] = useState(
        currentUser?.roles?.includes("ROLE_ADMIN") ? initialAdminTab : initialUserTab
    );

    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 992);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const [showServiceForm, setShowServiceForm] = useState(false);
    const [isSubmittingService, setIsSubmittingService] = useState(false);

    const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes("ROLE_ADMIN");

    const handleAppointmentChangeInCalendarOrList = useCallback(() => {
        if (onAppointmentAdded) {
            onAppointmentAdded();
        }
    }, [onAppointmentAdded]);


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
        if (currentUser) {
            // 'adminAnalytics' wurde zu 'adminDashboardStats' umbenannt/ersetzt
            const adminTabs = ['adminDashboardStats', 'adminCalendar', 'adminAppointmentList', 'adminServices', 'adminWorkingHours', 'adminBlockedSlots', 'profile'];
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
            setActiveTab(initialUserTab);
        }

        if (activeTab !== 'adminServices') {
            setShowServiceForm(false);
        }
    }, [currentUser, isAdmin, activeTab, initialAdminTab, initialUserTab]);


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
            case 'adminDashboardStats': // NEUER TAB
                return isAdmin && (
                    <div className="dashboard-section-content admin-stats-tab-content">
                        <h2 className="dashboard-section-heading">Dashboard Übersicht</h2>
                        <AdminDashboardStats />
                    </div>
                );
            case 'bookings':
                return (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Meine Termine</h2>
                        <AppointmentList
                            refreshTrigger={refreshAppointmentsList}
                            currentUser={currentUser}
                        />
                    </div>
                );
            case 'adminCalendar':
                return isAdmin && (
                    <div className="dashboard-section-content admin-calendar-tab-content">
                        <h2 className="dashboard-section-heading">Terminkalender</h2>
                        <AdminCalendarView
                            currentUser={currentUser}
                            refreshTrigger={refreshAppointmentsList}
                            onAppointmentUpdated={handleAppointmentChangeInCalendarOrList}
                        />
                    </div>
                );
            case 'adminAppointmentList':
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Terminübersicht (Liste)</h2>
                        <AppointmentList
                            refreshTrigger={refreshAppointmentsList}
                            currentUser={currentUser}
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
                        {/* Hier könnte später ein Formular zum Bearbeiten der Profildaten hinzukommen */}
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
            // case 'adminAnalytics': // Alter Analytics-Tab, kann entfernt oder umbenannt werden
            //     return isAdmin && (
            //         <div className="dashboard-section-content">
            //             <h2 className="dashboard-section-heading">Analysen</h2>
            //             <p className="text-center text-gray-600 py-4">Dieser Bereich ist in Entwicklung.</p>
            //         </div>
            //     );
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
                    {!isAdmin && (
                        <>
                            <li className="nav-category-title">Mein Bereich</li>
                            {renderNavItem('bookings', faClipboardList, 'Meine Termine')}
                            {renderNavItem('profile', faUser, 'Meine Daten')}
                        </>
                    )}

                    {isAdmin && (
                        <>
                            {/* NEUER TAB "ÜBERSICHT" GANZ OBEN FÜR ADMINS */}
                            {renderNavItem('adminDashboardStats', faTachometerAlt, 'Übersicht')}

                            <li className="nav-category-title mt-4">Terminplanung</li>
                            {renderNavItem('adminCalendar', faCalendarAlt, 'Kalender')}
                            {renderNavItem('adminAppointmentList', faListAlt, 'Terminliste')}

                            <li className="nav-category-title mt-4">Verwaltung</li>
                            {renderNavItem('adminServices', faTools, 'Services')}
                            {renderNavItem('adminWorkingHours', faClock, 'Arbeitszeiten')}
                            {renderNavItem('adminBlockedSlots', faCalendarTimes, 'Abwesenheiten')}
                            {/* {renderNavItem('adminAnalytics', faChartBar, 'Analysen')} ALT */}


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

    const MobileNav = () => (
        <div className={`mobile-dashboard-nav ${mobileNavOpen ? 'open' : ''}`} id="mobile-dashboard-navigation">
            <button className="mobile-nav-close-button" onClick={() => setMobileNavOpen(false)}>
                <FontAwesomeIcon icon={faTimesCircle} /> Menü schließen
            </button>
            <nav>
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
                            {renderNavItem('adminWorkingHours', faClock, 'Arbeitszeiten')}
                            {renderNavItem('adminBlockedSlots', faCalendarTimes, 'Abwesenheiten')}
                            {/* {renderNavItem('adminAnalytics', faChartBar, 'Analysen')} ALT */}

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