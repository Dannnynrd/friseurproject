// friseursalon-frontend/src/components/CustomerEditModal.js
import React, { useState, useEffect } from 'react';
import api from '../services/api.service';
import styles from './CustomerEditModal.module.css'; // Angenommen, diese Datei existiert
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faSpinner, faExclamationCircle, faCheckCircle, faUserPlus, faUserEdit } from '@fortawesome/free-solid-svg-icons';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const CustomerSchema = Yup.object().shape({
    firstName: Yup.string().required('Vorname ist erforderlich.'),
    lastName: Yup.string().required('Nachname ist erforderlich.'),
    email: Yup.string().email('Ungültige E-Mail-Adresse.').required('E-Mail ist erforderlich.'),
    phoneNumber: Yup.string()
        .matches(/^[0-9+\-\s()]*$/, "Ungültige Telefonnummer. Nur Zahlen, Leerzeichen und '+()-'.")
        .notRequired(), // Optional
    notes: Yup.string().max(500, "Notizen dürfen maximal 500 Zeichen lang sein.").notRequired(),
});

function CustomerEditModal({ isOpen, onClose, onSave, customerData }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const isEditing = Boolean(customerData && customerData.id);
    const modalTitle = isEditing ? "Kunde bearbeiten" : "Neuen Kunden anlegen";
    const submitButtonText = isEditing ? "Änderungen speichern" : "Kunden erstellen";
    const submitButtonIcon = isEditing ? faUserEdit : faUserPlus;

    const initialValues = {
        firstName: customerData?.firstName || '',
        lastName: customerData?.lastName || '',
        email: customerData?.email || '',
        phoneNumber: customerData?.phoneNumber || '',
        notes: customerData?.notes || '',
    };

    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        setLoading(true);
        setMessage('');
        setError('');

        const payload = {
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            email: values.email.trim(),
            phoneNumber: values.phoneNumber.trim() || null, // Send null if empty
            notes: values.notes.trim() || null,
        };

        try {
            if (isEditing) {
                // KORREKTUR: Relativer Pfad
                await api.put(`customers/${customerData.id}`, payload);
            } else {
                // KORREKTUR: Relativer Pfad
                await api.post('customers', payload);
            }
            setMessage(isEditing ? 'Kundendaten erfolgreich aktualisiert!' : 'Kunde erfolgreich erstellt!');
            if (typeof onSave === 'function') {
                onSave(); // Callback, um die Elternkomponente zu benachrichtigen
            }
            setTimeout(() => {
                onClose(); // Modal nach kurzer Verzögerung schließen
            }, 1500);
        } catch (err) {
            console.error("Error saving customer:", err.response?.data || err.message);
            const apiError = err.response?.data;
            if (apiError && apiError.message && apiError.message.includes("constraint [uk_customer_email]")) {
                setError("Diese E-Mail-Adresse ist bereits einem anderen Kunden zugeordnet.");
            } else {
                setError(apiError?.message || 'Fehler beim Speichern des Kunden.');
            }
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    useEffect(() => {
        // Reset messages when modal opens or customerData changes
        if (isOpen) {
            setMessage('');
            setError('');
        }
    }, [isOpen, customerData]);


    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1051] p-4 animate-fadeInModalOverlay backdrop-blur-sm">
            <div className={`bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-slideInModalContent ${styles.modalContent}`}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800 font-serif flex items-center">
                        <FontAwesomeIcon icon={isEditing ? faUserEdit : faUserPlus} className="mr-2 text-indigo-600" />
                        {modalTitle}
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label="Modal schließen"
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                        disabled={loading}
                    >
                        <FontAwesomeIcon icon={faTimes} size="lg" />
                    </button>
                </div>
                <Formik
                    initialValues={initialValues}
                    validationSchema={CustomerSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize // Wichtig, damit das Formular bei Änderung von customerData neu initialisiert wird
                >
                    {({ errors, touched, isSubmitting, dirty }) => (
                        <Form className="p-6 space-y-5 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                                <div className={styles.formGroup}>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">Vorname*</label>
                                    <Field name="firstName" type="text" id="firstName" className={`w-full px-3 py-2.5 border ${errors.firstName && touched.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`} />
                                    <ErrorMessage name="firstName" component="div" className="mt-1 text-xs text-red-600" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Nachname*</label>
                                    <Field name="lastName" type="text" id="lastName" className={`w-full px-3 py-2.5 border ${errors.lastName && touched.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`} />
                                    <ErrorMessage name="lastName" component="div" className="mt-1 text-xs text-red-600" />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-Mail-Adresse*</label>
                                <Field name="email" type="email" id="email" className={`w-full px-3 py-2.5 border ${errors.email && touched.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`} />
                                <ErrorMessage name="email" component="div" className="mt-1 text-xs text-red-600" />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Telefonnummer (optional)</label>
                                <Field name="phoneNumber" type="tel" id="phoneNumber" className={`w-full px-3 py-2.5 border ${errors.phoneNumber && touched.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`} />
                                <ErrorMessage name="phoneNumber" component="div" className="mt-1 text-xs text-red-600" />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notizen (optional)</label>
                                <Field
                                    as="textarea"
                                    name="notes"
                                    id="notes"
                                    rows="3"
                                    placeholder="Zusätzliche Informationen zum Kunden..."
                                    className={`w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput} ${styles.formTextarea}`}
                                />
                                <ErrorMessage name="notes" component="div" className="mt-1 text-xs text-red-600" />
                            </div>

                            {error && (
                                <div className={`p-3 rounded-md bg-red-50 text-red-700 border border-red-200 text-sm flex items-center ${styles.formMessage} ${styles.error}`}>
                                    <FontAwesomeIcon icon={faExclamationCircle} className="mr-2 flex-shrink-0" /> {error}
                                </div>
                            )}
                            {message && (
                                <div className={`p-3 rounded-md bg-green-50 text-green-600 border border-green-200 text-sm flex items-center ${styles.formMessage} ${styles.success}`}>
                                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2 flex-shrink-0" /> {message}
                                </div>
                            )}

                            <div className="pt-5 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading || isSubmitting}
                                    className={`px-5 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 disabled:opacity-60 ${styles.actionButton} ${styles.cancelButton}`}
                                >
                                    Abbrechen
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || isSubmitting || !dirty} // Deaktivieren, wenn nicht geändert wurde
                                    className={`inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 ${styles.actionButton} ${styles.saveButton}`}
                                >
                                    {loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={submitButtonIcon} className="mr-2" />}
                                    {submitButtonText}
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}

export default CustomerEditModal;
