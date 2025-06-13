import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import EventBus from '../common/EventBus';
import AuthService from '../services/auth.service';
import styles from './Header.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

const Header = () => {
    const [currentUser, setCurrentUser] = useState(undefined);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const user = AuthService.getCurrentUser();
        if (user) {
            setCurrentUser(user);
        }

        EventBus.on("logout", () => {
            logOut();
        });

        return () => {
            EventBus.remove("logout");
        };
    }, []);

    const logOut = () => {
        AuthService.logout();
        setCurrentUser(undefined);
        setMobileMenuOpen(false); // Menü bei Logout schließen
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    }

    // Fügt eine Klasse zum Body hinzu, um das Scrollen zu verhindern, wenn das Menü geöffnet ist
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.classList.add(styles.noScroll);
        } else {
            document.body.classList.remove(styles.noScroll);
        }
    }, [isMobileMenuOpen]);


    const isAdmin = currentUser && currentUser.roles.includes("ROLE_ADMIN");

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link to="/" className={styles.logo} onClick={closeMobileMenu}>
                    SalonName
                </Link>

                <nav className={`${styles.nav} ${isMobileMenuOpen ? styles.navOpen : ''}`}>
                    <ul className={styles.navList}>
                        <li><NavLink to="/services" className={({ isActive }) => isActive ? styles.activeLink : ''} onClick={closeMobileMenu}>Dienstleistungen</NavLink></li>
                        <li><NavLink to="/about" className={({ isActive }) => isActive ? styles.activeLink : ''} onClick={closeMobileMenu}>Über Uns</NavLink></li>
                        <li><NavLink to="/contact" className={({ isActive }) => isActive ? styles.activeLink : ''} onClick={closeMobileMenu}>Kontakt</NavLink></li>

                        {/* Auth Links im mobilen Menü */}
                        <li className={styles.mobileAuthLinks}>
                            {currentUser ? (
                                <>
                                    <Link to={isAdmin ? "/admin/dashboard" : "/account/dashboard"} className={styles.authButtonMobile} onClick={closeMobileMenu}>
                                        Dashboard
                                    </Link>
                                    <a href="/login" className={styles.authButtonMobile} onClick={(e) => { e.preventDefault(); closeMobileMenu(); logOut(); }}>
                                        Logout
                                    </a>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className={styles.authButtonMobile} onClick={closeMobileMenu}>Login</Link>
                                    <Link to="/register" className={styles.authButtonMobile} onClick={closeMobileMenu}>Registrieren</Link>
                                </>
                            )}
                        </li>
                    </ul>
                </nav>

                <div className={styles.actions}>
                    {currentUser ? (
                        <div className={styles.authActions}>
                            <Link to={isAdmin ? "/admin/dashboard" : "/account/dashboard"} className={styles.dashboardLink}>
                                Dashboard
                            </Link>
                            <a href="/login" className={styles.logoutLink} onClick={logOut}>
                                Logout
                            </a>
                        </div>
                    ) : (
                        <div className={styles.authActions}>
                            <Link to="/login" className={styles.loginLink}>Login</Link>
                            <Link to="/register" className={styles.registerButton}>Registrieren</Link>
                        </div>
                    )}
                    <Link to="/booking" className={styles.ctaButton}>Jetzt Buchen</Link>
                </div>

                <button className={styles.mobileMenuButton} onClick={toggleMobileMenu} aria-label="Menü öffnen/schließen">
                    <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
                </button>
            </div>
        </header>
    );
};

export default Header;