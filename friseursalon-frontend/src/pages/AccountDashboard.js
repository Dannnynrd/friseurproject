// File: src/pages/AccountDashboard.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTachometerAlt, faCalendarAlt, faListAlt, faTools, faUsers, faClock,
    faCalendarTimes, faUserCog, faSignOutAlt, faChevronRight, faBars,
    faPlusCircle, faMinusCircle, faEdit, faCheckCircle, faExclamationCircle,
    faCog, faUser, faClipboardList, faTimes,
    faSpinner,
    faStarHalfAlt // NEU für Testimonials
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
import AdminTestimonialManagement from '../components/AdminTestimonialManagement'; // NEU
import ProfileEditForm from '../components/ProfileEditForm';
import DashboardSettings from '../components/DashboardSettings';

import './AccountDashboard.css';

const TABS = {
    ADMIN_DASHBOARD_STATS: 'adminDashboardStats', ADMIN_CALENDAR: 'adminCalendar',
    ADMIN_APPOINTPOINTMENT_LIST: 'adminAppointmentList', ADMIN_SERVICES: 'adminServices',
    ADMIN_CUSTOMER_MANAGEMENT: 'adminCustomerManagement', ADMIN_WORKING_HOURS: 'adminWorkingHours',
    ADMIN_BLOCKED_SLOTS: 'adminBlockedSlots',
    ADMIN_TESTIMONIALS: 'adminTestimonials', // NEU
    ADMIN_SETTINGS: 'adminSettings',
    PROFILE: 'profile', USER_BOOKINGS: 'userBookings',
};

const NAV_ITEMS_ADMIN = [
    { id: TABS.ADMIN_DASHBOARD_STATS, label: 'Übersicht', icon: faTachometerAlt, category: 'Analyse' },
    { id: TABS.ADMIN_CALENDAR, label: 'Kalender', icon: faCalendarAlt, category: 'Terminplanung' },
    { id: TABS.ADMIN_APPOINTPOINTMENT_LIST, label: 'Terminliste', icon: faListAlt, category: 'Terminplanung' },
    { id: TABS.ADMIN_SERVICES, label: 'Services', icon: faTools, category: 'Verwaltung' },
    { id: TABS.ADMIN_CUSTOMER_MANAGEMENT, label: 'Kunden', icon: faUsers, category: 'Verwaltung' },
    { id: TABS.ADMIN_WORKING_HOURS, label: 'Arbeitszeiten', icon: faClock, category: 'Betrieb' },
    { id: TABS.ADMIN_BLOCKED_SLOTS, label: 'Abwesenheiten', icon: faCalendarTimes, category: 'Betrieb' },
    { id: TABS.ADMIN_TESTIMONIALS, label: 'Bewertungen', icon: faStarHalfAlt, category: 'Kundenfeedback' }, // NEU
    { id: TABS.PROFILE, label: 'Mein Profil', icon: faUserCog, category: 'Konto' },
    { id: TABS.ADMIN_SETTINGS, label: 'Einstellungen', icon: faCog, category: 'Konto' },
];

const NAV_ITEMS_USER = [
    { id: TABS.USER_BOOKINGS, label: 'Meine Termine', icon: faClipboardList, category: 'Mein Bereich' },
    { id: TABS.PROFILE, label: 'Mein Profil', icon: faUser, category: 'Mein Bereich' },
];


