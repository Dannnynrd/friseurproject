// friseursalon-frontend/src/components/TestimonialSubmitModal.js
import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import testimonialService from '../services/testimonial.service';
import styles from './TestimonialSubmitModal.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as fasStar, faPaperPlane, faSpinner, faTimes, faExclamationCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons';

const TestimonialSchema = Yup.object().shape({
    rating: Yup.number().min(1, 'Eine Bewertung ist erforderlich.').required('Bewertung ist erforderlich.'),
    comment: Yup.string().required('Ein Kommentar ist erforderlich.').min(10, 'Ihr Kommentar sollte mindestens 10 Zeichen lang sein.').max(1000, 'Ihr Kommentar darf maximal 1000 Zeichen lang sein.'),
});

const StarRating = ({ field, form, disabled }) => {
    const [hoverRating, setHoverRating] = useState(0);
    const rating = field.value;

    return (
        <div className={styles.starRatingInput}>
            {[1, 2, 3, 4, 5].map((star) => (
                <FontAwesomeIcon
                    key={star}
                    icon={star <= (hoverRating || rating) ? fasStar : farStar}
                    className={`${styles.starIcon} ${disabled ? styles.disabled : ''}`}
                    onMouseEnter={() => !disabled && setHoverRating(star)}
                    onMouseLeave={() => !disabled && setHoverRating(0)}
                    onClick={() => !disabled && form.setFieldValue(field.name, star)}
                />
            ))}
        </div>
    );
};

function TestimonialSubmitModal({ isOpen, onClose, onSubmitted, appointment }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        setLoading(true);
        setError('');
        setMessage('');

        const testimonialData = {
            rating: values.rating,
            comment: values.comment,
            serviceId: appointment?.service?.id,
        };

        try {
            await testimonialService.submitTestimonial(testimonialData);
            setMessage('Vielen Dank! Ihre Bewertung wurde erfolgreich übermittelt.');
            setLoading(false);
            setSubmitting(false);
            if (onSubmitted) onSubmitted();
            setTimeout(onClose, 2000);
        } catch (err) {
            const resMessage = err.response?.data?.message || 'Ein unerwarteter Fehler ist aufgetreten.';
            setError(resMessage);
            setLoading(false);
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1060] p-4 animate-fadeInModalOverlay backdrop-blur-sm">
            <div className={`bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-slideInModalContent ${styles.modalContent}`}>
                <div className="flex justify-between items-center p-5 border-b border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-800 font-serif">Bewertung abgeben</h3>
                    <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                        <FontAwesomeIcon icon={faTimes} size="lg" />
                    </button>
                </div>
                <Formik
                    initialValues={{ rating: 0, comment: '' }}
                    validationSchema={TestimonialSchema}
                    onSubmit={handleSubmit}
                >
                    {({ errors, touched, isSubmitting, values }) => (
                        <Form className="p-6 space-y-5 overflow-y-auto">
                            <p className="text-sm text-gray-600">
                                Wir würden uns über Ihr Feedback zur Dienstleistung <strong>"{appointment?.service?.name || 'Ihrem Termin'}"</strong> freuen.
                            </p>

                            <div className={styles.formGroup}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ihre Bewertung*</label>
                                <Field name="rating" component={StarRating} disabled={loading} />
                                <ErrorMessage name="rating" component="div" className="mt-1 text-xs text-red-600" />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">Ihr Kommentar*</label>
                                <Field
                                    as="textarea"
                                    name="comment"
                                    id="comment"
                                    rows="4"
                                    className={`w-full px-3 py-2 border ${errors.comment && touched.comment ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput} ${styles.formTextarea}`}
                                    disabled={loading}
                                />
                                <ErrorMessage name="comment" component="div" className="mt-1 text-xs text-red-600" />
                            </div>

                            {error && (
                                <div className={`p-3 rounded-md bg-red-50 text-red-700 border border-red-200 text-sm flex items-center ${styles.formMessage} ${styles.error}`}>
                                    <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" /> {error}
                                </div>
                            )}
                            {message && (
                                <div className={`p-3 rounded-md bg-green-50 text-green-700 border border-green-200 text-sm flex items-center ${styles.formMessage} ${styles.success}`}>
                                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2" /> {message}
                                </div>
                            )}

                            <div className="pt-5 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading || isSubmitting}
                                    className={`inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 ${styles.actionButton}`}
                                >
                                    {loading ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />}
                                    Bewertung absenden
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}

export default TestimonialSubmitModal;