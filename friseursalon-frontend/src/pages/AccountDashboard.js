// File: friseursalon-frontend/src/pages/AccountDashboard.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTachometerAlt, faCalendarAlt, faListAlt, faTools, faUsers, faClock,
    faCalendarTimes, faUserCog, faSignOutAlt, faChevronRight, faChevronDown,
    faPlusCircle, faMinusCircle, faEdit, faCheckCircle, faExclamationCircle,
    faCog, // For new Settings tab
    faUser, // For non-admin profile
    faClipboardList, // For user bookings
    faTimesCircle, // ADDED: For mobile nav close button
    faSpinner // ADDED: For loading states
} from '@fortawesome/free-solid-svg-icons';

// Import der Kindkomponenten
import AdminDashboardStats from '../components/AdminDashboardStats';
import AdminCalendarView from '../components/AdminCalendarView';
import AppointmentList from '../components/AppointmentList';
import ServiceList from '../components/ServiceList';
import ServiceForm from '../components/ServiceForm';
import CustomerManagement from '../components/CustomerManagement';
import WorkingHoursManager from '../components/WorkingHoursManager';
import BlockedTimeSlotManager from '../components/BlockedTimeSlotManager';
import ProfileEditForm from '../components/ProfileEditForm';
import DashboardSettings from '../components/DashboardSettings';

import './AccountDashboard.css';

// Definition der Tabs für bessere Struktur und Lesbarkeit
const TABS = {
    // Admin Tabs
    ADMIN_DASHBOARD_STATS: 'adminDashboardStats',
    ADMIN_CALENDAR: 'adminCalendar',
    ADMIN_APPOINTMENT_LIST: 'adminAppointmentList',
    ADMIN_SERVICES: 'adminServices',
    ADMIN_CUSTOMER_MANAGEMENT: 'adminCustomerManagement',
    ADMIN_WORKING_HOURS: 'adminWorkingHours',
    ADMIN_BLOCKED_SLOTS: 'adminBlockedSlots',
    ADMIN_SETTINGS: 'adminSettings',

    // Gemeinsame Tabs
    PROFILE: 'profile',

    // User Tabs
    USER_BOOKINGS: 'userBookings',
};

const NAV_ITEMS_ADMIN = [
    { id: TABS.ADMIN_DASHBOARD_STATS, label: 'Übersicht', icon: faTachometerAlt, category: 'Hauptmenü' },
    { id: TABS.ADMIN_CALENDAR, label: 'Kalender', icon: faCalendarAlt, category: 'Terminplanung' },
    { id: TABS.ADMIN_APPOINTMENT_LIST, label: 'Terminliste', icon: faListAlt, category: 'Terminplanung' },
    { id: TABS.ADMIN_SERVICES, label: 'Services', icon: faTools, category: 'Verwaltung' },
    { id: TABS.ADMIN_CUSTOMER_MANAGEMENT, label: 'Kunden', icon: faUsers, category: 'Verwaltung' },
    { id: TABS.ADMIN_WORKING_HOURS, label: 'Arbeitszeiten', icon: faClock, category: 'Verwaltung' },
    { id: TABS.ADMIN_BLOCKED_SLOTS, label: 'Abwesenheiten', icon: faCalendarTimes, category: 'Verwaltung' },
    { id: TABS.ADMIN_SETTINGS, label: 'Einstellungen', icon: faCog, category: 'System' },
    { id: TABS.PROFILE, label: 'Mein Profil', icon: faUserCog, category: 'System' },
];

const NAV_ITEMS_USER = [
    { id: TABS.USER_BOOKINGS, label: 'Meine Termine', icon: faClipboardList, category: 'Mein Bereich' },
    { id: TABS.PROFILE, label: 'Mein Profil', icon: faUser, category: 'Mein Bereich' },
];


