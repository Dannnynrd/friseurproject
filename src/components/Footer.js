import React, { useEffect, useRef } from 'react';

function Footer() {
    const yearSpanRef = useRef(null); // Für das Copyright-Jahr

    useEffect(() => {
        if (yearSpanRef.current) {
            yearSpanRef.current.textContent = new Date().getFullYear();
        }
    }, []); // Nur einmal beim Mount

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-column">
                        <h4>IMW Salon</h4>
                        <p>Die Kunst der Reduktion. Ich kreiere Balance, Form und ein Gefühl von müheloser Eleganz.</p>
                    </div>
                    <div className="footer-column">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><a href="#experience" className="interactive">Die Erfahrung</a></li>
                            <li><a href="#services-dynamic" className="interactive">Services</a></li>
                            <li><a href="#about-founder" className="interactive">Über Mich</a></li>
                            <li><a href="#faq" className="interactive">FAQ</a></li>
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h4>Kontakt</h4>
                        <p>
                            Musterstraße 123<br />
                            10115 Berlin, Deutschland<br /><br />
                            <a href="tel:+49301234567" className="interactive">T: (030) 123 456 7</a><br />
                            <a href="mailto:hallo@imw-salon.de" className="interactive">E: hallo@imw-salon.de</a>
                        </p>
                    </div>
                    <div className="footer-column">
                        <h4>Folgen Sie mir</h4>
                        <div className="social-icons">
                            <a href="#" className="interactive" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                            <a href="#" className="interactive" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
                            <a href="#" className="interactive" aria-label="Pinterest"><i className="fab fa-pinterest-p"></i></a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; <span id="copyright-year" ref={yearSpanRef}></span> IMW Salon. Alle Rechte vorbehalten. | <a href="#" className="interactive">Impressum</a> | <a href="#" className="interactive">Datenschutz</a></p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;