// Datei: friseursalon-frontend/src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import './Header.css';

// Die Funktion `navigateToBooking` wird als Prop von App.js erwartet
function Header({ currentUser, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu, isHeaderScrolled, headerRef, navigateToBooking }) {

    // Handler für den Klick auf "Termin buchen"
    const handleBookAppointmentClick = () => {
        if (typeof navigateToBooking === 'function') {
            navigateToBooking(); // Ruft die übergebene Funktion aus App.js auf, die die Navigation durchführt
        } else {
            console.error("Header: navigateToBooking ist keine Funktion oder wurde nicht übergeben.");
        }
        // closeMobileMenu(); // Wird jetzt zentral in navigateToBooking in App.js gehandhabt
    };

    return (
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
                    aria-label={isMobileMenuOpen ? "Menü schließen" : "Menü öffnen"}
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="main-nav"
                >
                    <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
                </button>

                <nav className={`nav-links-container ${isMobileMenuOpen ? 'open' : ''}`} id="main-nav">
                    <div className="main-nav-group">
                        <a href="/#experience" className="nav-link-item" onClick={closeMobileMenu}>Erfahrung</a>
                        <a href="/#about-founder" className="nav-link-item" onClick={closeMobileMenu}>Über Mich</a>
                        <a href="/#services-dynamic" className="nav-link-item" onClick={closeMobileMenu}>Services</a>
                        <a href="/#gallery-journal" className="nav-link-item" onClick={closeMobileMenu}>Galerie</a>
                        <a href="/#faq" className="nav-link-item" onClick={closeMobileMenu}>FAQ</a>
                    </div>

                    <div className="nav-auth-actions">
                        {currentUser ? (
                            <Link to="/my-account" className="nav-link-item account-link" onClick={closeMobileMenu}>
                                <FontAwesomeIcon icon={faUserCircle} /> Mein Account
                            </Link>
                        ) : (
                            <Link to="/login" className="nav-link-item login-link" onClick={closeMobileMenu}>Login</Link>
                        )}
                        {/* Der "Termin buchen"-Button ruft jetzt den Handler auf */}
                        <button onClick={handleBookAppointmentClick} className="button-link nav-cta">
                            Termin buchen
                        </button>
                    </div>
                </nav>
            </div>
        </header>
    );
}

export default Header;
