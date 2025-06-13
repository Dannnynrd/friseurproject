import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import AuthService from '../services/auth.service';
import styles from './Login.module.css';

function Login({ onLoginSuccess }) {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const onSubmit = (data) => {
        setMessage('');
        setLoading(true);

        // Das Feld heißt intern 'username', um zum Backend zu passen,
        // obwohl der Benutzer seine E-Mail eingibt.
        AuthService.login(data.username, data.password).then(
            () => {
                onLoginSuccess();
            },
            (error) => {
                const resMessage =
                    (error.response &&
                        error.response.data &&
                        error.response.data.message) ||
                    error.message ||
                    error.toString();

                setLoading(false);
                setMessage('Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Zugangsdaten.');
            }
        );
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginWrapper}>
                <h1 className={styles.headline}>Willkommen zurück</h1>
                <p className={styles.subheadline}>Bitte melden Sie sich an, um auf Ihr Konto zuzugreifen.</p>

                <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
                    <div className={styles.inputGroup}>
                        {/* KORREKTUR: Fragt nach E-Mail, sendet aber als 'username' */}
                        <label htmlFor="email" className={styles.label}>E-Mail-Adresse</label>
                        <input
                            type="email"
                            id="email"
                            className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
                            // Das Feld wird als 'username' registriert
                            {...register('username', {
                                required: 'E-Mail-Adresse ist erforderlich',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Ungültige E-Mail-Adresse"
                                }
                            })}
                        />
                        {errors.username && <p className={styles.error}>{errors.username.message}</p>}
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>Passwort</label>
                        <input
                            type="password"
                            id="password"
                            className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                            {...register('password', { required: 'Passwort ist erforderlich' })}
                        />
                        {errors.password && <p className={styles.error}>{errors.password.message}</p>}
                    </div>

                    {message && (
                        <div className={styles.serverError}>
                            {message}
                        </div>
                    )}

                    <div className={styles.options}>
                        <Link to="/passwort-vergessen" className={styles.link}>
                            Passwort vergessen?
                        </Link>
                    </div>

                    <button type="submit" className={styles.submitButton} disabled={loading}>
                        {loading ? 'Anmelden...' : 'Sicher Anmelden'}
                    </button>

                    <div className={styles.footer}>
                        <p>Noch kein Konto? <Link to="/register" className={styles.link}>Jetzt registrieren</Link></p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;
