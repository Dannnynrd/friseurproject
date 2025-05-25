import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ServiceEditModal({ service, onClose, onServiceUpdated }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [durationMinutes, setDurationMinutes] = useState('');
    const [message, setMessage] = useState('');

    // useEffect zum Initialisieren der Formularfelder, wenn sich die "service"-Prop ändert
    useEffect(() => {
        if (service) {
            setName(service.name || '');
            setDescription(service.description || '');
            setPrice(service.price ? service.price.toString() : '');
            setDurationMinutes(service.durationMinutes ? service.durationMinutes.toString() : '');
            setMessage(''); // Nachricht zurücksetzen, wenn Modal geöffnet wird
        }
    }, [service]); // Abhängigkeit von 'service'

    // Handler für das Absenden des Bearbeitungsformulars
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !description || !price || !durationMinutes) {
            setMessage('Bitte füllen Sie alle Felder aus.');
            return;
        }
        if (isNaN(price) || isNaN(durationMinutes) || parseFloat(price) <= 0 || parseInt(durationMinutes) <= 0) {
            setMessage('Preis und Dauer müssen positive Zahlen sein.');
            return;
        }

        const updatedService = {
            id: service.id, // Die ID der Dienstleistung muss beibehalten werden
            name,
            description,
            price: parseFloat(price),
            durationMinutes: parseInt(durationMinutes)
        };

        try {
            await axios.put(`http://localhost:8080/api/services/${service.id}`, updatedService);
            setMessage('Dienstleistung erfolgreich aktualisiert!');
            onServiceUpdated(); // Elternkomponente informieren, dass aktualisiert wurde
            setTimeout(onClose, 1500); // Modal nach 1.5 Sekunden schließen
        } catch (error) {
            console.error("Fehler beim Aktualisieren der Dienstleistung:", error);
            setMessage('Fehler beim Aktualisieren der Dienstleistung. Bitte versuchen Sie es erneut.');
        }
    };

    // Wenn kein Service übergeben wird (z.B. Modal ist geschlossen), nichts rendern
    if (!service) {
        return null;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Dienstleistung bearbeiten</h3>
                <form onSubmit={handleSubmit} className="service-edit-form">
                    <div className="form-group">
                        <label htmlFor="editName">Name:</label>
                        <input
                            type="text"
                            id="editName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="editDescription">Beschreibung:</label>
                        <textarea
                            id="editDescription"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="editPrice">Preis (€):</label>
                        <input
                            type="number"
                            id="editPrice"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            step="0.01"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="editDuration">Dauer (Minuten):</label>
                        <input
                            type="number"
                            id="editDuration"
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(e.target.value)}
                            required
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="submit" className="save-button">Speichern</button>
                        <button type="button" onClick={onClose} className="cancel-button">Abbrechen</button>
                    </div>
                </form>
                {message && <p className="form-message">{message}</p>}
            </div>
        </div>
    );
}

export default ServiceEditModal;