function AccountDashboard({
                              currentUser, logOut, onAppointmentAdded, refreshAppointmentsList,
                              onServiceAdded, refreshServicesList, onProfileUpdateSuccess, onProfileUpdateError // onProfileUpdateError hinzugefügt
                          }) {
    const isAdmin = currentUser?.roles?.includes("ROLE_ADMIN");
    const initialTab = isAdmin ? TABS.ADMIN_DASHBOARD_STATS : TABS.USER_BOOKINGS;
    const [activeTab, setActiveTab] = useState(initialTab);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [isSubmittingService, setIsSubmittingService] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileMessages, setProfileMessages] = useState({ error: '', success: '' });

    const mainContentRef = useRef(null);


    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobileView(mobile);
            if (!mobile && mobileNavOpen) setMobileNavOpen(false);
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [mobileNavOpen]);

    useEffect(() => {
        if (activeTab !== TABS.ADMIN_SERVICES) setShowServiceForm(false);
        if (activeTab !== TABS.PROFILE) {
            setIsEditingProfile(false);
            // profileMessages sollten nur hier zurückgesetzt werden, wenn sie nicht von einem Timeout gesteuert werden
            // setProfileMessages({ error: '', success: '' });
        }
        if (mainContentRef.current) {
            mainContentRef.current.scrollTop = 0;
        }
    }, [activeTab]);

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        if (isMobileView) setMobileNavOpen(false);
        // Das Zurücksetzen von isEditingProfile und profileMessages wird nun innerhalb von renderTabContent / useEffect[activeTab] gehandhabt,
        // um Nachrichten bei Profilaktualisierung nicht sofort zu löschen.
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

    // NEU: Hinzugefügt für onProfileUpdateError Prop
    const handleProfileSaveError = (errorMessage) => {
        // Fehlerbehandlung bereits in ProfileEditForm, aber hier für zusätzliche Logik falls nötig
        setProfileMessages({ error: errorMessage, success: '' });
        if (onProfileUpdateError) onProfileUpdateError(errorMessage);
        setTimeout(() => setProfileMessages({ error: '', success: '' }), 5000);
    };


    const handleCancelEditProfile = () => {
        setIsEditingProfile(false);
        setProfileMessages({ error: '', success: '' });
    };

    const renderTabContent = () => {
        const currentNavInfo = (isAdmin ? NAV_ITEMS_ADMIN : NAV_ITEMS_USER).find(item => item.id === activeTab);
        const tabTitle = currentNavInfo?.label || "Dashboard";
        const tabIcon = currentNavInfo?.icon;

        const Card = ({ children, title = tabTitle, icon = tabIcon, extraHeaderContent, cardClassName = '', noPadding = false }) => (
            <div className={`dashboard-content-card ${cardClassName}`}>
                <div className="dashboard-card__header">
                    <h2 className="dashboard-card__title">
                        {icon && <FontAwesomeIcon icon={icon} />}
                        {title}
                    </h2>
                    {extraHeaderContent && <div className="dashboard-card__header-extra">{extraHeaderContent}</div>}
                </div>
                <div className={`dashboard-card__content ${noPadding ? 'no-padding' : ''}`}>
                    {children}
                </div>
            </div>
        );

        switch (activeTab) {
            case TABS.ADMIN_DASHBOARD_STATS:
                return <AdminDashboardStats currentUser={currentUser} onAppointmentAction={onAppointmentAdded} />;

            case TABS.ADMIN_CALENDAR:
                return <Card cardClassName="calendar-card" noPadding><AdminCalendarView currentUser={currentUser} refreshTrigger={refreshAppointmentsList} onAppointmentUpdated={onAppointmentAdded} /></Card>;

            case TABS.ADMIN_APPOINTPOINTMENT_LIST:
                return <Card><AppointmentList refreshTrigger={refreshAppointmentsList} currentUser={currentUser} onAppointmentModified={onAppointmentAdded} /></Card>;

            case TABS.PROFILE:
                return (
                    <Card extraHeaderContent={
                        !isEditingProfile && (
                            <button onClick={() => { setIsEditingProfile(true); setProfileMessages({ error: '', success: '' }); }}
                                    className="button-link-outline small-button">
                                <FontAwesomeIcon icon={faEdit} /> Bearbeiten
                            </button> )}>
                        {profileMessages.success && <p className="form-message success mb-4"><FontAwesomeIcon icon={faCheckCircle} /> {profileMessages.success}</p>}
                        {profileMessages.error && <p className="form-message error mb-4"><FontAwesomeIcon icon={faExclamationCircle} /> {profileMessages.error}</p>}
                        {isEditingProfile ? (
                            <ProfileEditForm
                                currentUser={currentUser}
                                onSaveSuccess={handleProfileSaveSuccess}
                                onCancel={handleCancelEditProfile}
                                onProfileUpdateSuccess={handleProfileSaveSuccess} // Weiterleiten
                                onProfileUpdateError={handleProfileSaveError}   // Weiterleiten
                            />
                        ) : (
                            <div className="profile-info-display">
                                <p><strong>Vorname:</strong> {currentUser?.firstName || '-'}</p>
                                <p><strong>Nachname:</strong> {currentUser?.lastName || '-'}</p>
                                <p><strong>E-Mail:</strong> {currentUser?.email || '-'}</p>
                                <p><strong>Telefon:</strong> {currentUser?.phoneNumber || 'Nicht angegeben'}</p>
                                <p><strong>Rollen:</strong> {currentUser?.roles?.join(', ').replace("ROLE_", "") || '-'}</p>
                            </div>
                        )}
                    </Card>
                );

            case TABS.ADMIN_SERVICES:
                return (
                    <Card extraHeaderContent={
                        <button onClick={() => setShowServiceForm(!showServiceForm)} className="button-link-outline small-button" aria-expanded={showServiceForm}>
                            <FontAwesomeIcon icon={showServiceForm ? faMinusCircle : faPlusCircle} />
                            {showServiceForm ? ' Formular Schließen' : ' Service Hinzufügen'}
                        </button> }>
                        {showServiceForm && (
                            <div className="form-in-card-wrapper">
                                <ServiceForm onServiceAdded={handleServiceAddedCallback} setIsSubmitting={setIsSubmittingService} isSubmitting={isSubmittingService} />
                            </div>
                        )}
                        <ServiceList key={refreshServicesList} currentUser={currentUser} />
                    </Card>
                );

            case TABS.ADMIN_CUSTOMER_MANAGEMENT:
                return <Card><CustomerManagement currentUser={currentUser} refreshTrigger={refreshAppointmentsList} /></Card>;

            case TABS.ADMIN_WORKING_HOURS:
                return <Card><WorkingHoursManager /></Card>;

            case TABS.ADMIN_BLOCKED_SLOTS:
                return <Card><BlockedTimeSlotManager /></Card>;

            case TABS.ADMIN_TESTIMONIALS: // NEUER CASE
                return <Card cardClassName="testimonial-management-card"><AdminTestimonialManagement currentUser={currentUser} /></Card>;

            case TABS.ADMIN_SETTINGS:
                return <DashboardSettings currentUser={currentUser} />;

            case TABS.USER_BOOKINGS:
                return <Card><AppointmentList refreshTrigger={refreshAppointmentsList} currentUser={currentUser} onAppointmentModified={onAppointmentAdded} /></Card>;

            default:
                return <Card title="Willkommen"><p>Wählen Sie eine Option aus dem Menü.</p></Card>;
        }
    };

    const renderNavItems = (items) => {
        const groupedItems = items.reduce((acc, item) => {
            acc[item.category] = [...(acc[item.category] || []), item];
            return acc;
        }, {});

        return Object.entries(groupedItems).map(([category, categoryItems]) => (
            <React.Fragment key={category}>
                <li className="sidebar__nav-category">{category}</li>
                {categoryItems.map(item => (
                    <li key={item.id} className="sidebar__nav-item">
                        <button onClick={() => handleTabClick(item.id)}
                                className={`sidebar__nav-button ${activeTab === item.id ? 'active' : ''}`}
                                aria-current={activeTab === item.id ? 'page' : undefined}>
                            <FontAwesomeIcon icon={item.icon} className="sidebar__nav-icon" />
                            <span>{item.label}</span>
                        </button>
                    </li>
                ))}
            </React.Fragment>
        ));
    };

    const navigationItems = isAdmin ? NAV_ITEMS_ADMIN : NAV_ITEMS_USER;
    const currentActiveNavInfo = navigationItems.find(item => item.id === activeTab);

    const SidebarNav = () => (
        <aside className="dashboard__sidebar">
            <div className="sidebar__header">
                <span className="sidebar__logo-text">Friseur Admin</span>
            </div>
            <nav className="sidebar__nav">
                <ul>{renderNavItems(navigationItems)}</ul>
            </nav>
            <div className="sidebar__footer">
                <button onClick={logOut} className="sidebar__nav-button sidebar__logout-button">
                    <FontAwesomeIcon icon={faSignOutAlt} className="sidebar__nav-icon" />
                    <span>Abmelden</span>
                </button>
            </div>
        </aside>
    );

    const MobileNav = () => (
        <div className={`mobile-nav__overlay ${mobileNavOpen ? 'open' : ''}`} onClick={() => setMobileNavOpen(false)}>
            <aside className={`mobile-nav__sidebar ${mobileNavOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="mobile-nav__header">
                    <span className="sidebar__logo-text">Menü</span>
                    <button className="mobile-nav__close-button" onClick={() => setMobileNavOpen(false)} aria-label="Menü schließen">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <nav className="sidebar__nav">
                    <ul>{renderNavItems(navigationItems)}</ul>
                </nav>
                <div className="sidebar__footer">
                    <button onClick={() => { logOut(); setMobileNavOpen(false); }} className="sidebar__nav-button sidebar__logout-button">
                        <FontAwesomeIcon icon={faSignOutAlt} className="sidebar__nav-icon" />
                        <span>Abmelden</span>
                    </button>
                </div>
            </aside>
        </div>
    );

    if (!currentUser) {
        return <div className="loading-fullscreen"><FontAwesomeIcon icon={faSpinner} spin size="3x" /></div>;
    }

    return (
        <div className={`dashboard-page ${isMobileView && mobileNavOpen ? 'mobile-nav-is-open' : ''}`}>
            {isMobileView && <MobileNav />}
            <div className="dashboard-layout-container">
                {!isMobileView && <SidebarNav />}
                <main className="dashboard-main-content-area" ref={mainContentRef}>
                    <header className="dashboard-content-header-sticky">
                        <div className="dashboard-content-header__left">
                            {isMobileView && (
                                <button className="mobile-menu-trigger" onClick={() => setMobileNavOpen(true)} aria-label="Menü öffnen">
                                    <FontAwesomeIcon icon={faBars} />
                                </button>
                            )}
                            <h1 className="dashboard-content-title">
                                {currentActiveNavInfo?.label || "Mein Account"}
                            </h1>
                        </div>
                        <div className="dashboard-content-header__right">
                            <span className="user-welcome-text">
                                Hallo, {currentUser.firstName || currentUser.email}!
                            </span>
                        </div>
                    </header>
                    <div className="dashboard-active-tab-area">
                        {renderTabContent()}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default AccountDashboard;