function AccountDashboard({
                              currentUser,
                              logOut,
                              onAppointmentAdded,
                              refreshAppointmentsList,
                              onServiceAdded,
                              refreshServicesList,
                              onProfileUpdateSuccess
                          }) {
    const isAdmin = currentUser?.roles?.includes("ROLE_ADMIN");
    const initialTab = isAdmin ? TABS.ADMIN_DASHBOARD_STATS : TABS.USER_BOOKINGS;
    const [activeTab, setActiveTab] = useState(initialTab);

    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [isSubmittingService, setIsSubmittingService] = useState(false);
    const [showServiceForm, setShowServiceForm] = useState(false);

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileMessages, setProfileMessages] = useState({ error: '', success: '' });

    const headerRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobileView(mobile);
            if (!mobile && mobileNavOpen) {
                setMobileNavOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [mobileNavOpen]);

    useEffect(() => {
        if (activeTab !== TABS.ADMIN_SERVICES) setShowServiceForm(false);
        if (activeTab !== TABS.PROFILE) {
            setIsEditingProfile(false);
            setProfileMessages({ error: '', success: '' });
        }
    }, [activeTab]);

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        if (isMobileView) setMobileNavOpen(false);
        setIsEditingProfile(false);
        setProfileMessages({ error: '', success: '' });
    };

    const handleServiceAddedCallback = () => {
        if (onServiceAdded) onServiceAdded();
        setShowServiceForm(false);
        setIsSubmittingService(false);
    };

    const handleProfileSaveSuccess = (updatedPartialUser) => {
        setIsEditingProfile(false);
        setProfileMessages({ success: 'Ihre Daten wurden erfolgreich aktualisiert.', error: '' });
        if (onProfileUpdateSuccess) onProfileUpdateSuccess(updatedPartialUser);
        setTimeout(() => setProfileMessages({ error: '', success: '' }), 4000);
    };

    const handleCancelEditProfile = () => {
        setIsEditingProfile(false);
        setProfileMessages({ error: '', success: '' });
    };

    const renderTabContent = () => {
        const CardWrapper = ({ title, children, icon, extraHeaderContent, cardClassName = '' }) => (
            <div className={`dashboard-card ${cardClassName}`}>
                <div className="dashboard-card-header">
                    <h2 className="dashboard-card-title">
                        {icon && <FontAwesomeIcon icon={icon} className="mr-2 text-gray-500" />}
                        {title}
                    </h2>
                    {extraHeaderContent && <div className="dashboard-card-header-extra">{extraHeaderContent}</div>}
                </div>
                <div className="dashboard-card-content">
                    {children}
                </div>
            </div>
        );

        switch (activeTab) {
            case TABS.ADMIN_DASHBOARD_STATS:
                return <AdminDashboardStats currentUser={currentUser} onAppointmentAction={onAppointmentAdded} />;

            case TABS.ADMIN_CALENDAR:
                return <CardWrapper title="Terminkalender" icon={faCalendarAlt} cardClassName="calendar-card-full-height"><AdminCalendarView currentUser={currentUser} refreshTrigger={refreshAppointmentsList} onAppointmentUpdated={onAppointmentAdded} /></CardWrapper>;

            case TABS.ADMIN_APPOINTMENT_LIST:
                return <CardWrapper title="Terminübersicht" icon={faListAlt}><AppointmentList refreshTrigger={refreshAppointmentsList} currentUser={currentUser} /></CardWrapper>;

            case TABS.PROFILE:
                return (
                    <CardWrapper
                        title="Mein Profil"
                        icon={isAdmin ? faUserCog : faUser}
                        extraHeaderContent={
                            !isEditingProfile && (
                                <button
                                    onClick={() => { setIsEditingProfile(true); setProfileMessages({ error: '', success: '' }); }}
                                    className="button-link-outline small-button"
                                >
                                    <FontAwesomeIcon icon={faEdit} /> Bearbeiten
                                </button>
                            )
                        }
                    >
                        {profileMessages.success && <p className="form-message success mb-4"><FontAwesomeIcon icon={faCheckCircle} /> {profileMessages.success}</p>}
                        {profileMessages.error && <p className="form-message error mb-4"><FontAwesomeIcon icon={faExclamationCircle} /> {profileMessages.error}</p>}

                        {isEditingProfile ? (
                            <ProfileEditForm
                                currentUser={currentUser}
                                onSaveSuccess={handleProfileSaveSuccess}
                                onCancel={handleCancelEditProfile}
                            />
                        ) : (
                            <div className="dashboard-profile-info-display">
                                <p><strong>Vorname:</strong> {currentUser?.firstName || '-'}</p>
                                <p><strong>Nachname:</strong> {currentUser?.lastName || '-'}</p>
                                <p><strong>E-Mail:</strong> {currentUser?.email || '-'}</p>
                                <p><strong>Telefon:</strong> {currentUser?.phoneNumber || 'Nicht angegeben'}</p>
                                <p><strong>Rollen:</strong> {currentUser?.roles?.join(', ') || '-'}</p>
                            </div>
                        )}
                    </CardWrapper>
                );

            case TABS.ADMIN_SERVICES:
                return (
                    <CardWrapper
                        title="Dienstleistungen Verwalten"
                        icon={faTools}
                        extraHeaderContent={
                            <button
                                onClick={() => setShowServiceForm(!showServiceForm)}
                                className="button-link-outline small-button"
                                aria-expanded={showServiceForm}
                            >
                                <FontAwesomeIcon icon={showServiceForm ? faMinusCircle : faPlusCircle} />
                                {showServiceForm ? ' Formular schließen' : ' Neuer Service'}
                            </button>
                        }
                    >
                        {showServiceForm && (
                            <div className="service-form-wrapper-collapsible">
                                <ServiceForm
                                    onServiceAdded={handleServiceAddedCallback}
                                    setIsSubmitting={setIsSubmittingService}
                                    isSubmitting={isSubmittingService}
                                />
                            </div>
                        )}
                        <ServiceList key={refreshServicesList} currentUser={currentUser} />
                    </CardWrapper>
                );

            case TABS.ADMIN_CUSTOMER_MANAGEMENT:
                return <CardWrapper title="Kundenverwaltung" icon={faUsers}><CustomerManagement currentUser={currentUser} refreshTrigger={refreshAppointmentsList} /></CardWrapper>;

            case TABS.ADMIN_WORKING_HOURS:
                return <CardWrapper title="Arbeitszeiten Verwalten" icon={faClock}><WorkingHoursManager /></CardWrapper>;

            case TABS.ADMIN_BLOCKED_SLOTS:
                return <CardWrapper title="Abwesenheiten & Pausen" icon={faCalendarTimes}><BlockedTimeSlotManager /></CardWrapper>;

            case TABS.ADMIN_SETTINGS:
                return <DashboardSettings currentUser={currentUser} />;

            case TABS.USER_BOOKINGS:
                return <CardWrapper title="Meine Termine" icon={faClipboardList}><AppointmentList refreshTrigger={refreshAppointmentsList} currentUser={currentUser} /></CardWrapper>;

            default:
                return <CardWrapper title="Willkommen"><p>Bitte wählen Sie einen Bereich aus dem Menü.</p></CardWrapper>;
        }
    };

    const renderNavItems = (items) => {
        const groupedItems = items.reduce((acc, item) => {
            acc[item.category] = [...(acc[item.category] || []), item];
            return acc;
        }, {});

        return Object.entries(groupedItems).map(([category, categoryItems]) => (
            <React.Fragment key={category}>
                <li className="nav-category-title">{category}</li>
                {categoryItems.map(item => (
                    <li key={item.id} className="dashboard-nav-item">
                        <button
                            onClick={() => handleTabClick(item.id)}
                            className={`dashboard-nav-button ${activeTab === item.id ? 'active' : ''}`}
                            aria-current={activeTab === item.id ? 'page' : undefined}
                        >
                            <FontAwesomeIcon icon={item.icon} className="nav-icon" />
                            <span>{item.label}</span>
                        </button>
                    </li>
                ))}
            </React.Fragment>
        ));
    };

    const navigationItems = isAdmin ? NAV_ITEMS_ADMIN : NAV_ITEMS_USER;

    const SidebarNav = () => (
        <aside className="dashboard-sidebar">
            <div className="dashboard-sidebar-header">
                <span className="text-xl font-semibold text-gray-700">Salon Management</span>
            </div>
            <nav className="dashboard-sidebar-nav">
                <ul>
                    {renderNavItems(navigationItems)}
                    <li className="dashboard-nav-item logout-item-separator"></li>
                    <li className="dashboard-nav-item">
                        <button onClick={logOut} className="dashboard-nav-button logout-button">
                            <FontAwesomeIcon icon={faSignOutAlt} className="nav-icon" />
                            <span>Abmelden</span>
                        </button>
                    </li>
                </ul>
            </nav>
        </aside>
    );

    const MobileNav = () => (
        <div className={`mobile-dashboard-nav-overlay ${mobileNavOpen ? 'open' : ''}`} onClick={() => setMobileNavOpen(false)}>
            <div className={`mobile-dashboard-nav ${mobileNavOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="mobile-nav-header">
                    <span className="text-lg font-semibold">Menü</span>
                    <button className="mobile-nav-close-button" onClick={() => setMobileNavOpen(false)} aria-label="Menü schließen">
                        <FontAwesomeIcon icon={faTimesCircle} /> {/* Corrected: faTimesCircle is now imported */}
                    </button>
                </div>
                <nav>
                    <ul>
                        {renderNavItems(navigationItems)}
                        <li className="dashboard-nav-item logout-item-separator"></li>
                        <li className="dashboard-nav-item">
                            <button onClick={() => { logOut(); setMobileNavOpen(false); }} className="dashboard-nav-button logout-button">
                                <FontAwesomeIcon icon={faSignOutAlt} className="nav-icon" />
                                <span>Abmelden</span>
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );

    if (!currentUser) {
        return <div className="flex items-center justify-center h-screen"><FontAwesomeIcon icon={faSpinner} spin size="3x" /></div>; {/* Corrected: faSpinner is now imported */}
    }

    return (
        <div className="account-dashboard-page bg-gray-100 min-h-screen">
            {isMobileView && <MobileNav />}
            <div className="dashboard-container-flex">
                {!isMobileView && <SidebarNav />}
                <main className="dashboard-main-content">
                    <div className="dashboard-content-header" ref={headerRef}>
                        {isMobileView && (
                            <button
                                className="mobile-menu-toggle-main"
                                onClick={() => setMobileNavOpen(true)}
                                aria-label="Menü öffnen"
                            >
                                <FontAwesomeIcon icon={faChevronRight} />
                            </button>
                        )}
                        <h1 className="dashboard-main-title">
                            {navigationItems.find(item => item.id === activeTab)?.label || "Mein Account"}
                        </h1>
                        <div className="user-greeting">
                            Hallo, {currentUser.firstName || currentUser.email}!
                        </div>
                    </div>
                    <div className="dashboard-active-tab-content">
                        {renderTabContent()}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default AccountDashboard;
