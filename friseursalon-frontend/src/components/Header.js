// friseursalon-frontend/src/components/Header.js
import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import styles from './Header.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faUserCircle, faSignOutAlt, faTachometerAlt, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';

function Header({
                    currentUser,
                    logOut,
                    isMobileMenuOpen,
                    toggleMobileMenu,
                    closeMobileMenu,
                    isHeaderScrolled,
                    headerRef,
                    navigateToBooking,
                    pageType
                }) {
    const location = useLocation();
    const accentColor = "indigo-600";

    const forceSolidBackground = isHeaderScrolled || isMobileMenuOpen || pageType === "dashboard";

    const linkTextColorClass = forceSolidBackground ? styles.scrolledLinkText : styles.initialLinkText;
    const logoTextColorClass = forceSolidBackground ? 'text-gray-800' : 'text-white';
    const mobileToggleColorClass = forceSolidBackground
        ? `text-gray-700 hover:bg-gray-100 focus:ring-gray-500 ${styles.mobileMenuToggleScrolled}`
        : `text-white hover:bg-white/10 focus:ring-white ${styles.mobileMenuToggleInitial}`;
    const userIconColorClass = forceSolidBackground ? 'text-gray-700' : 'text-white';

    const navLinkClasses = ({ isActive }) =>
        `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 relative ${styles.navLinkItem} ${linkTextColorClass} ` +
        (isActive
            ? `font-semibold text-${accentColor} ${styles.activeNavLink}`
            : `hover:text-${accentColor} ${styles.inactiveNavLink}`);

    const mobileNavLinkClasses = ({ isActive }) =>
        `block px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 ` +
        (isActive
            ? `bg-indigo-50 text-indigo-700 ${styles.activeMobileNavLink}`
            : `text-gray-700 hover:bg-gray-100 hover:text-indigo-600 ${styles.inactiveMobileNavLink}`);

    const authLinkStyle = `px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 border ${
        forceSolidBackground
            ? `text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 ${styles.scrolledAuthLink}`
            : `text-white border-white/70 hover:bg-white/10 hover:border-white ${styles.initialAuthLink}`
    }`;

    const ctaStyle = `ml-4 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform duration-150 ease-in-out hover:scale-105 active:scale-100 ${
        forceSolidBackground
            ? `text-white bg-${accentColor} hover:bg-indigo-700 focus:ring-${accentColor} ${styles.scrolledCta}`
            : `text-dark-text bg-white hover:bg-gray-100 focus:ring-${accentColor} ${styles.initialCta}`
    }`;

    const isAdmin = currentUser?.roles?.includes("ROLE_ADMIN");

    return (
        <header
            ref={headerRef}
            className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ease-in-out
                        ${forceSolidBackground ? `bg-white/95 shadow-md backdrop-blur-sm ${styles.headerScrolled}` : `bg-transparent ${styles.headerInitial}`}`}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`flex items-center justify-between h-16 md:h-20 ${styles.headerInner}`}>
                    <div className="flex-shrink-0">
                        <Link to="/" className={`text-2xl font-bold font-serif transition-colors duration-300 ${logoTextColorClass} ${styles.logo}`}>
                            IMW
                        </Link>
                    </div>

                    <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
                        <NavLink to="/" className={navLinkClasses} end>Start</NavLink>
                        <NavLink to="/#services-dynamic" className={navLinkClasses} onClick={(e) => { e.preventDefault(); document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' }); }}>Dienstleistungen</NavLink>
                        <NavLink to="/#gallery-journal" className={navLinkClasses} onClick={(e) => { e.preventDefault(); document.getElementById('gallery-journal')?.scrollIntoView({ behavior: 'smooth' }); }}>Galerie</NavLink>
                    </nav>

                    <div className="hidden md:flex items-center">
                        {currentUser ? (
                            <div className="relative group">
                                <button className={`flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${styles.userMenuButton}`}>
                                    <FontAwesomeIcon icon={faUserCircle} className={`h-8 w-8 transition-colors duration-300 ${userIconColorClass}`} />
                                </button>
                                <div className={`absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out transform scale-95 group-hover:scale-100 ${styles.dropdownMenu}`}>
                                    <div className="px-4 py-3 border-b">
                                        <p className="text-sm text-gray-500">Angemeldet als</p>
                                        <p className="text-sm font-medium text-gray-900 truncate">{currentUser.firstName || currentUser.email}</p>
                                    </div>
                                    <NavLink to="/my-account" className={mobileNavLinkClasses}>Mein Konto</NavLink>
                                    {isAdmin && <NavLink to="/my-account?tab=admin-dashboard" className={mobileNavLinkClasses}>Admin Dashboard</NavLink>}
                                    <button onClick={logOut} className={`${mobileNavLinkClasses} w-full text-left`}>
                                        <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" /> Ausloggen
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <NavLink to="/login" className={authLinkStyle}>Login</NavLink>
                        )}
                        <button onClick={() => navigateToBooking()} className={ctaStyle}>Termin buchen</button>
                    </div>

                    <div className="md:hidden flex items-center">
                        <button
                            onClick={toggleMobileMenu}
                            aria-controls="mobile-menu"
                            aria-expanded={isMobileMenuOpen}
                            className={`inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset transition-colors duration-300 ${mobileToggleColorClass}`}
                        >
                            <span className="sr-only">Menü öffnen</span>
                            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={`${isMobileMenuOpen ? `block ${styles.mobileMenuOpen}` : 'hidden'} md:hidden ${styles.mobileMenu}`} id="mobile-menu">
                <div className="px-2 pt-2 pb-3 space-y-1">
                    <NavLink to="/" className={mobileNavLinkClasses} onClick={closeMobileMenu} end>Start</NavLink>
                    <a href="/#services-dynamic" className={mobileNavLinkClasses} onClick={(e) => { e.preventDefault(); closeMobileMenu(); document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' }); }}>Dienstleistungen</a>
                    <a href="/#gallery-journal" className={mobileNavLinkClasses} onClick={(e) => { e.preventDefault(); closeMobileMenu(); document.getElementById('gallery-journal')?.scrollIntoView({ behavior: 'smooth' }); }}>Galerie</a>
                </div>
                <div className="pt-4 pb-3 border-t border-gray-200">
                    {currentUser ? (
                        <div className="px-2 space-y-1">
                            <NavLink to="/my-account" className={mobileNavLinkClasses} onClick={closeMobileMenu}><FontAwesomeIcon icon={faUserCircle} className="mr-2" /> Mein Konto</NavLink>
                            {isAdmin && <NavLink to="/my-account?tab=admin-dashboard" className={mobileNavLinkClasses} onClick={closeMobileMenu}><FontAwesomeIcon icon={faTachometerAlt} className="mr-2" /> Admin Dashboard</NavLink>}
                            <button onClick={logOut} className={`${mobileNavLinkClasses} w-full text-left`}><FontAwesomeIcon icon={faSignOutAlt} className="mr-2" /> Ausloggen</button>
                        </div>
                    ) : (
                        <div className="px-2">
                            <NavLink to="/login" className={mobileNavLinkClasses} onClick={closeMobileMenu}>Login</NavLink>
                        </div>
                    )}
                    <div className="mt-4 px-4">
                        <button onClick={() => { navigateToBooking(); closeMobileMenu(); }} className={`block w-full text-center px-4 py-3 rounded-md shadow-sm text-base font-medium text-white bg-${accentColor} hover:bg-indigo-700`}>Termin buchen</button>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;