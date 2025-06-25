// friseursalon-frontend/src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
import { FiInstagram, FiFacebook, FiMail } from 'react-icons/fi';

function Footer() {
    const currentYear = new Date().getFullYear();

    const quickLinks = [
        { label: "Leistungen", to: "/#services-section" },
        { label: "So geht's", to: "/#how-it-works-section" },
        { label: "Über uns", to: "/#about-founder" },
        { label: "FAQ", to: "/#faq-section" }
    ];

    const legalLinks = [
        { label: "Impressum", to: "/impressum" },
        { label: "Datenschutz", to: "/datenschutz" }
    ];

    const socialMedia = [
        { icon: <FiFacebook />, href: "https://facebook.com", label: "Facebook" },
        { icon: <FiInstagram />, href: "https://instagram.com", label: "Instagram" },
        { icon: <FiMail />, href: "mailto:hallo@imw-friseure.de", label: "Email" }
    ];

    return (
        <footer className={styles.siteFooter}>
            <div className={styles.container}>
                <div className={styles.mainContent}>
                    {/* Spalte 1: Branding */}
                    <div className={styles.brandColumn}>
                        <h3 className={styles.salonName}>IMW Friseure</h3>
                        <p className={styles.tagline}>Kunst, Handwerk und Leidenschaft für perfektes Haar.</p>
                    </div>

                    {/* Spalte 2 & 3: Navigation */}
                    <div className={styles.navGrid}>
                        <div className={styles.navColumn}>
                            <h4 className={styles.columnTitle}>Navigation</h4>
                            <nav>
                                {quickLinks.map(link => (
                                    <Link key={link.label} to={link.to} className={styles.footerLink}>
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                        <div className={styles.navColumn}>
                            <h4 className={styles.columnTitle}>Kontakt & Rechtliches</h4>
                            <nav>
                                <a href="tel:+49301234567" className={styles.footerLink}>+49 (0)30 123 456 78</a>
                                <a href="mailto:hallo@imw-friseure.de" className={styles.footerLink}>hallo@imw-friseure.de</a>
                                {legalLinks.map(link => (
                                    <Link key={link.label} to={link.to} className={styles.footerLink}>
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>

                <div className={styles.subFooter}>
                    <p className={styles.copyright}>
                        &copy; {currentYear} IMW Friseure
                    </p>
                    <div className={styles.socialLinks}>
                        {socialMedia.map(social => (
                            <a
                                key={social.label}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={social.label}
                                className={styles.socialIcon}
                            >
                                {social.icon}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;