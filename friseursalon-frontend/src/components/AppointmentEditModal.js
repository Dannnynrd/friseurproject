// friseursalon-frontend/src/components/AppointmentEditModal.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api.service';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { de } from 'date-fns/locale';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import styles from './AppointmentEditModal.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes, faSave, faSpinner, faExclamationCircle, faCheckCircle,
  faUser, faCut, faClock, faEnvelope, faStickyNote, faCalendarAlt,
  faTrashAlt, faEdit, faTimesCircle // faTimesCircle HIER HINZUGEFÜGT
} from '@fortawesome/free-solid-svg-icons';
import { parseISO, format as formatDateFns, isValid as isValidDateFns } from 'date-fns';
import ConfirmModal from './ConfirmModal';

registerLocale('de', de);

const EditAppointmentSchema = Yup.object().shape({
  serviceId: Yup.string().required('Dienstleistung ist erforderlich.'),
  appointmentDate: Yup.date().required('Datum ist erforderlich.').nullable().min(new Date(new Date().setDate(new Date().getDate() -1)), "Datum darf nicht in der Vergangenheit liegen."),
  appointmentTime: Yup.string().required('Uhrzeit ist erforderlich.'),
  notes: Yup.string().max(500, "Notizen dürfen maximal 500 Zeichen lang sein.").notRequired(),
  status: Yup.string().required("Status ist erforderlich."),
  price: Yup.number().typeError("Preis muss eine Zahl sein.").positive("Preis muss positiv sein.").required("Preis ist erforderlich."),
  duration: Yup.number().typeError("Dauer muss eine Zahl sein.").integer("Dauer muss eine ganze Zahl sein.").min(5, "Dauer muss mind. 5 Min. sein.").required("Dauer ist erforderlich.")
});

const formatPriceForInput = (price) => {
  if (typeof price !== 'number') return '';
  return price.toFixed(2);
};

const formatDurationForInput = (minutes) => {
  if (typeof minutes !== 'number' || minutes < 0) return '';
  return minutes.toString();
};

