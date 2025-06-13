import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import styles from './Header.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faUserCircle, faSignOutAlt, faTachometerAlt, faUserCog, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';

function Header({
                    currentUser,
                    logOut,
                    isMobileMenuOpen,
                    toggleMobileMenu,
                    closeMobileMenu,
                    isHeaderScrolled,
                    navigateToBooking,
                    variant = 'solid'
                }) {

    const isAdmin = currentUser?.roles?.includes("ROLE_ADMIN");
    const isThemed = variant === 'transparent' && !isHeaderScrolled;

    const headerClasses = `${styles.header} ${isThemed ? styles.transparent : styles.solid}`;
    const textColor = isThemed ? 'text-white' : 'text-gray-800';
    const hoverTextColor = isThemed ? 'hover:text-white' : 'hover:text-black';

    const navLinkClasses = ({ isActive }) =>
        `${styles.navLinkItem} ${textColor} ${hoverTextColor}` +
        (isActive ? ` ${styles.navLinkActive}` : '');

    const ctaButtonClasses = `${styles.ctaButton} ${isThemed ? styles.ctaButtonThemed : styles.ctaButtonSolid}`;

    const handleNavLinkClick = (e, hash) => {
        if (location.pathname !== '/') {
            navigate('/' + hash, { replace: true });
        } else {
            e.preventDefault();
            document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
        }
        closeMobileMenu();
    };


    return (
        <header className={headerClasses}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
                <div className="flex items-center justify-between h-full">

                    <div className="flex items-center">
                        <Link to="/" className={`${styles.logo} ${textColor}`} onClick={closeMobileMenu}>IMW</Link>
                    </div>

                    <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
                        <NavLink to="/" className={navLinkClasses} end>Start</NavLink>
                        <a href="/#services-section" className={navLinkClasses} onClick={(e) => handleNavLinkClick(e, '#services-section')}>Dienstleistungen</a>
                        <a href="/#gallery-journal" className={navLinkClasses} onClick={(e) => handleNavLinkClick(e, '#gallery-journal')}>Galerie</a>
                    </nav>

                    <div className="hidden md:flex items-center justify-end">
                        {currentUser ? (
                            <div className="relative group">
                                <button className={`${styles.userButton} ${textColor}`}>
                                    <FontAwesomeIcon icon={faUserCircle} />
                                </button>
                                <div className={styles.dropdownMenu}>
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="text-xs text-gray-500">Angemeldet als</p>
                                        <p className="text-sm font-medium text-gray-900 truncate">{currentUser.firstName || currentUser.email}</p>
                                    </div>
                                    <div className="py-1">
                                        <NavLink to="/my-account" className={styles.dropdownItem}><FontAwesomeIcon icon={faCalendarCheck} className={styles.dropdownIcon} /> Meine Termine</NavLink>
                                        <NavLink to="/my-account?tab=profile" className={styles.dropdownItem}><FontAwesomeIcon icon={faUserCog} className={styles.dropdownIcon} /> Profil</NavLink>
                                        {isAdmin && <NavLink to="/my-account?tab=admin-dashboard" className={styles.dropdownItem}><FontAwesomeIcon icon={faTachometerAlt} className={styles.dropdownIcon} /> Admin</NavLink>}
                                    </div>
                                    <div className="py-1 border-t border-gray-100">
                                        <button onClick={logOut} className={`${styles.dropdownItem} w-full text-left`}><FontAwesomeIcon icon={faSignOutAlt} className={styles.dropdownIcon} /> Ausloggen</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <NavLink to="/login" className={`${styles.loginButton} ${isThemed ? styles.loginButtonThemed : styles.loginButtonSolid}`}>
                                Login
                            </NavLink>
                        )}
                        <button onClick={navigateToBooking} className={ctaButtonClasses}>Termin buchen</button>
                    </div>

                    <div className="md:hidden">
                        <button onClick={toggleMobileMenu} className={`${styles.mobileToggle} ${textColor}`}>
                            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
                        </button>
                    </div>

                </div>
            </div>

            <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
                <nav className="p-4 space-y-2">
                    <NavLink to="/" className={styles.mobileLink} onClick={closeMobileMenu}>Start</NavLink>
                    <a href="/#services-section" className={styles.mobileLink} onClick={(e) => handleNavLinkClick(e, '#services-section')}>Dienstleistungen</a>
                    <a href="/#gallery-journal" className={styles.mobileLink} onClick={(e) => handleNavLinkClick(e, '#gallery-journal')}>Galerie</a>
                </nav>
                <div className="p-4 border-t border-gray-100 space-y-2">
                    {currentUser ? (
                        <>
                            <NavLink to="/my-account" className={styles.mobileLink} onClick={closeMobileMenu}><FontAwesomeIcon icon={faUserCircle} className="mr-2" /> Mein Konto</NavLink>
                            {isAdmin && <NavLink to="/my-account?tab=admin-dashboard" className={styles.mobileLink} onClick={closeMobileMenu}><FontAwesomeIcon icon={faTachometerAlt} className="mr-2" /> Admin</NavLink>}
                            <button onClick={logOut} className={`${styles.mobileLink} w-full text-left`}><FontAwesomeIcon icon={faSignOutAlt} className="mr-2" /> Ausloggen</button>
                        </>
                    ) : (
                        <NavLink to="/login" className={styles.mobileLink} onClick={closeMobileMenu}>Login</NavLink>
                    )}
                    <button onClick={() => {navigateToBooking(); closeMobileMenu()}} className={styles.mobileCtaButton}>Termin buchen</button>
                </div>
            </div>
        </header>
    );
}

export default Header;
