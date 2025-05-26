import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css'; // Dein gesamtes CSS
import { Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom'; // useLocation hinzugefügt
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faSignOutAlt, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

// Importiere alle dynamischen Komponenten
import Login from './components/Login';
import AuthService from './services/auth.service';
import AuthVerify from './common/AuthVerify';
import EventBus from './common/EventBus';

// Importiere alle statischen Design-Komponenten
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

// Importiere die Seiten
import BookingPage from './pages/BookingPage';
import AccountDashboard from './pages/AccountDashboard';

const ProtectedRoute = ({ children, currentUser, redirectPath = '/login' }) => {
    if (!currentUser) {
        return <Navigate to={redirectPath} replace />;
    }
    return children;
};

function App() {
    const [refreshServicesList, setRefreshServicesList] = useState(0);
    const [refreshAppointmentsList, setRefreshAppointmentsList] = useState(0);
    const [currentUser, setCurrentUser] = useState(undefined);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);


    const headerRef = useRef(null);
    const cursorRef = useRef(null);
    const preloaderRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation(); // Um auf Routenänderungen zu reagieren

    // Schließe das mobile Menü bei Routenänderung
    useEffect(() => {
        closeMobileMenu();
    }, [location]);

    const logOut = useCallback(() => {
        AuthService.logout();
        setCurrentUser(undefined);
        setIsMobileMenuOpen(false);
        navigate('/');
    }, [navigate]);

    const handleServiceAdded = useCallback(() => setRefreshServicesList(prev => prev + 1), []);
    const handleAppointmentAdded = useCallback(() => setRefreshAppointmentsList(prev => prev + 1), []);

    const handleLoginSuccess = useCallback(() => {
        const user = AuthService.getCurrentUser();
        setCurrentUser(user);
        setIsMobileMenuOpen(false);
        navigate('/my-account');
    }, [navigate]);

    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
        }
        const handleLogoutEvent = () => logOut();
        EventBus.on("logout", handleLogoutEvent);
        return () => EventBus.remove("logout", handleLogoutEvent);
    }, [logOut]);

    // Preloader, Cursor, Sticky Header Effekte
    useEffect(() => {
        const preloader = preloaderRef.current;
        let preloaderTimeoutId;
        if (preloader) {
            preloaderTimeoutId = setTimeout(() => preloader.classList.add('loaded'), 1000);
        }

        const cursor = cursorRef.current;
        let mouseMoveHandler, mouseEnterHandler, mouseLeaveHandler;
        let interactiveElements = [];

        if (window.innerWidth > 768 && cursor) {
            mouseMoveHandler = e => {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
            };
            window.addEventListener('mousemove', mouseMoveHandler);

            // Selektiere Elemente dynamisch, nachdem die Seite geladen ist
            interactiveElements = Array.from(document.querySelectorAll('.interactive'));
            mouseEnterHandler = () => cursor.classList.add('hovered');
            mouseLeaveHandler = () => cursor.classList.remove('hovered');

            interactiveElements.forEach(el => {
                el.addEventListener('mouseenter', mouseEnterHandler);
                el.addEventListener('mouseleave', mouseLeaveHandler);
            });
        }

        const header = headerRef.current;
        let scrollHandler;
        if (header) {
            scrollHandler = () => {
                const scrolled = window.scrollY > 50;
                header.classList.toggle('scrolled', scrolled);
                setIsHeaderScrolled(scrolled); // State aktualisieren
            };
            window.addEventListener('scroll', scrollHandler);
            scrollHandler(); // Initialer Check
        }

        return () => {
            if (preloaderTimeoutId) clearTimeout(preloaderTimeoutId);
            if (mouseMoveHandler) window.removeEventListener('mousemove', mouseMoveHandler);
            interactiveElements.forEach(el => {
                el.removeEventListener('mouseenter', mouseEnterHandler);
                el.removeEventListener('mouseleave', mouseLeaveHandler);
            });
            if (scrollHandler && header) window.removeEventListener('scroll', scrollHandler);
        };
    }, []); // Leeres Array, damit es nur beim Mounten/Unmounten läuft


    const openBookingModal = useCallback((serviceName = null) => {
        const path = serviceName ? `/buchen/${encodeURIComponent(serviceName)}` : '/buchen';
        navigate(path);
        closeMobileMenu(); // Menü schließen
    }, [navigate]);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
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
            <div id="cursor-dot" ref={cursorRef}></div>
            <div id="preloader" ref={preloaderRef}><span className="loader-char">IMW</span></div>

            <header className={`header ${isHeaderScrolled ? 'scrolled' : ''}`} id="header" ref={headerRef}>
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

                    <nav className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`} id="main-nav">
                        <a href="/#experience" className="interactive nav-link-item" onClick={closeMobileMenu}>Erfahrung</a>
                        <a href="/#about-founder" className="interactive nav-link-item" onClick={closeMobileMenu}>Über Mich</a>
                        <a href="/#services-dynamic" className="interactive nav-link-item" onClick={closeMobileMenu}>Services</a>
                        <a href="/#gallery-journal" className="interactive nav-link-item" onClick={closeMobileMenu}>Galerie</a>
                        <a href="/#faq" className="interactive nav-link-item" onClick={closeMobileMenu}>FAQ</a>

                        <div className="nav-auth-actions">
                            {currentUser ? (
                                <>
                                    <Link to="/my-account" className="interactive nav-link-item" onClick={closeMobileMenu}>
                                        <FontAwesomeIcon icon={faUserCircle} /> Mein Account
                                    </Link>
                                    <button onClick={() => { logOut(); closeMobileMenu(); }} className="interactive nav-button-like nav-link-item">
                                        <FontAwesomeIcon icon={faSignOutAlt} /> Abmelden
                                    </button>
                                </>
                            ) : (
                                <Link to="/login" className="interactive nav-link-item" onClick={closeMobileMenu}>Login</Link>
                            )}
                            <Link to="/buchen" className="button-link interactive nav-cta nav-link-item" onClick={closeMobileMenu}>Termin buchen</Link>
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
                            <div className="page-center-content"> {/* Eigene Klasse für Zentrierung */}
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
