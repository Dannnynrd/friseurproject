// File: src/components/AppointmentEditModal.js
import React, { useState, useEffect } from 'react';
import api from '../services/api.service';
import AuthService from '../services/auth.service';
import DatePicker, { registerLocale } from 'react-datepicker';
import { de } from 'date-fns/locale';
import "react-datepicker/dist/react-datepicker.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faSave, faSpinner, faUser, faClock,
  faConciergeBell, faStickyNote, faPhone, faEnvelope,
  faCalendarAlt, faExclamationCircle, faCheckCircle,
  faEdit, faCalendarDay, faInfoCircle, faTag, faEuroSign,
  faAlignLeft
} from '@fortawesome/free-solid-svg-icons';
import { format, parseISO, isValid } from 'date-fns';
import './AppointmentEditModal.module.css';

registerLocale('de', de);

function AppointmentEditModal({ appointment, onClose, onAppointmentUpdated }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    serviceId: '',
    notes: '',
  });
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const currentUser = AuthService.getCurrentUser();
  const isAdmin = currentUser?.roles?.includes("ROLE_ADMIN");

  useEffect(() => {
    if (appointment && appointment.startTime) {
      const startTimeDate = parseISO(appointment.startTime);
      if (isValid(startTimeDate)) {
        setSelectedDate(startTimeDate);
      } else {
        // Fallback if startTime is invalid, try to parse just the date part if time is the issue
        const dateOnly = appointment.startTime.split('T')[0];
        const parsedDateOnly = parseISO(dateOnly);
        if(isValid(parsedDateOnly)) {
          setSelectedDate(parsedDateOnly); // Set to midnight if time was invalid
        } else {
          setSelectedDate(new Date()); // Absolute fallback
        }
        console.error("Invalid startTime received, used fallback:", appointment.startTime);
      }
      setFormData({
        serviceId: appointment.service?.id?.toString() || '', // Ensure serviceId is a string for select value
        notes: appointment.notes || '',
      });
    } else if (appointment) {
      setSelectedDate(new Date());
      setFormData({
        serviceId: appointment.service?.id?.toString() || '',
        notes: appointment.notes || '',
      });
    }
  }, [appointment]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const serviceResponse = await api.get('/services');
        setServices(serviceResponse.data || []);
      } catch (err) {
        console.error("Fehler beim Laden der Services:", err);
      }
    };
    fetchServices();
  }, []);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setError('');
    setSuccessMessage('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    if (!selectedDate) {
      setError("Datum und Uhrzeit sind Pflichtfelder.");
      setIsLoading(false);
      return;
    }
    if (!formData.serviceId) {
      setError("Dienstleistung ist ein Pflichtfeld. Bitte wählen Sie eine Dienstleistung aus.");
      setIsLoading(false);
      return;
    }

    const formattedStartTime = format(selectedDate, "yyyy-MM-dd'T'HH:mm:ss");

    const payload = {
      startTime: formattedStartTime,
      serviceId: formData.serviceId, // serviceId is already a string from the select
      notes: formData.notes,
    };

    try {
      await api.put(`/appointments/${appointment.id}`, payload);
      setSuccessMessage('Termin erfolgreich aktualisiert!');
      setIsLoading(false);
      if (onAppointmentUpdated) {
        onAppointmentUpdated();
      }
      // Optional: Modal nach kurzer Verzögerung schließen
      setTimeout(() => {
        if (!error) { // Nur schließen, wenn kein neuer Fehler während des Speicherns aufgetreten ist
          onClose();
        }
      }, 1800);
    } catch (err) {
      console.error("Fehler beim Aktualisieren des Termins:", err);
      const errMsg = err.response?.data?.message || "Fehler beim Aktualisieren des Termins.";
      if (errMsg.toLowerCase().includes("service id") || errMsg.toLowerCase().includes("dienstleistungs-id")) {
        setError("Dienstleistungs-ID für Update fehlt oder ist ungültig. Bitte wählen Sie eine Dienstleistung.");
      } else {
        setError(errMsg);
      }
      setIsLoading(false);
    }
  };

  const selectedServiceFull = services.find(s => s.id === parseInt(formData.serviceId));

  if (!appointment) return null;

  const DetailItem = ({ icon, label, value, className = '' }) => (
      <div className={`detail-item ${className}`}>
        <FontAwesomeIcon icon={icon} className="detail-item-icon" />
        <span className="detail-item-label">{label}:</span>
        <span className="detail-item-value">{value || 'N/A'}</span>
      </div>
  );

  return (
      <div className="modal-overlay-modern" onClick={onClose}>
        <div className="modal-content-modern appointment-edit-modal-modern" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header-modern">
            <h2 className="modal-title-modern">
              <FontAwesomeIcon icon={faCalendarAlt} /> Terminübersicht
            </h2>
            <button onClick={onClose} className="modal-close-button-modern" aria-label="Schließen">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {error && <p className="form-message error modal-form-message-modern"><FontAwesomeIcon icon={faExclamationCircle} /> {error}</p>}
          {successMessage && <p className="form-message success modal-form-message-modern"><FontAwesomeIcon icon={faCheckCircle} /> {successMessage}</p>}

          <div className="modal-body-modern">
            <div className="modal-sections-container">
              <section className="modal-section customer-info-section">
                <h3 className="modal-section-title"><FontAwesomeIcon icon={faUser} /> Kundendetails</h3>
                <div className="customer-details-content">
                  <DetailItem icon={faUser} label="Name" value={`${appointment.customer?.firstName} ${appointment.customer?.lastName}`} />
                  <DetailItem icon={faEnvelope} label="E-Mail" value={appointment.customer?.email} />
                  <DetailItem icon={faPhone} label="Telefon" value={appointment.customer?.phoneNumber} />
                </div>
              </section>

              <section className="modal-section appointment-form-section-modern">
                <h3 className="modal-section-title"><FontAwesomeIcon icon={faEdit} /> Termin anpassen</h3>
                <form onSubmit={handleSubmit} className="appointment-edit-form-fields">
                  <div className="form-group-modern datepicker-group">
                    <label htmlFor="appointmentDateTime"><FontAwesomeIcon icon={faCalendarDay} /> Datum & Uhrzeit</label>
                    <DatePicker
                        selected={selectedDate}
                        onChange={handleDateChange}
                        locale="de"
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={15}
                        dateFormat="dd.MM.yyyy HH:mm"
                        className="custom-datepicker-input"
                        wrapperClassName="datepicker-wrapper"
                        id="appointmentDateTime"
                        disabled={!isAdmin}
                        minDate={isAdmin ? null : new Date()} // Admins can select past dates
                        placeholderText="Datum und Uhrzeit wählen"
                        autoComplete="off"
                        popperPlacement="top-end" // Versucht, das Popup besser zu positionieren
                    />
                  </div>

                  <div className="form-group-modern">
                    <label htmlFor="serviceId"><FontAwesomeIcon icon={faConciergeBell} /> Dienstleistung</label>
                    <select
                        id="serviceId"
                        name="serviceId"
                        value={formData.serviceId}
                        onChange={handleChange}
                        required
                        disabled={!isAdmin}
                        className="custom-select-input"
                    >
                      <option value="" disabled>Bitte Dienstleistung wählen...</option>
                      {services.map(service => (
                          <option key={service.id} value={service.id.toString()}> {/* Ensure value is string */}
                            {service.name}
                          </option>
                      ))}
                    </select>
                  </div>

                  {selectedServiceFull && (
                      <div className="service-details-preview">
                        <DetailItem icon={faInfoCircle} label="Ausgewählt" value={selectedServiceFull.name} />
                        <DetailItem icon={faClock} label="Dauer" value={`${selectedServiceFull.duration} Min.`} />
                        <DetailItem icon={faEuroSign} label="Preis" value={`${selectedServiceFull.price}€`} />
                      </div>
                  )}

                  <div className="form-group-modern">
                    <label htmlFor="notes"><FontAwesomeIcon icon={faAlignLeft} /> Notizen (optional)</label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Zusätzliche Informationen zum Termin..."
                        disabled={!isAdmin}
                        className="custom-textarea-input"
                    ></textarea>
                  </div>

                  {isAdmin && (
                      <div className="modal-actions-modern">
                        <button type="button" onClick={onClose} className="button-link-outline modal-button-modern">
                          Abbrechen
                        </button>
                        <button type="submit" className="button-link modal-button-modern primary" disabled={isLoading}>
                          {isLoading ? <><FontAwesomeIcon icon={faSpinner} spin /> Speichern...</> : <><FontAwesomeIcon icon={faSave} /> Änderungen Speichern</>}
                        </button>
                      </div>
                  )}
                </form>
              </section>
            </div>
          </div>
        </div>
      </div>
  );
}

export default AppointmentEditModal;
