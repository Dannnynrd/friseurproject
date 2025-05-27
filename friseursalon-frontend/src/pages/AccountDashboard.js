import React, { useState, useEffect } from 'react';
import "./AccountDashboard.css"
import AppointmentList from '../components/AppointmentList';
import ServiceForm from '../components/ServiceForm';
import ServiceList from '../components/ServiceList';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClipboardList, faUserCog, faTools, faSignOutAlt,
    faChevronRight, faChevronDown, faPlusCircle, faMinusCircle,
    faChartBar, faUser, faTimesCircle, faEdit, faSave, faTimes // For profile edit
} from '@fortawesome/free-solid-svg-icons';
import api from '../services/api.service'; // Import api service
import authService from '../services/auth.service'; // Import auth service


// ... (Der Rest des Codes aus meiner vorherigen Antwort, in der wir die Navigation überarbeitet haben)
// Stelle sicher, dass du den gesamten Code aus der vorherigen Antwort hier hast.
// Ich füge ihn hier zur Vollständigkeit noch einmal ein:

function AccountDashboard({ currentUser, logOut, onAppointmentAdded, refreshAppointmentsList, onServiceAdded, refreshServicesList }) {
    const initialTab = currentUser?.roles?.includes("ROLE_ADMIN") ? 'adminServices' : 'bookings';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 992);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const [showServiceForm, setShowServiceForm] = useState(false);
    const [isSubmittingService, setIsSubmittingService] = useState(false);

    // State for profile editing
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileFormData, setProfileFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: ''
    });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');
    
    // Local copy of currentUser to reflect updates immediately if prop is not directly mutable
    const [internalCurrentUser, setInternalCurrentUser] = useState(currentUser);

    useEffect(() => {
        setInternalCurrentUser(currentUser); // Sync with prop
        if (currentUser) {
            setProfileFormData({
                firstName: currentUser.firstName || '',
                lastName: currentUser.lastName || '',
                phoneNumber: currentUser.phoneNumber || ''
            });
        }
    }, [currentUser]);


    const isAdmin = currentUser && currentUser.roles && currentUser.roles.includes("ROLE_ADMIN");

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 992;
            setIsMobileView(mobile);
            if (!mobile) setMobileNavOpen(false);
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Initialer Check beim Laden
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Beim Benutzerwechsel den initialen Tab setzen und Service-Formular ausblenden
        setActiveTab(internalCurrentUser?.roles?.includes("ROLE_ADMIN") ? 'adminServices' : 'bookings');
        setShowServiceForm(false);
        setIsEditingProfile(false); // Reset editing state on user change
         if (internalCurrentUser) {
            setProfileFormData({
                firstName: internalCurrentUser.firstName || '',
                lastName: internalCurrentUser.lastName || '',
                phoneNumber: internalCurrentUser.phoneNumber || ''
            });
        }
    }, [internalCurrentUser]);

    const handleServiceAddedCallback = () => {
        if (onServiceAdded) {
            onServiceAdded();
        }
        setShowServiceForm(false);
        setIsSubmittingService(false);
    };

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        if (tabName !== 'adminServices') { // Formular schließen, wenn anderer Tab gewählt wird
            setShowServiceForm(false);
        }
        if (isMobileView) {
            setMobileNavOpen(false); // Schließe mobiles Menü nach Klick
        }
    };


    const renderTabContent = (tabName) => {
        switch (tabName) {
            case 'bookings':
                return (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Meine Termine</h2>
                        <AppointmentList refreshTrigger={refreshAppointmentsList} currentUser={currentUser} />
                    </div>
                );
            case 'profile':
                return (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Meine Daten</h2>
                        {profileError && <div className="alert alert-danger">{profileError}</div>}
                        {profileSuccess && <div className="alert alert-success">{profileSuccess}</div>}

                        {!isEditingProfile ? (
                            <div className="dashboard-profile-info">
                                <p><strong>Vorname:</strong> {internalCurrentUser?.firstName || '-'}</p>
                                <p><strong>Nachname:</strong> {internalCurrentUser?.lastName || '-'}</p>
                                <p><strong>E-Mail:</strong> {internalCurrentUser?.email || '-'}</p>
                                <p><strong>Telefon:</strong> {internalCurrentUser?.phoneNumber || 'Nicht angegeben'}</p>
                                <p><strong>Rollen:</strong> {internalCurrentUser?.roles?.join(', ') || '-'}</p>
                                <button onClick={() => {
                                    setIsEditingProfile(true);
                                    setProfileError('');
                                    setProfileSuccess('');
                                }} className="button-primary edit-profile-button">
                                    <FontAwesomeIcon icon={faEdit} /> Bearbeiten
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleProfileUpdate} className="profile-edit-form">
                                <div className="form-group">
                                    <label htmlFor="firstName">Vorname</label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        className="form-control"
                                        value={profileFormData.firstName}
                                        onChange={handleProfileFormChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="lastName">Nachname</label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        className="form-control"
                                        value={profileFormData.lastName}
                                        onChange={handleProfileFormChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="phoneNumber">Telefonnummer</label>
                                    <input
                                        type="tel"
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        className="form-control"
                                        value={profileFormData.phoneNumber}
                                        onChange={handleProfileFormChange}
                                    />
                                </div>
                                <div className="profile-form-actions">
                                    <button type="submit" className="button-primary" disabled={profileLoading}>
                                        <FontAwesomeIcon icon={faSave} /> {profileLoading ? 'Speichern...' : 'Speichern'}
                                    </button>
                                    <button type="button" className="button-secondary" onClick={handleCancelEditProfile} disabled={profileLoading}>
                                        <FontAwesomeIcon icon={faTimes} /> Abbrechen
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                );
            case 'adminServices':
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <div className="dashboard-section-header-controls">
                            <h2 className="dashboard-section-heading">Dienstleistungen verwalten</h2>
                            <button
                                onClick={() => setShowServiceForm(!showServiceForm)}
                                className="button-link-outline toggle-service-form-button" // Nutzt globale Button-Stile
                                aria-expanded={showServiceForm}
                            >
                                <FontAwesomeIcon icon={showServiceForm ? faMinusCircle : faPlusCircle} />
                                {showServiceForm ? 'Formular schließen' : 'Neuen Service hinzufügen'}
                            </button>
                        </div>
                        {showServiceForm && (
                            <div className="service-form-wrapper">
                                <ServiceForm
                                    onServiceAdded={handleServiceAddedCallback}
                                    setIsSubmitting={setIsSubmittingService}
                                    isSubmitting={isSubmittingService}
                                />
                            </div>
                        )}
                        <hr className="dashboard-section-hr" />
                        <ServiceList key={refreshServicesList} currentUser={currentUser} />
                    </div>
                );
            case 'adminAnalytics':
                return isAdmin && (
                    <div className="dashboard-section-content">
                        <h2 className="dashboard-section-heading">Analysen</h2>
                        <p className="text-center text-gray-600 py-4">Dieser Bereich ist in Entwicklung.</p>
                    </div>
                );
            default:
                // Fallback, falls kein Tab aktiv ist (sollte nicht oft vorkommen)
                if (isAdmin) return renderTabContent('adminServices');
                return renderTabContent('bookings');
    };
    
    const handleProfileFormChange = (e) => {
        const { name, value } = e.target;
        setProfileFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCancelEditProfile = () => {
        setIsEditingProfile(false);
        setProfileError('');
        setProfileSuccess('');
        // Reset form data to current user's data
        if (internalCurrentUser) {
            setProfileFormData({
                firstName: internalCurrentUser.firstName || '',
                lastName: internalCurrentUser.lastName || '',
                phoneNumber: internalCurrentUser.phoneNumber || ''
            });
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileError('');
        setProfileSuccess('');

        try {
            const updatedUserData = await api.updateUserProfile(profileFormData);
            setProfileSuccess('Profil erfolgreich aktualisiert!');
            setIsEditingProfile(false);
            // Update internalCurrentUser to reflect changes immediately in the UI
            // authService.getCurrentUser() will also return the updated user from localStorage
            const refreshedUserFromStorage = authService.getCurrentUser();
            if(refreshedUserFromStorage){
                 setInternalCurrentUser(refreshedUserFromStorage);
            } else {
                 // Fallback if local storage update wasn't immediate or failed
                 setInternalCurrentUser(prev => ({...prev, ...updatedUserData}));
            }
           

            // If an onProfileUpdate prop was available, we'd call it here:
            // onProfileUpdate(updatedUserData); 
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Fehler beim Aktualisieren des Profils.";
            setProfileError(errorMsg);
        } finally {
            setProfileLoading(false);
        }
    };


    const renderNavItem = (tabName, icon, label) => (
        <li key={tabName} className="dashboard-nav-item">
            <button
                onClick={() => handleTabClick(tabName)}
                className={`dashboard-nav-button ${activeTab === tabName ? 'active' : ''}`}
            >
                <FontAwesomeIcon icon={icon} fixedWidth /> <span>{label}</span>
            </button>
        </li>
    );


    if (!internalCurrentUser) {
        return <p>Laden...</p>; // Einfache Ladeanzeige
    }

    const DesktopNav = () => (
        <aside className="dashboard-sidebar">
            <nav>
                <ul>
                    <li className="nav-category-title">Mein Bereich</li>
                    {renderNavItem('bookings', faClipboardList, 'Meine Termine')}
                    {renderNavItem('profile', faUser, 'Meine Daten')}

                    {isAdmin && (
                        <>
                            <li className="nav-category-title mt-4">Verwaltung</li>
                            {renderNavItem('adminServices', faTools, 'Services')}
                            {renderNavItem('adminAnalytics', faChartBar, 'Analysen')}
                        </>
                    )}
                    <li className="dashboard-nav-item logout-button-container">
                        <button onClick={logOut} className="dashboard-nav-button logout-button">
                            <FontAwesomeIcon icon={faSignOutAlt} fixedWidth /> <span>Abmelden</span>
                        </button>
                    </li>
                </ul>
            </nav>
        </aside>
    );

    const MobileNav = () => (
        <div className={`mobile-dashboard-nav ${mobileNavOpen ? 'open' : ''}`} id="mobile-dashboard-navigation">
            <button className="mobile-nav-close-button" onClick={() => setMobileNavOpen(false)}>
                <FontAwesomeIcon icon={faTimesCircle} /> Menü schließen
            </button>
            <nav>
                <ul>
                    <li className="nav-category-title">Mein Bereich</li>
                    {renderNavItem('bookings', faClipboardList, 'Meine Termine')}
                    {renderNavItem('profile', faUser, 'Meine Daten')}

                    {isAdmin && (
                        <>
                            <li className="nav-category-title mt-4">Verwaltung</li>
                            {renderNavItem('adminServices', faTools, 'Services')}
                            {renderNavItem('adminAnalytics', faChartBar, 'Analysen')}
                        </>
                    )}
                    <li className="dashboard-nav-item logout-button-container">
                        <button onClick={() => { logOut(); setMobileNavOpen(false); }} className="dashboard-nav-button logout-button">
                            <FontAwesomeIcon icon={faSignOutAlt} fixedWidth /> <span>Abmelden</span>
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );

    return (
        <div className="account-dashboard-container">
            <div className="container">
                <div className="dashboard-header">
                    <h1 className="dashboard-main-heading">Mein Account</h1>
                    {isMobileView && (
                        <button
                            className="mobile-nav-toggle-button button-link-outline small-button" // Globale Button-Klassen
                            onClick={() => setMobileNavOpen(true)}
                            aria-expanded={mobileNavOpen}
                            aria-controls="mobile-dashboard-navigation"
                        >
                            <FontAwesomeIcon icon={faChevronRight} /> Menü
                        </button>
                    )}
                </div>
                <p className="dashboard-welcome-message">
                    Hallo, {internalCurrentUser.firstName || internalCurrentUser.email}! Hier verwalten Sie Ihre Daten.
                </p>

                <div className="dashboard-layout">
                    {isMobileView ? <MobileNav /> : <DesktopNav />}

                    <section className="dashboard-content" aria-live="polite">
                        {renderTabContent(activeTab)}
                    </section>
                </div>
            </div>
        </div>
    );
}

export default AccountDashboard;