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

// --- NEUE, MODERNISIERTE HOMEPAGE SEKTIONEN ---
import HeroSection from './components/HeroSection';
import TrustBarSection from './components/TrustBarSection';
import ServicesSection from './components/ServicesSection';
import HowItWorksSection from './components/HowItWorksSection'; // NEU
import AboutFounderSection from './components/AboutFounderSection';
import TestimonialsSection from './components/TestimonialsSection';
import FinalCTASection from './components/FinalCTASection'; // NEU
import LocationSection from './components/LocationSection';


// --- Helper Components für das Layout ---

// Dieser Wrapper wird für ALLE Seiten außer der Homepage verwendet.
const PageLayout = ({ children }) => (
    <div className="page-layout">
        {children}
    </div>
);

// Bündelt alle Sektionen der neuen, modernisierten Homepage
const HomePage = () => (
    <div className="homepage-layout">
        <HeroSection />
        <HowItWorksSection />
        <div id="services-section">
            <ServicesSection />
        </div>

        <TrustBarSection />
        <div id="about-founder">
            <AboutFounderSection />
        </div>
        <TestimonialsSection />
        <FinalCTASection />
        <div id="location">
            <LocationSection />
        </div>
    </div>
);

// Schützt Routen, die eine Anmeldung erfordern
const ProtectedRoute = ({ children, currentUser }) => {
    if (!currentUser) {
        return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
    }
    return children;
};


// --- Main App Component ---

function App() {
    const [currentUser, setCurrentUser] = useState(undefined);
    const preloaderRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Init-Effekt, um den Benutzer zu Beginn zu setzen
    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
        }
    }, []);

    // Preloader-Logik
    useEffect(() => {
        const preloader = preloaderRef.current;
        if (preloader) {
            const timer = setTimeout(() => {
                if (preloader) preloader.classList.add('loaded');
            }, 150);
            return () => clearTimeout(timer);
        }
    }, []);

    // Logout-Logik
    const logOut = useCallback(() => {
        AuthService.logout();
        setCurrentUser(undefined);
        navigate('/');
    }, [navigate]);

    useEffect(() => {
        const handleLogout = () => logOut();
        EventBus.on("logout", handleLogout);
        return () => {
            EventBus.remove("logout", handleLogout);
        };
    }, [logOut]);

    // Nach erfolgreichem Login navigieren
    const handleLoginSuccess = useCallback(() => {
        const user = AuthService.getCurrentUser();
        setCurrentUser(user);
        const from = location.state?.from || (user?.roles?.includes('ROLE_ADMIN') ? '/account' : '/account');
        navigate(from, { replace: true });
    }, [navigate, location.state]);


    return (
        <div className="App">
            <div id="preloader" ref={preloaderRef}></div>

            <Header currentUser={currentUser} logOut={logOut} />

            <main>
                <Routes>
                    <Route path="/" element={<HomePage />} />

                    {/* Anchor-Link-Fallbacks, leiten zur Homepage weiter, wo das Scrolling stattfindet */}
                    <Route path="/#services-section" element={<Navigate to="/" replace />} />
                    <Route path="/#about-founder" element={<Navigate to="/" replace />} />
                    <Route path="/#location" element={<Navigate to="/" replace />} />

                    {/* Seiten-Routen */}
                    <Route path="/buchen" element={<PageLayout><BookingPage currentUser={currentUser} onLoginSuccess={handleLoginSuccess} /></PageLayout>} />
                    <Route path="/login" element={currentUser ? <Navigate to="/account" replace /> : <PageLayout><Login onLoginSuccess={handleLoginSuccess} /></PageLayout>} />
                    <Route path="/register" element={currentUser ? <Navigate to="/account" replace /> : <PageLayout><Register /></PageLayout>} />
                    <Route path="/passwort-vergessen" element={currentUser ? <Navigate to="/" replace /> : <PageLayout><ForgotPasswordPage /></PageLayout>} />
                    <Route path="/passwort-zuruecksetzen" element={currentUser ? <Navigate to="/" replace /> : <PageLayout><ResetPasswordPage /></PageLayout>} />

                    <Route
                        path="/account"
                        element={
                            <ProtectedRoute currentUser={currentUser}>
                                <PageLayout>
                                    <AccountDashboard currentUser={currentUser} logOut={logOut} onProfileUpdateSuccess={() => setCurrentUser(AuthService.getCurrentUser())} />
                                </PageLayout>
                            </ProtectedRoute>
                        }
                    />

                    {/* Fallback für alle unbekannten Routen */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>

            <Footer />
            <AuthVerify logOut={logOut} />
        </div>
    );
}

export default App;