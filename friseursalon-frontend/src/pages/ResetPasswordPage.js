// friseursalon-frontend/src/pages/ResetPasswordPage.js
import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import AuthService from '../services/auth.service';
import styles from './AuthPages.module.css'; // Gemeinsames Stil-Modul
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faSpinner, faExclamationCircle, faCheckCircle, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const ResetPasswordSchema = Yup.object().shape({
    newPassword: Yup.string().required('Neues Passwort ist erforderlich.').min(6, 'Das neue Passwort muss mindestens 6 Zeichen lang sein.').max(40, 'Passwort darf maximal 40 Zeichen lang sein.'),
    confirmNewPassword: Yup.string().oneOf([Yup.ref('newPassword'), null], 'Passwörter müssen übereinstimmen.').required('Passwortbestätigung ist erforderlich.'),
});

function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const sectionRef = useRef(null);

    useEffect(() => {
        if (!token) {
            setMessage("Kein gültiger Link. Bitte fordern Sie einen neuen an.");
            setIsError(true);
        }
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });
        const currentSectionRef = sectionRef.current;
        if (currentSectionRef) observer.observe(currentSectionRef);
        return () => { if (currentSectionRef) observer.unobserve(currentSectionRef); };
    }, [token]);

    const handleResetPassword = (formValue, { setSubmitting }) => {
        setMessage('');
        setIsError(false);
        setLoading(true);
        setSubmitting(true);

        AuthService.resetPassword(token, formValue.newPassword).then(
            (response) => {
                setMessage(response.data.message);
                setIsError(false);
                setLoading(false);
                setSubmitting(false);
                setTimeout(() => navigate('/login'), 3000);
            },
            (error) => {
                const resMessage = (error.response?.data?.message) || error.message || error.toString();
                setMessage(resMessage);
                setIsError(true);
                setLoading(false);
                setSubmitting(false);
            }
        );
    };

    const renderPasswordField = (name, placeholder, show, setShow, errors, touched) => (
        <div className="relative">
            <Field
                name={name}
                type={show ? "text" : "password"}
                placeholder={placeholder}
                className={`mt-1 block w-full px-3 py-2 border ${errors[name] && touched[name] ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-indigo-600 focus:outline-none">
                <FontAwesomeIcon icon={show ? faEyeSlash : faEye} />
            </button>
        </div>
    );

    return (
        <section ref={sectionRef} className={`flex items-center justify-center min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 ${styles.authPageContainer}`}>
            <div className={`w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-2xl animate-up ${styles.authContainer}`}>
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 font-serif">Neues Passwort festlegen</h2>
                </div>

                {message && (
                    <div className={`p-3 rounded-md text-sm flex items-center ${isError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'} ${styles.formMessage}`}>
                        <FontAwesomeIcon icon={isError ? faExclamationCircle : faCheckCircle} className="mr-2" />
                        {message}
                    </div>
                )}

                {token && !isError && (
                    <Formik
                        initialValues={{ newPassword: '', confirmNewPassword: '' }}
                        validationSchema={ResetPasswordSchema}
                        onSubmit={handleResetPassword}
                    >
                        {({ errors, touched, isSubmitting }) => (
                            <Form className="mt-8 space-y-6">
                                <div className={styles.formGroup}>
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Neues Passwort</label>
                                    {renderPasswordField("newPassword", "Mindestens 6 Zeichen", showNewPassword, setShowNewPassword, errors, touched)}
                                    <ErrorMessage name="newPassword" component="div" className="mt-1 text-xs text-red-600" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">Neues Passwort bestätigen</label>
                                    {renderPasswordField("confirmNewPassword", "Passwort wiederholen", showConfirmNewPassword, setShowConfirmNewPassword, errors, touched)}
                                    <ErrorMessage name="confirmNewPassword" component="div" className="mt-1 text-xs text-red-600" />
                                </div>
                                <div>
                                    <button type="submit" disabled={loading || isSubmitting} className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 ${styles.authButton}`}>
                                        {loading || isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faKey} className="mr-2 h-5 w-5 text-indigo-300 group-hover:text-indigo-200" />}
                                        Passwort speichern
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                )}
                <div className="text-center text-sm">
                    <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
                        Zurück zum Login
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default ResetPasswordPage;