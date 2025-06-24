// src/components/DashboardPage.js
import React from 'react';
import styles from './DashboardPage.module.css';

/**
 * Eine Wrapper-Komponente für jede einzelne Seite im Dashboard.
 * Sorgt für einen einheitlichen Header und Container-Stil.
 */
function DashboardPage({ title, headerContent, children }) {
    return (
        <div className={styles.pageContainer}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>{title}</h1>
                {headerContent && (
                    <div className={styles.headerActions}>
                        {headerContent}
                    </div>
                )}
            </header>
            <div className={styles.pageContent}>
                {children}
            </div>
        </div>
    );
}

export default DashboardPage;