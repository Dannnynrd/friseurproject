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
        // Check if admin to redirect appropriately
        if (user && user.roles && user.roles.includes('ROLE_ADMIN')) {
            navigate('/my-account?tab=admin-dashboard');
        } else {
            navigate('/my-account');
        }
    }, [navigate]);

    const handleProfileUpdateSuccess = useCallback((updatedUserData) => {
        // AuthService.updateProfile now updates localStorage and dispatches an event.
        // This handler will be called by the EventBus listener.
        // We can simply re-fetch the user from AuthService to ensure consistency.
        const refreshedUser = AuthService.getCurrentUser();
        if (refreshedUser) {
            console.log("App.js: handleProfileUpdateSuccess (via EventBus) - currentUser wird aktualisiert mit:", refreshedUser);
            setCurrentUser(refreshedUser);
        }
    }, []);


    const handleProfileUpdateError = useCallback((errorMessage) => {
        console.error("App.js: Fehler beim Profilupdate:", errorMessage);
        // Optionally: display a global error message to the user
    }, []);

    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user) {
            // More robust check to prevent unnecessary updates if user object is identical
            if (!currentUser || JSON.stringify(user) !== JSON.stringify(currentUser)) {
                setCurrentUser(user);
            }
        } else if (currentUser) { // If no user in localStorage but currentUser state exists, clear it
            setCurrentUser(undefined);
        }

        const handleLogoutEvent = () => logOut();
        EventBus.on("logout", handleLogoutEvent);

        const handleProfileUpdatedEvent = (updatedUserFromEvent) => {
            console.log("App.js: Event 'profileUpdated' empfangen", updatedUserFromEvent);
            // Check if the received data is different before updating, to prevent unnecessary re-renders
            if (updatedUserFromEvent &&
                (!currentUser ||
                    updatedUserFromEvent.id !== currentUser.id ||
                    updatedUserFromEvent.email !== currentUser.email || // Use email
                    updatedUserFromEvent.firstName !== currentUser.firstName ||
                    updatedUserFromEvent.lastName !== currentUser.lastName ||
                    updatedUserFromEvent.phoneNumber !== currentUser.phoneNumber ||
                    JSON.stringify(updatedUserFromEvent.roles) !== JSON.stringify(currentUser.roles) // Also check roles
                )) {
                setCurrentUser(updatedUserFromEvent);
            }
        };
        EventBus.on("profileUpdated", handleProfileUpdatedEvent);

        return () => {
            EventBus.remove("logout", handleLogoutEvent);
            EventBus.remove("profileUpdated", handleProfileUpdatedEvent);
        };
    }, [logOut, currentUser]); // currentUser is a dependency to re-evaluate if it changes externally

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
            scrollHandler(); // Initial check
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

        updateBodyPadding(); // Initial call

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

    // Modified navigateToBooking
    const navigateToBooking = useCallback((serviceName = null) => {
        if (serviceName) {
            navigate(`/buchen/${encodeURIComponent(serviceName)}`);
        } else {
            navigate('/buchen');
        }
        closeMobileMenu();
    }, [navigate, closeMobileMenu]);


    const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);

    const isDashboardPage = location.pathname.startsWith('/my-account');

    const HomePageLayout = () => (
        <main>
            <HeroSection />
            <TrustBarSection />
            <ExperienceSection />
            <TestimonialsSection />
            <AboutFounderSection />
            {/* Pass navigateToBooking to ServicesSection */}
            <ServicesSection openBookingModal={navigateToBooking} />
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
                pageType={isDashboardPage ? "dashboard" : "default"}
            />
            <Routes>
                <Route path="/" element={<HomePageLayout />} />
                {/* Added routes for BookingPage */}
                <Route path="/buchen" element={<BookingPage onAppointmentAdded={handleAppointmentAdded} currentUser={currentUser} onLoginSuccess={handleLoginSuccess} />} />
                <Route path="/buchen/:serviceName" element={<BookingPage onAppointmentAdded={handleAppointmentAdded} currentUser={currentUser} onLoginSuccess={handleLoginSuccess}/>} />


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
                                <Register /> {/* Assuming Register component does not need onLoginSuccess */}
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
                                onProfileUpdateSuccess={handleProfileUpdateSuccess}
                                onProfileUpdateError={handleProfileUpdateError}
                            />
                        </ProtectedRoute>
                    }
                />
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Footer />
            <AuthVerify logOut={logOut} />
        </div>
    );
}

export default App;