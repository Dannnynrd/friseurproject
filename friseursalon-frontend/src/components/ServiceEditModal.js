// friseursalon-frontend/src/components/ServiceEditModal.js
import React, { useState, useEffect } from 'react';
import api from '../services/api.service';
import styles from './ServiceEditModal.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faSpinner, faExclamationCircle, faCheckCircle, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const ServiceSchema = Yup.object().shape({
    name: Yup.string().required('Name ist erforderlich.'),
    description: Yup.string().required('Beschreibung ist erforderlich.'),
    price: Yup.number()
        .typeError('Preis muss eine Zahl sein.')
        .required('Preis ist erforderlich.')
        .positive('Preis muss positiv sein.'),
    // KORREKTUR: Feldname im Schema auf 'duration' geändert für Konsistenz im Formular
    duration: Yup.number()
        .typeError('Dauer muss eine Zahl sein.')
        .required('Dauer ist erforderlich.')
        .integer('Dauer muss eine ganze Zahl sein.')
        .min(5, 'Dauer muss mindestens 5 Minuten betragen.'),
});

function ServiceEditModal({ isOpen, onClose, onSave, serviceData }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const isEditing = Boolean(serviceData && serviceData.id);
    const modalTitle = isEditing ? "Dienstleistung bearbeiten" : "Neue Dienstleistung erstellen";
    const submitButtonText = isEditing ? "Änderungen speichern" : "Dienstleistung erstellen";
    const submitButtonIcon = isEditing ? faSave : faPlus;

    const initialValues = {
        name: serviceData?.name || '',
        description: serviceData?.description || '',
        price: serviceData?.price || '',
        // KORREKTUR: Initialwert vom Backend-Feld 'durationMinutes' auf das Formularfeld 'duration' mappen
        duration: serviceData?.durationMinutes || '',
    };

    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        setLoading(true);
        setMessage('');
        setError('');

        // KORREKTUR: Payload wird jetzt korrekt mit `durationMinutes` erstellt
        const payload = {
            name: values.name,
            description: values.description,
            price: parseFloat(values.price),
            durationMinutes: parseInt(values.duration, 10), // Hier wird von 'duration' auf 'durationMinutes' gemappt
        };

        try {
            if (isEditing) {
                await api.put(`services/${serviceData.id}`, payload);
            } else {
                await api.post('services', payload);
            }
            setMessage(isEditing ? 'Dienstleistung erfolgreich aktualisiert!' : 'Dienstleistung erfolgreich erstellt!');
            if (typeof onSave === 'function') {
                onSave();
            }
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            console.error("Error saving service:", err.response?.data || err.message);
            setError(err.response?.data?.message || 'Fehler beim Speichern der Dienstleistung.');
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setMessage('');
            setError('');
        }
    }, [isOpen, serviceData]);


    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1051] p-4 animate-fadeInModalOverlay backdrop-blur-sm">
            <div className={`bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-slideInModalContent ${styles.modalContent}`}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800 font-serif">{modalTitle}</h3>
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
                    validationSchema={ServiceSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
                >
                    {({ errors, touched, isSubmitting, dirty }) => (
                        <Form className="p-6 space-y-5 overflow-y-auto">
                            <div className={styles.formGroup}>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name der Dienstleistung</label>
                                <Field
                                    name="name"
                                    type="text"
                                    id="name"
                                    className={`w-full px-3 py-2.5 border ${errors.name && touched.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}
                                />
                                <ErrorMessage name="name" component="div" className="mt-1 text-xs text-red-600" />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                                <Field
                                    name="description"
                                    as="textarea"
                                    id="description"
                                    rows="3"
                                    className={`w-full px-3 py-2.5 border ${errors.description && touched.description ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput} ${styles.formTextarea}`}
                                />
                                <ErrorMessage name="description" component="div" className="mt-1 text-xs text-red-600" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                                <div className={styles.formGroup}>
                                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Preis (€)</label>
                                    <Field
                                        name="price"
                                        type="number"
                                        id="price"
                                        step="0.01"
                                        className={`w-full px-3 py-2.5 border ${errors.price && touched.price ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}
                                    />
                                    <ErrorMessage name="price" component="div" className="mt-1 text-xs text-red-600" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">Dauer (Minuten)</label>
                                    <Field
                                        name="duration"
                                        type="number"
                                        id="duration"
                                        className={`w-full px-3 py-2.5 border ${errors.duration && touched.duration ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}
                                    />
                                    <ErrorMessage name="duration" component="div" className="mt-1 text-xs text-red-600" />
                                </div>
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
                                    disabled={loading || isSubmitting || !dirty}
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

export default ServiceEditModal;