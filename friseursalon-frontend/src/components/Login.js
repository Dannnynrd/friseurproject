// friseursalon-frontend/src/components/Login.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import AuthService from '../services/auth.service';
import styles from './Login.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt, faUserPlus, faSpinner, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

const LoginSchema = Yup.object().shape({
    email: Yup.string().email("Ungültige E-Mail-Adresse.").required('E-Mail ist erforderlich'), // Geändert von username
    password: Yup.string().required('Passwort ist erforderlich'),
});

function Login({ onLoginSuccess }) { // onLoginSuccess prop hinzugefügt
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
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

    const handleLogin = (formValue, { setSubmitting }) => { // setSubmitting von Formik hinzugefügt
        const { email, password } = formValue; // Geändert von username
        setMessage('');
        setLoading(true);

        AuthService.login(email, password).then( // email statt username
            () => {
                if (typeof onLoginSuccess === 'function') {
                    onLoginSuccess(); // Callback für App.js aufrufen
                } else {
                    // Fallback, falls Prop nicht übergeben wurde (sollte aber)
                    const user = AuthService.getCurrentUser();
                    if (user && user.roles && user.roles.includes('ROLE_ADMIN')) {
                        navigate('/my-account?tab=admin-dashboard'); // Ziel für Admin
                    } else {
                        navigate('/my-account'); // Standard-Dashboard für User
                    }
                }
                // window.location.reload(); // Wird nicht mehr benötigt, da App.js den currentUser aktualisiert
            },
            (error) => {
                const resMessage =
                    (error.response &&
                        error.response.data &&
                        error.response.data.message) ||
                    error.message ||
                    error.toString();
                setLoading(false);
                setMessage(resMessage);
                setSubmitting(false); // Formik darüber informieren, dass Submit beendet ist
            }
        );
    };

    return (
        <section ref={sectionRef} className={`flex items-center justify-center min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 ${styles.loginPageContainer}`}>
            <div className={`w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-2xl animate-up ${styles.authContainer}`}>
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 font-serif">
                        Anmelden
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Oder{' '}
                        <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
                            erstellen Sie ein neues Konto
                        </Link>
                    </p>
                </div>

                <Formik
                    initialValues={{ email: '', password: '' }} // Geändert von username
                    validationSchema={LoginSchema}
                    onSubmit={handleLogin}
                >
                    {({ errors, touched, isSubmitting }) => ( // isSubmitting von Formik
                        <Form className="mt-8 space-y-6">
                            <div className={styles.formGroup}>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    E-Mail-Adresse {/* Geändert */}
                                </label>
                                <Field
                                    name="email" // Geändert
                                    type="email"  // Typ auf email geändert
                                    autoComplete="email" // Geändert
                                    className={`mt-1 block w-full px-3 py-2 border ${errors.email && touched.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}
                                />
                                <ErrorMessage name="email" component="div" className="mt-1 text-xs text-red-600" /> {/* Geändert */}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Passwort
                                </label>
                                <Field
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    className={`mt-1 block w-full px-3 py-2 border ${errors.password && touched.password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}
                                />
                                <ErrorMessage name="password" component="div" className="mt-1 text-xs text-red-600" />
                            </div>

                            <div className="flex items-center justify-end">
                                <div className="text-sm">
                                    <Link to="/passwort-vergessen" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
                                        Passwort vergessen?
                                    </Link>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading || isSubmitting} // Auch Formiks isSubmitting verwenden
                                    className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 ${styles.authButton}`}
                                >
                                    {loading || isSubmitting ? ( // Auch Formiks isSubmitting verwenden
                                        <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                                    ) : (
                                        <FontAwesomeIcon icon={faSignInAlt} className="mr-2 h-5 w-5 text-indigo-300 group-hover:text-indigo-200" />
                                    )}
                                    Anmelden
                                </button>
                            </div>

                            {message && (
                                <div className={`mt-4 p-3 rounded-md bg-red-50 text-red-700 border border-red-200 text-sm flex items-center ${styles.formMessage} ${styles.error}`}>
                                    <FontAwesomeIcon icon={faExclamationCircle} className="mr-2" />
                                    {message}
                                </div>
                            )}
                        </Form>
                    )}
                </Formik>
                {/* Der "Oder weiter mit" Teil bleibt unverändert, da er OAuth betrifft, was aktuell nicht implementiert ist. */}
                {/* ... (bestehender OAuth Teil) ... */}
            </div>
        </section>
    );
}

export default Login;