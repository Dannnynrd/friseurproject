// src/components/ProfileEditForm.js
import React, { useState, useEffect } from 'react';
import AuthService from '../services/auth.service';
import './ProfileEditForm.css'; // Stelle sicher, dass die CSS-Datei existiert oder erstelle sie

const ProfileEditForm = ({ currentUser, onProfileUpdateSuccess, onProfileUpdateError }) => {
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
    const [message, setMessage] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setFormData({
                firstName: currentUser.firstName || '',
                lastName: currentUser.lastName || '',
                phoneNumber: currentUser.phoneNumber || '',
            });
        }
    }, [currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData({ ...passwordData, [name]: value });
    };

    const handleSubmitProfile = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        try {
            // Die profileData sollten nur die Felder enthalten, die das Backend erwartet
            const profileToUpdate = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phoneNumber: formData.phoneNumber,
            };
            const response = await AuthService.updateProfile(profileToUpdate);
            setMessage(response.message || 'Profil erfolgreich aktualisiert!');
            if (onProfileUpdateSuccess) {
                // Wichtig: Die aktualisierten Daten für den Global State bereitstellen.
                // AuthService.updateProfile aktualisiert bereits den LocalStorage.
                // Wir holen den User neu aus dem LocalStorage, um sicherzugehen.
                onProfileUpdateSuccess(AuthService.getCurrentUser());
            }
        } catch (error) {
            const resMessage =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            setMessage(resMessage);
            if (onProfileUpdateError) {
                onProfileUpdateError(resMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitPassword = async (e) => {
        e.preventDefault();
        setPasswordMessage('');
        setPasswordLoading(true);

        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            setPasswordMessage('Die neuen Passwörter stimmen nicht überein.');
            setPasswordLoading(false);
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setPasswordMessage('Das neue Passwort muss mindestens 6 Zeichen lang sein.');
            setPasswordLoading(false);
            return;
        }

        try {
            const response = await AuthService.changePassword(
                passwordData.currentPassword,
                passwordData.newPassword
            );
            setPasswordMessage(response.message || 'Passwort erfolgreich geändert!');
            setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' }); // Formular zurücksetzen
        } catch (error) {
            const resMessage =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            setPasswordMessage(resMessage);
        } finally {
            setPasswordLoading(false);
        }
    };

    if (!currentUser) {
        return <p>Bitte einloggen, um das Profil zu bearbeiten.</p>;
    }

    return (
        <div className="profile-edit-container">
            <h3>Profil bearbeiten</h3>
            <form onSubmit={handleSubmitProfile} className="profile-form">
                <div className="form-group">
                    <label htmlFor="firstName">Vorname</label>
                    <input
                        type="text"
                        className="form-control"
                        name="firstName"
                        id="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="lastName">Nachname</label>
                    <input
                        type="text"
                        className="form-control"
                        name="lastName"
                        id="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="phoneNumber">Telefonnummer</label>
                    <input
                        type="tel"
                        className="form-control"
                        name="phoneNumber"
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                    />
                </div>
                {/* E-Mail kann hier nicht geändert werden, da sie als Benutzername dient */}
                {message && (
                    <div className="form-group">
                        <div className="alert alert-info" role="alert"> {/* Oder alert-danger bei Fehler */}
                            {message}
                        </div>
                    </div>
                )}
                <div className="form-group">
                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? <span>Wird gespeichert...</span> : 'Profil speichern'}
                    </button>
                </div>
            </form>

            <hr className="my-4" />

            <h3>Passwort ändern</h3>
            <form onSubmit={handleSubmitPassword} className="password-form">
                <div className="form-group">
                    <label htmlFor="currentPassword">Aktuelles Passwort</label>
                    <input
                        type="password"
                        className="form-control"
                        name="currentPassword"
                        id="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="newPassword">Neues Passwort</label>
                    <input
                        type="password"
                        className="form-control"
                        name="newPassword"
                        id="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength="6"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="confirmNewPassword">Neues Passwort bestätigen</label>
                    <input
                        type="password"
                        className="form-control"
                        name="confirmNewPassword"
                        id="confirmNewPassword"
                        value={passwordData.confirmNewPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength="6"
                    />
                </div>
                {passwordMessage && (
                    <div className="form-group">
                        <div className="alert alert-info" role="alert"> {/* Oder alert-danger bei Fehler */}
                            {passwordMessage}
                        </div>
                    </div>
                )}
                <div className="form-group">
                    <button type="submit" className="btn btn-primary btn-block" disabled={passwordLoading}>
                        {passwordLoading ? <span>Wird geändert...</span> : 'Passwort ändern'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileEditForm;