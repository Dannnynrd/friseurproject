import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import './App.css';

// Layout & Core Components
import Header from './components/Header';
import Footer from './components/Footer';

// Auth & Pages
import Login from './components/Login';
import Register from './components/Register';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import BookingPage from './pages/BookingPage';
import AccountDashboard from './pages/AccountDashboard';

// Services & Common
import AuthService from './services/auth.service';
import AuthVerify from './common/AuthVerify';
import EventBus from './common/EventBus';

// Homepage Sections
import HeroSection from './components/HeroSection';
import TrustBarSection from './components/TrustBarSection';
import ExperienceSection from './components/ExperienceSection';
import TestimonialsSection from './components/TestimonialsSection';
import AboutFounderSection from './components/AboutFounderSection';
import ServicesSection from './components/ServicesSection';
import GalleryJournalSection from './components/GalleryJournalSection';
import EssentialsSection from './components/EssentialsSection';
import FAQSection from './components/FAQSection';
import LocationSection from './components/LocationSection';
import NewsletterSection from './components/NewsletterSection';

// --- Helper Components ---

const ProtectedRoute = ({ children, currentUser }) => {
    if (!currentUser) {
        return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
    }
    return children;
};

const MainLayout = ({ children }) => (
    <main className="main-content">
        {children}
        <Footer />
    </main>
);

const HomePage = ({ navigateToBooking }) => (
    <>
        <HeroSection />
        <TrustBarSection />
        <ExperienceSection />
        <TestimonialsSection />
        <AboutFounderSection />
        <ServicesSection openBookingModal={navigateToBooking} />
        <GalleryJournalSection />
        <EssentialsSection />
        <FAQSection />
        <LocationSection />
        <NewsletterSection />
    </>
);

// --- Main App Component ---

function App() {
    const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
    const [refreshAppointmentsList, setRefreshAppointmentsList] = useState(0);
    const [refreshServicesList, setRefreshServicesList] = useState(0);

    const preloaderRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    // --- Side Effects ---

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Prevent body scrolling when mobile menu is open
    useEffect(() => {
        document.body.classList.toggle('mobile-menu-active', isMobileMenuOpen);
        return () => document.body.classList.remove('mobile-menu-active');
    }, [isMobileMenuOpen]);

    // Handle scroll detection for header effects
    useEffect(() => {
        const handleScroll = () => setIsHeaderScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial check
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Handle preloader
    useEffect(() => {
        const preloader = preloaderRef.current;
        if (preloader) {
            const id = setTimeout(() => preloader.classList.add('loaded'), 300);
            return () => clearTimeout(id);
        }
    }, []);

    // --- Authentication Logic ---

    const logOut = useCallback(() => {
        AuthService.logout();
        setCurrentUser(null);
        setIsMobileMenuOpen(false);
        navigate('/');
    }, [navigate]);

    const handleLoginSuccess = useCallback(() => {
        const user = AuthService.getCurrentUser();
        setCurrentUser(user);
        const from = location.state?.from || (user?.roles?.includes('ROLE_ADMIN') ? '/my-account?tab=admin-dashboard' : '/my-account');
        navigate(from, { replace: true });
    }, [navigate, location]);

    const handleProfileUpdateSuccess = useCallback(() => {
        setCurrentUser(AuthService.getCurrentUser());
    }, []);

    useEffect(() => {
        EventBus.on("logout", logOut);
        return () => EventBus.remove("logout", logOut);
    }, [logOut]);

    // --- Navigation ---

    const navigateToBooking = useCallback((serviceName = null) => {
        navigate(serviceName ? `/buchen/${encodeURIComponent(serviceName)}` : '/buchen');
    }, [navigate]);

    // --- Render ---

    const headerVariant = location.pathname === '/' ? 'transparent' : 'solid';

    return (
        <div className="App">
            <div id="preloader" ref={preloaderRef}><span className="loader-char">IMW</span></div>

            <Header
                currentUser={currentUser}
                isMobileMenuOpen={isMobileMenuOpen}
                toggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
                closeMobileMenu={() => setIsMobileMenuOpen(false)}
                isHeaderScrolled={isHeaderScrolled}
                navigateToBooking={navigateToBooking}
                logOut={logOut}
                variant={headerVariant}
            />

            <Routes>
                <Route path="/" element={<MainLayout><HomePage navigateToBooking={navigateToBooking} /></MainLayout>} />
                <Route path="/buchen/*" element={<MainLayout><BookingPage onAppointmentAdded={() => setRefreshAppointmentsList(p => p + 1)} currentUser={currentUser} onLoginSuccess={handleLoginSuccess} /></MainLayout>} />

                <Route path="/login" element={currentUser ? <Navigate to="/my-account" replace /> : <Login onLoginSuccess={handleLoginSuccess} />} />
                <Route path="/register" element={currentUser ? <Navigate to="/my-account" replace /> : <Register />} />
                <Route path="/passwort-vergessen" element={currentUser ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />
                <Route path="/passwort-zuruecksetzen" element={currentUser ? <Navigate to="/" replace /> : <ResetPasswordPage />} />

                <Route
                    path="/my-account"
                    element={
                        <ProtectedRoute currentUser={currentUser}>
                            <MainLayout>
                                <AccountDashboard
                                    currentUser={currentUser}
                                    logOut={logOut}
                                    onAppointmentAdded={() => setRefreshAppointmentsList(p => p + 1)}
                                    refreshAppointmentsList={refreshAppointmentsList}
                                    onServiceAdded={() => setRefreshServicesList(p => p + 1)}
                                    refreshServicesList={refreshServicesList}
                                    onProfileUpdateSuccess={handleProfileUpdateSuccess}
                                    onProfileUpdateError={(err) => console.error("Profile update error:", err)}
                                />
                            </MainLayout>
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <AuthVerify logOut={logOut} />
        </div>
    );
}

export default App;
