// File: friseursalon-frontend/src/App.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css'; // Globale Stile
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';

// Layout Komponenten
import Header from './components/Header';
import Footer from './components/Footer';

// Dynamische Komponenten
import Login from './components/Login';
import AuthService from './services/auth.service';
import AuthVerify from './common/AuthVerify';
import EventBus from './common/EventBus';
import Register from './components/Register';

// Statische Design-Komponenten (Homepage Sektionen)
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

// Seiten
import BookingPage from './pages/BookingPage';
import AccountDashboard from './pages/AccountDashboard';

// ProtectedRoute Komponente zum Schutz von Routen, die eine Anmeldung erfordern
const ProtectedRoute = ({ children, currentUser, redirectPath = '/login' }) => {
    if (!currentUser) {
        return <Navigate to={redirectPath} replace />;
    }
    return children;
};

function App() {
    const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
    const [refreshServicesList, setRefreshServicesList] = useState(0);
    const [refreshAppointmentsList, setRefreshAppointmentsList] = useState(0);

    const headerRef = useRef(null);
    const preloaderRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

    useEffect(() => {
        closeMobileMenu();
    }, [location.pathname, closeMobileMenu]);

    useEffect(() => {
        const bodyClass = 'mobile-menu-active';
        if (isMobileMenuOpen) {
            document.body.classList.add(bodyClass);
        } else {
            document.body.classList.remove(bodyClass);
        }
        return () => {
            document.body.classList.remove(bodyClass);
        };
    }, [isMobileMenuOpen]);

    const logOut = useCallback(() => {
        AuthService.logout();
        setCurrentUser(undefined);
        setIsMobileMenuOpen(false);
        navigate('/');
    }, [navigate]);

    const handleServiceAdded = useCallback(() => setRefreshServicesList(p => p + 1), []);
    const handleAppointmentAdded = useCallback(() => setRefreshAppointmentsList(p => p + 1), []);

    const handleLoginSuccess = useCallback(() => {
        const user = AuthService.getCurrentUser();
        setCurrentUser(user);
        setIsMobileMenuOpen(false);
        navigate('/my-account');
    }, [navigate]);

    const handleProfileUpdateSuccess = useCallback((updatedUserData) => {
        if (updatedUserData && (!currentUser || updatedUserData.id !== currentUser.id || updatedUserData.username !== currentUser.username || updatedUserData.email !== currentUser.email)) {
            console.log("App.js: handleProfileUpdateSuccess - currentUser wird aktualisiert.", updatedUserData);
            setCurrentUser(updatedUserData);
        } else if (!updatedUserData && currentUser) {
            setCurrentUser(AuthService.getCurrentUser());
        }
    }, [currentUser]);

    const handleProfileUpdateError = useCallback((errorMessage) => {
        console.error("App.js: Fehler beim Profilupdate:", errorMessage);
    }, []);

    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user && (!currentUser || user.id !== currentUser.id)) {
            setCurrentUser(user);
        } else if (!user && currentUser) {
            setCurrentUser(undefined);
        }

        const handleLogoutEvent = () => logOut();
        EventBus.on("logout", handleLogoutEvent);

        const handleProfileUpdatedEvent = (updatedUserFromEvent) => {
            console.log("App.js: Event 'profileUpdated' empfangen", updatedUserFromEvent);
            if (updatedUserFromEvent && (!currentUser || updatedUserFromEvent.id !== currentUser.id || updatedUserFromEvent.username !== currentUser.username)) {
                setCurrentUser(updatedUserFromEvent);
            }
        };
        EventBus.on("profileUpdated", handleProfileUpdatedEvent);

        return () => {
            EventBus.remove("logout", handleLogoutEvent);
            EventBus.remove("profileUpdated", handleProfileUpdatedEvent);
        };
    }, [logOut, currentUser]);

    useEffect(() => {
        const preloader = preloaderRef.current;
        let preloaderTimeoutId;
        if (preloader) {
            preloaderTimeoutId = setTimeout(() => preloader.classList.add('loaded'), 300);
        }
        const headerElement = headerRef.current;
        let scrollHandler;
        if (headerElement) {
            scrollHandler = () => {
                const scrolled = window.scrollY > 20;
                setIsHeaderScrolled(scrolled);
            };
            window.addEventListener('scroll', scrollHandler, { passive: true });
            scrollHandler();
        }
        return () => {
            if (preloaderTimeoutId) clearTimeout(preloaderTimeoutId);
            if (scrollHandler && headerElement) window.removeEventListener('scroll', scrollHandler);
        };
    }, []);

    useEffect(() => {
        const updateBodyPadding = () => {
            if (headerRef.current && document.body) {
                const headerHeight = headerRef.current.offsetHeight;
                document.body.style.paddingTop = `${headerHeight}px`;
            }
        };

        updateBodyPadding();

        const resizeObserver = new ResizeObserver(updateBodyPadding);
        if (headerRef.current) {
            resizeObserver.observe(headerRef.current);
        }

        const transitionTimeout = setTimeout(updateBodyPadding, 350);

        return () => {
            if (headerRef.current) {
                resizeObserver.unobserve(headerRef.current);
            }
            clearTimeout(transitionTimeout);
            if(document.body) document.body.style.paddingTop = '0';
        };
    }, [isHeaderScrolled, isMobileMenuOpen, location.pathname]);

    const navigateToBooking = useCallback((serviceName = null) => {
        if (location.pathname === "/") {
            const servicesSection = document.getElementById('services-dynamic');
            if (servicesSection) {
                servicesSection.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            navigate('/#services-dynamic');
        }
        closeMobileMenu();
    }, [navigate, closeMobileMenu, location.pathname]);

    const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);

    // Ermitteln, ob es sich um eine Dashboard-Seite handelt
    const isDashboardPage = location.pathname.startsWith('/my-account') || location.pathname.startsWith('/admin');

    const HomePageLayout = () => (
        <main>
            <HeroSection />
            <TrustBarSection />
            <ExperienceSection />
            <TestimonialsSection />
            <AboutFounderSection />
            <ServicesSection />
            <GalleryJournalSection />
            <EssentialsSection />
            <FAQSection />
            <LocationSection />
            <NewsletterSection />
        </main>
    );

    return (
        <div className="App">
            <div id="preloader" ref={preloaderRef}><span className="loader-char">IMW</span></div>
            <Header
                currentUser={currentUser}
                isMobileMenuOpen={isMobileMenuOpen}
                toggleMobileMenu={toggleMobileMenu}
                closeMobileMenu={closeMobileMenu}
                isHeaderScrolled={isHeaderScrolled}
                headerRef={headerRef}
                navigateToBooking={navigateToBooking}
                logOut={logOut}
                // Neue Prop, um dem Header mitzuteilen, auf welcher Art von Seite er sich befindet
                pageType={isDashboardPage ? "dashboard" : "default"}
            />
            <Routes>
                <Route path="/" element={<HomePageLayout />} />

                <Route
                    path="/login"
                    element={
                        currentUser ? <Navigate to="/my-account" replace /> :
                            <div className="page-center-content">
                                <Login onLoginSuccess={handleLoginSuccess} />
                            </div>
                    }
                />
                <Route
                    path="/register"
                    element={
                        currentUser ? <Navigate to="/my-account" replace /> :
                            <div className="page-center-content">
                                <Register />
                            </div>
                    }
                />
                <Route
                    path="/my-account" // Hauptroute für das Benutzer-Dashboard
                    element={
                        <ProtectedRoute currentUser={currentUser} redirectPath="/login">
                            <AccountDashboard
                                currentUser={currentUser}
                                logOut={logOut}
                                onAppointmentAdded={handleAppointmentAdded}
                                refreshAppointmentsList={refreshAppointmentsList}
                                onServiceAdded={handleServiceAdded}
                                refreshServicesList={refreshServicesList}
                                onProfileUpdateSuccess={handleProfileUpdateSuccess}
                                onProfileUpdateError={handleProfileUpdateError}
                            />
                        </ProtectedRoute>
                    }
                />
                {/* Beispiel für Admin-Routen, falls dein AdminDashboard verschachtelte Routen verwendet */}
                {/* Wenn AccountDashboard bereits Admin-Routen intern handhabt, ist dies nicht nötig */}
                {/* <Route path="/admin/*" element={
                    <ProtectedRoute currentUser={currentUser} roles={["ROLE_ADMIN"]}>
                        <AdminDashboardLayout> // Deine Admin-Layout-Komponente
                             <Routes>
                                <Route path="dashboard" element={<AdminDashboardStats />} />
                                // Weitere Admin-Unterrouten
                            </Routes>
                        </AdminDashboardLayout>
                    </ProtectedRoute>
                } />
                */}

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Footer />
            <AuthVerify logOut={logOut} />
        </div>
    );
}

export default App;
