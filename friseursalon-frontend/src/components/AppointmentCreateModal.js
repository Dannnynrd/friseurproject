// friseursalon-frontend/src/components/AppointmentCreateModal.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api.service';
// AuthService nicht mehr direkt hier, currentUser kommt als Prop
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { de } from 'date-fns/locale';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import styles from './AppointmentCreateModal.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes, faCalendarPlus, faSpinner, faExclamationCircle, faCheckCircle,
    faUser, faCut, faClock, faEnvelope, faPhone, faStickyNote, faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import { parseISO, format as formatDateFns, isValid as isValidDateFns, addMinutes } from 'date-fns';

registerLocale('de', de);

const AppointmentSchema = Yup.object().shape({
    serviceId: Yup.string().required('Dienstleistung ist erforderlich.'),
    isNewCustomer: Yup.boolean(),
    customerName: Yup.string().when('isNewCustomer', {
        is: true,
        // Validierung für Vor- und Nachname, mindestens zwei Wörter
        then: () => Yup.string()
            .required('Kundenname (Vor- und Nachname) ist erforderlich für Neukunden.')
            .matches(/^(\S+\s+\S+.*)$/, 'Bitte Vor- und Nachnamen angeben (mind. 2 Wörter).'),
        otherwise: () => Yup.string().notRequired(),
    }),
    customerEmail: Yup.string().email('Ungültige E-Mail.').when('isNewCustomer', {
        is: true,
        then: () => Yup.string().required('E-Mail ist erforderlich für Neukunden.'),
        otherwise: () => Yup.string().notRequired(),
    }),
    customerPhone: Yup.string().matches(/^[0-9+\-\s()]*$/, "Ungültige Telefonnummer.").notRequired(),
    appointmentDate: Yup.date().required('Datum ist erforderlich.').nullable().min(new Date(new Date().setDate(new Date().getDate() -1)), "Datum darf nicht in der Vergangenheit liegen."),
    appointmentTime: Yup.string().required('Uhrzeit ist erforderlich.'),
    notes: Yup.string().max(500, 'Notizen dürfen maximal 500 Zeichen lang sein.').notRequired(),
    selectedExistingCustomer: Yup.string().when(['isNewCustomer', 'adminView'], {
        is: (isNewCustomer, adminView) => !isNewCustomer && adminView, // Nur für Admin relevant, wenn kein Neukunde
        then: () => Yup.string().required('Bitte wählen Sie einen Bestandskunden oder markieren Sie "Neukunde".'),
        otherwise: () => Yup.string().notRequired(),
    }),
});

const formatPrice = (price) => {
    if (typeof price !== 'number') return 'N/A';
    return `${price.toFixed(2).replace('.', ',')} €`;
};

const formatDuration = (minutes) => {
    if (typeof minutes !== 'number' || minutes <= 0) return 'N/A';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    let durationString = '';
    if (h > 0) durationString += `${h} Std. `;
    if (m > 0) durationString += `${m} Min.`;
    return durationString.trim() || 'N/A';
};

