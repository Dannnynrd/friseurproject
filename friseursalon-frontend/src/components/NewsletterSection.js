// friseursalon-frontend/src/components/NewsletterSection.js
import React, { useState, useEffect, useRef } from 'react';
// HIER den Import ändern:
import styles from './NewsletterSection.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import api from '../services/api.service'; // Annahme: Es gibt einen Endpunkt für Newsletter-Anmeldungen

function NewsletterSection() {
    const sectionRef = useRef(null);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        const currentSectionRef = sectionRef.current;
        if (currentSectionRef) {
            observer.observe(currentSectionRef);
        }

        return () => {
            if (currentSectionRef) {
                observer.unobserve(currentSectionRef);
            }
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            setError("Bitte geben Sie eine E-Mail-Adresse ein.");
            return;
        }
        setLoading(true);
        setMessage('');
        setError('');

        try {
            // Annahme: Dein Backend hat einen Endpunkt wie /api/newsletter/subscribe
            // Passe dies entsprechend deinem Backend an.
            const response = await api.post('/api/newsletter/subscribe', { email });
            setMessage(response.data.message || "Vielen Dank für Ihre Anmeldung!");
            setEmail(''); // Formular zurücksetzen
        } catch (err) {
            console.error("Newsletter subscription error:", err.response?.data || err.message);
            setError(err.response?.data?.message || "Anmeldung fehlgeschlagen. Bitte versuchen Sie es später erneut.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="newsletter" ref={sectionRef} className="py-16 md:py-24 bg-dark-text text-light-text-on-dark">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-xl mx-auto animate-up">
                    {/* Section Header angepasst für dunklen Hintergrund */}
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Bleiben Sie informiert
                    </span>
                    <h2 className="font-serif text-3xl md:text-4xl font-medium text-white mb-4">
                        Newsletter abonnieren
                    </h2>
                    <p className="text-gray-300 mb-8">
                        Erhalten Sie exklusive Angebote, Styling-Tipps und Neuigkeiten direkt in Ihr Postfach.
                    </p>

                    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-3 max-w-md mx-auto ${styles.newsletterForm}`}>
                        <label htmlFor="newsletter-email" className="sr-only">E-Mail-Adresse</label>
                        <input
                            type="email"
                            id="newsletter-email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Ihre E-Mail-Adresse"
                            required
                            className={`flex-grow p-3 rounded-md border bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none ${styles.newsletterInput}`}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            className={`inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-text focus:ring-indigo-500 ${styles.newsletterButton}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                            )}
                            {loading ? "Senden..." : "Abonnieren"}
                        </button>
                    </form>

                    {message && (
                        <div className={`mt-4 p-3 rounded-md bg-green-500 bg-opacity-20 text-green-300 text-sm flex items-center justify-center ${styles.formMessage} ${styles.success}`}>
                            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" /> {message}
                        </div>
                    )}
                    {error && (
                        <div className={`mt-4 p-3 rounded-md bg-red-500 bg-opacity-20 text-red-300 text-sm flex items-center justify-center ${styles.formMessage} ${styles.error}`}>
                            <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" /> {error}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export default NewsletterSection;
