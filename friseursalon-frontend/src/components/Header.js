// src/components/Header.js

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faBars } from '@fortawesome/free-solid-svg-icons';

const Header = ({ currentUser, logOut }) => {
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const isHomePage = location.pathname === '/';

    // Effekt für das Scroll-Verhalten
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Effekt für das mobile Menü (Body-Scroll sperren)
    useEffect(() => {
        document.body.classList.toggle('mobile-menu-active', isMobileMenuOpen);
    }, [isMobileMenuOpen]);

    // Menü bei Routenwechsel schließen
    useEffect(() => {
        closeMobileMenu();
    }, [location.pathname]);

    const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);
    const closeMobileMenu = () => setMobileMenuOpen(false);

    // Funktion für sanftes Scrollen zu Anker-Links auf der Startseite
    const handleNavClick = (e, targetId) => {
        closeMobileMenu();
        if (isHomePage) {
            e.preventDefault();
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
        } else {
            // Wenn nicht auf der Startseite, zuerst dorthin navigieren
            // und den Anker in der Location State speichern, um dorthin zu scrollen.
            navigate(`/${targetId}`);
        }
    };

    const headerClasses = [
        styles.header,
        (isScrolled || !isHomePage || isMobileMenuOpen) && styles.scrolled,
        isMobileMenuOpen && styles.menuOpen
    ].filter(Boolean).join(' ');

    return (
        <header className={headerClasses}>
            <div className={styles.container}>
                <Link to="/" className={styles.logo} onClick={closeMobileMenu}>
                    IMW
                </Link>

                {/* --- Desktop Navigation --- */}
                <nav className={styles.desktopNav}>
                    <ul className={styles.navList}>
                        <li><a href="/#services-section" onClick={(e) => handleNavClick(e, 'services-section')} className={styles.navLink}>Dienstleistungen</a></li>
                        <li><a href="/#about-founder" onClick={(e) => handleNavClick(e, 'about-founder')} className={styles.navLink}>Über Uns</a></li>
                        <li><a href="/#location" onClick={(e) => handleNavClick(e, 'location')} className={styles.navLink}>Kontakt</a></li>
                    </ul>
                </nav>

                <div className={styles.actions}>
                    {currentUser ? (
                        <div className={styles.authActions}>
                            <Link to="/account" className={styles.navLink}>Dashboard</Link>
                            <a href="/" className={styles.navLink} onClick={(e) => { e.preventDefault(); logOut(); }}>Logout</a>
                        </div>
                    ) : (
                        <div className={styles.authActions}>
                            <Link to="/login" className={styles.navLink}>Login</Link>
                        </div>
                    )}
                    <Link to="/buchen" className={styles.ctaButton}>Termin buchen</Link>
                </div>

                {/* --- Mobile Menu Button --- */}
                <button className={styles.mobileMenuButton} onClick={toggleMobileMenu} aria-label="Menü öffnen/schließen">
                    <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
                </button>
            </div>

            {/* --- Mobile Menu Overlay --- */}
            <div className={`${styles.mobileMenuOverlay} ${isMobileMenuOpen ? styles.isOpen : ''}`}>
                <nav>
                    <ul className={styles.mobileNavList}>
                        <li><a href="/#services-section" onClick={(e) => handleNavClick(e, 'services-section')}>Dienstleistungen</a></li>
                        <li><a href="/#about-founder" onClick={(e) => handleNavClick(e, 'about-founder')}>Über Uns</a></li>
                        <li><a href="/#location" onClick={(e) => handleNavClick(e, 'location')}>Kontakt</a></li>
                    </ul>
                </nav>
                <div className={styles.mobileMenuFooter}>
                    {currentUser ? (
                        <>
                            <Link to="/account" className={styles.mobileCtaButton} onClick={closeMobileMenu}>Dashboard</Link>
                            <a href="/" className={styles.mobileLink} onClick={(e) => { e.preventDefault(); closeMobileMenu(); logOut(); }}>Logout</a>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className={styles.mobileCtaButton} onClick={closeMobileMenu}>Login</Link>
                            <Link to="/register" className={styles.mobileLink} onClick={closeMobileMenu}>Registrieren</Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;