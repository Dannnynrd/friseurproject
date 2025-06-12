import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import AuthService from '../services/auth.service';
import styles from './Login.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt, faSpinner, faExclamationCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const LoginSchema = Yup.object().shape({
    email: Yup.string().email("Ungültige E-Mail-Adresse.").required('E-Mail ist erforderlich'),
    password: Yup.string().required('Passwort ist erforderlich'),
});

function Login({ onLoginSuccess }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const sectionRef = useRef(null);

    useEffect(() => {
        if (location.state && location.state.message) {
            setMessage(location.state.message);
            setIsError(false);
        }
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
    }, [location.state]);

    const handleLogin = (formValue, { setSubmitting }) => {
        const { email, password } = formValue;
        setMessage('');
        setIsError(false);
        setLoading(true);
        setSubmitting(true);

        AuthService.login(email, password).then(
            (userData) => {
                setLoading(false);
                setSubmitting(false);
                if (typeof onLoginSuccess === 'function') {
                    onLoginSuccess(userData);
                } else {
                    navigate(userData.roles?.includes('ROLE_ADMIN') ? '/my-account?tab=admin-dashboard' : '/my-account');
                }
            },
            (error) => {
                const resMessage = (error.response?.data?.message) || error.message || error.toString();
                setLoading(false);
                setSubmitting(false);
                setMessage(resMessage);
                setIsError(true);
            }
        );
    };

    return (
        <section ref={sectionRef} className={`flex items-center justify-center min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 ${styles.loginPageContainer}`}>
            <div className={`w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-2xl animate-up ${styles.authContainer}`}>
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 font-serif">Anmelden</h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Oder{' '}
                        <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
                            erstellen Sie ein neues Konto
                        </Link>
                    </p>
                </div>

                {message && (
                    <div className={`p-3 rounded-md text-sm flex items-center ${isError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'} ${styles.formMessage}`}>
                        <FontAwesomeIcon icon={isError ? faExclamationCircle : faCheckCircle} className="mr-2" />
                        {message}
                    </div>
                )}

                <Formik
                    initialValues={{ email: '', password: '' }}
                    validationSchema={LoginSchema}
                    onSubmit={handleLogin}
                >
                    {({ errors, touched, isSubmitting }) => (
                        <Form className="mt-8 space-y-6">
                            <div className={styles.formGroup}>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    E-Mail-Adresse
                                </label>
                                <Field
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    className={`mt-1 block w-full px-3 py-2 border ${errors.email && touched.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}
                                />
                                <ErrorMessage name="email" component="div" className="mt-1 text-xs text-red-600" />
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
                                    disabled={loading || isSubmitting}
                                    className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 ${styles.authButton}`}
                                >
                                    {loading || isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faSignInAlt} className="mr-2 h-5 w-5 text-indigo-300 group-hover:text-indigo-200" />}
                                    Anmelden
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </section>
    );
}

export default Login;