function AppointmentCreateModal({ isOpen, onClose, onSave, selectedSlot, currentUser }) {
    const [services, setServices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmittingForm, setIsSubmittingForm] = useState(false);

    const initialDate = selectedSlot?.start && isValidDateFns(selectedSlot.start) ? selectedSlot.start : null;
    const initialTime = selectedSlot?.start && isValidDateFns(selectedSlot.start) ? formatDateFns(selectedSlot.start, 'HH:mm') : '';
    const adminView = currentUser?.roles?.includes('ROLE_ADMIN');

    const formikRef = useRef();

    const getInitialValues = useCallback(() => ({
        serviceId: '',
        isNewCustomer: !currentUser || adminView, // Standard für Gäste oder wenn Admin erstellt
        selectedExistingCustomer: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        appointmentDate: initialDate,
        appointmentTime: initialTime,
        notes: '',
        adminView: adminView // Um Yup Schema dynamisch zu machen
    }), [currentUser, adminView, initialDate, initialTime]);


    const fetchServicesAndCustomers = useCallback(async () => {
        setLoadingServices(true);
        setLoadingCustomers(true);
        setError('');
        try {
            const servicesResPromise = api.get('/api/services').catch(e => { console.error("Error fetching services", e); return { data: [] }; });
            const customersResPromise = adminView ? api.get('/api/customers').catch(e => { console.error("Error fetching customers", e); return { data: [] }; }) : Promise.resolve({ data: [] });

            const [servicesRes, customersRes] = await Promise.all([servicesResPromise, customersResPromise]);

            setServices(servicesRes.data || []);
            setCustomers(customersRes.data || []);
        } catch (err) {
            console.error("Error fetching initial modal data:", err);
            setError("Fehler beim Laden der Basisdaten für das Formular.");
        } finally {
            setLoadingServices(false);
            setLoadingCustomers(false);
        }
    }, [adminView]);

    useEffect(() => {
        if (isOpen) {
            fetchServicesAndCustomers();
            setError('');
            setSuccess('');
            if (formikRef.current) {
                formikRef.current.resetForm({ values: getInitialValues() });
            }
        }
    }, [isOpen, fetchServicesAndCustomers, getInitialValues]);

    const fetchAvailableTimeSlotsInternal = useCallback(async (date, serviceIdForSlots, setFieldValue) => {
        const service = services.find(s => s.id.toString() === serviceIdForSlots);
        if (!date || !service || !service.id || !isValidDateFns(date)) {
            setAvailableTimeSlots([]);
            if (date && serviceIdForSlots && setFieldValue) setFieldValue('appointmentTime', '');
            return;
        }
        setLoadingTimeSlots(true);
        if (setFieldValue) setFieldValue('appointmentTime', '');
        try {
            const formattedDate = formatDateFns(date, 'yyyy-MM-dd');
            const response = await api.get('/api/appointments/available-slots', {
                params: { serviceId: service.id, date: formattedDate },
            });
            setAvailableTimeSlots(response.data || []);
        } catch (error) {
            console.error('Error fetching time slots:', error);
            setAvailableTimeSlots([]);
            setError("Zeiten konnten nicht geladen werden.");
        } finally {
            setLoadingTimeSlots(false);
        }
    }, [services]);


    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        setIsSubmittingForm(true);
        setError('');
        setSuccess('');

        const selectedService = services.find(s => s.id.toString() === values.serviceId.toString());
        if (!selectedService) {
            setError("Ausgewählte Dienstleistung nicht gefunden.");
            setIsSubmittingForm(false);
            setSubmitting(false);
            return;
        }

        const appointmentDateTime = new Date(values.appointmentDate);
        const [hours, minutes] = values.appointmentTime.split(':');
        appointmentDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        let customerPayload = {};
        if (values.isNewCustomer) {
            const nameParts = values.customerName.trim().split(/\s+/); // Teilt bei einem oder mehreren Leerzeichen
            customerPayload = {
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || (nameParts.length > 1 ? '' : nameParts[0]), // Fallback, falls nur ein Wort
                email: values.customerEmail.trim(),
                phoneNumber: values.customerPhone.trim() || null,
            };
        } else if (currentUser && !adminView) { // Eingeloggter User bucht für sich selbst
            customerPayload = {
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                email: currentUser.email,
                phoneNumber: currentUser.phoneNumber || null,
            };
        } else if (adminView && values.selectedExistingCustomer) { // Admin wählt existierenden Kunden
            const existingCustomer = customers.find(c => c.id.toString() === values.selectedExistingCustomer);
            if (existingCustomer) {
                customerPayload = {
                    firstName: existingCustomer.firstName,
                    lastName: existingCustomer.lastName,
                    email: existingCustomer.email,
                    phoneNumber: existingCustomer.phoneNumber || null,
                };
            } else {
                setError("Ausgewählter Bestandskunde nicht gefunden.");
                setIsSubmittingForm(false); setSubmitting(false); return;
            }
        } else {
            setError("Kundeninformationen sind unvollständig oder ungültig.");
            setIsSubmittingForm(false); setSubmitting(false); return;
        }


        const payload = {
            service: { id: parseInt(values.serviceId, 10) }, // Korrekt: Service Objekt mit ID
            customer: customerPayload, // Korrekt: Genestetes Kundenobjekt
            startTime: appointmentDateTime.toISOString(),
            notes: values.notes,
        };

        try {
            // Korrigierter API Endpunkt
            await api.post('/api/appointments', payload);
            setSuccess('Termin erfolgreich erstellt!');
            if (typeof onSave === 'function') {
                onSave();
            }
            setTimeout(() => {
                onClose();
                // resetForm({ values: getInitialValues() }); // Formular beim Schließen zurücksetzen
            }, 2000);
        } catch (err) {
            console.error("Error creating appointment:", err.response?.data || err.message);
            setError(err.response?.data?.message || 'Fehler beim Erstellen des Termins.');
        } finally {
            setIsSubmittingForm(false);
            setSubmitting(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1055] p-4 animate-fadeInModalOverlay backdrop-blur-sm">
            <div className={`bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[95vh] flex flex-col animate-slideInModalContent ${styles.modalContent}`}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800 font-serif flex items-center">
                        <FontAwesomeIcon icon={faCalendarPlus} className="mr-3 text-indigo-600" />
                        Neuen Termin erstellen
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label="Modal schließen"
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                        disabled={isSubmittingForm}
                    >
                        <FontAwesomeIcon icon={faTimes} size="lg" />
                    </button>
                </div>

                <Formik
                    innerRef={formikRef}
                    initialValues={getInitialValues()}
                    validationSchema={AppointmentSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
                >
                    {({ errors, touched, isSubmitting, values, setFieldValue, dirty }) => (
                        <Form className="p-6 space-y-4 overflow-y-auto flex-grow">
                            {(loadingServices || (adminView && loadingCustomers)) && (
                                <div className="flex justify-center items-center p-4 text-gray-500">
                                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2"/> Daten laden...
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 mb-1">
                                    <FontAwesomeIcon icon={faCut} className="mr-2 text-gray-400"/>Dienstleistung*
                                </label>
                                <Field
                                    as="select"
                                    name="serviceId"
                                    id="serviceId"
                                    className={`w-full px-3 py-2.5 border ${errors.serviceId && touched.serviceId ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}
                                    onChange={(e) => {
                                        const newServiceId = e.target.value;
                                        setFieldValue('serviceId', newServiceId);
                                        if (values.appointmentDate && isValidDateFns(values.appointmentDate) && newServiceId) {
                                            fetchAvailableTimeSlotsInternal(values.appointmentDate, newServiceId, setFieldValue);
                                        } else {
                                            setAvailableTimeSlots([]);
                                        }
                                    }}
                                >
                                    <option value="">Dienstleistung wählen...</option>
                                    {services.map(service => (
                                        <option key={service.id} value={service.id}>{service.name} ({formatDuration(service.durationMinutes)}, {formatPrice(service.price)})</option>
                                    ))}
                                </Field>
                                <ErrorMessage name="serviceId" component="div" className="mt-1 text-xs text-red-600" />
                            </div>

                            {adminView && (
                                <div className={`p-4 border border-gray-200 rounded-md bg-slate-50 ${styles.customerSelectionAdmin}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-medium text-gray-700 flex items-center">
                                            <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-400"/> Kunde*
                                        </label>
                                        <label htmlFor="isNewCustomerToggleAdmin" className="flex items-center text-sm text-gray-600 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="isNewCustomer"
                                                id="isNewCustomerToggleAdmin"
                                                checked={values.isNewCustomer}
                                                onChange={(e) => {
                                                    setFieldValue('isNewCustomer', e.target.checked);
                                                    if (e.target.checked) setFieldValue('selectedExistingCustomer', ''); else {setFieldValue('customerName', ''); setFieldValue('customerEmail',''); setFieldValue('customerPhone','');}
                                                }}
                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-1.5"
                                            />
                                            Neukunde anlegen?
                                        </label>
                                    </div>

                                    {!values.isNewCustomer ? (
                                        <div className={styles.formGroup}>
                                            <Field
                                                as="select"
                                                name="selectedExistingCustomer"
                                                id="selectedExistingCustomer"
                                                className={`w-full px-3 py-2.5 border ${errors.selectedExistingCustomer && touched.selectedExistingCustomer ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}
                                            >
                                                <option value="">Bestandskunden wählen...</option>
                                                {customers.map(customer => (
                                                    <option key={customer.id} value={customer.id}>
                                                        {customer.firstName || ''} {customer.lastName || ''} ({customer.email || 'Keine E-Mail'})
                                                    </option>
                                                ))}
                                            </Field>
                                            <ErrorMessage name="selectedExistingCustomer" component="div" className="mt-1 text-xs text-red-600" />
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className={styles.formGroup}>
                                                <label htmlFor="customerName" className="block text-xs font-medium text-gray-600">Vollständiger Name*</label>
                                                <Field name="customerName" type="text" id="customerName" placeholder="Max Mustermann" className={`w-full px-3 py-2 border ${errors.customerName && touched.customerName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm text-sm ${styles.formInput}`} />
                                                <ErrorMessage name="customerName" component="div" className="mt-1 text-xs text-red-600" />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className={styles.formGroup}>
                                                    <label htmlFor="customerEmail" className="block text-xs font-medium text-gray-600">E-Mail*</label>
                                                    <Field name="customerEmail" type="email" id="customerEmail" placeholder="max.mustermann@mail.de" className={`w-full px-3 py-2 border ${errors.customerEmail && touched.customerEmail ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm text-sm ${styles.formInput}`} />
                                                    <ErrorMessage name="customerEmail" component="div" className="mt-1 text-xs text-red-600" />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label htmlFor="customerPhone" className="block text-xs font-medium text-gray-600">Telefon</label>
                                                    <Field name="customerPhone" type="tel" id="customerPhone" placeholder="Optional" className={`w-full px-3 py-2 border ${errors.customerPhone && touched.customerPhone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm text-sm ${styles.formInput}`} />
                                                    <ErrorMessage name="customerPhone" component="div" className="mt-1 text-xs text-red-600" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}


                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                <div className={styles.formGroup}>
                                    <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700 mb-1">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-400"/>Datum*
                                    </label>
                                    <DatePicker
                                        selected={values.appointmentDate}
                                        onChange={(date) => {
                                            setFieldValue('appointmentDate', date);
                                            if (values.serviceId && date && isValidDateFns(date)) {
                                                fetchAvailableTimeSlotsInternal(date, values.serviceId, setFieldValue);
                                            } else {
                                                setAvailableTimeSlots([]);
                                            }
                                        }}
                                        dateFormat="dd.MM.yyyy"
                                        minDate={new Date()}
                                        id="appointmentDate"
                                        className={`w-full px-3 py-2.5 border ${errors.appointmentDate && touched.appointmentDate ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}
                                        placeholderText="Datum wählen"
                                        autoComplete="off"
                                        locale="de"
                                    />
                                    <ErrorMessage name="appointmentDate" component="div" className="mt-1 text-xs text-red-600" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="appointmentTime" className="block text-sm font-medium text-gray-700 mb-1">
                                        <FontAwesomeIcon icon={faClock} className="mr-2 text-gray-400"/>Uhrzeit*
                                    </label>
                                    <Field
                                        as="select"
                                        name="appointmentTime"
                                        id="appointmentTime"
                                        disabled={loadingTimeSlots || availableTimeSlots.length === 0 || !values.serviceId || !values.appointmentDate}
                                        className={`w-full px-3 py-2.5 border ${errors.appointmentTime && touched.appointmentTime ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput} ${loadingTimeSlots || (availableTimeSlots.length === 0 && values.appointmentDate && values.serviceId) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    >
                                        <option value="">{loadingTimeSlots ? "Lade Zeiten..." : (availableTimeSlots.length === 0 && values.appointmentDate && values.serviceId ? "Keine Zeiten verfügbar" : "Uhrzeit wählen...")}</option>
                                        {availableTimeSlots.map(slot => (
                                            <option key={slot} value={slot}>{slot}</option>
                                        ))}
                                    </Field>
                                    <ErrorMessage name="appointmentTime" component="div" className="mt-1 text-xs text-red-600" />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                                    <FontAwesomeIcon icon={faStickyNote} className="mr-2 text-gray-400"/> Notizen (optional)
                                </label>
                                <Field
                                    as="textarea"
                                    name="notes"
                                    id="notes"
                                    rows="2"
                                    placeholder="Zusätzliche Informationen oder Wünsche..."
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

                            <div className="pt-5 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmittingForm || isSubmitting}
                                    className={`px-5 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 disabled:opacity-60 ${styles.actionButton} ${styles.cancelButton}`}
                                >
                                    Abbrechen
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingForm || isSubmitting || !dirty}
                                    className={`inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 ${styles.actionButton} ${styles.saveButton}`}
                                >
                                    {isSubmittingForm ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faCalendarPlus} className="mr-2" />}
                                    Termin erstellen
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}

export default AppointmentCreateModal;