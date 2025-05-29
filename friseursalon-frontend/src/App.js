// Datei: friseursalon-frontend/src/App.js
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
        // Wenn kein Benutzer angemeldet ist, zur Login-Seite weiterleiten
        return <Navigate to={redirectPath} replace />;
    }
    // Wenn Benutzer angemeldet ist, die angeforderte Komponente rendern
    return children;
};

function App() {
    // State für den aktuell angemeldeten Benutzer
    const [currentUser, setCurrentUser] = useState(undefined);
    // State für die Sichtbarkeit des mobilen Menüs
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    // State, um zu erkennen, ob der Header gescrollt wurde (für Styling-Änderungen)
    const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);

    // States, um Aktualisierungen in Kindkomponenten auszulösen
    const [refreshServicesList, setRefreshServicesList] = useState(0);
    const [refreshAppointmentsList, setRefreshAppointmentsList] = useState(0);

    // Refs für DOM-Elemente
    const headerRef = useRef(null);
    const preloaderRef = useRef(null);

    // Hooks von react-router-dom für Navigation und aktuellen Standort
    const navigate = useNavigate();
    const location = useLocation();

    // Schließt das mobile Menü (optimiert mit useCallback)
    const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

    // Effekt, der das mobile Menü schließt, wenn sich der Pfad ändert
    useEffect(() => {
        closeMobileMenu();
    }, [location.pathname, closeMobileMenu]);

    // Effekt, der die body-Klasse für das offene mobile Menü verwaltet (verhindert Scrollen des Body)
    useEffect(() => {
        const bodyClass = 'mobile-menu-active';
        if (isMobileMenuOpen) {
            document.body.classList.add(bodyClass);
            document.documentElement.classList.add(bodyClass);
        } else {
            document.body.classList.remove(bodyClass);
            document.documentElement.classList.remove(bodyClass);
        }
        // Cleanup-Funktion, um die Klasse beim Unmounten der Komponente zu entfernen
        return () => {
            document.body.classList.remove(bodyClass);
            document.documentElement.classList.remove(bodyClass);
        };
    }, [isMobileMenuOpen]);

    // Funktion zum Ausloggen des Benutzers (optimiert mit useCallback)
    const logOut = useCallback(() => {
        AuthService.logout(); // Benutzerdaten aus dem LocalStorage entfernen
        setCurrentUser(undefined); // Benutzerstatus in der App zurücksetzen
        setIsMobileMenuOpen(false); // Mobiles Menü schließen
        navigate('/'); // Zur Startseite navigieren
    }, [navigate]);

    // Callbacks, um das Neuladen von Listen in Kindkomponenten zu triggern
    const handleServiceAdded = useCallback(() => setRefreshServicesList(p => p + 1), []);
    const handleAppointmentAdded = useCallback(() => setRefreshAppointmentsList(p => p + 1), []);

    // Callback nach erfolgreichem Login (optimiert mit useCallback)
    const handleLoginSuccess = useCallback(() => {
        const user = AuthService.getCurrentUser();
        setCurrentUser(user);
        setIsMobileMenuOpen(false); // Mobiles Menü schließen
        navigate('/my-account'); // Zum Account-Dashboard navigieren
    }, [navigate]);

    // Effekt zum Initialisieren des Benutzerstatus und zum Einrichten des Logout-Event-Listeners
    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
        }

        // Event-Listener für globales Logout-Event (z.B. bei Token-Ablauf)
        const handleLogoutEvent = () => logOut();
        EventBus.on("logout", handleLogoutEvent);
        // Cleanup-Funktion, um Event-Listener beim Unmounten zu entfernen
        return () => {
            EventBus.remove("logout", handleLogoutEvent);
        };
    }, [logOut]);

    // Effekt für Preloader und Scroll-Verhalten des Headers
    useEffect(() => {
        const preloader = preloaderRef.current;
        let preloaderTimeoutId;
        if (preloader) {
            // Preloader nach kurzer Verzögerung ausblenden
            preloaderTimeoutId = setTimeout(() => preloader.classList.add('loaded'), 300);
        }

        const headerElement = headerRef.current;
        let scrollHandler;
        if (headerElement) {
            // Handler, um festzustellen, ob die Seite gescrollt wurde
            scrollHandler = () => {
                const scrolled = window.scrollY > 20;
                setIsHeaderScrolled(scrolled);
            };
            window.addEventListener('scroll', scrollHandler, { passive: true });
            scrollHandler(); // Initialer Check beim Laden
        }
        // Cleanup-Funktion
        return () => {
            if (preloaderTimeoutId) clearTimeout(preloaderTimeoutId);
            if (scrollHandler && headerElement) window.removeEventListener('scroll', scrollHandler);
        };
    }, []);

    // Effekt zum Anpassen des Body-Paddings basierend auf der Header-Höhe
    useEffect(() => {
        const updateBodyPadding = () => {
            if (headerRef.current) {
                const headerHeight = headerRef.current.offsetHeight;
                document.body.style.paddingTop = `${headerHeight}px`;
            }
        };
        updateBodyPadding(); // Initial aufrufen
        // ResizeObserver, um auf Größenänderungen des Headers zu reagieren
        const resizeObserver = new ResizeObserver(updateBodyPadding);
        if (headerRef.current) {
            resizeObserver.observe(headerRef.current);
        }
        // Timeout, um sicherzustellen, dass das Padding nach CSS-Transitionen korrekt ist
        const transitionTimeout = setTimeout(updateBodyPadding, 300);

        // Cleanup-Funktion
        return () => {
            if (headerRef.current) {
                resizeObserver.unobserve(headerRef.current);
            }
            clearTimeout(transitionTimeout);
            document.body.style.paddingTop = '0'; // Padding beim Unmounten zurücksetzen
        };
    }, [isHeaderScrolled, isMobileMenuOpen, location.pathname]);

    // Funktion zum Navigieren zur Buchungsseite (optimiert mit useCallback)
    // Wird jetzt `navigateToBooking` genannt für mehr Klarheit.
    const navigateToBooking = useCallback((serviceName = null) => {
        const path = serviceName ? `/buchen/${encodeURIComponent(serviceName)}` : '/buchen';
        console.log('Navigating to (navigateToBooking):', path); // Debugging
        navigate(path);
        closeMobileMenu(); // Mobiles Menü nach Navigation schließen
    }, [navigate, closeMobileMenu]);

    // Funktion zum Umschalten des mobilen Menüs
    const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);

    // Layout-Komponente für die Startseite
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
                openBookingModal={navigateToBooking} // Hier die umbenannte Funktion verwenden
            />
            <GalleryJournalSection />
            <EssentialsSection />
            <FAQSection />
            <LocationSection openBookingModal={navigateToBooking} /> {/* Hier die umbenannte Funktion verwenden */}
            <NewsletterSection />
        </main>
    );

    return (
        <div className="App">
            {/* Preloader-Element */}
            <div id="preloader" ref={preloaderRef}><span className="loader-char">IMW</span></div>

            {/* Header-Komponente */}
            <Header
                currentUser={currentUser}
                isMobileMenuOpen={isMobileMenuOpen}
                toggleMobileMenu={toggleMobileMenu}
                closeMobileMenu={closeMobileMenu}
                isHeaderScrolled={isHeaderScrolled}
                headerRef={headerRef}
                navigateToBooking={navigateToBooking} // Prop hier übergeben (umbenannt)
            />

            {/* Routen-Definitionen */}
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
