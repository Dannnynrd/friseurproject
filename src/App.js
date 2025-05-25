import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css'; // Hier kommt dein gesamtes CSS rein!
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom'; // NEU: Navigate importieren

// Importiere alle dynamischen Komponenten (werden auf der Buchungsseite oder bedingt gerendert)
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

// Importiere die neue Buchungsseite
import BookingPage from './pages/BookingPage';


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
    // HIERHER VERSCHOBEN: logOut muss VOR seinem Gebrauch in useEffect definiert sein
    const logOut = useCallback(() => {
        AuthService.logout();
        setCurrentUser(undefined);
        setRefreshServicesList(prev => prev + 1);
        setRefreshAppointmentsList(prev => prev + 1);
        navigate('/'); // Nach Logout zur Startseite navigieren
    }, [navigate]); // navigate ist eine Abhängigkeit für useCallback

    const handleServiceAdded = useCallback(() => {
        setRefreshServicesList(prev => prev + 1);
    }, []);

    const handleAppointmentAdded = useCallback(() => {
        setRefreshAppointmentsList(prev => prev + 1);
    }, []);

    const handleLoginSuccess = useCallback(() => {
        setCurrentUser(AuthService.getCurrentUser());
        setRefreshServicesList(prev => prev + 1);
        setRefreshAppointmentsList(prev => prev + 1);
        navigate('/'); // Nach erfolgreichem Login zur Startseite navigieren
    }, [navigate]);


    // Effekt für den initialen Benutzer-Check und EventBus-Listener
    // Wird beim Mount der App ausgeführt
    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
        }
        // HIER IST DIE KORREKTUR für "Cannot access 'logOut' before initialization"
        const handleLogoutEvent = () => {
            logOut();
        };

        EventBus.on("logout", handleLogoutEvent); // Den benannten Event-Handler registrieren

        // Cleanup-Funktion: Event-Listener entfernen, wenn die Komponente unmounted wird
        return () => {
            EventBus.remove("logout", handleLogoutEvent); // Wichtig: dieselbe Referenz entfernen
        };
    }, [logOut]);


    // Effekt für Custom Cursor und Preloader (VEREINFACHTE VERSION)
    useEffect(() => {
        // --- PRELOADER (nach 1 Sekunde ausblenden, unabhängig vom load-Event) ---
        const preloader = preloaderRef.current;
        let preloaderTimeoutId;
        if (preloader) {
            preloaderTimeoutId = setTimeout(() => {
                preloader.classList.add('loaded');
            }, 1000); // Blendet nach 1 Sekunde aus
        }

        // --- CUSTOM CURSOR ---
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

        // --- Cleanup für den gesamten Effect ---
        return () => {
            // Preloader Cleanup
            if (preloaderTimeoutId) {
                clearTimeout(preloaderTimeoutId);
            }

            // Cursor Cleanup
            if (window.innerWidth > 768 && cursor) {
                window.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseenter', mouseEnterHandler, true);
                document.removeEventListener('mouseleave', mouseLeaveHandler, true);
            }
        };
    }, []); // Leeres Array, damit es nur einmal beim Mount ausgeführt wird


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
        navigate(path); // Navigiere zur Buchungsseite
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
                    {/* Login/Logout Button wird dynamisch gerendert */}
                    {currentUser ? (
                        <div className="auth-section">
                            <span style={{color: 'var(--dark-text)', marginRight: '15px', fontWeight: '500'}}>Hallo, {currentUser.username}!</span>
                            <button onClick={logOut} className="button-link interactive">Abmelden</button>
                        </div>
                    ) : (
                        // Wenn nicht eingeloggt, zeige einen Login-Link
                        <Link to="/login" className="button-link interactive">Login</Link>
                    )}
                    {/* Link zum Buchungssystem */}
                    <Link to="/buchen" className="button-link interactive" id="open-modal-btn">Termin anfragen</Link>
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
                            openBookingModal={openBookingModal} // openBookingModal an ServicesSection übergeben
                        />
                        <GalleryJournalSection />
                        <EssentialsSection />
                        <FAQSection />
                        <LocationSection openBookingModal={openBookingModal} /> {/* openBookingModal an LocationSection übergeben */}
                        <NewsletterSection />
                    </main>
                } />

                {/* Route für die dedizierte Buchungsseite */}
                <Route path="/buchen" element={
                    <ProtectedRoute currentUser={currentUser}>
                        <BookingPage
                            onAppointmentAdded={handleAppointmentAdded}
                            refreshAppointmentsList={refreshAppointmentsList}
                            currentUser={currentUser} // currentUser an BookingPage übergeben
                        />
                    </ProtectedRoute>
                } />
                {/* Route für die dedizierte Buchungsseite mit initialem Service-Namen */}
                <Route path="/buchen/:serviceName" element={
                    <ProtectedRoute currentUser={currentUser}>
                        <BookingPage
                            onAppointmentAdded={handleAppointmentAdded}
                            refreshAppointmentsList={refreshAppointmentsList}
                            currentUser={currentUser} // currentUser an BookingPage übergeben
                        />
                    </ProtectedRoute>
                } />

                {/* Route für die dedizierte Login-Seite */}
                <Route path="/login" element={
                    <div style={{minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--light-bg)'}}>
                        <Login onLoginSuccess={handleLoginSuccess} />
                    </div>
                } />
            </Routes>

            <Footer />

            {/* AuthVerify für automatischen Logout bei abgelaufenem Token */}
            <AuthVerify logOut={logOut} />
        </div>
    );
}

export default App;
