// File: friseursalon-frontend/src/components/ProfileEditForm.js
import React, { useState, useEffect } from 'react';
import AuthService from '../services/auth.service'; // We'll add methods here
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faSpinner, faExclamationCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import './ProfileEditForm.css';

function ProfileEditForm({ currentUser, onSaveSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
    });

    const [infoMessage, setInfoMessage] = useState('');
    const [infoError, setInfoError] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setFormData({
                firstName: currentUser.firstName || '',
                lastName: currentUser.lastName || '',
                phoneNumber: currentUser.phoneNumber || '',
            });
        }
    }, [currentUser]);

    const handleInfoChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleInfoSubmit = async (e) => {
        e.preventDefault();
        setInfoError('');
        setInfoMessage('');
        setIsSubmittingInfo(true);

        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            setInfoError('Vorname und Nachname dürfen nicht leer sein.');
            setIsSubmittingInfo(false);
            return;
        }

        try {
            // This will call the new method in AuthService
            const updatedUserPartial = await AuthService.updateProfile(currentUser.id, formData);

            setInfoMessage('Profil erfolgreich aktualisiert!');
            if (onSaveSuccess) {
                // Pass the updated data, or trigger a refetch of currentUser in App.js
                onSaveSuccess(updatedUserPartial);
            }
        } catch (err) {
            const errMsg = err.response?.data?.message || err.message || 'Fehler beim Aktualisieren des Profils.';
            setInfoError(errMsg);
        } finally {
            setIsSubmittingInfo(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordMessage('');
        setIsSubmittingPassword(true);

        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmNewPassword) {
            setPasswordError('Bitte alle Passwortfelder ausfüllen.');
            setIsSubmittingPassword(false);
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setPasswordError('Das neue Passwort muss mindestens 6 Zeichen lang sein.');
            setIsSubmittingPassword(false);
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            setPasswordError('Die neuen Passwörter stimmen nicht überein.');
            setIsSubmittingPassword(false);
            return;
        }

        try {
            // This will call the new method in AuthService
            const response = await AuthService.changePassword(passwordData.currentPassword, passwordData.newPassword);

            setPasswordMessage(response.message || 'Passwort erfolgreich geändert!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        } catch (err) {
            const errMsg = err.response?.data?.message || err.message || 'Fehler beim Ändern des Passworts.';
            setPasswordError(errMsg);
        } finally {
            setIsSubmittingPassword(false);
        }
    };

    return (
        <div className="profile-edit-forms-container">
            <form onSubmit={handleInfoSubmit} className="profile-edit-form section-style">
                <h3 className="form-section-heading">Persönliche Daten ändern</h3>
                {infoError && <p className="form-message error small"><FontAwesomeIcon icon={faExclamationCircle} /> {infoError}</p>}
                {infoMessage && <p className="form-message success small"><FontAwesomeIcon icon={faCheckCircle} /> {infoMessage}</p>}

                <div className="form-group">
                    <label htmlFor="pef-firstName">Vorname</label>
                    <input type="text" id="pef-firstName" name="firstName" value={formData.firstName} onChange={handleInfoChange} disabled={isSubmittingInfo} />
                </div>
                <div className="form-group">
                    <label htmlFor="pef-lastName">Nachname</label>
                    <input type="text" id="pef-lastName" name="lastName" value={formData.lastName} onChange={handleInfoChange} disabled={isSubmittingInfo} />
                </div>
                <div className="form-group">
                    <label htmlFor="pef-email">E-Mail</label>
                    <input type="email" id="pef-email" name="email" value={currentUser?.email || ''} disabled readOnly />
                    <p className="form-hint small-hint">E-Mail-Adresse kann nicht geändert werden.</p>
                </div>
                <div className="form-group">
                    <label htmlFor="pef-phoneNumber">Telefonnummer</label>
                    <input type="tel" id="pef-phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleInfoChange} disabled={isSubmittingInfo} />
                </div>
                <div className="form-actions">
                    <button type="submit" className="button-link" disabled={isSubmittingInfo}>
                        {isSubmittingInfo ? <><FontAwesomeIcon icon={faSpinner} spin /> Speichere...</> : <><FontAwesomeIcon icon={faSave} /> Daten speichern</>}
                    </button>
                </div>
            </form>

            <hr className="profile-form-divider" />

            <form onSubmit={handlePasswordSubmit} className="profile-edit-form section-style">
                <h3 className="form-section-heading">Passwort ändern</h3>
                {passwordError && <p className="form-message error small"><FontAwesomeIcon icon={faExclamationCircle} /> {passwordError}</p>}
                {passwordMessage && <p className="form-message success small"><FontAwesomeIcon icon={faCheckCircle} /> {passwordMessage}</p>}

                <div className="form-group">
                    <label htmlFor="pef-currentPassword">Aktuelles Passwort</label>
                    <input type="password" id="pef-currentPassword" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} disabled={isSubmittingPassword} />
                </div>
                <div className="form-group">
                    <label htmlFor="pef-newPassword">Neues Passwort</label>
                    <input type="password" id="pef-newPassword" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} disabled={isSubmittingPassword} />
                </div>
                <div className="form-group">
                    <label htmlFor="pef-confirmNewPassword">Neues Passwort bestätigen</label>
                    <input type="password" id="pef-confirmNewPassword" name="confirmNewPassword" value={passwordData.confirmNewPassword} onChange={handlePasswordChange} disabled={isSubmittingPassword} />
                </div>
                <div className="form-actions">
                    <button type="submit" className="button-link" disabled={isSubmittingPassword}>
                        {isSubmittingPassword ? <><FontAwesomeIcon icon={faSpinner} spin /> Ändere...</> : <><FontAwesomeIcon icon={faSave} /> Passwort ändern</>}
                    </button>
                </div>
            </form>
            <div className="form-actions overall-cancel">
                <button type="button" onClick={onCancel} className="button-link-outline">
                    <FontAwesomeIcon icon={faTimes} /> Zurück zur Übersicht
                </button>
            </div>
        </div>
    );
}

export default ProfileEditForm;
