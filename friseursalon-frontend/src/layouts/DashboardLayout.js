// src/layouts/DashboardLayout.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './DashboardLayout.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserEdit, faCog, faUsers, faScissors, faClock, faSignOutAlt, faStore,
    faGaugeHigh, faCalendarDays, faCalendarCheck, faStar, faCalendarXmark,
    faAngleRight, faAngleLeft, faBars, faTimes
} from '@fortawesome/free-solid-svg-icons';

// --- Navigations-Konfiguration ---
const getNavConfig = (roles = []) => {
    const isAdmin = roles.includes('ROLE_ADMIN');
    const sections = [
        // ... (Navigations-Konfiguration von letzter Antwort unverändert)
        {
            title: 'Analyse',
            links: [ { name: 'admin-dashboard', label: 'Übersicht', icon: faGaugeHigh, admin: true }, ]
        },
        {
            title: 'Verwaltung',
            links: [
                { name: 'admin-calendar', label: 'Kalender', icon: faCalendarDays, admin: true },
                { name: 'admin-appointments', label: 'Terminverwaltung', icon: faCalendarCheck, admin: true },
                { name: 'admin-customers', label: 'Kundenverwaltung', icon: faUsers, admin: true },
                { name: 'admin-services', label: 'Dienstleistungen', icon: faScissors, admin: true },
                { name: 'admin-testimonials', label: 'Bewertungen', icon: faStar, admin: true },
            ]
        },
        {
            title: 'Einstellungen',
            links: [
                { name: 'admin-working-hours', label: 'Öffnungszeiten', icon: faClock, admin: true },
                { name: 'admin-blocked-slots', label: 'Sperrzeiten', icon: faCalendarXmark, admin: true },
                { name: 'admin-settings', label: 'Salon Einstellungen', icon: faCog, admin: true },
            ]
        },
        {
            title: 'Mein Konto',
            links: [
                { name: 'appointments', label: 'Meine Termine', icon: faCalendarCheck, user: true },
                { name: 'profile', label: 'Profil bearbeiten', icon: faUserEdit, user: true },
            ]
        }
    ];

    return sections
        .map(section => ({
            ...section,
            links: section.links.filter(link => link.admin ? isAdmin : link.user)
        }))
        .filter(section => section.links.length > 0);
};


// --- Die Haupt-Layout-Komponente ---
function DashboardLayout({ children, currentUser, logOut }) {
    const location = useLocation();
    // VERBESSERUNG: Sidebar standardmäßig ausgeklappt
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    // NEU: State für das mobile Menü
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const activeTab = new URLSearchParams(location.search).get('tab') || (currentUser.roles.includes('ROLE_ADMIN') ? 'admin-dashboard' : 'appointments');
    const navConfig = getNavConfig(currentUser.roles);
    const allLinks = navConfig.flatMap(s => s.links);

    const mobileNavLinks = [
        allLinks.find(l => l.name === 'admin-dashboard' || l.name === 'appointments'),
        allLinks.find(l => l.name === 'admin-calendar'),
        allLinks.find(l => l.name === 'admin-appointments'),
        { name: 'menu', label: 'Menü', icon: faBars }
    ].filter(Boolean);

    return (
        <div className={styles.dashboardLayout}>
            {/* --- Desktop Sidebar --- */}
            <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
                {/* ... Inhalt der Sidebar ist unverändert ... */}
                <div className={styles.sidebarHeader}>
                    <Link to="/" className={styles.logo}>
                        <FontAwesomeIcon icon={faStore} className={styles.logoIcon} />
                        <span className={styles.logoText}>Salon</span>
                    </Link>
                </div>
                <nav className={styles.sidebarNav}>
                    {navConfig.map(section => (
                        <div key={section.title} className={styles.navSection}>
                            <h3 className={styles.navSectionTitle}>{section.title}</h3>
                            {section.links.map(link => (
                                <Link key={link.name} to={`/account?tab=${link.name}`} className={`${styles.navLink} ${activeTab === link.name ? styles.navLinkActive : ''}`} title={link.label}>
                                    <FontAwesomeIcon icon={link.icon} className={styles.navIcon} />
                                    <span className={styles.navText}>{link.label}</span>
                                </Link>
                            ))}
                        </div>
                    ))}
                </nav>
                <div className={styles.sidebarFooter}>
                    <button onClick={logOut} className={`${styles.navLink} ${styles.logoutButton}`} title="Ausloggen">
                        <FontAwesomeIcon icon={faSignOutAlt} className={styles.navIcon} />
                        <span className={styles.navText}>Ausloggen</span>
                    </button>
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className={styles.collapseButton} title={isSidebarCollapsed ? "Menü ausklappen" : "Menü einklappen"}>
                        <FontAwesomeIcon icon={isSidebarCollapsed ? faAngleRight : faAngleLeft} />
                    </button>
                </div>
            </aside>

            {/* --- NEU: Vollbild-Menü für Mobile --- */}
            <div className={`${styles.mobileMenuOverlay} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
                <div className={styles.mobileMenuHeader}>
                    <h2 className={styles.mobileMenuTitle}>Menü</h2>
                    <button onClick={() => setIsMobileMenuOpen(false)} className={styles.mobileMenuClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <nav className={styles.mobileMenuNav}>
                    {navConfig.map(section => (
                        <div key={section.title} className={styles.mobileNavSection}>
                            <h3 className={styles.mobileNavSectionTitle}>{section.title}</h3>
                            {section.links.map(link => (
                                <Link
                                    key={link.name}
                                    to={`/account?tab=${link.name}`}
                                    className={`${styles.mobileMenuLink} ${activeTab === link.name ? styles.mobileMenuLinkActive : ''}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <FontAwesomeIcon icon={link.icon} className={styles.mobileMenuIcon} />
                                    <span>{link.label}</span>
                                </Link>
                            ))}
                        </div>
                    ))}
                    <div className={styles.mobileNavSection}>
                        <button onClick={logOut} className={`${styles.mobileMenuLink} ${styles.mobileMenuLogout}`}>
                            <FontAwesomeIcon icon={faSignOutAlt} className={styles.mobileMenuIcon} />
                            <span>Ausloggen</span>
                        </button>
                    </div>
                </nav>
            </div>


            {/* --- Mobile Bottom Tab Bar --- */}
            <nav className={styles.mobileTabBar}>
                {mobileNavLinks.map(link => (
                    <Link
                        key={link.name}
                        to={link.name === 'menu' ? '#' : `/account?tab=${link.name}`}
                        onClick={link.name === 'menu' ? (e) => { e.preventDefault(); setIsMobileMenuOpen(true); } : undefined}
                        className={`${styles.mobileNavLink} ${activeTab === link.name ? styles.mobileNavLinkActive : ''}`}
                    >
                        <FontAwesomeIcon icon={link.icon} className={styles.mobileNavIcon} />
                        <span className={styles.mobileNavText}>{link.label}</span>
                    </Link>
                ))}
            </nav>

            {/* --- Hauptinhaltsbereich --- */}
            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}

export default DashboardLayout;