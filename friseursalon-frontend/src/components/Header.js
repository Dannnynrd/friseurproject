import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import AuthService from '../services/auth.service';
import EventBus from '../common/EventBus';
import styles from './Header.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faBars } from '@fortawesome/free-solid-svg-icons';

const Header = () => {
    const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();

    // Bestimmt, ob der Header auf der aktuellen Seite transparent starten soll
    const isTransparentStart = location.pathname === '/';

    // Effekt für den Scroll-Zustand des Headers
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        // Initialer Check beim Laden der Seite
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Effekt für die Authentifizierung des Benutzers
    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
        }
        EventBus.on("logout", logOut);
        return () => EventBus.remove("logout", logOut);
    }, []);

    // Logik für das Öffnen/Schließen des mobilen Menüs und Verhindern des Body-Scrolls
    useEffect(() => {
        document.body.classList.toggle('mobile-menu-active', isMobileMenuOpen);
    }, [isMobileMenuOpen]);

    // Schließt das Menü bei einem Routenwechsel
    useEffect(() => {
        closeMobileMenu();
    }, [location.pathname]);

    const logOut = () => {
        AuthService.logout();
        setCurrentUser(undefined);
        closeMobileMenu();
    };

    const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);
    const closeMobileMenu = () => setMobileMenuOpen(false);

    const isAdmin = currentUser?.roles.includes("ROLE_ADMIN");

    // Baut die CSS-Klassen für den Header dynamisch zusammen
    const headerClasses = [
        styles.header,
        (isScrolled || !isTransparentStart || isMobileMenuOpen) && styles.scrolled,
    ].filter(Boolean).join(' ');

    return (
        <header className={headerClasses}>
            <div className={styles.container}>
                <Link to="/" className={styles.logo} onClick={closeMobileMenu}>
                    STUDIO
                </Link>

                <nav className={`${styles.nav} ${isMobileMenuOpen ? styles.navOpen : ''}`}>
                    <ul className={styles.navList}>
                        <li><NavLink to="/services" className={({ isActive }) => isActive ? styles.activeLink : styles.navLink}>Dienstleistungen</NavLink></li>
                        <li><NavLink to="/about" className={({ isActive }) => isActive ? styles.activeLink : styles.navLink}>Über Uns</NavLink></li>
                        <li><NavLink to="/contact" className={({ isActive }) => isActive ? styles.activeLink : styles.navLink}>Kontakt</NavLink></li>
                    </ul>
                </nav>

                <div className={styles.actions}>
                    {currentUser ? (
                        <div className={styles.authActions}>
                            <Link to={isAdmin ? "/account" : "/account"} className={styles.navLink}>Dashboard</Link>
                            <a href="/login" className={styles.navLink} onClick={logOut}>Logout</a>
                        </div>
                    ) : (
                        <div className={styles.authActions}>
                            <Link to="/login" className={styles.navLink}>Login</Link>
                        </div>
                    )}
                    <Link to="/buchen" className={styles.ctaButton}>Jetzt Buchen</Link>
                </div>

                <button className={styles.mobileMenuButton} onClick={toggleMobileMenu} aria-label="Menü">
                    <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
                </button>
            </div>

            {/* Mobiles Menü Overlay */}
            {isMobileMenuOpen && (
                <div className={styles.mobileMenuOverlay}>
                    <ul className={styles.mobileNavList}>
                        <li><NavLink to="/services" onClick={closeMobileMenu}>Dienstleistungen</NavLink></li>
                        <li><NavLink to="/about" onClick={closeMobileMenu}>Über Uns</NavLink></li>
                        <li><NavLink to="/contact" onClick={closeMobileMenu}>Kontakt</NavLink></li>
                    </ul>
                    <div className={styles.mobileMenuFooter}>
                        {currentUser ? (
                            <>
                                <Link to={isAdmin ? "/account" : "/account"} className={styles.mobileCtaButton} onClick={closeMobileMenu}>Dashboard</Link>
                                <a href="/login" className={styles.mobileLink} onClick={logOut}>Logout</a>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className={styles.mobileCtaButton} onClick={closeMobileMenu}>Login</Link>
                                <Link to="/register" className={styles.mobileLink} onClick={closeMobileMenu}>Registrieren</Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;