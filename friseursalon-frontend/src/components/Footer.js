// friseursalon-frontend/src/components/Footer.js
import React from 'react';
// HIER den Import ändern:
import styles from './Footer.module.css'; // Importiert als CSS-Modul
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faInstagram, faTwitter, faPinterestP } from '@fortawesome/free-brands-svg-icons'; // Beispiel Social Media Icons
import { faMapMarkerAlt, faPhone, faEnvelope, faClock } from '@fortawesome/free-solid-svg-icons'; // Kontakt Icons

function Footer() {
    const currentYear = new Date().getFullYear();

    // Beispieldaten für Links - diese könnten auch aus einer Konfiguration oder API kommen
    const quickLinks = [
        { label: "Startseite", href: "/" },
        { label: "Dienstleistungen", href: "/#services-dynamic" }, // Beispiel für Ankerlink
        { label: "Galerie", href: "/#gallery-journal" },
        { label: "Über uns", href: "/ueber-uns" }, // Beispiel für eine separate Seite
        { label: "Kontakt", href: "/kontakt" }
    ];

    const legalLinks = [
        { label: "Impressum", href: "/impressum" },
        { label: "Datenschutz", href: "/datenschutz" },
        { label: "AGB", href: "/agb" }
    ];

    const socialMedia = [
        { icon: faFacebookF, href: "https://facebook.com", label: "Facebook" },
        { icon: faInstagram, href: "https://instagram.com", label: "Instagram" },
        { icon: faTwitter, href: "https://twitter.com", label: "Twitter" },
        { icon: faPinterestP, href: "https://pinterest.com", label: "Pinterest" }
    ];

    return (
        <footer className={`bg-dark-text text-gray-300 pt-16 pb-8 ${styles.siteFooter}`}>
            <div className="container mx-auto px-6">
                {/* Haupt-Grid für den Footer-Inhalt */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8 mb-10">
                    {/* Spalte 1: Über den Salon / Logo */}
                    <div className={styles.footerColumn}>
                        <h3 className="text-xl font-serif font-semibold text-white mb-4">IMW Friseure</h3>
                        <p className="text-sm mb-4 leading-relaxed">
                            Ihr Experte für exklusive Haarschnitte, brillante Farben und individuelle Stilberatung in Berlin. Wir freuen uns auf Ihren Besuch.
                        </p>
                        {/* Social Media Icons */}
                        <div className="flex space-x-4 mt-4">
                            {socialMedia.map(social => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.label}
                                    className="text-gray-400 hover:text-white transition-colors duration-200"
                                >
                                    <FontAwesomeIcon icon={social.icon} size="lg" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Spalte 2: Quick Links */}
                    <div className={styles.footerColumn}>
                        <h4 className="text-lg font-semibold text-white mb-4">Schnellzugriff</h4>
                        <ul className="space-y-2">
                            {quickLinks.map(link => (
                                <li key={link.label}>
                                    <a href={link.href} className={`text-sm hover:text-indigo-400 hover:underline transition-colors duration-200 ${styles.footerLink}`}>
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Spalte 3: Kontaktinformationen */}
                    <div className={styles.footerColumn}>
                        <h4 className="text-lg font-semibold text-white mb-4">Kontakt</h4>
                        <address className="not-italic text-sm space-y-3">
                            <p className="flex items-start">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-3 mt-1 w-4 text-indigo-400" />
                                Musterstraße 123, 10115 Berlin
                            </p>
                            <p className="flex items-center">
                                <FontAwesomeIcon icon={faPhone} className="mr-3 w-4 text-indigo-400" />
                                <a href="tel:+49301234567" className="hover:text-indigo-400 hover:underline">+49 (0)30 123 456 78</a>
                            </p>
                            <p className="flex items-center">
                                <FontAwesomeIcon icon={faEnvelope} className="mr-3 w-4 text-indigo-400" />
                                <a href="mailto:hallo@imw-friseure.de" className="hover:text-indigo-400 hover:underline">hallo@imw-friseure.de</a>
                            </p>
                            <p className="flex items-start">
                                <FontAwesomeIcon icon={faClock} className="mr-3 mt-1 w-4 text-indigo-400" />
                                <span>Di - Fr: 09:00 - 18:00 Uhr<br />Sa: 09:00 - 14:00 Uhr</span>
                            </p>
                        </address>
                    </div>

                    {/* Spalte 4: Rechtliches (optional, könnte auch in die untere Leiste) */}
                    <div className={styles.footerColumn}>
                        <h4 className="text-lg font-semibold text-white mb-4">Rechtliches</h4>
                        <ul className="space-y-2">
                            {legalLinks.map(link => (
                                <li key={link.label}>
                                    <a href={link.href} className={`text-sm hover:text-indigo-400 hover:underline transition-colors duration-200 ${styles.footerLink}`}>
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                        {/* Optional: Logo oder Qualitätssiegel */}
                        {/* <img src="/path/to/your/logo-footer.png" alt="Salon Logo" className="mt-6 opacity-80 w-24" /> */}
                    </div>
                </div>

                {/* Untere Footer-Leiste: Copyright und ggf. zusätzliche Links */}
                <div className="border-t border-gray-700 pt-8 mt-10 text-center md:text-left">
                    <p className="text-xs text-gray-500">
                        &copy; {currentYear} IMW Friseure. Alle Rechte vorbehalten.
                        {/* Optional: "Designed by..." oder andere Credits */}
                    </p>
                    {/* Hier könnten auch die rechtlichen Links platziert werden, wenn sie nicht oben sind */}
                </div>
            </div>
        </footer>
    );
}

export default Footer;