function AppointmentEditModal({ isOpen, onClose, onSave, appointmentData, adminView = false }) {
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false);
  const formikRef = useRef();

  const initialValues = {
    serviceId: appointmentData?.service?.id?.toString() || '',
    appointmentDate: appointmentData?.startTime ? parseISO(appointmentData.startTime) : null,
    appointmentTime: appointmentData?.startTime ? formatDateFns(parseISO(appointmentData.startTime), 'HH:mm') : '',
    notes: appointmentData?.notes || '',
    status: appointmentData?.status || 'PENDING',
    price: formatPriceForInput(appointmentData?.service?.price),
    duration: formatDurationForInput(appointmentData?.service?.durationMinutes),
    customerName: `${appointmentData?.customer?.firstName || ''} ${appointmentData?.customer?.lastName || ''}`.trim() || 'Unbekannt',
    customerEmail: appointmentData?.customer?.email || '',
  };


  const fetchServices = useCallback(async () => {
    if (!isOpen) return;
    setLoadingServices(true);
    try {
      // KORREKTUR: Relativer Pfad
      const response = await api.get('services');
      setServices(response.data || []);
    } catch (err) {
      console.error("Error fetching services for edit modal:", err);
      setError("Dienstleistungen konnten nicht geladen werden.");
    } finally {
      setLoadingServices(false);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const fetchAvailableTimeSlotsInternal = useCallback(async (date, duration, serviceId, currentAppointmentId, setFieldValue) => {
    if (!date || !duration || !serviceId || !isValidDateFns(date)) {
      setAvailableTimeSlots([]);
      return;
    }
    setLoadingTimeSlots(true);
    try {
      const formattedDate = formatDateFns(date, 'yyyy-MM-dd');
      // KORREKTUR: Relativer Pfad
      const response = await api.get('appointments/available-slots', {
        params: {
          serviceId: parseInt(serviceId, 10),
          date: formattedDate,
          excludeId: currentAppointmentId
        },
      });
      const slots = response.data || [];
      const currentAppointmentTime = appointmentData?.startTime ? formatDateFns(parseISO(appointmentData.startTime), 'HH:mm') : '';
      if (currentAppointmentTime &&
          formatDateFns(date, 'yyyy-MM-dd') === formatDateFns(parseISO(appointmentData.startTime), 'yyyy-MM-dd') &&
          !slots.includes(currentAppointmentTime)) {
        slots.push(currentAppointmentTime);
        slots.sort();
      }
      setAvailableTimeSlots(slots);
      if (currentAppointmentTime &&
          formatDateFns(date, 'yyyy-MM-dd') === formatDateFns(parseISO(appointmentData.startTime), 'yyyy-MM-dd')) {
        setFieldValue('appointmentTime', currentAppointmentTime);
      }

    } catch (error) {
      console.error('Error fetching time slots:', error);
      setAvailableTimeSlots([]);
      setError("Zeiten konnten nicht geladen werden.");
    } finally {
      setLoadingTimeSlots(false);
    }
  }, [appointmentData]);


  useEffect(() => {
    if (isOpen && formikRef.current) {
      const { values, setFieldValue } = formikRef.current;
      const selectedService = services.find(s => s.id.toString() === values.serviceId?.toString());
      const durationToUse = parseInt(values.duration, 10) || selectedService?.durationMinutes;

      if (values.appointmentDate && durationToUse && values.serviceId && isValidDateFns(values.appointmentDate)) {
        fetchAvailableTimeSlotsInternal(values.appointmentDate, durationToUse, values.serviceId, appointmentData?.id, setFieldValue);
      } else if (values.appointmentDate && !values.serviceId) {
        setAvailableTimeSlots([]);
        setFieldValue('appointmentTime', '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, services, appointmentData?.id, fetchAvailableTimeSlotsInternal, formikRef.current?.values?.appointmentDate, formikRef.current?.values?.serviceId, formikRef.current?.values?.duration]);


  const handleSubmit = async (values, { setSubmitting }) => {
    setIsSubmittingForm(true);
    setError('');
    setSuccess('');

    const appointmentDateTime = new Date(values.appointmentDate);
    const [hours, minutes] = values.appointmentTime.split(':');
    appointmentDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    // const selectedServiceForPayload = services.find(s => s.id.toString() === values.serviceId); // Nicht verwendet

    const payload = {
      service: { id: parseInt(values.serviceId, 10) },
      startTime: appointmentDateTime.toISOString(),
      notes: values.notes,
      status: values.status,
      price: parseFloat(values.price),
      durationMinutes: parseInt(values.duration, 10),
      customer: {
        id: appointmentData.customer.id,
        email: appointmentData.customer.email,
        firstName: appointmentData.customer.firstName,
        lastName: appointmentData.customer.lastName,
        phoneNumber: appointmentData.customer.phoneNumber
      }
    };

    try {
      // KORREKTUR: Relativer Pfad
      await api.put(`appointments/${appointmentData.id}`, payload);
      setSuccess('Termin erfolgreich aktualisiert!');
      if (typeof onSave === 'function') {
        onSave();
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error updating appointment:", err.response?.data || err.message);
      setError(err.response?.data?.message || 'Fehler beim Aktualisieren des Termins.');
    } finally {
      setIsSubmittingForm(false);
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async () => {
    setShowConfirmCancelModal(false);
    setIsCancelling(true);
    setError('');
    setSuccess('');
    try {
      // KORREKTUR: Relativer Pfad
      await api.delete(`appointments/${appointmentData.id}`);
      // KORREKTUR: setSuccessMessage zu setSuccess
      setSuccess('Termin erfolgreich storniert!');
      if (typeof onSave === 'function') {
        onSave();
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      setError(err.response?.data?.message || 'Fehler beim Stornieren des Termins.');
    } finally {
      setIsCancelling(false);
    }
  };


  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
    }
  }, [isOpen]);


  if (!isOpen || !appointmentData) {
    return null;
  }

  return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1051] p-4 animate-fadeInModalOverlay backdrop-blur-sm">
          <div className={`bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[95vh] flex flex-col animate-slideInModalContent ${styles.modalContent}`}>
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 font-serif flex items-center">
                <FontAwesomeIcon icon={faEdit} className="mr-3 text-indigo-600" />
                Termin bearbeiten
              </h3>
              <button
                  onClick={onClose}
                  aria-label="Modal schließen"
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                  disabled={isSubmittingForm || isCancelling}
              >
                <FontAwesomeIcon icon={faTimes} size="lg" />
              </button>
            </div>

            <Formik
                innerRef={formikRef}
                initialValues={initialValues}
                validationSchema={EditAppointmentSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
              {({ errors, touched, isSubmitting, values, setFieldValue, dirty }) => (
                  <Form className="p-6 space-y-4 overflow-y-auto flex-grow">
                    <div className={`p-3 bg-slate-50 rounded-md border border-slate-200 ${styles.customerInfoBox}`}>
                      <p className="text-sm font-medium text-gray-700 flex items-center">
                        <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-400" />
                        Kunde: <span className="ml-1 font-normal text-gray-600">{values.customerName}</span>
                      </p>
                      {values.customerEmail &&
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-gray-400" /> {values.customerEmail}
                          </p>
                      }
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="editServiceId" className="block text-sm font-medium text-gray-700 mb-1">
                        <FontAwesomeIcon icon={faCut} className="mr-2 text-gray-400"/>Dienstleistung*
                      </label>
                      <Field
                          as="select"
                          name="serviceId"
                          id="editServiceId"
                          className={`w-full px-3 py-2.5 border ${errors.serviceId && touched.serviceId ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}
                          onChange={(e) => {
                            const newServiceId = e.target.value;
                            setFieldValue('serviceId', newServiceId);
                            const selectedService = services.find(s => s.id.toString() === newServiceId);
                            if (selectedService) {
                              setFieldValue('price', formatPriceForInput(selectedService.price));
                              setFieldValue('duration', formatDurationForInput(selectedService.durationMinutes));
                              if (values.appointmentDate && isValidDateFns(values.appointmentDate)) {
                                fetchAvailableTimeSlotsInternal(values.appointmentDate, selectedService.durationMinutes, newServiceId, appointmentData.id, setFieldValue);
                              }
                            } else {
                              setFieldValue('price', '');
                              setFieldValue('duration', '');
                              setAvailableTimeSlots([]);
                            }
                          }}
                      >
                        <option value="">Dienstleistung wählen...</option>
                        {services.map(service => (
                            <option key={service.id} value={service.id}>{service.name}</option>
                        ))}
                      </Field>
                      <ErrorMessage name="serviceId" component="div" className="mt-1 text-xs text-red-600" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      <div className={styles.formGroup}>
                        <label htmlFor="editDuration" className="block text-sm font-medium text-gray-700 mb-1">Dauer (Min.)*</label>
                        <Field name="duration" type="number" id="editDuration" className={`w-full px-3 py-2.5 border ${errors.duration && touched.duration ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`} />
                        <ErrorMessage name="duration" component="div" className="mt-1 text-xs text-red-600" />
                      </div>
                      <div className={styles.formGroup}>
                        <label htmlFor="editPrice" className="block text-sm font-medium text-gray-700 mb-1">Preis (€)*</label>
                        <Field name="price" type="number" step="0.01" id="editPrice" className={`w-full px-3 py-2.5 border ${errors.price && touched.price ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`} />
                        <ErrorMessage name="price" component="div" className="mt-1 text-xs text-red-600" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      <div className={styles.formGroup}>
                        <label htmlFor="editAppointmentDate" className="block text-sm font-medium text-gray-700 mb-1">
                          <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-400"/>Datum*
                        </label>
                        <DatePicker
                            selected={values.appointmentDate}
                            onChange={(date) => {
                              setFieldValue('appointmentDate', date);
                              const selectedService = services.find(s => s.id.toString() === values.serviceId?.toString());
                              const durationToUse = parseInt(values.duration, 10) || selectedService?.durationMinutes;
                              if (date && isValidDateFns(date) && durationToUse && values.serviceId) {
                                fetchAvailableTimeSlotsInternal(date, durationToUse, values.serviceId, appointmentData.id, setFieldValue);
                              } else {
                                setAvailableTimeSlots([]);
                              }
                            }}
                            dateFormat="dd.MM.yyyy"
                            minDate={new Date()}
                            id="editAppointmentDate"
                            className={`w-full px-3 py-2.5 border ${errors.appointmentDate && touched.appointmentDate ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}
                            placeholderText="Datum wählen"
                            autoComplete="off"
                            locale="de"
                        />
                        <ErrorMessage name="appointmentDate" component="div" className="mt-1 text-xs text-red-600" />
                      </div>
                      <div className={styles.formGroup}>
                        <label htmlFor="editAppointmentTime" className="block text-sm font-medium text-gray-700 mb-1">
                          <FontAwesomeIcon icon={faClock} className="mr-2 text-gray-400"/>Uhrzeit*
                        </label>
                        <Field
                            as="select"
                            name="appointmentTime"
                            id="editAppointmentTime"
                            disabled={loadingTimeSlots || availableTimeSlots.length === 0 || !values.serviceId || !values.appointmentDate}
                            className={`w-full px-3 py-2.5 border ${errors.appointmentTime && touched.appointmentTime ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput} ${loadingTimeSlots || (availableTimeSlots.length === 0 && values.appointmentDate && values.serviceId) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        >
                          <option value="">{loadingTimeSlots ? "Lade Zeiten..." : (availableTimeSlots.length === 0 && values.appointmentDate && values.serviceId ? "Keine Zeiten verfügbar" : "Uhrzeit wählen...")}</option>
                          {values.appointmentTime && !availableTimeSlots.includes(values.appointmentTime) &&
                              <option key={`current-${values.appointmentTime}`} value={values.appointmentTime}>{values.appointmentTime} (Aktuell)</option>
                          }
                          {availableTimeSlots.map(slot => (
                              <option key={slot} value={slot} disabled={slot === values.appointmentTime && !availableTimeSlots.includes(values.appointmentTime) && slot !== initialValues.appointmentTime } >{slot}</option>
                          ))}
                        </Field>
                        <ErrorMessage name="appointmentTime" component="div" className="mt-1 text-xs text-red-600" />
                      </div>
                    </div>

                    {adminView && (
                        <div className={styles.formGroup}>
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status*</label>
                          <Field as="select" name="status" id="status" className={`w-full px-3 py-2.5 border ${errors.status && touched.status ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}>
                            <option value="PENDING">Ausstehend</option>
                            <option value="CONFIRMED">Bestätigt</option>
                            <option value="COMPLETED">Abgeschlossen</option>
                            <option value="CANCELLED">Storniert</option>
                          </Field>
                          <ErrorMessage name="status" component="div" className="mt-1 text-xs text-red-600" />
                        </div>
                    )}

                    <div className={styles.formGroup}>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                        <FontAwesomeIcon icon={faStickyNote} className="mr-2 text-gray-400"/> Notizen (optional)
                      </label>
                      <Field
                          as="textarea"
                          name="notes"
                          id="notes"
                          rows="2"
                          placeholder="Zusätzliche Informationen..."
                          className={`w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput} ${styles.formTextarea}`}
                      />
                      <ErrorMessage name="notes" component="div" className="mt-1 text-xs text-red-600" />
                    </div>

                    {error && (
                        <div className={`p-3 rounded-md bg-red-50 text-red-700 border border-red-200 text-sm flex items-center ${styles.formMessage} ${styles.error}`}>
                          <FontAwesomeIcon icon={faExclamationCircle} className="mr-2 flex-shrink-0" /> {error}
                        </div>
                    )}
                    {success && (
                        <div className={`p-3 rounded-md bg-green-50 text-green-600 border border-green-200 text-sm flex items-center ${styles.formMessage} ${styles.success}`}>
                          <FontAwesomeIcon icon={faCheckCircle} className="mr-2 flex-shrink-0" /> {success}
                        </div>
                    )}

                    <div className="pt-5 flex flex-col sm:flex-row justify-end sm:space-x-3 space-y-2 sm:space-y-0">
                      {appointmentData.status !== 'CANCELLED' && (
                          <button
                              type="button"
                              onClick={() => setShowConfirmCancelModal(true)}
                              disabled={isSubmittingForm || isSubmitting || isCancelling}
                              className={`w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-red-500 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-60 ${styles.actionButton} ${styles.cancelAppointmentButton}`}
                          >
                            <FontAwesomeIcon icon={isCancelling ? faSpinner : faTimesCircle} spin={isCancelling} className="mr-2" />
                            Termin stornieren
                          </button>
                      )}
                      <div className="flex-grow sm:flex-grow-0"></div>
                      <button
                          type="button"
                          onClick={onClose}
                          disabled={isSubmittingForm || isSubmitting || isCancelling}
                          className={`w-full sm:w-auto px-5 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 disabled:opacity-60 ${styles.actionButton} ${styles.cancelButton}`}
                      >
                        Abbrechen
                      </button>
                      <button
                          type="submit"
                          disabled={isSubmittingForm || isSubmitting || !dirty || isCancelling}
                          className={`w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 ${styles.actionButton} ${styles.saveButton}`}
                      >
                        {isSubmittingForm ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faSave} className="mr-2" />}
                        Änderungen speichern
                      </button>
                    </div>
                  </Form>
              )}
            </Formik>
          </div>
        </div>
        {showConfirmCancelModal && (
            <ConfirmModal
                isOpen={showConfirmCancelModal}
                onClose={() => setShowConfirmCancelModal(false)}
                onConfirm={handleCancelAppointment}
                title="Termin stornieren"
                message="Möchten Sie diesen Termin wirklich stornieren? Diese Aktion kann nicht rückgängig gemacht werden."
                confirmButtonText="Ja, stornieren"
                icon={faTrashAlt}
                iconColorClass="text-red-500"
                isLoading={isCancelling}
            />
        )}
      </>
  );
}

export default AppointmentEditModal;