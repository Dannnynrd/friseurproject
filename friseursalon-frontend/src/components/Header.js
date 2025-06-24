// friseursalon-frontend/src/components/Header.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

const Header = ({ currentUser, logOut }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Effekt für das Scroll-Verhalten
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Body-Scroll bei offenem Menü sperren
    useEffect(() => {
        if (isMenuOpen) {
            document.body.classList.add(styles.bodyNoScroll);
        } else {
            document.body.classList.remove(styles.bodyNoScroll);
        }
        return () => document.body.classList.remove(styles.bodyNoScroll);
    }, [isMenuOpen]);

    // Menü bei Klick auf einen Link schließen
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    const handleNavClick = (e, targetId) => {
        setIsMenuOpen(false);
        if (location.pathname !== '/') {
            navigate('/');
            setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' }), 100);
        } else {
            e.preventDefault();
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const headerClasses = `${styles.header} ${isScrolled ? styles.scrolled : ''} ${isMenuOpen ? styles.menuOpen : ''}`;

    return (
        <header className={headerClasses}>
            <div className={styles.container}>
                <Link to="/" className={styles.logo}>IMW</Link>

                <nav className={styles.desktopNav}>
                    <a href="#services-section" onClick={(e) => handleNavClick(e, 'services-section')}>Leistungen</a>
                    <a href="#about-founder" onClick={(e) => handleNavClick(e, 'about-founder')}>Über Mich</a>
                    <a href="#location" onClick={(e) => handleNavClick(e, 'location')}>Kontakt</a>
                </nav>

                <div className={styles.desktopActions}>
                    {currentUser ? (
                        <>
                            <a href="#logout" className={styles.actionLink} onClick={(e) => { e.preventDefault(); logOut(); }}>Logout</a>
                            <Link to="/account" className={styles.ctaButton}>Dashboard</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className={styles.actionLink}>Login</Link>
                            <Link to="/buchen" className={styles.ctaButton}>Termin buchen</Link>
                        </>
                    )}
                </div>

                <button className={styles.mobileToggle} onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menü">
                    <div className={styles.hamburger}>
                        <div className={styles.hamburgerBar}></div>
                        <div className={styles.hamburgerBar}></div>
                        <div className={styles.hamburgerBar}></div>
                    </div>
                </button>
            </div>

            <div className={styles.mobileMenu}>
                <nav className={styles.mobileNav}>
                    <a href="#services-section" onClick={(e) => handleNavClick(e, 'services-section')}>Leistungen</a>
                    <a href="#about-founder" onClick={(e) => handleNavClick(e, 'about-founder')}>Über Mich</a>
                    <a href="#location" onClick={(e) => handleNavClick(e, 'location')}>Kontakt</a>
                </nav>
                <div className={styles.mobileMenuFooter}>
                    {currentUser ? (
                        <>
                            <Link to="/account" className={styles.mobileCtaButton}>Dashboard</Link>
                            <a href="#logout" className={styles.mobileActionLink} onClick={(e) => { e.preventDefault(); logOut(); }}>Logout</a>
                        </>
                    ) : (
                        <>
                            <Link to="/buchen" className={styles.mobileCtaButton}>Termin buchen</Link>
                            <Link to="/login" className={styles.mobileActionLink}>Login</Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;