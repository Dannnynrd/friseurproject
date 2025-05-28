import React, { useState, useEffect } from 'react';
import api from '../services/api.service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faTrashAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import ConfirmModal from './ConfirmModal'; // Import ConfirmModal

function AppointmentEditModal({ appointment, onClose, onAppointmentUpdated }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [customerFirstName, setCustomerFirstName] = useState('');
  const [customerLastName, setCustomerLastName] = useState('');
  const [customerEmail, setCustomerEmail] = useState(''); // Added for display

  // State for messages and loading
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // For save operation
  const [isDeleting, setIsDeleting] = useState(false); // For delete operation

  // State for delete confirmation
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState('');


  useEffect(() => {
    if (appointment) {
      const apptDate = appointment.startTime ? appointment.startTime.substring(0, 10) : '';
      const apptTime = appointment.startTime ? appointment.startTime.substring(11, 16) : '';

      setDate(apptDate);
      setTime(apptTime);
      setNotes(appointment.notes || '');
      setSelectedServiceId(appointment.service ? String(appointment.service.id) : '');
      setCustomerFirstName(appointment.customer ? appointment.customer.firstName : 'N/A');
      setCustomerLastName(appointment.customer ? appointment.customer.lastName : '');
      setCustomerEmail(appointment.customer ? appointment.customer.email : 'N/A');

      setMessage('');
      setDeleteError('');
      setIsSubmitting(false);
      setIsDeleting(false);
    }
  }, [appointment]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get('/services'); // Path should be relative to API_BASE_URL
        setServices(response.data || []);
      } catch (error) {
        console.error("Fehler beim Laden der Dienstleistungen für Modal:", error);
        setMessage('Dienstleistungen konnten nicht geladen werden.');
      }
    };
    if (appointment) { // Fetch services only when modal is open for an appointment
      fetchServices();
    }
  }, [appointment]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setDeleteError('');
    setIsSubmitting(true);

    if (!date || !time || !selectedServiceId) {
      setMessage('Bitte Datum, Uhrzeit und Dienstleistung auswählen.');
      setIsSubmitting(false);
      return;
    }

    const updatedStartTime = `${date}T${time}:00`;

    try {
      // Customer data should ideally not be modifiable here unless intended
      // For now, we pass the existing customer ID.
      // If customer details (like name) were editable, they'd need to be part of the payload.
      const customerData = {
        id: appointment.customer.id,
        firstName: customerFirstName, // Assuming these are not changed in this modal
        lastName: customerLastName,
        email: customerEmail,
        // phoneNumber: appointment.customer.phoneNumber // if available and needed
      };

      const updatedAppointmentPayload = {
        id: appointment.id,
        startTime: updatedStartTime,
        service: { id: parseInt(selectedServiceId) },
        customer: customerData, // Pass the original customer data or updated if form allows
        notes
      };

      await api.put(`appointments/${appointment.id}`, updatedAppointmentPayload);
      setMessage('Termin erfolgreich aktualisiert!');
      if(onAppointmentUpdated) onAppointmentUpdated();
      setTimeout(() => {
        onClose();
        setMessage(''); // Clear message on close
      }, 1500);
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Termins:", error);
      const errMsg = error.response?.data?.message || 'Fehler beim Aktualisieren des Termins. Bitte versuchen Sie es erneut.';
      setMessage(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteError(''); // Clear previous delete errors
    setShowConfirmDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!appointment || !appointment.id) return;

    setIsDeleting(true);
    setDeleteError('');
    setShowConfirmDeleteModal(false);

    try {
      await api.delete(`appointments/${appointment.id}`);
      // setMessage('Termin erfolgreich gelöscht!'); // Success message handled by onAppointmentUpdated if needed
      if(onAppointmentUpdated) onAppointmentUpdated(); // This will trigger a refresh in the parent
      onClose(); // Close the edit modal
    } catch (error) {
      console.error("Fehler beim Löschen des Termins:", error);
      const errMsg = error.response?.data?.message || 'Fehler beim Löschen des Termins.';
      setDeleteError(errMsg); // Show delete error in the modal
      // setMessage(errMsg); // Or use the general message state
    } finally {
      setIsDeleting(false);
    }
  };


  if (!appointment) {
    return null;
  }

  return (
      <>
        <div className="modal-overlay">
          <div className="modal-content appointment-edit-modal-content">
            <h3>Termin Details & Bearbeitung</h3>
            <form onSubmit={handleSubmit} className="service-edit-form"> {/* Re-using class, consider renaming if styles diverge significantly */}
              <div className="form-group">
                <label>Kunde:</label>
                <input
                    type="text"
                    value={`${customerFirstName} ${customerLastName} (${customerEmail})`}
                    disabled
                    className="form-input-disabled"
                />
              </div>
              <div className="form-group">
                <label htmlFor="editService">Dienstleistung:</label>
                <select
                    id="editService"
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    required
                    disabled={isSubmitting || isDeleting}
                >
                  <option value="">Wählen Sie eine Dienstleistung</option>
                  {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} ({service.durationMinutes} Min, {service.price ? service.price.toFixed(2) : 'N/A'} €)
                      </option>
                  ))}
                </select>
              </div>
              <div className="form-grid-halved">
                <div className="form-group">
                  <label htmlFor="editDate">Datum:</label>
                  <input
                      type="date"
                      id="editDate"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      disabled={isSubmitting || isDeleting}
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
                      disabled={isSubmitting || isDeleting}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="editNotes">Notizen:</label>
                <textarea
                    id="editNotes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="3"
                    disabled={isSubmitting || isDeleting}
                ></textarea>
              </div>

              {message && <p className={`form-message ${message.includes('erfolgreich') ? 'success' : 'error'} mt-3`}>{message}</p>}
              {deleteError && <p className="form-message error mt-3">{deleteError}</p>}

              <div className="modal-actions">
                <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="button-link-outline danger" // Danger styling for delete
                    disabled={isSubmitting || isDeleting}
                >
                  {isDeleting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faTrashAlt} />} Löschen
                </button>
                <div className="modal-actions-right">
                  <button
                      type="button"
                      onClick={onClose}
                      className="button-link-outline"
                      disabled={isSubmitting || isDeleting}
                  >
                    <FontAwesomeIcon icon={faTimes} /> Abbrechen
                  </button>
                  <button
                      type="submit"
                      className="button-link" // Primary action for save
                      disabled={isSubmitting || isDeleting}
                  >
                    {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />} Speichern
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <ConfirmModal
            isOpen={showConfirmDeleteModal}
            onClose={() => setShowConfirmDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            title="Termin löschen"
            message={`Möchten Sie diesen Termin wirklich endgültig löschen? Dieser Schritt kann nicht rückgängig gemacht werden.`}
            confirmText="Ja, löschen"
            cancelText="Abbrechen"
            type="danger"
        />
      </>
  );
}

export default AppointmentEditModal;
