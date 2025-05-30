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
    const [currentUser, setCurrentUser] = useState(undefined);
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
            document.documentElement.classList.add(bodyClass);
        } else {
            document.body.classList.remove(bodyClass);
            document.documentElement.classList.remove(bodyClass);
        }
        return () => {
            document.body.classList.remove(bodyClass);
            document.documentElement.classList.remove(bodyClass);
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

    // NEW: Callback to handle profile update from AccountDashboard
    const handleProfileUpdateSuccess = useCallback((updatedPartialUser) => {
        // When profile is updated, AuthService.getCurrentUser() should ideally return the fresh user
        // if AuthService.updateProfile (which is still a stub) updates localStorage.
        // For a robust solution, the backend should return the full updated user object,
        // and that should be used to set the state and update localStorage.

        // Attempt to get the latest from localStorage (assuming AuthService.updateProfile updates it)
        const freshUserFromStorage = AuthService.getCurrentUser();
        if (freshUserFromStorage && freshUserFromStorage.id === updatedPartialUser.id) {
            // If the user in storage matches the one being updated, use it
            setCurrentUser(freshUserFromStorage);
        } else {
            // Fallback: merge the partial update with the existing currentUser state
            // This is less ideal if other parts of currentUser (like roles, token) could change
            // or if updatedPartialUser doesn't contain all necessary fields.
            setCurrentUser(prevUser => {
                if (prevUser && prevUser.id === updatedPartialUser.id) {
                    return { ...prevUser, ...updatedPartialUser };
                }
                return prevUser; // Or handle error/logout if IDs don't match
            });
        }
        console.log("App.js: currentUser updated after profile save.");
    }, []);


    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
        }
        const handleLogoutEvent = () => logOut();
        EventBus.on("logout", handleLogoutEvent);
        return () => {
            EventBus.remove("logout", handleLogoutEvent);
        };
    }, [logOut]);

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
            if (headerRef.current) {
                const headerHeight = headerRef.current.offsetHeight;
                document.body.style.paddingTop = `${headerHeight}px`;
            }
        };
        updateBodyPadding();
        const resizeObserver = new ResizeObserver(updateBodyPadding);
        if (headerRef.current) {
            resizeObserver.observe(headerRef.current);
        }
        const transitionTimeout = setTimeout(updateBodyPadding, 300);
        return () => {
            if (headerRef.current) {
                resizeObserver.unobserve(headerRef.current);
            }
            clearTimeout(transitionTimeout);
            document.body.style.paddingTop = '0';
        };
    }, [isHeaderScrolled, isMobileMenuOpen, location.pathname]);

    const navigateToBooking = useCallback((serviceName = null) => {
        const path = serviceName ? `/buchen/${encodeURIComponent(serviceName)}` : '/buchen';
        navigate(path);
        closeMobileMenu();
    }, [navigate, closeMobileMenu]);

    const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);

    const HomePageLayout = () => (
        <main>
            <HeroSection />
            <TrustBarSection />
            <ExperienceSection />
            <TestimonialsSection />
            <AboutFounderSection />
            <ServicesSection
                currentUser={currentUser}
                onServiceAdded={handleServiceAdded}
                refreshServicesList={refreshServicesList}
                openBookingModal={navigateToBooking}
            />
            <GalleryJournalSection />
            <EssentialsSection />
            <FAQSection />
            <LocationSection openBookingModal={navigateToBooking} />
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
            />
            <Routes>
                <Route path="/" element={<HomePageLayout />} />
                <Route path="/buchen" element={<BookingPage onAppointmentAdded={handleAppointmentAdded} currentUser={currentUser} onLoginSuccess={handleLoginSuccess} />} />
                <Route path="/buchen/:serviceName" element={<BookingPage onAppointmentAdded={handleAppointmentAdded} currentUser={currentUser} onLoginSuccess={handleLoginSuccess} />} />
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
                    path="/my-account"
                    element={
                        <ProtectedRoute currentUser={currentUser} redirectPath="/login">
                            <AccountDashboard
                                currentUser={currentUser}
                                logOut={logOut}
                                onAppointmentAdded={handleAppointmentAdded}
                                refreshAppointmentsList={refreshAppointmentsList}
                                onServiceAdded={handleServiceAdded}
                                refreshServicesList={refreshServicesList}
                                onProfileUpdateSuccess={handleProfileUpdateSuccess} // Pass new prop
                            />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Footer />
            <AuthVerify logOut={logOut} />
        </div>
    );
}

export default App;
