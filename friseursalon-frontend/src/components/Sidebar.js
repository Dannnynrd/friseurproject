// src/components/Sidebar.js
import React, { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import AuthService from '../services/auth.service';
import {
    FiUser, FiCalendar, FiLogOut, FiBarChart2, FiBriefcase,
    FiUsers, FiClock, FiSlash, FiTag, FiStar, FiSettings
} from 'react-icons/fi';

const navConfig = {
    user: [
        { to: '/account/appointments', icon: <FiBriefcase />, label: 'Meine Termine' },
        { to: '/account/profile', icon: <FiUser />, label: 'Mein Profil' },
    ],
    admin: [
        { to: '/account/admin/dashboard', icon: <FiBarChart2 />, label: 'Übersicht' },
        { to: '/account/admin/calendar', icon: <FiCalendar />, label: 'Kalender' },
        { to: '/account/admin/appointments', icon: <FiBriefcase />, label: 'Alle Termine' },
        { to: '/account/admin/customers', icon: <FiUsers />, label: 'Kunden' },
        { to: '/account/admin/services', icon: <FiTag />, label: 'Dienstleistungen' },
        { to: '/account/admin/testimonials', icon: <FiStar />, label: 'Bewertungen' },
        { to: '/account/admin/working-hours', icon: <FiClock />, label: 'Öffnungszeiten' },
        { to: '/account/admin/blocked-slots', icon: <FiSlash />, label: 'Sperrzeiten' },
        { to: '/account/admin/settings', icon: <FiSettings />, label: 'Einstellungen' },
    ]
};

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const sidebarRef = useRef(null);
    const user = AuthService.getCurrentUser();
    const isAdmin = user?.roles?.includes('ROLE_ADMIN');

    const handleLogout = () => {
        AuthService.logout();
        navigate('/login');
        onClose();
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    const renderNavLink = (link) => (
        <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
            onClick={onClose}
            // `end` prop sorgt dafür, dass übergeordnete Routen nicht fälschlicherweise als aktiv markiert werden
            end={link.to.split('/').length <= 3}
        >
            <span className={styles.navIcon}>{link.icon}</span>
            {link.label}
        </NavLink>
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
                {isAdmin ? navConfig.admin.map(renderNavLink) : navConfig.user.map(renderNavLink)}
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