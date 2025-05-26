import React, { useState, useEffect } from  'react';
import api from '../services/api.service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes } from '@fortawesome/free-solid-svg-icons';

function AppointmentEditModal({ appointment, onClose, onAppointmentUpdated }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [customerFirstName, setCustomerFirstName] = useState('');
  const [customerLastName, setCustomerLastName] = useState('');

  useEffect(() => {
    if (appointment) {
      const apptDate = appointment.startTime.substring(0, 10);
      const apptTime = appointment.startTime.substring(11, 16);

      setDate(apptDate);
      setTime(apptTime);
      setNotes(appointment.notes || '');
      setSelectedServiceId(appointment.service ? appointment.service.id.toString() : '');
      setCustomerFirstName(appointment.customer ? appointment.customer.firstName : '');
      setCustomerLastName(appointment.customer ? appointment.customer.lastName : '');
      setMessage('');
    }
  }, [appointment]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('services');
        setServices(response.data);
      } catch (error) {
        console.error("Fehler beim Laden der Dienstleistungen für Modal:", error);
      }
    };
    fetchServices();
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!date || !time || !selectedServiceId) {
      setMessage('Bitte Datum, Uhrzeit und Dienstleistung auswählen.');
      return;
    }

    const updatedStartTime = `${date}T${time}:00`;

    try {
      const customerData = {
        id: appointment.customer.id,
        firstName: customerFirstName,
        lastName: customerLastName,
        email: appointment.customer.email,
        phoneNumber: appointment.phoneNumber
      };

      const updatedAppointment = {
        id: appointment.id,
        startTime: updatedStartTime,
        service: { id: parseInt(selectedServiceId) },
        customer: customerData,
        notes
      };

      await api.put(`appointments/${appointment.id}`, updatedAppointment);
      setMessage('Termin erfolgreich aktualisiert!');
      onAppointmentUpdated();
      setTimeout(onClose, 1500);
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Termins:", error);
      if (error.response && error.response.status === 400) {
        setMessage('Fehler bei der Anfrage: Bitte überprüfen Sie Ihre Eingaben.');
      } else {
        setMessage('Fehler beim Aktualisieren des Termins. Bitte versuchen Sie es erneut.');
      }
    }
  };

  if (!appointment) {
    return null;
  }

  return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Termin bearbeiten</h3>
          <form onSubmit={handleSubmit} className="service-edit-form">
            <div className="form-group">
              <label>Kunde:</label>
              <input
                  type="text"
                  value={`${customerFirstName} ${customerLastName} (${appointment.customer.email})`}
                  disabled
              />
            </div>
            <div className="form-group">
              <label htmlFor="editService">Dienstleistung:</label>
              <select
                  id="editService"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  required
              >
                <option value="">Wählen Sie eine Dienstleistung</option>
                {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.durationMinutes} Min, {service.price.toFixed(2)} €)
                    </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="editDate">Datum:</label>
              <input
                  type="date"
                  id="editDate"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
              />
            </div>
            <div className="form-group">
              <label htmlFor="editTime">Uhrzeit:</label>
              <input
                  type="time"
                  id="editTime"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
              />
            </div>
            <div className="form-group">
              <label htmlFor="editNotes">Notizen:</label>
              <textarea
                  id="editNotes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
            <div className="modal-actions">
              <button type="submit" className="save-button">
                <FontAwesomeIcon icon={faSave} /> Speichern
              </button>
              <button type="button" onClick={onClose} className="cancel-button">
                <FontAwesomeIcon icon={faTimes} /> Abbrechen
              </button>
            </div>
          </form>
          {message && <p className="form-message">{message}</p>}
        </div>
      </div>
  );
}

export default AppointmentEditModal;
