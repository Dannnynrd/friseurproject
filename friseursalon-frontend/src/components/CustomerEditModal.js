// src/components/CustomerEditModal.js
import React, { useState, useEffect } from 'react';
import api from '../services/api.service'; // API Service
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faSpinner, faExclamationCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons'; // faCheckCircle HINZUGEFÜGT
// import './CustomerEditModal.css'; // Stelle sicher, dass die CSS importiert wird, falls spezifisch

function CustomerEditModal({ customer, onClose, onCustomerUpdated }) {
    const [formData, setFormData] = useState({
        id: '',
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        notes: ''
    });
    // HINWEIS: message wird zu error umbenannt für Klarheit
    const [error, setError] = useState(''); // Für Fehlermeldungen
    const [successMessage, setSuccessMessage] = useState(''); // Für Erfolgsmeldungen

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (customer) {
            setFormData({
                id: customer.id || '',
                firstName: customer.firstName || '',
                lastName: customer.lastName || '',
                email: customer.email || '',
                phoneNumber: customer.phoneNumber || '',
                notes: customer.notes || ''
            });
            setError(''); // Fehler zurücksetzen, wenn Modal mit neuem Kunden geöffnet wird
            setSuccessMessage(''); // Erfolgsmeldung zurücksetzen
        }
    }, [customer]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsSubmitting(true);

        if (!formData.firstName || !formData.lastName || !formData.email) {
            setError('Vorname, Nachname und E-Mail dürfen nicht leer sein.');
            setIsSubmitting(false);
            return;
        }
        // Optionale E-Mail-Validierung (einfach)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
            setIsSubmitting(false);
            return;
        }

        try {
            // Sendet das gesamte formData Objekt, das die ID enthält
            await api.put(`/customers/${formData.id}`, formData);
            setSuccessMessage('Kundendaten erfolgreich aktualisiert!');
            if (onCustomerUpdated) {
                onCustomerUpdated(); // Ruft Callback auf, um die Liste in der Elternkomponente zu aktualisieren
            }
            setTimeout(() => {
                onClose(); // Schließt das Modal nach einer kurzen Verzögerung
            }, 1500); // 1.5 Sekunden Verzögerung
        } catch (err) {
            console.error("Fehler beim Aktualisieren der Kundendaten:", err.response || err);
            const errMsg = err.response?.data?.message || 'Fehler beim Aktualisieren der Kundendaten.';
            setError(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!customer) {
        return null;
    }

    return (
        <div className="modal-overlay">
            {/* Es ist besser, .modal-content beizubehalten und spezifische Klassen für Overrides hinzuzufügen */}
            <div className="modal-content customer-edit-modal-content">
                <h3>Kundendaten bearbeiten</h3>
                {/* Globale Klasse .app-form für konsistentes Styling von Formularen */}
                <form onSubmit={handleSubmit} className="app-form service-edit-form">
                    <div className="form-group">
                        <label htmlFor="editModalFirstName">Vorname*</label>
                        <input
                            type="text"
                            id="editModalFirstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="editModalLastName">Nachname*</label>
                        <input
                            type="text"
                            id="editModalLastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="editModalEmail">E-Mail*</label>
                        <input
                            type="email"
                            id="editModalEmail"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="editModalPhoneNumber">Telefonnummer</label>
                        <input
                            type="tel"
                            id="editModalPhoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="editModalNotes">Notizen (Admin)</label>
                        <textarea
                            id="editModalNotes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="4" // Etwas mehr Platz für Notizen
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Nachrichtenanzeige */}
                    {error && (
                        <p className="form-message error small mt-3">
                            <FontAwesomeIcon icon={faExclamationCircle} /> {error}
                        </p>
                    )}
                    {successMessage && (
                        <p className="form-message success small mt-3">
                            <FontAwesomeIcon icon={faCheckCircle} /> {successMessage}
                        </p>
                    )}

                    <div className="modal-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="button-link-outline"
                            disabled={isSubmitting}
                        >
                            <FontAwesomeIcon icon={faTimes} /> Abbrechen
                        </button>
                        <button
                            type="submit"
                            className="button-link"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />}
                            Speichern
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CustomerEditModal;
