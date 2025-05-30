// friseursalon-frontend/src/pages/AccountDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import AuthService from '../services/auth.service';
import styles from './AccountDashboard.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarAlt, faUserEdit, faCog, faChartBar, faListAlt,
    faUsers, faCut, faClock, faGift, faSignOutAlt, faBars, faTimes,
    faThLarge, faBuilding // Salon-Icon
} from '@fortawesome/free-solid-svg-icons';

// Import der Unterkomponenten (Pfade ggf. anpassen)
import AppointmentList from '../components/AppointmentList';
import ProfileEditForm from '../components/ProfileEditForm';
import AdminDashboardStats from '../components/AdminDashboardStats';
import CustomerManagement from '../components/CustomerManagement';
import ServiceList from '../components/ServiceList';
import WorkingHoursManager from '../components/WorkingHoursManager';
import BlockedTimeSlotManager from '../components/BlockedTimeSlotManager';
import AdminTestimonialManagement from '../components/AdminTestimonialManagement';
import DashboardSettings from '../components/DashboardSettings';
import AdminCalendarView from '../components/AdminCalendarView';

function AccountDashboard({ currentUser, logOut, onAppointmentAdded, refreshAppointmentsList, onServiceAdded, refreshServicesList, onProfileUpdateSuccess, onProfileUpdateError }) {
    const navigate = useNavigate();
    const location = useLocation();

    const getActiveTabFromQuery = () => {
        const queryParams = new URLSearchParams(location.search);
        return queryParams.get('tab') || (currentUser?.roles?.includes('ROLE_ADMIN') ? 'admin-dashboard' : 'appointments');
    };

    const [activeTab, setActiveTab] = useState(getActiveTabFromQuery());
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes('ROLE_ADMIN');

    useEffect(() => {
        setActiveTab(getActiveTabFromQuery());
    }, [location.search, currentUser]);

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        setIsMobileNavOpen(false);
        navigate(`${location.pathname}?tab=${tabName}`, { replace: true });
    };

    const toggleMobileNav = () => setIsMobileNavOpen(!isMobileNavOpen);

    const userTabs = [
        { name: 'appointments', label: 'Meine Termine', icon: faCalendarAlt, component: <AppointmentList key={`user-${refreshAppointmentsList}`} /> },
        { name: 'profile', label: 'Profil bearbeiten', icon: faUserEdit, component: <ProfileEditForm user={currentUser} onProfileUpdateSuccess={onProfileUpdateSuccess} onProfileUpdateError={onProfileUpdateError} /> },
    ];

    const adminTabs = [
        { name: 'admin-dashboard', label: 'Übersicht', icon: faThLarge, component: <AdminDashboardStats /> },
        { name: 'admin-calendar', label: 'Kalender', icon: faCalendarAlt, component: <AdminCalendarView /> },
        { name: 'admin-appointments', label: 'Terminverwaltung', icon: faListAlt, component: <AppointmentList key={`admin-${refreshAppointmentsList}`} adminView={true} /> },
        { name: 'admin-customers', label: 'Kundenverwaltung', icon: faUsers, component: <CustomerManagement /> },
        { name: 'admin-services', label: 'Dienstleistungen', icon: faCut, component: <ServiceList onServiceAdded={onServiceAdded} refreshServicesList={refreshServicesList} /> },
        { name: 'admin-working-hours', label: 'Öffnungszeiten', icon: faClock, component: <WorkingHoursManager /> },
        { name: 'admin-blocked-slots', label: 'Sperrzeiten', icon: faGift, component: <BlockedTimeSlotManager /> },
        { name: 'admin-testimonials', label: 'Bewertungen', icon: faChartBar, component: <AdminTestimonialManagement /> },
        { name: 'admin-settings', label: 'Salon Einstellungen', icon: faCog, component: <DashboardSettings /> },
    ];

    const getTabContent = () => {
        const allTabs = isAdmin ? [...userTabs, ...adminTabs] : userTabs;
        const currentTabConfig = allTabs.find(tab => tab.name === activeTab);
        if (!currentTabConfig) {
            if (isAdmin) return <AdminDashboardStats />;
            return <AppointmentList key={`user-fallback-${refreshAppointmentsList}`} />;
        }
        return React.cloneElement(currentTabConfig.component, { key: activeTab });
    };

    const renderNavLinks = (tabs, isMobile = false) => {
        return tabs.map(tab => (
            <button
                key={tab.name}
                onClick={() => handleTabChange(tab.name)}
                className={`w-full flex items-center px-4 py-2.5 text-sm rounded-md transition-all duration-200 ease-in-out group
                    ${activeTab === tab.name
                    ? `bg-slate-100 text-indigo-700 font-medium ${styles.navItemActive}` // Heller Hintergrund, Akzentfarbe Text
                    : `text-gray-700 hover:bg-slate-50 hover:text-indigo-700 ${styles.navItem}`}
                    ${isMobile ? 'text-left' : 'justify-start'}`}
                aria-current={activeTab === tab.name ? 'page' : undefined}
            >
                <FontAwesomeIcon
                    icon={tab.icon}
                    className={`mr-3 h-5 w-5 flex-shrink-0 
                        ${activeTab === tab.name ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-600'}`}
                />
                {tab.label}
            </button>
        ));
    };

    if (!currentUser) {
        return <p className="p-8 text-center text-gray-600">Bitte melden Sie sich an, um Ihr Dashboard anzuzeigen.</p>;
    }

    return (
        <div className={`min-h-screen bg-slate-100 ${styles.accountDashboardContainer}`}>
            {/* Mobile Navigations-Toggle Bar */}
            <div className="md:hidden bg-white shadow-sm fixed top-0 left-0 right-0 z-40 pt-safe-top">
                <div className="container mx-auto px-4 h-16 flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-800">
                        { (isAdmin ? [...userTabs, ...adminTabs] : userTabs).find(t => t.name === activeTab)?.label || "Menü" }
                    </span>
                    <button
                        onClick={toggleMobileNav}
                        className="p-2 rounded-md text-gray-500 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        aria-controls="dashboard-mobile-nav"
                        aria-expanded={isMobileNavOpen}
                    >
                        <span className="sr-only">{isMobileNavOpen ? 'Navigation schließen' : 'Navigation öffnen'}</span>
                        <FontAwesomeIcon icon={isMobileNavOpen ? faTimes : faBars} className="h-6 w-6" />
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row">
                {/* Seitenleiste (Desktop) */}
                <aside className={`hidden md:flex md:flex-col md:w-64 lg:w-72 bg-white fixed md:sticky top-0 left-0 md:!h-screen shadow-lg md:shadow-none md:border-r border-gray-200 z-30 ${styles.dashboardSidebar}`}>
                    <div className="flex items-center justify-center h-16 md:h-20 border-b border-gray-200 px-4">
                        <Link to="/" className="flex items-center space-x-2 group">
                            <FontAwesomeIcon icon={faBuilding} className="h-7 w-7 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
                            <span className="text-xl font-bold text-gray-800 font-serif group-hover:text-indigo-700 transition-colors">Salon Dashboard</span>
                        </Link>
                    </div>
                    <nav className="flex-grow p-3 space-y-1 overflow-y-auto"> {/* Kleineres Padding und Space */}
                        <span className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Konto</span>
                        {renderNavLinks(userTabs)}

                        {isAdmin && (
                            <>
                                <div className="pt-3 mt-2">
                                    <span className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin Bereich</span>
                                </div>
                                <div className="mt-1 space-y-1"> {/* Kleineres Padding und Space */}
                                    {renderNavLinks(adminTabs)}
                                </div>
                            </>
                        )}
                        <div className="mt-auto pt-3 pb-2 px-1"> {/* Logout-Button am Ende der Sidebar, mit weniger Padding */}
                            <button
                                onClick={logOut}
                                className={`w-full flex items-center px-4 py-2.5 text-sm rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 group ${styles.navItem} ${styles.logoutButton}`}
                            >
                                <FontAwesomeIcon icon={faSignOutAlt} className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500" />
                                Ausloggen
                            </button>
                        </div>
                    </nav>
                </aside>

                {/* Mobile Navigation (Overlay) */}
                {isMobileNavOpen && (
                    <div
                        className={`fixed inset-0 z-40 bg-black bg-opacity-40 backdrop-blur-sm md:hidden ${styles.mobileNavOverlay}`}
                        onClick={toggleMobileNav}
                    ></div>
                )}
                <aside className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 transform transition-transform ease-in-out duration-300 md:hidden pt-safe-top
                                 ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'} ${styles.mobileDashboardNav}`}>
                    <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                        <span className="text-lg font-semibold text-gray-800">Menü</span>
                        <button onClick={toggleMobileNav} className="p-2 text-gray-600 hover:text-indigo-600">
                            <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
                        </button>
                    </div>
                    <nav className="flex-grow p-3 space-y-1 overflow-y-auto">
                        <span className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Konto</span>
                        {renderNavLinks(userTabs, true)}
                        {isAdmin && (
                            <>
                                <div className="pt-3 mt-2">
                                    <span className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin Bereich</span>
                                </div>
                                <div className="mt-1 space-y-1">
                                    {renderNavLinks(adminTabs, true)}
                                </div>
                            </>
                        )}
                        <div className="mt-auto pt-3 pb-2 px-1">
                            <button
                                onClick={logOut}
                                className={`w-full flex items-center px-4 py-2.5 text-sm rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 group ${styles.navItem} ${styles.logoutButton}`}
                            >
                                <FontAwesomeIcon icon={faSignOutAlt} className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500" />
                                Ausloggen
                            </button>
                        </div>
                    </nav>
                </aside>


                {/* Inhaltsbereich */}
                <main className={`flex-1 p-6 md:p-8 lg:p-10 mt-16 md:mt-0 md:ml-64 lg:ml-72 ${styles.dashboardContent}`}>
                    {getTabContent()}
                </main>
            </div>
        </div>
    );
}

export default AccountDashboard;
