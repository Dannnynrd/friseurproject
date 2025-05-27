import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCircle, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import './Header';

function Header({ currentUser, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu, isHeaderScrolled, headerRef }) {
    return (
        <header
            className={`header ${isHeaderScrolled ? 'scrolled' : ''} ${isMobileMenuOpen ? 'menu-open-header-state' : ''}`}
            id="header" // Behalte die ID bei, falls sie für Anker-Links verwendet wird
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
                        {/* Diese Links könnten auch als Array von Objekten definiert und gemappt werden */}
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
    );
}

export default Header;