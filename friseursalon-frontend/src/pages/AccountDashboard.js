// src/pages/AccountDashboard.js
import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';

// Import der Layout-Komponenten
import DashboardLayout from '../layouts/DashboardLayout';
import DashboardPage from '../components/DashboardPage';

// Import der einzelnen Seiten-Komponenten
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

// Zentrale Konfiguration für alle Seiten im Dashboard
const tabConfig = {
    // Admin
    'admin-dashboard': { component: AdminDashboardStats, title: 'Übersicht' },
    'admin-calendar': { component: AdminCalendarView, title: 'Kalender' },
    'admin-appointments': { component: AppointmentList, title: 'Terminverwaltung' },
    'admin-customers': { component: CustomerManagement, title: 'Kundenverwaltung' },
    'admin-services': { component: ServiceList, title: 'Dienstleistungen' },
    'admin-testimonials': { component: AdminTestimonialManagement, title: 'Bewertungen' },
    'admin-working-hours': { component: WorkingHoursManager, title: 'Öffnungszeiten' },
    'admin-blocked-slots': { component: BlockedTimeSlotManager, title: 'Sperrzeiten' },
    'admin-settings': { component: DashboardSettings, title: 'Salon Einstellungen' },
    // User
    'appointments': { component: AppointmentList, title: 'Meine Termine' },
    'profile': { component: ProfileEditForm, title: 'Profil bearbeiten' },
};


function AccountDashboard({ currentUser, logOut, ...props }) {
    const location = useLocation();

    // Wenn kein Benutzer angemeldet ist, zum Login weiterleiten.
    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    const activeTab = new URLSearchParams(location.search).get('tab');
    const isAdmin = currentUser.roles.includes('ROLE_ADMIN');

    // Definiere die Standard-Seite basierend auf der Benutzerrolle.
    const defaultTabKey = isAdmin ? 'admin-dashboard' : 'appointments';

    // **KORREKTUR & VERBESSERUNG:**
    // 1. Prüfe, ob der `activeTab` aus der URL gültig ist.
    // 2. Wenn nicht (oder wenn er fehlt), leite direkt auf die korrekte Standard-Seite um.
    //    Dadurch wird sichergestellt, dass die URL immer einen gültigen Zustand widerspiegelt.
    if (!activeTab || !tabConfig[activeTab]) {
        return <Navigate to={`/account?tab=${defaultTabKey}`} replace />;
    }

    // Wenn wir hier ankommen, ist `activeTab` garantiert ein gültiger Schlüssel.
    const { component: ComponentToRender, title } = tabConfig[activeTab];

    return (
        <DashboardLayout currentUser={currentUser} logOut={logOut}>
            <DashboardPage title={title}>
                <ComponentToRender
                    currentUser={currentUser}
                    adminView={activeTab.startsWith('admin-')}
                    {...props}
                />
            </DashboardPage>
        </DashboardLayout>
    );
}

export default AccountDashboard;