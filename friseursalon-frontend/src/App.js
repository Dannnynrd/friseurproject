import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css'; // Hier kommt dein gesamtes CSS rein!
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';

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
import ServicesSection from './components/ServicesSection'; // Diese Sektion enthält bedingt ServiceForm/ServiceList
import GalleryJournalSection from './components/GalleryJournalSection';
import EssentialsSection from './components/EssentialsSection';
import FAQSection from './components/FAQSection';
import LocationSection from './components/LocationSection';
import NewsletterSection from './components/NewsletterSection';
import Footer from './components/Footer';

// Importiere die neuen Seiten
import BookingPage from './pages/BookingPage';
import AccountDashboard from './pages/AccountDashboard';


// Helper-Komponente für geschützte Routen
// Leitet Benutzer um, wenn sie nicht angemeldet sind
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

    // Refs für globale DOM-Elemente, die von JavaScript manipuliert werden
    const headerRef = useRef(null);
    const cursorRef = useRef(null);
    const preloaderRef = useRef(null);

    // Hook für die programmatische Navigation
    const navigate = useNavigate();


    // Callback-Funktionen für Datenaktualisierungen und Login/Logout
    const logOut = useCallback(() => {
        AuthService.logout();
        setCurrentUser(undefined);
        setRefreshServicesList(prev => prev + 1);
        setRefreshAppointmentsList(prev => prev + 1);
        navigate('/');
    }, [navigate]);

    const handleServiceAdded = useCallback(() => {
        setRefreshServicesList(prev => prev + 1);
    }, []);

    const handleAppointmentAdded = useCallback(() => {
        setRefreshAppointmentsList(prev => prev + 1);
    }, []);

    const handleLoginSuccess = useCallback(() => {
        const user = AuthService.getCurrentUser();
        setCurrentUser(user);
        console.log('App.js (Login Success): currentUser Objekt:', user);
        console.log('App.js (Login Success): Rollen des Benutzers:', user?.roles);
        console.log('App.js (Login Success): Ist Admin?', user?.roles?.includes("ROLE_ADMIN"));
        setRefreshServicesList(prev => prev + 1);
        setRefreshAppointmentsList(prev => prev + 1);
        navigate('/my-account'); // NEU: Nach erfolgreichem Login zum Account Dashboard navigieren
    }, [navigate]);


    // Effekt für den initialen Benutzer-Check und EventBus-Listener
    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
            console.log('App.js (Initial Load): currentUser aus localStorage:', user);
            console.log('App.js (Initial Load): Rollen des Benutzers:', user?.roles);
            console.log('App.js (Initial Load): Ist Admin?', user?.roles?.includes("ROLE_ADMIN"));
        }
        const handleLogoutEvent = () => {
            logOut();
        };

        EventBus.on("logout", handleLogoutEvent);

        return () => {
            EventBus.remove("logout", handleLogoutEvent);
        };
    }, [logOut]);


    // Effekt für Custom Cursor und Preloader (VEREINFACHTE VERSION)
    useEffect(() => {
        const preloader = preloaderRef.current;
        let preloaderTimeoutId;
        if (preloader) {
            preloaderTimeoutId = setTimeout(() => {
                preloader.classList.add('loaded');
            }, 1000);
        }

        const cursor = cursorRef.current;
        let mouseMoveHandler, mouseEnterHandler, mouseLeaveHandler;

        if (window.innerWidth > 768 && cursor) {
            mouseMoveHandler = e => {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
            };
            window.addEventListener('mousemove', mouseMoveHandler);

            mouseEnterHandler = (event) => {
                if (event.target && typeof event.target.closest === 'function') {
                    const target = event.target.closest('.interactive');
                    if (target) {
                        cursor.classList.add('hovered');
                    }
                }
            };
            mouseLeaveHandler = (event) => {
                if (event.target && typeof event.target.closest === 'function') {
                    const target = event.target.closest('.interactive');
                    if (target) {
                        cursor.classList.remove('hovered');
                    }
                }
            };

            document.addEventListener('mouseenter', mouseEnterHandler, true);
            document.addEventListener('mouseleave', mouseLeaveHandler, true);
        }

        return () => {
            if (preloaderTimeoutId) {
                clearTimeout(preloaderTimeoutId);
            }
            if (window.innerWidth > 768 && cursor) {
                window.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseenter', mouseEnterHandler, true);
                document.removeEventListener('mouseleave', mouseLeaveHandler, true);
            }
        };
    }, []);


    // Effekt für Sticky Header
    useEffect(() => {
        const header = headerRef.current;
        if (header) {
            const handleScroll = () => {
                header.classList.toggle('scrolled', window.scrollY > 50);
            };
            window.addEventListener('scroll', handleScroll);
            return () => {
                window.removeEventListener('scroll', handleScroll);
            };
        }
    }, []);


    // Funktion zum Öffnen des Buchungsmodals, jetzt leitet sie zur Buchungsseite weiter
    const openBookingModal = useCallback((serviceName = null) => {
        const path = serviceName ? `/buchen/${encodeURIComponent(serviceName)}` : '/buchen';
        navigate(path);
    }, [navigate]);


    return (
        <div className="App">
            {/* Preloader und Cursor Divs */}
            <div id="cursor-dot" ref={cursorRef}></div>
            <div id="preloader" ref={preloaderRef}><span className="loader-char">IMW</span></div>

            {/* HEADER & NAVIGATION */}
            <header className="header" id="header" ref={headerRef}>
                <div className="container navbar">
                    {/* Links nutzen Link-Komponente von React Router */}
                    <Link to="/" className="logo">IMW</Link>
                    <nav className="nav-links">
                        {/* Navigationslinks mit a href, da sie zu Ankern auf der aktuellen Seite scrollen sollen */}
                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                        <a href="#experience" className="interactive">Erfahrung</a>
                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                        <a href="#about-founder" className="interactive">Über Mich</a>
                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                        <a href="#services-dynamic" className="interactive">Services</a>
                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                        <a href="#gallery-journal" className="interactive">Galerie</a>
                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                        <a href="#faq" className="interactive">FAQ</a>
                    </nav>
                    {/* HIER IST DIE NEUE LOGIK FÜR HEADER-BUTTONS */}
                    {currentUser ? (
                        // Wenn angemeldet: Nur "Mein Account" Button anzeigen
                        <Link to="/my-account" className="button-link interactive">Mein Account</Link>
                    ) : (
                        // Wenn nicht angemeldet: Nur den "Termin buchen" Button anzeigen
                        <Link to="/buchen" className="button-link interactive" id="open-modal-btn">Termin buchen</Link>
                    )}
                </div>
            </header>

            {/* Hier definieren wir die Routen */}
            <Routes>
                {/* Haupt-Homepage Route */}
                <Route path="/" element={
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
                } />

                {/* Route für die dedizierte Buchungsseite (jetzt öffentlich zugänglich) */}
                <Route path="/buchen" element={
                    <BookingPage
                        onAppointmentAdded={handleAppointmentAdded}
                        refreshAppointmentsList={refreshAppointmentsList}
                        currentUser={currentUser}
                        onLoginSuccess={handleLoginSuccess}
                    />
                } />
                {/* Route für die dedizierte Buchungsseite mit initialem Service-Namen */}
                <Route path="/buchen/:serviceName" element={
                    <BookingPage
                        onAppointmentAdded={handleAppointmentAdded}
                        refreshAppointmentsList={refreshAppointmentsList}
                        currentUser={currentUser}
                        onLoginSuccess={handleLoginSuccess}
                    />
                } />

                {/* Route für die dedizierte Login-Seite */}
                <Route path="/login" element={
                    <div style={{minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--light-bg)'}}>
                        <Login onLoginSuccess={handleLoginSuccess} />
                    </div>
                } />

                {/* NEU: Route für das "Mein Account" Dashboard (geschützt) */}
                <Route path="/my-account" element={
                    <ProtectedRoute currentUser={currentUser}>
                        <AccountDashboard
                            currentUser={currentUser}
                            logOut={logOut}
                            onAppointmentAdded={handleAppointmentAdded}
                            refreshAppointmentsList={refreshAppointmentsList}
                            onServiceAdded={handleServiceAdded}
                            refreshServicesList={refreshServicesList}
                        />
                    </ProtectedRoute>
                } />
            </Routes>

            <Footer />

            {/* AuthVerify für automatischen Logout bei abgelaufenem Token */}
            <AuthVerify logOut={logOut} />
        </div>
    );
}

export default App;
