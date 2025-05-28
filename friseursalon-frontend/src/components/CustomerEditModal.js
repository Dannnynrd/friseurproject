// src/components/CustomerEditModal.js
import React, { useState, useEffect } from 'react';
import api from '../services/api.service'; // API Service
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
// import './CustomerEditModal.css'; // Optional, falls spezifische Stile benötigt werden

function CustomerEditModal({ customer, onClose, onCustomerUpdated }) {
    const [formData, setFormData] = useState({
        id: '',
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        notes: ''
    });
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

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
            setMessage('');
            setError('');
        }
    }, [customer]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsSubmitting(true);

        if (!formData.firstName || !formData.lastName || !formData.email) {
            setError('Vorname, Nachname und E-Mail dürfen nicht leer sein.');
            setIsSubmitting(false);
            return;
        }
        // Optional: E-Mail-Validierung
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
            setIsSubmitting(false);
            return;
        }

        try {
            // Sendet das gesamte formData Objekt, das die ID enthält
            await api.put(`/customers/${formData.id}`, formData);
            setMessage('Kundendaten erfolgreich aktualisiert!');
            if (onCustomerUpdated) {
                onCustomerUpdated(); // Ruft Callback auf, um die Liste in der Elternkomponente zu aktualisieren
            }
            setTimeout(() => {
                onClose(); // Schließt das Modal nach einer kurzen Verzögerung
            }, 1500);
        } catch (err) {
            console.error("Fehler beim Aktualisieren der Kundendaten:", err.response || err);
            const errMsg = err.response?.data?.message || 'Fehler beim Aktualisieren der Kundendaten.';
            setError(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!customer) {
        return null; // Rendert nichts, wenn kein Kunde zum Bearbeiten ausgewählt ist
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content customer-edit-modal-content"> {/* Eigene Klasse für spezifisches Styling */}
                <h3>Kundendaten bearbeiten</h3>
                <form onSubmit={handleSubmit} className="app-form"> {/* Generische Formular-Klasse */}
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
                            rows="4"
                            disabled={isSubmitting}
                        />
                    </div>

                    {message && <p className="form-message success small mt-3">{message}</p>}
                    {error && <p className="form-message error small mt-3">{error}</p>}

                    <div className="modal-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="button-link-outline" // Standard Outline-Button
                            disabled={isSubmitting}
                        >
                            <FontAwesomeIcon icon={faTimes} /> Abbrechen
                        </button>
                        <button
                            type="submit"
                            className="button-link" // Standard Primary-Button
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
