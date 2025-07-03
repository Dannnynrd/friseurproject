// src/components/Sidebar.js
import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';
import {
    FiUser, FiCalendar, FiLogOut, FiBarChart2, FiBriefcase,
    FiUsers, FiClock, FiSlash, FiSettings, FiScissors, FiStar
} from 'react-icons/fi';
//
// Die Navigationsstruktur bleibt unverändert
const navConfig = {
    user: [
        { to: '/account/appointments', icon: <FiBriefcase />, label: 'Meine Termine' },
        { to: '/account/profile', icon: <FiUser />, label: 'Mein Profil' },
    ],
    admin: [
        {
            title: 'Analyse',
            links: [
                { to: '/account/admin/dashboard', icon: <FiBarChart2 />, label: 'Übersicht' },
                { to: '/account/admin/calendar', icon: <FiCalendar />, label: 'Kalender' },
            ]
        },
        {
            title: 'Verwaltung',
            links: [
                { to: '/account/admin/appointments', icon: <FiBriefcase />, label: 'Alle Termine' },
                { to: '/account/admin/customers', icon: <FiUsers />, label: 'Kunden' },
                { to: '/account/admin/services', icon: <FiScissors />, label: 'Leistungen' },
                { to: '/account/admin/testimonials', icon: <FiStar />, label: 'Bewertungen' },
            ]
        },
        {
            title: 'Einstellungen',
            links: [
                { to: '/account/admin/working-hours', icon: <FiClock />, label: 'Öffnungszeiten' },
                { to: '/account/admin/blocked-slots', icon: <FiSlash />, label: 'Sperrzeiten' },
                { to: '/account/admin/settings', icon: <FiSettings />, label: 'Dashboard' },
            ]
        }
    ]
};

const Sidebar = ({ isOpen, onClose, logOut, currentUser }) => {
    const sidebarRef = useRef(null);
    const isAdmin = currentUser?.roles?.includes('ROLE_ADMIN');

    const handleLogout = () => {
        logOut();
        if (onClose) onClose();
    };

    // Schließt die Sidebar, wenn außerhalb geklickt wird
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                if (onClose) onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    const renderNavLink = (link) => (
        <li key={link.to}>
            <NavLink
                to={link.to}
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                onClick={onClose}
            >
                <span className={styles.navIcon}>{link.icon}</span>
                <span className={styles.navLabel}>{link.label}</span>
            </NavLink>
        </li>
    );

    return (
        <aside ref={sidebarRef} className={`${styles.sidebar} ${isOpen ? styles.isOpen : ''}`}>
            <div className={styles.sidebarHeader}>
                <NavLink to="/" className={styles.logoLink} onClick={onClose}>
                    <h1 className={styles.logo}>IMW</h1>
                    <span className={styles.logoSubtext}>Dashboard</span>
                </NavLink>
            </div>

            <nav className={styles.mainNav}>
                <ul>
                    {navConfig.user.map(renderNavLink)}

                    {isAdmin && (
                        <>
                            {navConfig.admin.map((section) => (
                                <React.Fragment key={section.title}>
                                    <li className={styles.navDivider}><hr /></li>
                                    <li className={styles.navSectionTitle}>{section.title}</li>
                                    {section.links.map(renderNavLink)}
                                </React.Fragment>
                            ))}
                        </>
                    )}
                </ul>
            </nav>

            <div className={styles.sidebarFooter}>
                <div className={styles.userProfile}>
                    <div className={styles.userAvatar}>
                        {currentUser?.firstName?.charAt(0) || 'U'}
                    </div>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{currentUser?.firstName || 'Benutzer'} {currentUser?.lastName || ''}</span>
                        <span className={styles.userEmail}>{currentUser?.email}</span>
                    </div>
                </div>
                <button onClick={handleLogout} className={styles.logoutButton}>
                    <FiLogOut />
                    Abmelden
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;