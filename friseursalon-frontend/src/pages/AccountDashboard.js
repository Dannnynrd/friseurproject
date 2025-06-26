// src/pages/AccountDashboard.js
import React from 'react';
import { useLocation, Navigate, useSearchParams } from 'react-router-dom';

// Import der Layout-Komponenten
import DashboardLayout from '../layouts/DashboardLayout';
import DashboardPage from '../components/DashboardPage';

// Import der einzelnen Dashboard-Seiten-Komponenten
import AdminDashboardStats from '../components/AdminDashboardStats';
import AdminCalendarView from '../components/AdminCalendarView';
import AppointmentList from '../components/AppointmentList';
import CustomerManagement from '../components/CustomerManagement';
import ServiceList from '../components/ServiceList';
import WorkingHoursManager from '../components/WorkingHoursManager';
import BlockedTimeSlotManager from '../components/BlockedTimeSlotManager';
import AdminTestimonialManagement from '../components/AdminTestimonialManagement';
import DashboardSettings from '../components/DashboardSettings';
import ProfileEditForm from '../components/ProfileEditForm';
import AuthService from '../services/auth.service'; // Import für Rollenprüfung

// Zentrale Konfiguration aller Dashboard-Seiten
const tabConfig = {
    // User-Rollen
    'appointments': { component: AppointmentList, title: 'Meine Termine', roles: ['USER', 'ADMIN'] },
    'profile': { component: ProfileEditForm, title: 'Profil bearbeiten', roles: ['USER', 'ADMIN'] },

    // Admin-Rollen
    'admin-dashboard': { component: AdminDashboardStats, title: 'Übersicht & Statistiken', roles: ['ADMIN'] },
    'admin-calendar': { component: AdminCalendarView, title: 'Kalender', roles: ['ADMIN'] },
    'admin-appointments': { component: AppointmentList, title: 'Alle Termine', roles: ['ADMIN'] },
    'admin-customers': { component: CustomerManagement, title: 'Kundenverwaltung', roles: ['ADMIN'] },
    'admin-services': { component: ServiceList, title: 'Dienstleistungen', roles: ['ADMIN'] },
    'admin-testimonials': { component: AdminTestimonialManagement, title: 'Bewertungen verwalten', roles: ['ADMIN'] },
    'admin-working-hours': { component: WorkingHoursManager, title: 'Öffnungszeiten', roles: ['ADMIN'] },
    'admin-blocked-slots': { component: BlockedTimeSlotManager, title: 'Sperrzeiten verwalten', roles: ['ADMIN'] },
    'admin-settings': { component: DashboardSettings, title: 'Dashboard Einstellungen', roles: ['ADMIN'] },
};

function AccountDashboard({ currentUser, logOut, ...props }) {
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Wenn kein Benutzer angemeldet ist, zum Login weiterleiten.
    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const activeTab = searchParams.get('tab');
    const userRoles = AuthService.getCurrentUser()?.roles || [];
    const isAdmin = userRoles.includes('ROLE_ADMIN');

    const defaultTabKey = isAdmin ? 'admin-dashboard' : 'appointments';

    // Bestimme, welche Komponente gerendert werden soll.
    const getComponentToRender = () => {
        // Wenn kein Tab in der URL ist, leite zum Standard-Tab weiter.
        if (!activeTab) {
            return { redirect: `/account?tab=${defaultTabKey}` };
        }

        const tabDetails = tabConfig[activeTab];
        const userHasRole = tabDetails?.roles.some(role => userRoles.includes(`ROLE_${role}`));

        // Wenn der Tab ungültig ist oder der User keine Berechtigung hat, leite zum Standard-Tab weiter.
        if (!tabDetails || !userHasRole) {
            return { redirect: `/account?tab=${defaultTabKey}` };
        }

        // Alles gut, gib die Komponente und den Titel zurück.
        return { Component: tabDetails.component, title: tabDetails.title };
    };

    const { Component, title, redirect } = getComponentToRender();

    if (redirect) {
        return <Navigate to={redirect} replace />;
    }

    return (
        <DashboardLayout currentUser={currentUser} logOut={logOut}>
            <DashboardPage title={title}>
                {/* Übergib alle relevanten Props an die Kind-Komponente */}
                <Component
                    currentUser={currentUser}
                    adminView={activeTab.startsWith('admin-')}
                    {...props}
                />
            </DashboardPage>
        </DashboardLayout>
    );
}

export default AccountDashboard;