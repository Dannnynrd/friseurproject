// friseursalon-frontend/src/components/Register.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import AuthService from '../services/auth.service';
import styles from './Register.module.css'; // CSS-Modul
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faSignInAlt, faSpinner, faExclamationCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const RegisterSchema = Yup.object().shape({
    firstName: Yup.string()
        .required('Vorname ist erforderlich.'),
    lastName: Yup.string()
        .required('Nachname ist erforderlich.'),
    email: Yup.string()
        .email('Ungültige E-Mail-Adresse.')
        .required('E-Mail ist erforderlich.'),
    password: Yup.string()
        .required('Passwort ist erforderlich.')
        .min(6, 'Passwort muss mindestens 6 Zeichen lang sein.')
        .max(40, 'Passwort darf maximal 40 Zeichen lang sein.'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwörter müssen übereinstimmen.')
        .required('Passwortbestätigung ist erforderlich.'),
    phoneNumber: Yup.string()
        .matches(/^[0-9+\-\s()]*$/, "Ungültige Telefonnummer.")
        .notRequired(),
});

function Register({ onRegisterSuccess }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const sectionRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        const currentSectionRef = sectionRef.current;
        if (currentSectionRef) {
            observer.observe(currentSectionRef);
        }
        return () => {
            if (currentSectionRef) {
                observer.unobserve(currentSectionRef);
            }
        };
    }, []);

    const handleRegister = (formValue, { setSubmitting, resetForm }) => {
        const { firstName, lastName, email, password, phoneNumber } = formValue;
        setMessage('');
        setError('');
        setLoading(true);

        AuthService.register(firstName, lastName, email, password, phoneNumber || null).then(
            (response) => {
                setLoading(false);
                setSubmitting(false);
                setMessage(response.data?.message || response.message || "Registrierung erfolgreich! Sie können sich jetzt anmelden.");
                resetForm();
                if (typeof onRegisterSuccess === 'function') {
                    onRegisterSuccess();
                } else {
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                }
            },
            (error) => {
                const resMessage =
                    (error.response &&
                        error.response.data &&
                        error.response.data.message) ||
                    error.message ||
                    error.toString();
                setLoading(false);
                setSubmitting(false);
                setError(resMessage);
            }
        );
    };

    return (
        <section ref={sectionRef} className={`flex items-center justify-center min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 ${styles.registerPageContainer}`}>
            <div className={`w-full max-w-lg p-8 space-y-8 bg-white rounded-xl shadow-2xl animate-up ${styles.authContainer}`}>
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 font-serif">
                        Neues Konto erstellen
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Bereits registriert?{' '}
                        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
                            Hier anmelden
                        </Link>
                    </p>
                </div>

                <Formik
                    initialValues={{
                        firstName: '',
                        lastName: '',
                        email: '',
                        password: '',
                        confirmPassword: '',
                        phoneNumber: '',
                    }}
                    validationSchema={RegisterSchema}
                    onSubmit={handleRegister}
                >
                    {({ errors, touched, isSubmitting }) => (
                        <Form className="mt-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={styles.formGroup}>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Vorname*</label>
                                    <Field name="firstName" type="text" id="firstName" autoComplete="given-name" className={`mt-1 block w-full px-3 py-2 border ${errors.firstName && touched.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`} />
                                    <ErrorMessage name="firstName" component="div" className="mt-1 text-xs text-red-600" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Nachname*</label>
                                    <Field name="lastName" type="text" id="lastName" autoComplete="family-name" className={`mt-1 block w-full px-3 py-2 border ${errors.lastName && touched.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`} />
                                    <ErrorMessage name="lastName" component="div" className="mt-1 text-xs text-red-600" />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-Mail-Adresse*</label>
                                <Field name="email" type="email" id="email" autoComplete="email" className={`mt-1 block w-full px-3 py-2 border ${errors.email && touched.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`} />
                                <ErrorMessage name="email" component="div" className="mt-1 text-xs text-red-600" />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Telefonnummer (optional)</label>
                                <Field name="phoneNumber" type="tel" id="phoneNumber" autoComplete="tel" className={`mt-1 block w-full px-3 py-2 border ${errors.phoneNumber && touched.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`} />
                                <ErrorMessage name="phoneNumber" component="div" className="mt-1 text-xs text-red-600" />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Passwort*</label>
                                <Field name="password" type="password" id="password" autoComplete="new-password" className={`mt-1 block w-full px-3 py-2 border ${errors.password && touched.password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`} />
                                <ErrorMessage name="password" component="div" className="mt-1 text-xs text-red-600" />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Passwort bestätigen*</label>
                                <Field name="confirmPassword" type="password" id="confirmPassword" autoComplete="new-password" className={`mt-1 block w-full px-3 py-2 border ${errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`} />
                                <ErrorMessage name="confirmPassword" component="div" className="mt-1 text-xs text-red-600" />
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading || isSubmitting}
                                    className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 ${styles.authButton}`}
                                >
                                    {loading || isSubmitting ? (
                                        <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                                    ) : (
                                        <FontAwesomeIcon icon={faUserPlus} className="mr-2 h-5 w-5 text-indigo-300 group-hover:text-indigo-200" />
                                    )}
                                    Konto erstellen
                                </button>
                            </div>

                            {error && (
                                <div className={`mt-4 p-3 rounded-md bg-red-50 text-red-700 border border-red-200 text-sm flex items-center ${styles.formMessage} ${styles.error}`}>
                                    <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" />
                                    {error}
                                </div>
                            )}
                            {message && !error && (
                                <div className={`mt-4 p-3 rounded-md bg-green-50 text-green-700 border border-green-200 text-sm flex items-center ${styles.formMessage} ${styles.success}`}>
                                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                                    {message}
                                </div>
                            )}
                        </Form>
                    )}
                </Formik>
            </div>
        </section>
    );
}

export default Register;
