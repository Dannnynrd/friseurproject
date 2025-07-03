// friseursalon-frontend/src/components/ProfileEditForm.js
import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import AuthService from '../services/auth.service';
import styles from './ProfileEditForm.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faSpinner, faExclamationCircle, faCheckCircle, faEye, faEyeSlash, faKey, faUserEdit, faUserCircle, faShieldAlt } from '@fortawesome/free-solid-svg-icons';

// Validierungsschema für die Profildaten
const ProfileUpdateSchema = Yup.object().shape({
    firstName: Yup.string().required('Vorname ist erforderlich.'),
    lastName: Yup.string().required('Nachname ist erforderlich.'),
    phoneNumber: Yup.string().matches(/^[0-9+\-\s()]*$/, "Ungültige Telefonnummer.").notRequired(),
});

// Validierungsschema für die Passwortänderung
const PasswordChangeSchema = Yup.object().shape({
    currentPassword: Yup.string().required("Aktuelles Passwort ist erforderlich."),
    newPassword: Yup.string()
        .required("Neues Passwort ist erforderlich.")
        .min(6, "Das neue Passwort muss mindestens 6 Zeichen lang sein."),
    confirmNewPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], 'Die Passwörter müssen übereinstimmen.')
        .required('Bestätigung des neuen Passworts ist erforderlich.'),
});

// Hilfskomponente für ein Passwortfeld mit Sichtbarkeits-Toggle
const PasswordField = ({ name, placeholder, showPassword, togglePasswordVisibility }) => (
    <div className="relative">
        <Field
            name={name}
            type={showPassword ? "text" : "password"}
            placeholder={placeholder}
            className={styles.formInput}
        />
        <button
            type="button"
            onClick={togglePasswordVisibility}
            className={styles.passwordToggle}
            aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
        >
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
        </button>
    </div>
);

