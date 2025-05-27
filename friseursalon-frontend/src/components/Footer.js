import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Korrekter Import für Marken-Icons, nachdem das Paket installiert wurde
import { faFacebookF, faInstagram, faPinterestP } from '@fortawesome/free-brands-svg-icons';
import './Footer.css';

function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-column">
                        <h4>IMW Salon</h4>
                        <p>Musterstraße 123<br />12345 Berlin<br />Deutschland</p>
                        <p><a href="tel:+49301234567" className="interactive">+49 30 1234567</a><br />
                            <a href="mailto:hallo@imw-salon.de" className="interactive">hallo@imw-salon.de</a></p>
                    </div>
                    <div className="footer-column">
                        <h4>Öffnungszeiten</h4>
                        <ul>
                            <li>Di - Fr: 09:00 - 18:00 Uhr</li>
                            <li>Sa: 09:00 - 15:00 Uhr</li>
                            <li>So & Mo: Geschlossen</li>
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h4>Navigation</h4>
                        <ul>
                            <li><a href="/#experience" className="interactive">Erfahrung</a></li>
                            <li><a href="/#services-dynamic" className="interactive">Services</a></li>
                            <li><Link to="/buchen" className="interactive">Termin buchen</Link></li>
                            <li><a href="/#faq" className="interactive">FAQ</a></li>
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h4>Folgen Sie mir</h4>
                        <div className="social-icons">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="interactive" aria-label="Instagram">
                                <FontAwesomeIcon icon={faInstagram} />
                            </a>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="interactive" aria-label="Facebook">
                                <FontAwesomeIcon icon={faFacebookF} />
                            </a>
                            <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="interactive" aria-label="Pinterest">
                                <FontAwesomeIcon icon={faPinterestP} />
                            </a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} IMW Friseursalon. Alle Rechte vorbehalten.</p>
                    <p>
                        {/* Hier sollten tatsächliche Links zu Impressum/Datenschutz-Seiten sein, falls vorhanden */}
                        <Link to="/impressum" className="interactive">Impressum</Link> | <Link to="/datenschutz" className="interactive">Datenschutz</Link>
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
