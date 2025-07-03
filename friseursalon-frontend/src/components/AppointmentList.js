// src/components/AppointmentList.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.service';
import styles from './AppointmentList.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarCheck, faSpinner, faExclamationTriangle, faStar, faEdit, faTrashAlt,
    faClock, faCalendarPlus, faRedo, faPhone, faStickyNote, faUserPlus, faCheckCircle,
    faTimesCircle, faCalendarDay, faCalendarWeek, faTasks, faSyncAlt, faSearch
} from '@fortawesome/free-solid-svg-icons';
import { format, parseISO, isPast, isFuture, isToday, endOfWeek, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { generateICS } from '../utils/ics';

import AppointmentEditModal from './AppointmentEditModal';
import ConfirmModal from './ConfirmModal';
import TestimonialSubmitModal from './TestimonialSubmitModal';

// Hilfsfunktion zur Formatierung des Countdowns
const formatCountdown = (dateString) => {
    const date = parseISO(dateString);
    if (!isFuture(date)) return "Vergangen";
    const days = differenceInDays(date, new Date());
    if (days > 1) return `in ${days} Tagen`;
    if (days === 1) return `Morgen um ${format(date, 'HH:mm')} Uhr`;
    return `Heute um ${format(date, 'HH:mm')} Uhr`;
};

const statusLabels = {
    CONFIRMED: 'Bestätigt',
    COMPLETED: 'Abgeschlossen',
    CANCELLED: 'Storniert'
};

// --- Eigene Komponenten für Action-Buttons zur klaren Trennung ---
const UserActions = ({ appointment, onAction }) => {
    const navigate = useNavigate();
    const isUpcoming = isFuture(parseISO(appointment.startTime));

    const bookAgain = (service) => {
        if (service && service.name) navigate(`/buchen?service=${service.id}`);
    };
    const addToCalendar = (app) => generateICS(app);

    if (isUpcoming) {
        return (
            <>
                <button onClick={() => addToCalendar(appointment)}><FontAwesomeIcon icon={faCalendarPlus} /> Zum Kalender</button>
                <button className={styles.cancelButton} onClick={() => onAction('cancel', appointment)}><FontAwesomeIcon icon={faTrashAlt} /> Stornieren</button>
            </>
        );
    }

    // Für vergangene Termine
    return (
        <>
            <button onClick={() => bookAgain(appointment.service)}><FontAwesomeIcon icon={faRedo} /> Erneut Buchen</button>
            {appointment.status === 'COMPLETED' && (!appointment.review ?
                    <button className={styles.reviewButton} onClick={() => onAction('review', appointment)}><FontAwesomeIcon icon={faStar} /> Bewerten</button>
                    : <span className={styles.reviewed}><FontAwesomeIcon icon={faCheckCircle}/> Bewertet</span>
            )}
        </>
    );
};

const AdminActions = ({ appointment, onAction, onStatusUpdate }) => {
    return (
        <>
            {appointment.status !== 'COMPLETED' && <button onClick={() => onStatusUpdate(appointment.id, 'COMPLETED')} className={styles.actionBtnSuccess} title="Als Abgeschlossen markieren"><FontAwesomeIcon icon={faCheckCircle}/></button>}
            {appointment.status !== 'CANCELLED' && <button onClick={() => onStatusUpdate(appointment.id, 'CANCELLED')} className={styles.actionBtnDanger} title="Als 'Nicht erschienen' markieren"><FontAwesomeIcon icon={faTimesCircle}/></button>}
            <button onClick={() => onAction('edit', appointment)} className={styles.actionBtnDefault} title="Termin bearbeiten"><FontAwesomeIcon icon={faEdit}/></button>
        </>
    );
};


function AppointmentList({ adminView = false, refreshTrigger, onAppointmentAction }) {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [adminTab, setAdminTab] = useState('today');
    const [modal, setModal] = useState({ type: null, data: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const url = adminView ? 'appointments' : 'appointments/my-appointments';
            const { data } = await api.get(url);
            const sorted = (data || []).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            setAppointments(sorted);
        } catch (err) {
            setError(err.response?.data?.message || "Termine konnten nicht geladen werden.");
        } finally {
            setLoading(false);
        }
    }, [adminView]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments, refreshTrigger]);

    const handleAction = (type, data) => setModal({ type, data });
    const handleCloseModal = () => setModal({ type: null, data: null });

    const handleSaveAndRefresh = () => {
        handleCloseModal();
        fetchAppointments();
        if (onAppointmentAction) onAppointmentAction();
    };

    const handleConfirmCancel = async () => {
        if (!modal.data) return;
        try {
            await api.delete(`appointments/${modal.data.id}`);
            handleSaveAndRefresh();
        } catch (err) {
            setError(err.response?.data?.message || "Fehler beim Stornieren.");
            handleCloseModal();
        }
    };

    const updateAppointmentStatus = async (id, status) => {
        try {
            await api.patch(`/appointments/${id}/status`, { status });
            fetchAppointments();
        } catch (error) {
            setError("Status konnte nicht aktualisiert werden.");
        }
    };

    if (loading) return <div className={styles.centeredMessage}><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Lade Termine...</p></div>;
    if (error) return <div className={`${styles.message} ${styles.error}`}><FontAwesomeIcon icon={faExclamationTriangle} /> {error}</div>;

    const renderEmptyState = (view) => (
        <div className={styles.centeredMessage}>
            <FontAwesomeIcon icon={faCalendarCheck} size="3x" />
            <h3>{view === 'user' ? 'Keine Termine' : 'Keine anstehenden Termine'}</h3>
            <p>{view === 'user' ? 'Sie haben aktuell keine gebuchten Termine.' : `Für den Zeitraum "${adminTab}" gibt es keine Einträge.`}</p>
        </div>
    );

    // --- USER VIEW ---
    const renderUserView = () => {
        const upcoming = appointments.filter(app => isFuture(parseISO(app.startTime)));
        const past = appointments.filter(app => isPast(parseISO(app.startTime))).reverse();
        return (
            <div className={styles.viewContainer}>
                {upcoming.length > 0 && <h2 className={styles.viewTitle}>Anstehende Termine</h2>}
                {upcoming.length === 0 && past.length === 0 && renderEmptyState('user')}
                <div className={styles.cardGrid}>
                    {upcoming.map(app => (
                        <div key={app.id} className={styles.glassCard}>
                            <div className={styles.cardHeader}>
                                <h3>{app.service?.name}</h3>
                                <span className={styles.countdown}>{formatCountdown(app.startTime)}</span>
                            </div>
                            <div className={styles.cardDetails}>
                                <span>{format(parseISO(app.startTime), 'EEEE, dd. MMMM yy', { locale: de })}</span>
                                <span><FontAwesomeIcon icon={faClock} /> {app.service?.durationMinutes} min &bull; {app.service?.price?.toFixed(2)} €</span>
                                <span className={`${styles.statusBadge} ${styles[app.status.toLowerCase()]}`}>{statusLabels[app.status]}</span>
                            </div>
                            <div className={styles.cardActions}>
                                <UserActions appointment={app} onAction={handleAction} />
                            </div>
                        </div>
                    ))}
                </div>
                {past.length > 0 && <h2 className={`${styles.viewTitle} ${styles.pastHeader}`}>Vergangene Termine</h2>}
                <div className={styles.cardGrid}>
                    {past.map(app => (
                        <div key={app.id} className={`${styles.glassCard} ${styles.pastCard}`}>
                            <div className={styles.cardHeader}>
                                <h3>{app.service?.name}</h3>
                                <span>{format(parseISO(app.startTime), 'dd.MM.yyyy', { locale: de })}</span>
                            </div>
                            <div className={styles.cardDetails}>
                                <span className={`${styles.statusBadge} ${styles[app.status.toLowerCase()]}`}>{statusLabels[app.status]}</span>
                            </div>
                            <div className={styles.cardActions}>
                                <UserActions appointment={app} onAction={handleAction} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- ADMIN VIEW ---
    const renderAdminView = () => {
        const now = new Date();
        const endOfWeekDate = endOfWeek(now, { weekStartsOn: 1 });

        let filteredAppointments = appointments.filter(app => {
            const appDate = parseISO(app.startTime);
            if (adminTab === 'today') return isToday(appDate);
            if (adminTab === 'week') return appDate >= now && appDate <= endOfWeekDate && isFuture(appDate);
            return isFuture(appDate);
        });

        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filteredAppointments = filteredAppointments.filter(app =>
                (app.customer?.firstName?.toLowerCase().includes(search) ||
                 app.customer?.lastName?.toLowerCase().includes(search) ||
                 app.service?.name?.toLowerCase().includes(search))
            );
        }

        if (statusFilter !== 'ALL') {
            filteredAppointments = filteredAppointments.filter(app => app.status === statusFilter);
        }

        return (
            <div className={styles.viewContainer}>
                <div className={styles.adminControls}>
                    <div className={styles.searchWrapper}>
                        <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Suchen..."
                            className={styles.searchInput}
                        />
                    </div>
                    <select className={styles.statusFilter} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="ALL">Alle</option>
                        <option value="CONFIRMED">Bestätigt</option>
                        <option value="COMPLETED">Abgeschlossen</option>
                        <option value="CANCELLED">Storniert</option>
                    </select>
                    <button className={styles.refreshButton} onClick={fetchAppointments} title="Liste aktualisieren" disabled={loading}>
                        <FontAwesomeIcon icon={loading ? faSpinner : faSyncAlt} spin={loading} />
                    </button>
                </div>
                <div className={styles.adminTabs}>
                    <button onClick={() => setAdminTab('today')} className={adminTab === 'today' ? styles.activeTab : ''}><FontAwesomeIcon icon={faCalendarDay}/> Heute</button>
                    <button onClick={() => setAdminTab('week')} className={adminTab === 'week' ? styles.activeTab : ''}><FontAwesomeIcon icon={faCalendarWeek}/> Diese Woche</button>
                    <button onClick={() => setAdminTab('all')} className={adminTab === 'all' ? styles.activeTab : ''}><FontAwesomeIcon icon={faTasks}/> Alle anstehenden</button>
                </div>
                <div className={styles.adminList}>
                    {filteredAppointments.length === 0 ? renderEmptyState('admin') : filteredAppointments.map(app => (
                        <div key={app.id} className={styles.adminRow}>
                            <div className={styles.adminTime}>{format(parseISO(app.startTime), 'HH:mm')}</div>
                            <div className={styles.adminCustomer}>
                                {app.customer?.firstName} {app.customer?.lastName}
                                <span className={styles.customerIcons}>
                                     {app.isNewCustomer && <FontAwesomeIcon icon={faUserPlus} title="Neukunde"/>}
                                    {app.notes && <FontAwesomeIcon icon={faStickyNote} title={app.notes}/>}
                                 </span>
                            </div>
                            <div className={styles.adminService}>{app.service?.name}</div>
                            <div className={styles.adminContact}><FontAwesomeIcon icon={faPhone}/> {app.customer?.phoneNumber || '-'}</div>
                            <div className={styles.adminStatus}><span className={`${styles.statusBadge} ${styles[app.status.toLowerCase()]}`}>{statusLabels[app.status]}</span></div>
                            <div className={styles.adminActions}>
                                <AdminActions appointment={app} onAction={handleAction} onStatusUpdate={updateAppointmentStatus} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.pageWrapper}>
            {adminView ? renderAdminView() : renderUserView()}
            <AppointmentEditModal isOpen={modal.type === 'edit'} onClose={handleCloseModal} onSave={handleSaveAndRefresh} appointmentData={modal.data} adminView={adminView}/>
            <ConfirmModal isOpen={modal.type === 'cancel'} onClose={handleCloseModal} onConfirm={handleConfirmCancel} title="Termin stornieren" message="Möchten Sie diesen Termin wirklich stornieren? Dies kann nicht rückgängig gemacht werden."/>
            <TestimonialSubmitModal isOpen={modal.type === 'review'} onClose={handleCloseModal} onSubmitted={handleSaveAndRefresh} appointment={modal.data}/>
        </div>
    );
}

export default AppointmentList;