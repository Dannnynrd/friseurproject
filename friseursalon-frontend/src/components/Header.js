// friseursalon-frontend/src/components/Header.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import styles from './Header.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faUserCircle, faSignOutAlt, faTachometerAlt, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
// AuthService und EventBus werden hier nicht mehr direkt benötigt, da sie von App.js gehandhabt werden
// import AuthService from '../services/auth.service';
// import EventBus from '../common/EventBus';

function Header({
                    currentUser,
                    logOut,
                    isMobileMenuOpen,
                    toggleMobileMenu,
                    closeMobileMenu,
                    isHeaderScrolled,
                    headerRef,
                    navigateToBooking,
                    pageType // NEUE PROP: "default" oder "dashboard"
                }) {
    const location = useLocation();
    const accentColor = "indigo-600";

    // Bestimme, ob der Header einen soliden Hintergrund haben soll
    // (beim Scrollen, wenn mobiles Menü offen ist, ODER wenn auf einer Dashboard-Seite)
    const forceSolidBackground = isHeaderScrolled || isMobileMenuOpen || pageType === "dashboard";

    // --- Klassen für Navigationslinks ---
    const baseLinkStyle = "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150";
    // Textfarbe basierend auf Hintergrund
    const linkTextColorClass = forceSolidBackground ? styles.scrolledLinkText : styles.initialLinkText;
    const logoTextColorClass = forceSolidBackground ? 'text-dark-text' : 'text-white';
    const mobileToggleColorClass = forceSolidBackground
        ? `text-dark-text hover:bg-gray-100 focus:ring-gray-500 ${styles.mobileMenuToggleScrolled}`
        : `text-white hover:bg-white/20 focus:ring-white ${styles.mobileMenuToggleInitial}`;
    const userIconColorClass = forceSolidBackground ? 'text-dark-text' : 'text-white';


    const navLinkClasses = ({ isActive }) => {
        return `${baseLinkStyle} ${styles.navLinkItem} ${linkTextColorClass} ` +
            (isActive
                ? `text-${accentColor} ${styles.activeNavLink}`
                : `hover:text-${accentColor} ${styles.inactiveNavLink}`);
    };

    const mobileNavLinkClasses = ({ isActive }) => {
        // Mobile Links sind immer auf hellem Hintergrund (des ausgeklappten Menüs)
        return `${baseLinkStyle} block text-base ${styles.mobileNavLinkItem} ` +
            (isActive
                ? `text-${accentColor} bg-indigo-100 ${styles.activeMobileNavLink}`
                : `text-gray-700 hover:text-${accentColor} hover:bg-gray-100 ${styles.inactiveMobileNavLink}`);
    };

    const authLinkBaseStyle = "text-sm font-medium px-4 py-2 rounded-md transition-colors duration-150";
    const authLinkStyle = forceSolidBackground
        ? `${authLinkBaseStyle} ${styles.scrolledAuthLink} border border-gray-300 text-gray-700 hover:bg-gray-50`
        : `${authLinkBaseStyle} ${styles.initialAuthLink} border border-white/80 text-white hover:bg-white/10`;

    const ctaBaseStyle = "ml-3 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";
    const ctaStyle = forceSolidBackground
        ? `${ctaBaseStyle} ${styles.scrolledCta} text-white bg-${accentColor} hover:bg-indigo-700 focus:ring-${accentColor}`
        : `${ctaBaseStyle} ${styles.initialCta} text-dark-text bg-white hover:bg-gray-100 focus:ring-${accentColor}`;

    const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes("ROLE_ADMIN");

    return (
        <header
            ref={headerRef}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out 
                        ${forceSolidBackground ? `bg-white/95 shadow-lg backdrop-blur-md ${styles.headerScrolled}` : `bg-transparent ${styles.headerInitial}`} 
                        ${styles.siteHeader}`}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 md:h-20"> {/* Höhe des Headers */}
                    <div className="flex-shrink-0">
                        <Link to="/" className={`text-2xl font-bold font-serif transition-colors duration-300 ${logoTextColorClass} ${styles.logo}`}>
                            IMW
                        </Link>
                    </div>

                    <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
                        <NavLink to="/" className={navLinkClasses} end>Start</NavLink>
                        <NavLink to="/#services-dynamic" className={navLinkClasses}>Dienstleistungen</NavLink>
                        <NavLink to="/#gallery-journal" className={navLinkClasses}>Galerie</NavLink>
                    </nav>

                    <div className="hidden md:flex items-center">
                        {currentUser ? (
                            <div className="relative group">
                                <button className={`flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-${accentColor} ${styles.userMenuButton}`}>
                                    <FontAwesomeIcon icon={faUserCircle} className={`h-8 w-8 transition-colors duration-300 ${userIconColorClass}`} />
                                </button>
                                <div className={`absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 origin-top-right ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible focus:outline-none transition-all duration-200 ease-in-out transform scale-95 group-hover:scale-100 ${styles.dropdownMenu}`} role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
                                    <div className="px-4 py-3">
                                        <p className="text-sm text-gray-900">Angemeldet als</p>
                                        <p className="text-sm font-medium text-gray-900 truncate">{currentUser.username}</p>
                                    </div>
                                    <div className="border-t border-gray-100"></div>
                                    <NavLink to="/my-account" className={({isActive}) => `block px-4 py-2 text-sm ${isActive ? `bg-gray-100 text-${accentColor}` : 'text-gray-700'} hover:bg-gray-100 hover:text-${accentColor} ${styles.dropdownItem}`} role="menuitem">Mein Konto</NavLink>
                                    {isAdmin && <NavLink to="/my-account?tab=admin-dashboard" className={({isActive}) => `block px-4 py-2 text-sm ${isActive ? `bg-gray-100 text-${accentColor}` : 'text-gray-700'} hover:bg-gray-100 hover:text-${accentColor} ${styles.dropdownItem}`} role="menuitem">Admin Dashboard</NavLink>}
                                    <div className="border-t border-gray-100"></div>
                                    <button onClick={logOut} className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-${accentColor} ${styles.dropdownItem}`} role="menuitem">
                                        <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" /> Ausloggen
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <NavLink to="/login" className={authLinkStyle}>
                                Login
                            </NavLink>
                        )}
                        <button
                            onClick={navigateToBooking}
                            className={ctaStyle}
                        >
                            <FontAwesomeIcon icon={faCalendarCheck} className="mr-2 h-4 w-4" /> Termin buchen
                        </button>
                    </div>

                    <div className="md:hidden flex items-center">
                        <button
                            onClick={toggleMobileMenu}
                            aria-controls="mobile-menu"
                            aria-expanded={isMobileMenuOpen}
                            className={`inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset transition-colors duration-300 ${mobileToggleColorClass}`}
                        >
                            <span className="sr-only">Hauptmenü öffnen</span>
                            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>

            <div className={`${isMobileMenuOpen ? `block ${styles.mobileMenuOpen}` : 'hidden'} md:hidden ${styles.mobileMenu}`} id="mobile-menu">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    <NavLink to="/" className={mobileNavLinkClasses} end onClick={closeMobileMenu}>Start</NavLink>
                    <NavLink to="/#services-dynamic" className={mobileNavLinkClasses} onClick={closeMobileMenu}>Dienstleistungen</NavLink>
                    <NavLink to="/#gallery-journal" className={mobileNavLinkClasses} onClick={closeMobileMenu}>Galerie</NavLink>
                </div>
                <div className="pt-4 pb-3 border-t border-gray-200">
                    {currentUser ? (
                        <>
                            <div className="flex items-center px-5">
                                <FontAwesomeIcon icon={faUserCircle} className="h-10 w-10 text-gray-700" />
                                <div className="ml-3">
                                    <div className="text-base font-medium text-gray-800">{currentUser.username}</div>
                                    <div className="text-sm font-medium text-gray-500">{currentUser.email}</div>
                                </div>
                            </div>
                            <div className="mt-3 px-2 space-y-1">
                                <NavLink to="/my-account" className={mobileNavLinkClasses} onClick={closeMobileMenu}><FontAwesomeIcon icon={faUserCircle} className="mr-2" /> Mein Konto</NavLink>
                                {isAdmin && <NavLink to="/my-account?tab=admin-dashboard" className={mobileNavLinkClasses} onClick={closeMobileMenu}><FontAwesomeIcon icon={faTachometerAlt} className="mr-2" /> Admin Dashboard</NavLink>}
                                <button onClick={() => { logOut(); closeMobileMenu(); }} className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-${accentColor} hover:bg-gray-100 ${styles.mobileNavLinkItem}`}>
                                    <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" /> Ausloggen
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="px-2 space-y-1">
                            <NavLink to="/login" className={mobileNavLinkClasses} onClick={closeMobileMenu}>Login</NavLink>
                        </div>
                    )}
                    <div className="mt-4 px-4">
                        <button
                            onClick={() => { navigateToBooking(); closeMobileMenu(); }}
                            className={`block w-full text-center px-4 py-3 rounded-md shadow-sm text-base font-medium text-white bg-${accentColor} hover:bg-indigo-700 ${styles.mobileNavCta}`}
                        >
                            <FontAwesomeIcon icon={faCalendarCheck} className="mr-2" /> Termin buchen
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header;
