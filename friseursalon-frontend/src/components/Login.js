// friseursalon-frontend/src/components/Login.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import AuthService from '../services/auth.service';
// HIER den Import ändern:
import styles from './Login.module.css'; // Importiert als CSS-Modul
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt, faUserPlus, faSpinner, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

const LoginSchema = Yup.object().shape({
    username: Yup.string().required('Benutzername ist erforderlich'),
    password: Yup.string().required('Passwort ist erforderlich'),
});

function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const sectionRef = useRef(null); // Für eventuelle Scroll-Animationen

    // Für die "animate-up" Klasse, falls die Login-Seite Teil einer Scroll-Animation ist
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


    const handleLogin = (formValue) => {
        const { username, password } = formValue;
        setMessage('');
        setLoading(true);

        AuthService.login(username, password).then(
            () => {
                // Überprüfen, ob der Benutzer Admin-Rollen hat
                const user = AuthService.getCurrentUser();
                if (user && user.roles && user.roles.includes('ROLE_ADMIN')) {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/account'); // Oder eine andere Standardseite für normale Benutzer
                }
                // window.location.reload(); // Oft nicht nötig mit React Router, kann zu UX-Problemen führen
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
                    initialValues={{ username: '', password: '' }}
                    validationSchema={LoginSchema}
                    onSubmit={handleLogin}
                >
                    {({ errors, touched }) => (
                        <Form className="mt-8 space-y-6">
                            <div className={styles.formGroup}>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                    Benutzername
                                </label>
                                <Field
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    className={`mt-1 block w-full px-3 py-2 border ${errors.username && touched.username ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}
                                />
                                <ErrorMessage name="username" component="div" className="mt-1 text-xs text-red-600" />
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

                            {/* Optional: "Passwort vergessen?" Link */}
                            <div className="flex items-center justify-end">
                                <div className="text-sm">
                                    <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
                                        Passwort vergessen?
                                    </a>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 ${styles.authButton}`}
                                >
                                    {loading ? (
                                        <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                                    ) : (
                                        <FontAwesomeIcon icon={faSignInAlt} className="mr-2 h-5 w-5 text-indigo-500 group-hover:text-indigo-400" />
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

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">
                                Oder weiter mit
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <div>
                            <a
                                href="#" // TODO: Google Auth Link
                                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                            >
                                <span className="sr-only">Mit Google anmelden</span>
                                <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.418 2.865 8.148 6.839 9.489.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.338 4.695-4.566 4.942.359.31.678.92.678 1.852 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0020 10c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                                </svg>
                            </a>
                        </div>
                        <div>
                            <a
                                href="#" // TODO: Facebook Auth Link
                                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                            >
                                <span className="sr-only">Mit Facebook anmelden</span>
                                <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Login;
