import React, { useState } from 'react';
import api from '../services/api.service';
// import './ServiceForm.css'; // Optional: Styling für diese Komponente - wurde zentralisiert

function ServiceForm({ onServiceAdded }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [durationMinutes, setDurationMinutes] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !description || !price || !durationMinutes) {
            setMessage('Bitte füllen Sie alle Felder aus.');
            return;
        }
        if (isNaN(price) || parseFloat(price) <= 0 || isNaN(durationMinutes) || parseInt(durationMinutes) <= 0) {
            setMessage('Preis und Dauer müssen positive Zahlen sein.');
            return;
        }

        const newService = {
            name,
            description,
            price: parseFloat(price),
            durationMinutes: parseInt(durationMinutes)
        };

        try {
            const response = await api.post('services', newService);
            setMessage(`Dienstleistung "${response.data.name}" erfolgreich hinzugefügt!`);
            setName('');
            setDescription('');
            setPrice('');
            setDurationMinutes('');
            onServiceAdded();
        } catch (error) {
            console.error("Fehler beim Hinzufügen der Dienstleistung:", error);
            setMessage('Fehler beim Hinzufügen der Dienstleistung. Bitte versuchen Sie es erneut.');
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
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Beschreibung:</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
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
                    />
                </div>
                <button type="submit" className="submit-button">Dienstleistung hinzufügen</button>
            </form>
            {message && <p className="form-message">{message}</p>}
        </div>
    );
}

export default ServiceForm;
