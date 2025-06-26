// src/components/Sidebar.js
import React, { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import AuthService from '../services/auth.service';
import { FiGrid, FiUser, FiCalendar, FiStar, FiSettings, FiLogOut, FiBarChart2 } from 'react-icons/fi';

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const sidebarRef = useRef(null);

    const handleLogout = () => {
        AuthService.logout();
        navigate('/login');
        onClose(); // Schließt die Sidebar nach dem Logout
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

    const navLinks = [
        { to: '/dashboard/overview', icon: <FiGrid />, label: 'Übersicht' },
        { to: '/dashboard/appointments', icon: <FiCalendar />, label: 'Meine Termine' },
        { to: '/dashboard/profile', icon: <FiUser />, label: 'Mein Profil' },
        { to: '/dashboard/testimonials', icon: <FiStar />, label: 'Bewertungen' },
        { to: '/dashboard/settings', icon: <FiSettings />, label: 'Einstellungen' },
    ];

    // Beispiel: Admin-spezifische Links
    const user = AuthService.getCurrentUser();
    const isAdmin = user && user.roles.includes('ROLE_ADMIN');

    return (
        <aside ref={sidebarRef} className={`${styles.sidebar} ${isOpen ? styles.isOpen : ''}`}>
            <div className={styles.sidebarHeader}>
                <h1 className={styles.logo}>IMW</h1>
                <span className={styles.logoSubtext}>Dashboard</span>
            </div>
            <nav className={styles.mainNav}>
                {navLinks.map(link => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
                        onClick={onClose}
                    >
                        <span className={styles.navIcon}>{link.icon}</span>
                        {link.label}
                    </NavLink>
                ))}
            </nav>

            {isAdmin && (
                <nav className={styles.adminNav}>
                    <p className={styles.navSectionTitle}>Admin</p>
                    <NavLink to="/admin/dashboard" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`} onClick={onClose}>
                        <span className={styles.navIcon}><FiBarChart2 /></span>
                        Statistiken
                    </NavLink>
                    {/* Weitere Admin-Links hier */}
                </nav>
            )}

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