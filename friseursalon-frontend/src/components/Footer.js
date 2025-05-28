import React, { useState, useEffect, useCallback } from 'react'; // useState, useEffect, useCallback hinzugefügt
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faInstagram, faPinterestP } from '@fortawesome/free-brands-svg-icons';
import api from '../services/api.service'; // API Service importieren
import './Footer.css';

const germanDaysShortFooter = { // Eigene Konstante, um Konflikte zu vermeiden, falls unterschiedlich benötigt
    MONDAY: "Mo",
    TUESDAY: "Di",
    WEDNESDAY: "Mi",
    THURSDAY: "Do",
    FRIDAY: "Fr",
    SATURDAY: "Sa",
    SUNDAY: "So"
};
const getOrderedDaysFooter = () => {
    return ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
};

function Footer() {
    const [footerWorkingHours, setFooterWorkingHours] = useState([]);
    const [loadingFooterHours, setLoadingFooterHours] = useState(true);
    // Optional: error state für Footer

    const fetchFooterWorkingHours = useCallback(async () => {
        setLoadingFooterHours(true);
        try {
            const response = await api.get('/workinghours');
            const orderedDays = getOrderedDaysFooter();
            const sortedHours = (response.data || []).sort((a, b) => {
                return orderedDays.indexOf(a.dayOfWeek) - orderedDays.indexOf(b.dayOfWeek);
            });
            setFooterWorkingHours(sortedHours);
        } catch (err) {
            console.error("Fehler beim Laden der Öffnungszeiten für Footer:", err);
            // Hier könntest du einen Fehlerstatus setzen, wenn gewünscht
        } finally {
            setLoadingFooterHours(false);
        }
    }, []);

    useEffect(() => {
        fetchFooterWorkingHours();
    }, [fetchFooterWorkingHours]);

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
                        {loadingFooterHours ? (
                            <p>Lade...</p>
                        ) : footerWorkingHours.length > 0 ? (
                            <ul className="footer-opening-hours">
                                {footerWorkingHours.map(wh => (
                                    <li key={`footer-${wh.dayOfWeek}`}>
                                        <span className="day">{germanDaysShortFooter[wh.dayOfWeek]}:</span>
                                        {wh.isClosed || !wh.startTime || !wh.endTime ? (
                                            <span className="time closed">Geschlossen</span>
                                        ) : (
                                            <span className="time">{wh.startTime} - {wh.endTime}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>Zeiten nicht verfügbar.</p>
                        )}
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
                        <Link to="/impressum" className="interactive">Impressum</Link> | <Link to="/datenschutz" className="interactive">Datenschutz</Link>
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;