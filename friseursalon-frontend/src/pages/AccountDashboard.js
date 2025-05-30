// File: friseursalon-frontend/src/pages/AccountDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import "./AccountDashboard.css";
import AdminCalendarView from '../components/AdminCalendarView';
import AppointmentList from '../components/AppointmentList';
import ServiceForm from '../components/ServiceForm';
import ServiceList from '../components/ServiceList';
import WorkingHoursManager from '../components/WorkingHoursManager';
import BlockedTimeSlotManager from '../components/BlockedTimeSlotManager';
import AdminDashboardStats from '../components/AdminDashboardStats';
import AppointmentEditModal from '../components/AppointmentEditModal';
import CustomerManagement from '../components/CustomerManagement';
import ProfileEditForm from '../components/ProfileEditForm'; // NEW IMPORT
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClipboardList, faUserCog, faTools, faSignOutAlt,
    faChevronRight, faChevronDown, faPlusCircle, faMinusCircle,
    faChartBar, faUser, faTimesCircle, faClock, faCalendarTimes,
    faCalendarAlt, faListAlt, faTachometerAlt,
    faUsers, faEdit, faCheckCircle, faExclamationCircle // Added faEdit, faCheckCircle, faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';


function AccountDashboard({
                              currentUser,
                              logOut,
                              onAppointmentAdded,
                              refreshAppointmentsList,
                              onServiceAdded,
                              refreshServicesList,
                              onProfileUpdateSuccess // NEW PROP
                          }) {

    const initialAdminTab = 'adminDashboardStats';
    const initialUserTab = 'bookings';

    const [activeTab, setActiveTab] = useState(
        currentUser?.roles?.includes("ROLE_ADMIN") ? initialAdminTab : initialUserTab
    );

    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 992);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [isSubmittingService, setIsSubmittingService] = useState(false);
    const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes("ROLE_ADMIN");
    const [selectedAppointmentForEditFromStats, setSelectedAppointmentForEditFromStats] = useState(null);

    // NEW STATES for profile editing
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileMessages, setProfileMessages] = useState({ error: '', success: '' });


    const handleAppointmentAction = useCallback(() => {
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
            setActiveTab(initialUserTab);
        }

        if (activeTab !== 'adminServices') {
            setShowServiceForm(false);
        }
        if (activeTab !== 'profile') { // Reset edit mode if navigating away from profile
            setIsEditingProfile(false);
            setProfileMessages({ error: '', success: '' });
        }
        setSelectedAppointmentForEditFromStats(null);
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

    const handleCloseAppointmentEditModalFromStats = () => {
        setSelectedAppointmentForEditFromStats(null);
    };

    const handleAppointmentUpdatedFromStatsModal = () => {
        handleCloseAppointmentEditModalFromStats();
        if (onAppointmentAdded) {
            onAppointmentAdded();
        }
    };

    // NEW: Callback for successful profile update
    const handleProfileSaveSuccess = (updatedPartialUser) => {
        setIsEditingProfile(false);
        setProfileMessages({ success: 'Ihre Daten wurden erfolgreich aktualisiert.', error: '' });
        if (onProfileUpdateSuccess) {
            onProfileUpdateSuccess(updatedPartialUser); // Pass data up to App.js
        }
        setTimeout(() => setProfileMessages({ error: '', success: '' }), 4000);
    };

    // NEW: Callback to cancel profile editing
    const handleCancelEditProfile = () => {
        setIsEditingProfile(false);
        setProfileMessages({ error: '', success: '' }); // Clear any lingering messages
    };

    const renderTabContent = (tabName) => {
        switch (tabName) {
            case 'adminDashboardStats':
                return isAdmin && (
                    <div className="dashboard-section-content admin-stats-tab-content">
                        <AdminDashboardStats
                            currentUser={currentUser}
                            onAppointmentAction={handleAppointmentAction}
                        />
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
                            onAppointmentUpdated={handleAppointmentAction}
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
            case 'profile': // MODIFIED "Meine Daten" (Profile) Tab
                return (
                    <div className="dashboard-section-content profile-tab-content">
                        <div className="profile-header-controls">
                            <h2 className="dashboard-section-heading">Meine Daten</h2>
                            {!isEditingProfile && (
                                <button
                                    onClick={() => { setIsEditingProfile(true); setProfileMessages({ error: '', success: '' }); }}
                                    className="button-link-outline small-button edit-profile-button"
                                >
                                    <FontAwesomeIcon icon={faEdit} /> Bearbeiten
                                </button>
                            )}
                        </div>

                        {profileMessages.success &&
                            <p className="form-message success mb-4"><FontAwesomeIcon icon={faCheckCircle} /> {profileMessages.success}</p>}
                        {profileMessages.error &&
                            <p className="form-message error mb-4"><FontAwesomeIcon icon={faExclamationCircle} /> {profileMessages.error}</p>}

                        {isEditingProfile ? (
                            <ProfileEditForm
                                currentUser={currentUser}
                                onSaveSuccess={handleProfileSaveSuccess}
                                onCancel={handleCancelEditProfile}
                            />
                        ) : (
                            <div className="dashboard-profile-info">
                                <p><strong>Vorname:</strong> {currentUser?.firstName || '-'}</p>
                                <p><strong>Nachname:</strong> {currentUser?.lastName || '-'}</p>
                                <p><strong>E-Mail:</strong> {currentUser?.email || '-'}</p>
                                <p><strong>Telefon:</strong> {currentUser?.phoneNumber || 'Nicht angegeben'}</p>
                                <p><strong>Rollen:</strong> {currentUser?.roles?.join(', ') || '-'}</p>
                            </div>
                        )}
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
            case 'adminCustomerManagement':
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <CustomerManagement currentUser={currentUser} refreshTrigger={refreshAppointmentsList} />
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
                            {renderNavItem('profile', faUserCog, 'Meine Daten')}
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
                            {renderNavItem('adminCustomerManagement', faUsers, 'Kunden')}
                            {renderNavItem('adminWorkingHours', faClock, 'Arbeitszeiten')}
                            {renderNavItem('adminBlockedSlots', faCalendarTimes, 'Abwesenheiten')}
                            <li className="nav-category-title mt-4">Mein Account (Admin)</li>
                            {renderNavItem('profile', faUserCog, 'Meine Daten')}
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
