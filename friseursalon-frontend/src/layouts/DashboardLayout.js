// src/layouts/DashboardLayout.js
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom'; // WICHTIG: Outlet importieren
import Sidebar from '../components/Sidebar';
import styles from './DashboardLayout.module.css';
import { FiMenu, FiX } from 'react-icons/fi';

const DashboardLayout = ({ currentUser, logOut }) => { // Props currentUser und logOut werden durchgereicht
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className={styles.dashboardLayout}>
            {/* Sidebar bekommt jetzt die Props direkt von hier */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                currentUser={currentUser}
                logOut={logOut}
            />

            <div className={styles.mainContent}>

                <button
                    className={styles.mobileMenuButton}
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    aria-label="Menü öffnen/schließen"
                >
                    {isSidebarOpen ? <FiX /> : <FiMenu />}
                </button>

                <main className={styles.pageContent}>
                    {/* Das Outlet rendert jetzt die passende Komponente aus App.js */}
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;