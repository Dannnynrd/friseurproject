import React, { useState } from 'react';
import api from '../services/api.service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

function ServiceForm({ onServiceAdded, isSubmitting, setIsSubmitting }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [durationMinutes, setDurationMinutes] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!name || !description || !price || !durationMinutes) {
            setMessage('Bitte füllen Sie alle Pflichtfelder aus.');
            return;
        }
        if (isNaN(price) || parseFloat(price) <= 0 || isNaN(durationMinutes) || parseInt(durationMinutes) <= 0) {
            setMessage('Preis und Dauer müssen positive Zahlen sein.');
            return;
        }

        setIsSubmitting(true);
        let submissionError = null; // Variable, um den Fehler zu speichern

        const newService = {
            name,
            description,
            price: parseFloat(price),
            durationMinutes: parseInt(durationMinutes)
        };

        try {
            await api.post('services', newService);
            setName('');
            setDescription('');
            setPrice('');
            setDurationMinutes('');
            if (onServiceAdded) {
                onServiceAdded(); // Dies ruft handleServiceAddedCallback auf, was setIsSubmitting(false) macht
            }
        } catch (error) { // Fehler hier fangen und speichern
            submissionError = error; // Fehlerobjekt speichern
            console.error("Fehler beim Hinzufügen der Dienstleistung:", error);
            if (error.response && error.response.data && error.response.data.errors) {
                setMessage(`Fehler: ${error.response.data.errors.join(', ')}`);
            } else if (error.response && error.response.data && error.response.data.message) {
                setMessage(`Fehler: ${error.response.data.message}`);
            } else {
                setMessage('Fehler beim Hinzufügen der Dienstleistung. Bitte versuchen Sie es erneut.');
            }
        } finally {
            // setIsSubmitting wird im Erfolgsfall durch onServiceAdded (-> handleServiceAddedCallback) zurückgesetzt.
            // Hier nur zurücksetzen, wenn ein Fehler aufgetreten ist.
            if (submissionError) {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="service-form-container">
            <h3>Neue Dienstleistung hinzufügen</h3>
            <form onSubmit={handleSubmit} className="service-form">
                <div className="form-group">
                    <label htmlFor="name">Name:</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Beschreibung:</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        disabled={isSubmitting}
                    ></textarea>
                </div>
                <div className="form-group">
                    <label htmlFor="price">Preis (€):</label>
                    <input
                        type="number"
                        id="price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        step="0.01"
                        required
                        disabled={isSubmitting}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="durationMinutes">Dauer (Minuten):</label>
                    <input
                        type="number"
                        id="durationMinutes"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </div>
                <button type="submit" className="button-link" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <><FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> Wird hinzugefügt...</>
                    ) : (
                        "Dienstleistung hinzufügen"
                    )}
                </button>
            </form>
            {message && <p className="form-message mt-3">{message}</p>}
        </div>
    );
}

export default ServiceForm;