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
import Register from './components/Register'; // Pfad anpassen, falls nötig

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

    // Diese Funktion wird immer noch als Prop weitergegeben, aber der EventBus ist der primäre Updater
    const handleProfileUpdateSuccess = useCallback((updatedUserData) => {
        // Es ist gut, hier den State zu setzen, falls das Event aus irgendeinem Grund nicht ankommt
        // oder wenn eine sofortige Reaktion in der aufrufenden Komponente gewünscht ist.
        // Der EventBus sorgt aber für eine robustere Aktualisierung des globalen States.
        if (updatedUserData && updatedUserData.id === currentUser?.id) {
            setCurrentUser(updatedUserData);
        } else {
            // Wenn keine UserData übergeben werden oder ID nicht passt, hole den User neu
            setCurrentUser(AuthService.getCurrentUser());
        }
        console.log("App.js: handleProfileUpdateSuccess aufgerufen, currentUser potenziell aktualisiert.", updatedUserData);
    }, [currentUser]); // currentUser als Abhängigkeit hinzugefügt

    const handleProfileUpdateError = useCallback((errorMessage) => {
        console.error("App.js: Fehler beim Profilupdate:", errorMessage);
    }, []);

    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
        }

        const handleLogoutEvent = () => logOut();
        EventBus.on("logout", handleLogoutEvent);

        // Event-Listener für Profilaktualisierungen
        const handleProfileUpdatedEvent = (updatedUserFromEvent) => {
            console.log("App.js: Event 'profileUpdated' empfangen", updatedUserFromEvent);
            setCurrentUser(updatedUserFromEvent); // Direkt den User aus dem Event nehmen
        };
        EventBus.on("profileUpdated", handleProfileUpdatedEvent);

        return () => {
            EventBus.remove("logout", handleLogoutEvent);
            EventBus.remove("profileUpdated", handleProfileUpdatedEvent); // Listener entfernen
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
                <Route path="/buchen" element={<BookingPage onAppointmentAdded={handleAppointmentAdded} currentUser={currentUser} onLoginSuccess={handleLoginSuccess}/>} />
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
                {/* HINZUGEFÜGTE ROUTE FÜR REGISTRIERUNG */}
                <Route
                    path="/register"
                    element={
                        currentUser ? <Navigate to="/my-account" replace /> : // Wenn bereits eingeloggt, zum Konto weiterleiten
                            <div className="page-center-content">
                                <Register />
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
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Footer />
            <AuthVerify logOut={logOut} />
        </div>
    );
}

export default App;
