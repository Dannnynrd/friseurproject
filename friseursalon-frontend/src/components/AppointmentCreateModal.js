// friseursalon-frontend/src/components/AppointmentCreateModal.js
import React, { useState, useEffect, useCallback, useRef } from 'react'; // useRef hinzugefügt
import api from '../services/api.service';
import AuthService from '../services/auth.service';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { de } from 'date-fns/locale';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import styles from './AppointmentCreateModal.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes, faCalendarPlus, faSpinner, faExclamationCircle, faCheckCircle,
    faUser, faCut, faClock, faEuroSign, faStickyNote, faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import { parseISO, format as formatDateFns, isValid as isValidDateFns, addMinutes } from 'date-fns';

registerLocale('de', de);

const AppointmentSchema = Yup.object().shape({
    serviceId: Yup.string().required('Dienstleistung ist erforderlich.'),
    customerId: Yup.string().when('isNewCustomer', {
        is: (val) => !val,
        then: (schema) => schema.required('Bestandskunde ist erforderlich, wenn kein Neukunde ausgewählt ist.'),
        otherwise: (schema) => schema.notRequired(),
    }),
    customerName: Yup.string().when('isNewCustomer', {
        is: true,
        then: (schema) => schema.required('Kundenname ist erforderlich für Neukunden.'),
        otherwise: (schema) => schema.notRequired(),
    }),
    customerEmail: Yup.string().email('Ungültige E-Mail.').when('isNewCustomer', {
        is: true,
        then: (schema) => schema.required('E-Mail ist erforderlich für Neukunden.'),
        otherwise: (schema) => schema.notRequired(),
    }),
    customerPhone: Yup.string().matches(/^[0-9+\-\s()]*$/, "Ungültige Telefonnummer.").notRequired(),
    appointmentDate: Yup.date().required('Datum ist erforderlich.').nullable().min(new Date(new Date().setDate(new Date().getDate() -1)), "Datum darf nicht in der Vergangenheit liegen."),
    appointmentTime: Yup.string().required('Uhrzeit ist erforderlich.'),
    notes: Yup.string().max(500, 'Notizen dürfen maximal 500 Zeichen lang sein.').notRequired(),
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

    const formikRef = useRef();

    const initialValues = {
        serviceId: '',
        customerId: '',
        isNewCustomer: false,
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        appointmentDate: initialDate,
        appointmentTime: initialTime,
        notes: '',
    };

    const fetchServicesAndCustomers = useCallback(async () => {
        setLoadingServices(true);
        setLoadingCustomers(true);
        setError('');
        try {
            const [servicesRes, customersRes] = await Promise.all([
                api.get('/api/services').catch(e => { console.error("Error fetching services", e); return { data: [] }; }),
                api.get('/api/customers').catch(e => { console.error("Error fetching customers", e); return { data: [] }; })
            ]);
            setServices(servicesRes.data || []);
            setCustomers(customersRes.data || []);
        } catch (err) {
            console.error("Error fetching initial modal data:", err);
            setError("Fehler beim Laden der Basisdaten für das Formular.");
        } finally {
            setLoadingServices(false);
            setLoadingCustomers(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchServicesAndCustomers();
            setError('');
            setSuccess('');
            if (formikRef.current) {
                formikRef.current.resetForm({ values: {
                        ...initialValues,
                        appointmentDate: selectedSlot?.start && isValidDateFns(selectedSlot.start) ? selectedSlot.start : null,
                        appointmentTime: selectedSlot?.start && isValidDateFns(selectedSlot.start) ? formatDateFns(selectedSlot.start, 'HH:mm') : '',
                        isNewCustomer: false,
                    }});
            }
        }
    }, [isOpen, fetchServicesAndCustomers, selectedSlot]);

    const fetchAvailableTimeSlotsInternal = useCallback(async (date, duration, serviceId, setFieldValue) => {
        if (!date || !duration || !serviceId || !isValidDateFns(date)) {
            setAvailableTimeSlots([]);
            if (date && duration && serviceId) setFieldValue('appointmentTime', '');
            return;
        }
        setLoadingTimeSlots(true);
        setFieldValue('appointmentTime', '');
        try {
            const formattedDate = formatDateFns(date, 'yyyy-MM-dd');
            const response = await api.get('/api/appointments/available-slots', {
                params: { date: formattedDate, duration: parseInt(duration, 10), serviceId: parseInt(serviceId, 10) },
            });
            setAvailableTimeSlots(response.data || []);
        } catch (error) {
            console.error('Error fetching time slots:', error);
            setAvailableTimeSlots([]);
            setError("Zeiten konnten nicht geladen werden.");
        } finally {
            setLoadingTimeSlots(false);
        }
    }, []);


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

        const payload = {
            serviceId: parseInt(values.serviceId, 10),
            appointmentTime: appointmentDateTime.toISOString(),
            notes: values.notes,
            price: selectedService.price,
            duration: selectedService.duration,
            status: 'CONFIRMED',
            userId: values.isNewCustomer || !values.customerId ? null : parseInt(values.customerId, 10),
            customerData: values.isNewCustomer ? {
                firstName: values.customerName.split(' ')[0] || '',
                lastName: values.customerName.split(' ').slice(1).join(' ') || values.customerName,
                email: values.customerEmail,
                phone: values.customerPhone,
            } : null,
        };

        if (!values.isNewCustomer && values.customerId) {
            const existingCustomer = customers.find(c => c.id.toString() === values.customerId.toString());
            if (existingCustomer?.user?.id) {
                payload.registeredUserId = existingCustomer.user.id;
            }
        }

        try {
            await api.post('/api/appointments/admin/create', payload);
            setSuccess('Termin erfolgreich erstellt!');
            if (typeof onSave === 'function') {
                onSave();
            }
            setTimeout(() => {
                onClose();
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
                    initialValues={initialValues}
                    validationSchema={AppointmentSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
                >
                    {({ errors, touched, isSubmitting, values, setFieldValue, dirty }) => (
                        <Form className="p-6 space-y-4 overflow-y-auto flex-grow"> {/* space-y-4 statt 5 */}
                            {(loadingServices || loadingCustomers) && (
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
                                        const selectedService = services.find(s => s.id.toString() === newServiceId);
                                        if (selectedService && values.appointmentDate && isValidDateFns(values.appointmentDate)) {
                                            fetchAvailableTimeSlotsInternal(values.appointmentDate, selectedService.duration, newServiceId, setFieldValue);
                                        } else {
                                            setAvailableTimeSlots([]);
                                        }
                                    }}
                                >
                                    <option value="">Dienstleistung wählen...</option>
                                    {services.map(service => (
                                        <option key={service.id} value={service.id}>{service.name} ({formatDuration(service.duration)}, {formatPrice(service.price)})</option>
                                    ))}
                                </Field>
                                <ErrorMessage name="serviceId" component="div" className="mt-1 text-xs text-red-600" />
                            </div>

                            <div className="p-4 border border-gray-200 rounded-md bg-slate-50">
                                <div className="flex items-center mb-3">
                                    <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-400"/>
                                    <label className="block text-sm font-medium text-gray-700">Kunde*</label>
                                    <div className="ml-auto">
                                        <label htmlFor="isNewCustomerToggle" className="flex items-center text-sm text-gray-600 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="isNewCustomer"
                                                id="isNewCustomerToggle"
                                                checked={values.isNewCustomer}
                                                onChange={(e) => {
                                                    setFieldValue('isNewCustomer', e.target.checked);
                                                    if (!e.target.checked) {
                                                        setFieldValue('customerName', '');
                                                        setFieldValue('customerEmail', '');
                                                        setFieldValue('customerPhone', '');
                                                    } else {
                                                        setFieldValue('customerId', '');
                                                    }
                                                }}
                                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mr-1.5"
                                            />
                                            Neukunde?
                                        </label>
                                    </div>
                                </div>

                                {!values.isNewCustomer ? (
                                    <div className={styles.formGroup}>
                                        <Field
                                            as="select"
                                            name="customerId"
                                            id="customerId"
                                            className={`w-full px-3 py-2.5 border ${errors.customerId && touched.customerId ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}
                                        >
                                            <option value="">Bestandskunden wählen...</option>
                                            {customers.map(customer => (
                                                <option key={customer.id} value={customer.id}>
                                                    {customer.firstName || ''} {customer.lastName || ''} ({customer.email || (customer.user ? customer.user.username : 'Keine E-Mail')})
                                                </option>
                                            ))}
                                        </Field>
                                        <ErrorMessage name="customerId" component="div" className="mt-1 text-xs text-red-600" />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className={styles.formGroup}>
                                            <label htmlFor="customerName" className="block text-xs font-medium text-gray-600">Name (Vor- und Nachname)*</label>
                                            <Field name="customerName" type="text" id="customerName" placeholder="Max Mustermann" className={`w-full px-3 py-2 border ${errors.customerName && touched.customerName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm text-sm ${styles.formInput}`} />
                                            <ErrorMessage name="customerName" component="div" className="mt-1 text-xs text-red-600" />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className={styles.formGroup}>
                                                <label htmlFor="customerEmail" className="block text-xs font-medium text-gray-600">E-Mail*</label>
                                                <Field name="customerEmail" type="email" id="customerEmail" placeholder="max.mustermann@mail.de" className={`w-full px-3 py-2 border ${errors.customerEmail && touched.customerEmail ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm text-sm ${styles.formInput}`} />
                                                <ErrorMessage name="customerEmail" component="div" className="mt-1 text-xs text-red-600" />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label htmlFor="customerPhone" className="block text-xs font-medium text-gray-600">Telefon (optional)</label>
                                                <Field name="customerPhone" type="tel" id="customerPhone" placeholder="0123 456789" className={`w-full px-3 py-2 border ${errors.customerPhone && touched.customerPhone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm text-sm ${styles.formInput}`} />
                                                <ErrorMessage name="customerPhone" component="div" className="mt-1 text-xs text-red-600" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4"> {/* gap-y-4 statt 5 */}
                                <div className={styles.formGroup}>
                                    <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700 mb-1">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-400"/>Datum*
                                    </label>
                                    <DatePicker
                                        selected={values.appointmentDate}
                                        onChange={(date) => {
                                            setFieldValue('appointmentDate', date);
                                            const selectedService = services.find(s => s.id.toString() === values.serviceId.toString());
                                            if (selectedService && date && isValidDateFns(date)) {
                                                fetchAvailableTimeSlotsInternal(date, selectedService.duration, values.serviceId, setFieldValue);
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
                                        className={`w-full px-3 py-2.5 border ${errors.appointmentTime && touched.appointmentTime ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput} ${loadingTimeSlots || availableTimeSlots.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
