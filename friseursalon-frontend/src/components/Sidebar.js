// src/components/Sidebar.js
import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import AuthService from '../services/auth.service';
import {
    FiGrid, FiUser, FiCalendar, FiStar, FiSettings, FiLogOut,
    FiBarChart2, FiBriefcase, FiUsers, FiClock, FiSlash, FiTag // FiTag Icon hinzugefügt
} from 'react-icons/fi';

// Zentrale Konfiguration für die Navigationslinks.
// Das macht es super einfach, die Sidebar zu warten und zu erweitern.
const navConfig = {
    user: [
        { to: 'appointments', icon: <FiCalendar />, label: 'Meine Termine' },
        { to: 'profile', icon: <FiUser />, label: 'Mein Profil' },
    ],
    admin: [
        { to: 'admin-dashboard', icon: <FiBarChart2 />, label: 'Übersicht & Statistiken' },
        { to: 'admin-calendar', icon: <FiCalendar />, label: 'Kalender' },
        { to: 'admin-appointments', icon: <FiBriefcase />, label: 'Alle Termine' },
        { to: 'admin-customers', icon: <FiUsers />, label: 'Kunden' },
        // NEUES ICON HIER: FiTag für Dienstleistungen
        { to: 'admin-services', icon: <FiTag />, label: 'Dienstleistungen' },
        // NEUES ICON HIER: FiStar für Bewertungen
        { to: 'admin-testimonials', icon: <FiStar />, label: 'Bewertungen' },
        { to: 'admin-working-hours', icon: <FiClock />, label: 'Öffnungszeiten' },
        { to: 'admin-blocked-slots', icon: <FiSlash />, label: 'Sperrzeiten' },
        { to: 'admin-settings', icon: <FiSettings />, label: 'Einstellungen' },
    ]
};

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const sidebarRef = useRef(null);
    const user = AuthService.getCurrentUser();
    const isAdmin = user?.roles?.includes('ROLE_ADMIN');

    const handleLogout = () => {
        AuthService.logout();
        navigate('/login');
        onClose();
    };

    // Schließt die Sidebar bei Klick außerhalb auf Mobile
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    // Hilfsfunktion zum Rendern der Links
    const renderNavLink = (link) => {
        const destination = `/account?tab=${link.to}`;
        const currentTab = new URLSearchParams(location.search).get('tab');
        const isActive = currentTab === link.to;

        return (
            <NavLink
                key={link.to}
                to={destination}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                onClick={onClose}
                aria-current={isActive ? 'page' : undefined}
            >
                <span className={styles.navIcon}>{link.icon}</span>
                {link.label}
            </NavLink>
        );
    };

    return (
        <aside ref={sidebarRef} className={`${styles.sidebar} ${isOpen ? styles.isOpen : ''}`}>
            <div className={styles.sidebarHeader}>
                <NavLink to="/" className={styles.logoLink} onClick={onClose}>
                    <h1 className={styles.logo}>IMW</h1>
                    <span className={styles.logoSubtext}>Dashboard</span>
                </NavLink>
            </div>

            <nav className={styles.mainNav}>
                {isAdmin ? (
                    <>
                        {/* Admin Links */}
                        {navConfig.admin.map(renderNavLink)}
                        {/* Trennlinie und User-spezifische Links für den Admin */}
                        <p className={styles.navSectionTitle}>Benutzer-Ansicht</p>
                        {navConfig.user.map(renderNavLink)}
                    </>
                ) : (
                    // Nur User Links für normale Benutzer
                    navConfig.user.map(renderNavLink)
                )}
            </nav>

            <div className={styles.sidebarFooter}>
                <button onClick={handleLogout} className={`${styles.navLink} ${styles.logoutButton}`}>
                    <span className={styles.navIcon}><FiLogOut /></span>
                    Abmelden
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;