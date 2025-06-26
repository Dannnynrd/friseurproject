// src/layouts/DashboardLayout.js
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import styles from './DashboardLayout.module.css';
import { FiMenu, FiX } from 'react-icons/fi';

const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // NEU: State für die Datums-Auswahl, um die Funktionalität zu gewährleisten
    const [dateRange, setDateRange] = useState('letzte-30-tage');

    // Beispieldaten für die Auswahlmöglichkeiten
    const availableDateRanges = [
        { value: 'heute', label: 'Heute' },
        { value: 'letzte-7-tage', label: 'Letzte 7 Tage' },
        { value: 'letzte-30-tage', label: 'Letzte 30 Tage' },
    ];

    const activeDateRangeLabel = availableDateRanges.find(r => r.value === dateRange)?.label || 'Auswählen...';


    return (
        <div className={styles.dashboardLayout}>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className={styles.mainContent}>
                {/* NEU: Props werden an den Header übergeben, um die Funktionalität sicherzustellen */}
                <DashboardHeader
                    activeDateRangeLabel={activeDateRangeLabel}
                    onDateRangeChange={setDateRange}
                    availableDateRanges={availableDateRanges}
                />

                <button
                    className={styles.mobileMenuButton}
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    aria-label="Menü öffnen/schließen"
                >
                    {isSidebarOpen ? <FiX /> : <FiMenu />}
                </button>

                <main className={styles.pageContent}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;