// Hauptkomponente
function ProfileEditForm({ user, onProfileUpdateSuccess, onProfileUpdateError }) {
    // States für Nachrichten und Ladezustände
    const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
    const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

    // States für die Sichtbarkeit der Passwörter
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

    // Initialwerte für die Formulare
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

    // Handler für die Profilaktualisierung
    const handleProfileUpdate = (values, { setSubmitting, resetForm }) => {
        setProfileMessage({ text: '', type: '' });
        const profileData = {
            firstName: values.firstName,
            lastName: values.lastName,
            phoneNumber: values.phoneNumber,
        };

        AuthService.updateProfile(profileData)
            .then((response) => {
                setProfileMessage({ text: response.message || "Profil erfolgreich aktualisiert!", type: 'success' });
                if (onProfileUpdateSuccess) onProfileUpdateSuccess();
                // Formulardaten nach erfolgreicher Aktualisierung zurücksetzen
                resetForm({ values });
            })
            .catch((error) => {
                const resMessage = error.response?.data?.message || error.message || 'Ein Fehler ist aufgetreten.';
                setProfileMessage({ text: resMessage, type: 'error' });
                if (onProfileUpdateError) onProfileUpdateError(resMessage);
            })
            .finally(() => setSubmitting(false));
    };

    // Handler für die Passwortänderung
    const handlePasswordChange = (values, { setSubmitting, resetForm }) => {
        setPasswordMessage({ text: '', type: '' });

        AuthService.changePassword(values.currentPassword, values.newPassword)
            .then((response) => {
                setPasswordMessage({ text: response.message || "Passwort erfolgreich geändert!", type: 'success' });
                resetForm(); // Formular nach Erfolg zurücksetzen
            })
            .catch((error) => {
                const resMessage = error.response?.data?.message || error.message || 'Ein Fehler ist aufgetreten.';
                setPasswordMessage({ text: resMessage, type: 'error' });
            })
            .finally(() => setSubmitting(false));
    };

    if (!user) {
        return (
            <div className="flex justify-center items-center p-10">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-indigo-500" />
            </div>
        );
    }

    return (
        <div className={styles.profileContainer}>
            {/* Box für Profildaten */}
            <div className={styles.profileSection}>
                <h3 className={styles.sectionTitle}>
                    <FontAwesomeIcon icon={faUserCircle} />
                    Persönliche Daten
                </h3>
                <Formik
                    initialValues={initialProfileValues}
                    validationSchema={ProfileUpdateSchema}
                    onSubmit={handleProfileUpdate}
                    enableReinitialize
                >
                    {({ errors, touched, isSubmitting, dirty }) => (
                        <Form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={styles.formGroup}>
                                    <label htmlFor="firstName">Vorname*</label>
                                    <Field name="firstName" id="firstName" className={styles.formInput} />
                                    <ErrorMessage name="firstName" component="div" className={styles.errorMessage} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="lastName">Nachname*</label>
                                    <Field name="lastName" id="lastName" className={styles.formInput} />
                                    <ErrorMessage name="lastName" component="div" className={styles.errorMessage} />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="email">E-Mail (nicht änderbar)</label>
                                <Field name="email" id="email" disabled className={styles.formInputDisabled} />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="phoneNumber">Telefon (optional)</label>
                                <Field name="phoneNumber" id="phoneNumber" className={styles.formInput} />
                                <ErrorMessage name="phoneNumber" component="div" className={styles.errorMessage} />
                            </div>
                            {profileMessage.text && (
                                <div className={`${styles.formMessage} ${profileMessage.type === 'success' ? styles.success : styles.error}`}>
                                    <FontAwesomeIcon icon={profileMessage.type === 'success' ? faCheckCircle : faExclamationCircle} />
                                    {profileMessage.text}
                                </div>
                            )}
                            <div className="flex justify-end">
                                <button type="submit" disabled={isSubmitting || !dirty} className={styles.submitButton}>
                                    {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />}
                                    Änderungen speichern
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>

            {/* Box für Passwortänderung */}
            <div className={styles.profileSection}>
                <h3 className={styles.sectionTitle}>
                    <FontAwesomeIcon icon={faShieldAlt} />
                    Passwort ändern
                </h3>
                <Formik
                    initialValues={initialPasswordValues}
                    validationSchema={PasswordChangeSchema}
                    onSubmit={handlePasswordChange}
                >
                    {({ errors, touched, isSubmitting, dirty }) => (
                        <Form className="space-y-6">
                            <div className={styles.formGroup}>
                                <label htmlFor="currentPassword">Aktuelles Passwort</label>
                                <PasswordField name="currentPassword" placeholder="Ihr aktuelles Passwort" showPassword={showCurrentPassword} togglePasswordVisibility={() => setShowCurrentPassword(!showCurrentPassword)} />
                                <ErrorMessage name="currentPassword" component="div" className={styles.errorMessage} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={styles.formGroup}>
                                    <label htmlFor="newPassword">Neues Passwort</label>
                                    <PasswordField name="newPassword" placeholder="Mind. 6 Zeichen" showPassword={showNewPassword} togglePasswordVisibility={() => setShowNewPassword(!showNewPassword)} />
                                    <ErrorMessage name="newPassword" component="div" className={styles.errorMessage} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor="confirmNewPassword">Neues Passwort bestätigen</label>
                                    <PasswordField name="confirmNewPassword" placeholder="Passwort wiederholen" showPassword={showConfirmNewPassword} togglePasswordVisibility={() => setShowConfirmNewPassword(!showConfirmNewPassword)} />
                                    <ErrorMessage name="confirmNewPassword" component="div" className={styles.errorMessage} />
                                </div>
                            </div>
                            {passwordMessage.text && (
                                <div className={`${styles.formMessage} ${passwordMessage.type === 'success' ? styles.success : styles.error}`}>
                                    <FontAwesomeIcon icon={passwordMessage.type === 'success' ? faCheckCircle : faExclamationCircle} />
                                    {passwordMessage.text}
                                </div>
                            )}
                            <div className="flex justify-end">
                                <button type="submit" disabled={isSubmitting || !dirty} className={styles.submitButton}>
                                    {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faKey} />}
                                    Passwort ändern
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}

export default ProfileEditForm;