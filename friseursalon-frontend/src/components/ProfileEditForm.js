import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import AuthService from '../services/auth.service';
import styles from './ProfileEditForm.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faSpinner, faExclamationCircle, faCheckCircle, faEye, faEyeSlash, faKey, faUserEdit } from '@fortawesome/free-solid-svg-icons';

// Schema für die Profildaten-Aktualisierung
const ProfileUpdateSchema = Yup.object().shape({
    firstName: Yup.string().required('Vorname ist erforderlich.'),
    lastName: Yup.string().required('Nachname ist erforderlich.'),
    phoneNumber: Yup.string().matches(/^[0-9+\-\s()]*$/, "Ungültige Telefonnummer.").notRequired(),
});

// Schema für die Passwortänderung
const PasswordChangeSchema = Yup.object().shape({
    currentPassword: Yup.string().required("Aktuelles Passwort ist erforderlich."),
    newPassword: Yup.string()
        .required("Neues Passwort ist erforderlich.")
        .min(6, "Das neue Passwort muss mindestens 6 Zeichen lang sein."),
    confirmNewPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], 'Passwörter müssen übereinstimmen.')
        .required('Bestätigung des neuen Passworts ist erforderlich.'),
});

function ProfileEditForm({ user, onProfileUpdateSuccess, onProfileUpdateError }) {
    // State-Hooks für beide Formulare
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [messageProfile, setMessageProfile] = useState('');
    const [errorProfile, setErrorProfile] = useState('');

    const [loadingPassword, setLoadingPassword] = useState(false);
    const [messagePassword, setMessagePassword] = useState('');
    const [errorPassword, setErrorPassword] = useState('');

    // State für die Sichtbarkeit der Passwortfelder
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    // Initialwerte für die Formulare, basierend auf dem aktuellen Benutzer
    const initialProfileValues = {
        email: user?.email || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phoneNumber: user?.phoneNumber || '',
    };

    const initialPasswordValues = {
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    };

    const handleProfileUpdate = (formValue, { setSubmitting, resetForm }) => {
        setLoadingProfile(true);
        setMessageProfile('');
        setErrorProfile('');

        const profileData = {
            firstName: formValue.firstName,
            lastName: formValue.lastName,
            phoneNumber: formValue.phoneNumber,
        };

        AuthService.updateProfile(profileData)
            .then((response) => {
                setMessageProfile(response.message || "Profil erfolgreich aktualisiert!");
                if (onProfileUpdateSuccess) {
                    onProfileUpdateSuccess();
                }
            })
            .catch((error) => {
                const resMessage = (error.response?.data?.message) || error.message || error.toString();
                setErrorProfile(resMessage);
                if (onProfileUpdateError) onProfileUpdateError(resMessage);
            })
            .finally(() => {
                setLoadingProfile(false);
                setSubmitting(false);
            });
    };

    const handlePasswordChange = (formValue, { setSubmitting, resetForm }) => {
        setLoadingPassword(true);
        setMessagePassword('');
        setErrorPassword('');

        AuthService.changePassword(formValue.currentPassword, formValue.newPassword)
            .then((response) => {
                setMessagePassword(response.message || "Passwort erfolgreich geändert!");
                resetForm();
            })
            .catch((error) => {
                const resMessage = (error.response?.data?.message) || error.message || error.toString();
                setErrorPassword(resMessage);
            })
            .finally(() => {
                setLoadingPassword(false);
                setSubmitting(false);
            });
    };

    if (!user) {
        return <p className="p-8 text-center text-gray-600">Benutzerdaten werden geladen...</p>;
    }

    // ... rest of the component ...
    const renderPasswordField = (name, placeholder, showPassword, setShowPassword, errors, touched) => (
        <div className="relative">
            <Field
                name={name}
                type={showPassword ? "text" : "password"}
                placeholder={placeholder}
                className={`mt-1 block w-full px-3 py-2.5 border ${errors[name] && touched[name] ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-indigo-600 focus:outline-none"
                aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
            >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
        </div>
    );

    return (
        <div className={`${styles.profileEditFormContainer} mx-auto`}>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-8 font-serif">Profil bearbeiten</h2>

            <Formik
                initialValues={initialProfileValues}
                validationSchema={ProfileUpdateSchema}
                onSubmit={handleProfileUpdate}
                enableReinitialize
            >
                {({ errors, touched, isSubmitting, dirty }) => (
                    <Form className={`p-6 md:p-8 bg-white rounded-xl shadow-lg space-y-6 ${styles.formSection}`}>
                        <h3 className="text-xl font-semibold text-gray-700 border-b pb-3 mb-6 font-serif flex items-center">
                            <FontAwesomeIcon icon={faUserEdit} className="mr-3 text-indigo-500" /> Persönliche Daten
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <div className={styles.formGroup}>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Vorname*</label>
                                <Field name="firstName" type="text" id="firstName" className={`mt-1 block w-full px-3 py-2.5 border ${errors.firstName && touched.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`} />
                                <ErrorMessage name="firstName" component="div" className="mt-1 text-xs text-red-600" />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Nachname*</label>
                                <Field name="lastName" type="text" id="lastName" className={`mt-1 block w-full px-3 py-2.5 border ${errors.lastName && touched.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`} />
                                <ErrorMessage name="lastName" component="div" className="mt-1 text-xs text-red-600" />
                            </div>
                            <div className={`md:col-span-2 ${styles.formGroup}`}>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-Mail (nicht änderbar)</label>
                                <Field name="email" type="email" id="email" disabled className={`mt-1 block w-full px-3 py-2.5 border border-gray-300 bg-gray-100 rounded-md shadow-sm sm:text-sm text-gray-500 ${styles.formInput}`} />
                            </div>
                            <div className={`md:col-span-2 ${styles.formGroup}`}>
                                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Telefon (optional)</label>
                                <Field name="phoneNumber" type="tel" id="phoneNumber" className={`mt-1 block w-full px-3 py-2.5 border ${errors.phoneNumber && touched.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${styles.formInput}`} />
                                <ErrorMessage name="phoneNumber" component="div" className="mt-1 text-xs text-red-600" />
                            </div>
                        </div>

                        {errorProfile && (
                            <div className={`p-3 rounded-md bg-red-50 text-red-700 border border-red-200 text-sm flex items-center ${styles.formMessage} ${styles.error}`}>
                                <FontAwesomeIcon icon={faExclamationCircle} className="mr-2 flex-shrink-0" /> {errorProfile}
                            </div>
                        )}
                        {messageProfile && (
                            <div className={`p-3 rounded-md bg-green-50 text-green-700 border border-green-200 text-sm flex items-center ${styles.formMessage} ${styles.success}`}>
                                <FontAwesomeIcon icon={faCheckCircle} className="mr-2 flex-shrink-0" /> {messageProfile}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loadingProfile || isSubmitting || !dirty}
                                className={`inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 ${styles.submitButton}`}
                            >
                                {loadingProfile ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faSave} className="mr-2" />}
                                Profil speichern
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>

            <Formik
                initialValues={initialPasswordValues}
                validationSchema={PasswordChangeSchema}
                onSubmit={handlePasswordChange}
            >
                {({ errors, touched, isSubmitting, dirty }) => (
                    <Form className={`mt-10 p-6 md:p-8 bg-white rounded-xl shadow-lg space-y-6 ${styles.formSection}`}>
                        <h3 className="text-xl font-semibold text-gray-700 border-b pb-3 mb-6 font-serif flex items-center">
                            <FontAwesomeIcon icon={faKey} className="mr-3 text-indigo-500" /> Passwort ändern
                        </h3>
                        <div className={styles.formGroup}>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Aktuelles Passwort</label>
                            {renderPasswordField("currentPassword", "Ihr aktuelles Passwort", showCurrentPassword, setShowCurrentPassword, errors, touched)}
                            <ErrorMessage name="currentPassword" component="div" className="mt-1 text-xs text-red-600" />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Neues Passwort</label>
                            {renderPasswordField("newPassword", "Mindestens 6 Zeichen", showNewPassword, setShowNewPassword, errors, touched)}
                            <ErrorMessage name="newPassword" component="div" className="mt-1 text-xs text-red-600" />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">Neues Passwort bestätigen</label>
                            {renderPasswordField("confirmNewPassword", "Neues Passwort wiederholen", showConfirmNewPassword, setShowConfirmNewPassword, errors, touched)}
                            <ErrorMessage name="confirmNewPassword" component="div" className="mt-1 text-xs text-red-600" />
                        </div>

                        {errorPassword && (
                            <div className={`p-3 rounded-md bg-red-50 text-red-700 border border-red-200 text-sm flex items-center ${styles.formMessage} ${styles.error}`}>
                                <FontAwesomeIcon icon={faExclamationCircle} className="mr-2 flex-shrink-0" /> {errorPassword}
                            </div>
                        )}
                        {messagePassword && (
                            <div className={`p-3 rounded-md bg-green-50 text-green-700 border border-green-200 text-sm flex items-center ${styles.formMessage} ${styles.success}`}>
                                <FontAwesomeIcon icon={faCheckCircle} className="mr-2 flex-shrink-0" /> {messagePassword}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loadingPassword || isSubmitting || !dirty}
                                className={`inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 ${styles.submitButton}`}
                            >
                                {loadingPassword ? <FontAwesomeIcon icon={faSpinner} spin className="mr-2" /> : <FontAwesomeIcon icon={faKey} className="mr-2" />}
                                Passwort ändern
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
}

export default ProfileEditForm;