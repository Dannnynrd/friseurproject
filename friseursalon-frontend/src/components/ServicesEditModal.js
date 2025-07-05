import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../services/api.service';
import styles from './ServiceEditModal.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave, faSpinner } from '@fortawesome/free-solid-svg-icons';

const ServiceSchema = Yup.object().shape({
    name: Yup.string().min(3, 'Name muss mindestens 3 Zeichen lang sein.').required('Name ist erforderlich.'),
    description: Yup.string().min(10, 'Beschreibung muss mindestens 10 Zeichen lang sein.').required('Beschreibung ist erforderlich.'),
    price: Yup.number().positive('Preis muss eine positive Zahl sein.').required('Preis ist erforderlich.'),
    durationMinutes: Yup.number().integer('Dauer muss eine ganze Zahl sein.').positive('Dauer muss eine positive Zahl sein.').required('Dauer ist erforderlich.'),
});

function ServiceEditModal({ isOpen, onClose, onSave, service }) {
    if (!isOpen || !service) return null;

    const handleSubmit = async (values, { setSubmitting, setStatus }) => {
        setStatus(null);
        try {
            const response = await api.put(`/services/${service.id}`, values);
            onSave(response.data);
            onClose();
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Dienstleistung:', error);
            setStatus({ error: 'Dienstleistung konnte nicht gespeichert werden.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>Dienstleistung bearbeiten</h3>
                    <button onClick={onClose} className={styles.closeButton}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <Formik
                    initialValues={{
                        name: service.name || '',
                        description: service.description || '',
                        price: service.price || 0,
                        durationMinutes: service.durationMinutes || 0,
                    }}
                    validationSchema={ServiceSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize={true} // WICHTIG: Lädt die Daten neu, wenn sich `service` ändert.
                >
                    {({ isSubmitting, status, errors, touched }) => (
                        <Form className={styles.form}>
                            <div className={styles.formGroup}>
                                <label htmlFor="name">Name der Dienstleistung</label>
                                <Field name="name" type="text" className={`${styles.formInput} ${errors.name && touched.name ? styles.inputError : ''}`} />
                                <ErrorMessage name="name" component="div" className={styles.errorMessage} />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="description">Beschreibung</label>
                                <Field name="description" as="textarea" rows="4" className={`${styles.formTextarea} ${errors.description && touched.description ? styles.inputError : ''}`} />
                                <ErrorMessage name="description" component="div" className={styles.errorMessage} />
                            </div>
                            <div className={styles.formGroupGrid}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="price">Preis (€)</label>
                                    <Field name="price" type="number" step="0.01" className={`${styles.formInput} ${errors.price && touched.price ? styles.inputError : ''}`} />
                                    <ErrorMessage name="price" component="div" className={styles.errorMessage} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="durationMinutes">Dauer (in Minuten)</label>
                                    <Field name="durationMinutes" type="number" className={`${styles.formInput} ${errors.durationMinutes && touched.durationMinutes ? styles.inputError : ''}`} />
                                    <ErrorMessage name="durationMinutes" component="div" className={styles.errorMessage} />
                                </div>
                            </div>
                            {status?.error && <div className={styles.apiError}>{status.error}</div>}
                            <div className={styles.modalFooter}>
                                <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isSubmitting}>
                                    Abbrechen
                                </button>
                                <button type="submit" className={styles.saveButton} disabled={isSubmitting}>
                                    {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faSave} className="mr-2" />}
                                    Änderungen speichern
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
