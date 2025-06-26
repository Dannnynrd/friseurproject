// src/components/DashboardHeader.js
import React from 'react';
import { useLocation } from 'react-router-dom';
import styles from './DashboardHeader.module.css';
import { FiChevronDown, FiUser } from 'react-icons/fi';
import AuthService from '../services/auth.service';

const DashboardHeader = ({
                             activeDateRangeLabel,
                             onDateRangeChange,
                             availableDateRanges
                         }) => {
    const location = useLocation();

    const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes('overview')) return 'Übersicht';
        if (path.includes('appointments')) return 'Meine Termine';
        if (path.includes('profile')) return 'Mein Profil';
        if (path.includes('testimonials')) return 'Bewertungen';
        if (path.includes('settings')) return 'Einstellungen';
        if (path.includes('admin/dashboard')) return 'Admin Dashboard';
        return 'Dashboard';
    };

    const user = AuthService.getCurrentUser();

    // Sicherheitsüberprüfung, falls noch keine Daten da sind
    const isCustomRange = activeDateRangeLabel && typeof activeDateRangeLabel === 'string' && activeDateRangeLabel.startsWith('Benutzerdefiniert');

    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <h1 className={styles.pageTitle}>{getPageTitle()}</h1>
            </div>
            <div className={styles.headerRight}>
                {/* Die Datums-Auswahl ist jetzt voll integriert */}
                {onDateRangeChange && availableDateRanges && (
                    <div className={styles.dateRangeSelector}>
                        <select
                            value={isCustomRange ? 'custom' : activeDateRangeLabel}
                            onChange={(e) => onDateRangeChange(e.target.value)}
                            className={styles.select}
                        >
                            {availableDateRanges.map(range => (
                                <option key={range.value} value={range.value}>{range.label}</option>
                            ))}
                            {/* Option für eine spätere "Custom Range"-Funktion */}
                            {isCustomRange && <option value="custom">{activeDateRangeLabel}</option>}
                        </select>
                        <FiChevronDown className={styles.selectIcon} />
                    </div>
                )}
                <div className={styles.userMenu}>
                    <div className={styles.avatar}>
                        <FiUser />
                    </div>
                    <span className={styles.userName}>{user ? user.username : 'Gast'}</span>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;