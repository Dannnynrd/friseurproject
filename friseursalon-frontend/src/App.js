// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import './App.css';

// Layout & Core Components
import Header from './components/Header';
import Footer from './components/Footer';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './components/DashboardPage';

// Auth & Pages
import Login from './components/Login';
import Register from './components/Register';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import BookingPage from './pages/BookingPage';

// === KORREKTUR: Alle Homepage-Sektionen importieren ===
import HeroSection from './components/HeroSection';
import HowItWorksSection from './components/HowItWorksSection';
import ServicesSection from './components/ServicesSection';
import TrustBarSection from './components/TrustBarSection';
import AboutFounderSection from './components/AboutFounderSection';
import TestimonialsSection from './components/TestimonialsSection';
import FinalCTASection from './components/FinalCTASection';
import FAQSection from './components/FAQSection';
import LocationSection from './components/LocationSection';

// Dashboard-Komponenten
import AdminDashboardStats from './components/AdminDashboardStats';
import AdminCalendarView from './components/AdminCalendarView';
import AppointmentList from './components/AppointmentList';
import CustomerManagement from './components/CustomerManagement';
import ServiceList from './components/ServiceList';
import WorkingHoursManager from './components/WorkingHoursManager';
import BlockedTimeSlotManager from './components/BlockedTimeSlotManager';
import AdminTestimonialManagement from './components/AdminTestimonialManagement';
import DashboardSettings from './components/DashboardSettings';
import ProfileEditForm from './components/ProfileEditForm';

// Services & Common
import AuthService from './services/auth.service';
import AuthVerify from './common/AuthVerify';
import EventBus from './common/EventBus';


// Wrapper für Seiten, die einen Login erfordern
const ProtectedRoute = ({ children }) => {
    const user = AuthService.getCurrentUser();
    if (!user) {
        return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
    }
    return children;
};

// Wrapper für Admin-spezifische Seiten
const AdminRoute = ({ children }) => {
    const user = AuthService.getCurrentUser();
    const isAdmin = user?.roles?.includes('ROLE_ADMIN');
    if (!user || !isAdmin) {
        return <Navigate to="/account/appointments" replace />;
    }
    return children;
};


// --- Main App Component ---
function App() {
    const [currentUser, setCurrentUser] = useState(undefined);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
        }
    }, []);

    const logOut = useCallback(() => {
        AuthService.logout();
        setCurrentUser(undefined);
        navigate('/');
    }, [navigate]);

    useEffect(() => {
        const handleLogout = () => logOut();
        EventBus.on("logout", handleLogout);
        return () => EventBus.remove("logout", handleLogout);
    }, [logOut]);

    const handleLoginSuccess = useCallback(() => {
        const user = AuthService.getCurrentUser();
        setCurrentUser(user);
        const from = location.state?.from?.pathname || (user?.roles?.includes('ROLE_ADMIN') ? '/account/admin/dashboard' : '/account/appointments');
        navigate(from, { replace: true });
    }, [navigate, location.state]);

    return (
        <div className="App">
            <Header currentUser={currentUser} logOut={logOut} />
            <main>
                <Routes>
                    <Route path="/" element={<HomePageWrapper />} />

                    {/* Public Pages */}
                    <Route path="/buchen" element={<BookingPage currentUser={currentUser} onLoginSuccess={handleLoginSuccess} />} />
                    <Route path="/login" element={currentUser ? <Navigate to="/account" /> : <Login onLoginSuccess={handleLoginSuccess} />} />
                    <Route path="/register" element={currentUser ? <Navigate to="/account" /> : <Register />} />
                    <Route path="/passwort-vergessen" element={<ForgotPasswordPage />} />
                    <Route path="/passwort-zuruecksetzen" element={<ResetPasswordPage />} />

                    {/* === NEUES, VERSCHACHTELTES DASHBOARD ROUTING === */}
                    <Route
                        path="/account"
                        element={
                            <ProtectedRoute>
                                <DashboardLayout currentUser={currentUser} logOut={logOut} />
                            </ProtectedRoute>
                        }
                    >
                        {/* Standardroute, leitet zum richtigen Dashboard weiter */}
                        <Route index element={<Navigate to={currentUser?.roles?.includes('ROLE_ADMIN') ? "admin/dashboard" : "appointments"} replace />} />

                        {/* User Routes */}
                        <Route path="appointments" element={<DashboardPage title="Meine Termine"><AppointmentList /></DashboardPage>} />
                        <Route path="profile" element={<DashboardPage title="Profil bearbeiten"><ProfileEditForm user={currentUser} onProfileUpdateSuccess={() => setCurrentUser(AuthService.getCurrentUser())} /></DashboardPage>} />

                        {/* Admin Routes */}
                        <Route path="admin/dashboard" element={<AdminRoute><DashboardPage title="Übersicht & Statistiken"><AdminDashboardStats /></DashboardPage></AdminRoute>} />
                        <Route path="admin/calendar" element={<AdminRoute><DashboardPage title="Kalender"><AdminCalendarView /></DashboardPage></AdminRoute>} />
                        <Route path="admin/appointments" element={<AdminRoute><DashboardPage title="Alle Termine"><AppointmentList adminView={true} /></DashboardPage></AdminRoute>} />
                        <Route path="admin/customers" element={<AdminRoute><DashboardPage title="Kundenverwaltung"><CustomerManagement /></DashboardPage></AdminRoute>} />
                        <Route path="admin/services" element={<AdminRoute><DashboardPage title="Dienstleistungen"><ServiceList /></DashboardPage></AdminRoute>} />
                        <Route path="admin/testimonials" element={<AdminRoute><DashboardPage title="Bewertungen"><AdminTestimonialManagement /></DashboardPage></AdminRoute>} />
                        <Route path="admin/working-hours" element={<AdminRoute><DashboardPage title="Öffnungszeiten"><WorkingHoursManager /></DashboardPage></AdminRoute>} />
                        <Route path="admin/blocked-slots" element={<AdminRoute><DashboardPage title="Sperrzeiten"><BlockedTimeSlotManager /></DashboardPage></AdminRoute>} />
                        <Route path="admin/settings" element={<AdminRoute><DashboardPage title="Einstellungen"><DashboardSettings /></DashboardPage></AdminRoute>} />
                    </Route>

                    {/* Fallback für alle unbekannten Routen */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <Footer />
            <AuthVerify logOut={logOut} />
        </div>
    );
}

// Hilfskomponente, um die Homepage-Sektionen zu bündeln
const HomePageWrapper = () => (
    <>
        <HeroSection />
        <HowItWorksSection />
        <div id="services-section"><ServicesSection /></div>
        <TrustBarSection />
        <div id="about-founder"><AboutFounderSection /></div>
        <TestimonialsSection />
        <FinalCTASection />
        <FAQSection />
        <div id="location"><LocationSection /></div>
    </>
);

export default App;