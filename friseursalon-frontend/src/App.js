import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import { Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

// Dynamische Komponenten
import Login from './components/Login';
import AuthService from './services/auth.service';
import AuthVerify from './common/AuthVerify';
import EventBus from './common/EventBus';

// Statische Design-Komponenten
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
import Footer from './components/Footer';

// Seiten
import BookingPage from './pages/BookingPage';
import AccountDashboard from './pages/AccountDashboard';

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

    const [refreshServicesList, setRefreshServicesList] = useState(0); // Wird das noch gebraucht?
    const [refreshAppointmentsList, setRefreshAppointmentsList] = useState(0); // Wird das noch gebraucht?

    const headerRef = useRef(null);
    const preloaderRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Schließt mobiles Menü bei Routenänderung
    useEffect(() => {
        closeMobileMenu();
    }, [location.pathname]); // Nur bei Pfadänderung

    // Body-Klasse für Scroll-Sperre bei offenem mobilen Menü
    useEffect(() => {
        const bodyClass = 'mobile-menu-active';
        if (isMobileMenuOpen) {
            document.body.classList.add(bodyClass);
            document.documentElement.classList.add(bodyClass); // Für html-Tag
        } else {
            document.body.classList.remove(bodyClass);
            document.documentElement.classList.remove(bodyClass);
        }
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

    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user) setCurrentUser(user);

        const handleLogoutEvent = () => logOut();
        EventBus.on("logout", handleLogoutEvent);
        return () => EventBus.remove("logout", handleLogoutEvent);
    }, [logOut]);

    // Preloader und Sticky Header
    useEffect(() => {
        const preloader = preloaderRef.current;
        let preloaderTimeoutId;
        if (preloader) {
            preloaderTimeoutId = setTimeout(() => preloader.classList.add('loaded'), 300); // Schnellere Preloader-Zeit
        }

        const header = headerRef.current;
        let scrollHandler;
        if (header) {
            scrollHandler = () => {
                const scrolled = window.scrollY > 20; // Früher "scrolled"
                header.classList.toggle('scrolled', scrolled);
                setIsHeaderScrolled(scrolled); // Nur den State setzen, Klasse wird direkt manipuliert
            };
            window.addEventListener('scroll', scrollHandler, { passive: true });
            scrollHandler(); // Initialer Check
        }
        return () => {
            if (preloaderTimeoutId) clearTimeout(preloaderTimeoutId);
            if (scrollHandler && header) window.removeEventListener('scroll', scrollHandler);
        };
    }, []);

    // Dynamisches Body-Padding basierend auf Header-Höhe
    useEffect(() => {
        const updateBodyPadding = () => {
            if (headerRef.current) {
                const headerHeight = headerRef.current.offsetHeight;
                document.body.style.paddingTop = `${headerHeight}px`;
            }
        };

        updateBodyPadding(); // Initial
        const resizeObserver = new ResizeObserver(updateBodyPadding);
        if (headerRef.current) {
            resizeObserver.observe(headerRef.current);
        }

        // Timeout, um die Höhe nach CSS-Transitionen des Headers (z.B. beim Scrollen) neu zu berechnen
        const transitionTimeout = setTimeout(updateBodyPadding, 300);

        return () => {
            if (headerRef.current) resizeObserver.unobserve(headerRef.current);
            clearTimeout(transitionTimeout);
        };
    }, [isHeaderScrolled, isMobileMenuOpen, location.pathname]); // Reagiert auf relevante Änderungen

    const openBookingModal = useCallback((serviceName = null) => {
        const path = serviceName ? `/buchen/${encodeURIComponent(serviceName)}` : '/buchen';
        navigate(path);
        closeMobileMenu();
    }, [navigate]);

    const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
                openBookingModal={openBookingModal}
            />
            <GalleryJournalSection />
            <EssentialsSection />
            <FAQSection />
            <LocationSection openBookingModal={openBookingModal} />
            <NewsletterSection />
        </main>
    );

    return (
        <div className="App">
            <div id="preloader" ref={preloaderRef}><span className="loader-char">IMW</span></div>

            <header
                className={`header ${isHeaderScrolled ? 'scrolled' : ''} ${isMobileMenuOpen ? 'menu-open-header-state' : ''}`}
                id="header"
                ref={headerRef}
            >
                <div className="container navbar">
                    <Link to="/" className="logo" onClick={closeMobileMenu}>IMW</Link>

                    <button
                        className="mobile-menu-toggle"
                        onClick={toggleMobileMenu}
                        aria-label="Menü öffnen/schließen"
                        aria-expanded={isMobileMenuOpen}
                    >
                        <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
                    </button>

                    <nav className={`nav-links-container ${isMobileMenuOpen ? 'open' : ''}`} id="main-nav">
                        <div className="main-nav-group">
                            <a href="/#experience" className="interactive nav-link-item" onClick={closeMobileMenu}>Erfahrung</a>
                            <a href="/#about-founder" className="interactive nav-link-item" onClick={closeMobileMenu}>Über Mich</a>
                            <a href="/#services-dynamic" className="interactive nav-link-item" onClick={closeMobileMenu}>Services</a>
                            <a href="/#gallery-journal" className="interactive nav-link-item" onClick={closeMobileMenu}>Galerie</a>
                            <a href="/#faq" className="interactive nav-link-item" onClick={closeMobileMenu}>FAQ</a>
                        </div>

                        <div className="nav-auth-actions">
                            {currentUser ? (
                                <Link to="/my-account" className="interactive nav-link-item account-link" onClick={closeMobileMenu}>
                                    <FontAwesomeIcon icon={faUserCircle} /> Mein Account
                                </Link>
                            ) : (
                                <Link to="/login" className="interactive nav-link-item login-link" onClick={closeMobileMenu}>Login</Link>
                            )}
                            <Link to="/buchen" className="button-link interactive nav-cta" onClick={closeMobileMenu}>Termin buchen</Link>
                        </div>
                    </nav>
                </div>
            </header>

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
