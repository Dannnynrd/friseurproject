// src/components/AppointmentList.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.service';
import styles from './AppointmentList.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarCheck, faSpinner, faExclamationTriangle, faStar, faEdit, faTrashAlt,
    faClock, faCalendarPlus, faRedo, faUser, faEuroSign, faCut, faSlidersH, faSearch, faTimesCircle,
    faChevronDown, faCalendarDay
} from '@fortawesome/free-solid-svg-icons';
import { format, parseISO, isPast, isFuture, isToday, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { generateICS } from '../utils/ics';

import AppointmentEditModal from './AppointmentEditModal';
import ConfirmModal from './ConfirmModal';
import TestimonialSubmitModal from './TestimonialSubmitModal';


// --- Kleine, logische Sub-Komponenten für maximale Übersichtlichkeit ---

const StatusBadge = ({ status }) => {
    // BUGFIX: Fängt unbekannte Statuswerte ab und verhindert "Unbekannt"-Anzeige
    const config = useMemo(() => ({
        CONFIRMED: { label: 'Bestätigt', className: styles.statusConfirmed },
        COMPLETED: { label: 'Abgeschlossen', className: styles.statusCompleted },
        CANCELLED: { label: 'Storniert', className: styles.statusCancelled },
        PENDING: { label: 'Ausstehend', className: styles.statusPending }
    }), [])[status] || { label: 'Ausstehend', className: styles.statusPending };

    return <span className={`${styles.statusBadge} ${config.className}`}>{config.label}</span>;
};

const AppointmentCard = ({ appointment, onAction, isAdmin }) => {
    const navigate = useNavigate();
    const { id, service, startTime, status, customer } = appointment;
    const date = parseISO(startTime);

    const handleBookAgain = () => service && navigate(`/buchen?service=${service.id}`);
    const handleAddToCalendar = () => generateICS(appointment);

    const isUpcoming = isFuture(date) && status !== 'CANCELLED';

    // Logik für die primäre und sekundäre Aktion des Kunden
    const primaryUserAction = isUpcoming ?
        { label: 'Zum Kalender', icon: faCalendarPlus, handler: handleAddToCalendar } :
        { label: 'Erneut Buchen', icon: faRedo, handler: handleBookAgain };

    const secondaryUserAction = isUpcoming ?
        { label: 'Stornieren', icon: faTrashAlt, handler: () => onAction('cancel', appointment) } :
        (status === 'COMPLETED' && !appointment.reviewSubmitted) ?
            { label: 'Bewerten', icon: faStar, handler: () => onAction('review', appointment) } : null;

    return (
        <div className={styles.card}>
            {/* Kopfzeile der Karte */}
            <div className={styles.cardHeader}>
                <div className={styles.timeInfo}>
                    <span className={styles.time}>{format(date, 'HH:mm')} Uhr</span>
                    <span className={styles.date}>{format(date, 'dd. MMMM', { locale: de })}</span>
                </div>
                {isAdmin ? (
                    <div className={styles.adminCustomerInfo}>
                        <p>{customer?.firstName} {customer?.lastName}</p>
                        <span>{service.name}</span>
                    </div>
                ) : (
                    <div className={styles.serviceInfo}>
                        <p>{service?.name}</p>
                        <span>{service?.durationMinutes} min · {service?.price.toFixed(2)}€</span>
                    </div>
                )}
            </div>

            {/* Fußzeile mit Status und Aktionen */}
            <div className={styles.cardFooter}>
                <StatusBadge status={status} />
                <div className={styles.actions}>
                    {isAdmin ? (
                        <>
                            <button onClick={() => onAction('edit', appointment)} className={styles.iconButton} title="Bearbeiten"><FontAwesomeIcon icon={faEdit} /></button>
                            {status !== 'CANCELLED' && <button onClick={() => onAction('cancel', appointment)} className={`${styles.iconButton} ${styles.danger}`} title="Stornieren"><FontAwesomeIcon icon={faTrashAlt} /></button>}
                        </>
                    ) : (
                        <>
                            {secondaryUserAction && <button onClick={secondaryUserAction.handler} className={styles.secondaryButton}><FontAwesomeIcon icon={secondaryUserAction.icon} /></button>}
                            <button onClick={primaryUserAction.handler} className={styles.primaryButton}>
                                <FontAwesomeIcon icon={primaryUserAction.icon} />
                                <span>{primaryUserAction.label}</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};


function AppointmentList({ adminView = false }) {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState({ type: null, data: null });

    // Filter-Zustände
    const [searchTerm, setSearchTerm] = useState('');
    const [timeFilter, setTimeFilter] = useState('UPCOMING'); // UPCOMING oder ARCHIVED

    // Datenabruf
    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const url = adminView ? 'appointments' : 'appointments/my-appointments';
            const { data } = await api.get(url);
            setAppointments(data || []);
        } catch (err) {
            setError(err.response?.data?.message || "Termine konnten nicht geladen werden.");
        } finally {
            setLoading(false);
        }
    }, [adminView]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // Memoized Filtering & Sorting Logic
    const processedAppointments = useMemo(() => {
        const filtered = appointments.filter(app => {
            if (!adminView) return true; // Filterung nur für Admin-Ansicht

            const isArchived = isPast(parseISO(app.startTime)) || app.status === 'CANCELLED';
            if (timeFilter === 'UPCOMING' && isArchived) return false;
            if (timeFilter === 'ARCHIVED' && !isArchived) return false;

            const search = searchTerm.toLowerCase().trim();
            if (!search) return true;
            return (
                (app.customer?.firstName?.toLowerCase() || '').includes(search) ||
                (app.customer?.lastName?.toLowerCase() || '').includes(search) ||
                (app.service?.name?.toLowerCase() || '').includes(search)
            );
        });

        // Sortieren: Anstehende chronologisch, Archivierte umgekehrt
        return filtered.sort((a, b) => {
            const dateA = new Date(a.startTime);
            const dateB = new Date(b.startTime);
            return isPast(dateA) ? dateB - dateA : dateA - dateB;
        });
    }, [appointments, adminView, searchTerm, timeFilter]);

    // NEUE LOGIK: Termine für den User aufteilen
    const userAppointments = useMemo(() => {
        if (adminView) return {};
        const today = [];
        const upcoming = [];
        const archived = [];

        processedAppointments.forEach(app => {
            const date = parseISO(app.startTime);
            if(isPast(date) || app.status === 'CANCELLED') {
                archived.push(app)
            } else if (isToday(date)) {
                today.push(app);
            } else {
                upcoming.push(app);
            }
        });
        return { today, upcoming, archived };
    }, [processedAppointments, adminView]);


    // Modal-Handler
    const handleAction = (type, data) => setModal({ type, data });
    const handleCloseModal = () => setModal({ type: null, data: null });
    const handleSaveAndRefresh = () => { handleCloseModal(); fetchAppointments(); };
    const handleConfirmCancel = async () => {
        if (!modal.data) return;
        try { await api.delete(`appointments/${modal.data.id}`); handleSaveAndRefresh(); }
        catch (err) { setError(err.response?.data?.message || "Fehler."); handleCloseModal(); }
    };

    // Render-Zustände
    if (loading) return <div className={styles.centeredMessage}><FontAwesomeIcon icon={faSpinner} spin size="2x" /></div>;
    if (error) return <div className={styles.centeredMessage}><FontAwesomeIcon icon={faExclamationTriangle} /> {error}</div>;

    const renderEmptyState = (isFiltered) => (
        <div className={styles.centeredMessage}>
            <FontAwesomeIcon icon={faCalendarCheck} size="3x" className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>{isFiltered ? "Nichts gefunden" : "Keine Termine"}</h3>
            <p className={styles.emptyText}>
                {isFiltered ? "Ihre Suche oder Filterung ergab keine Treffer." : "Es sind aktuell keine Termine vorhanden."}
            </p>
        </div>
    );

    // --- RENDER-METHODEN FÜR USER UND ADMIN ---

    const UserView = () => (
        <>
            {userAppointments.today.length > 0 && (
                <section>
                    <h2 className={styles.sectionTitle}>Heute</h2>
                    <div className={styles.cardList}>
                        {userAppointments.today.map(app => <AppointmentCard key={app.id} appointment={app} onAction={handleAction} />)}
                    </div>
                </section>
            )}
            {userAppointments.upcoming.length > 0 && (
                <section>
                    <h2 className={styles.sectionTitle}>Demnächst</h2>
                    <div className={styles.cardList}>
                        {userAppointments.upcoming.map(app => <AppointmentCard key={app.id} appointment={app} onAction={handleAction} />)}
                    </div>
                </section>
            )}
            {userAppointments.archived.length > 0 && (
                <section>
                    <h2 className={styles.sectionTitle}>Archiv</h2>
                    <div className={styles.cardList}>
                        {userAppointments.archived.map(app => <AppointmentCard key={app.id} appointment={app} onAction={handleAction} />)}
                    </div>
                </section>
            )}
            {appointments.length === 0 && renderEmptyState(false)}
        </>
    );

    const AdminView = () => (
        <>
            <div className={styles.adminHeader}>
                <div className={styles.searchWrapper}>
                    <FontAwesomeIcon icon={faSearch} className={styles.controlIcon} />
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Suche..." className={styles.inputField} />
                </div>
                <div className={styles.tabs}>
                    <button onClick={() => setTimeFilter('UPCOMING')} className={timeFilter === 'UPCOMING' ? styles.activeTab : ''}>Anstehend</button>
                    <button onClick={() => setTimeFilter('ARCHIVED')} className={timeFilter === 'ARCHIVED' ? styles.activeTab : ''}>Archiv</button>
                </div>
            </div>

            {processedAppointments.length > 0 ? (
                <div className={styles.cardList}>
                    {processedAppointments.map(app => <AppointmentCard key={app.id} appointment={app} onAction={handleAction} isAdmin />)}
                </div>
            ) : renderEmptyState(true)}
        </>
    );
//
    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                {adminView ? <AdminView /> : <UserView />}
            </div>
            {modal.type && (
                <>
                    {modal.type === 'edit' && <AppointmentEditModal isOpen={true} onClose={handleCloseModal} onSave={handleSaveAndRefresh} appointmentData={modal.data} adminView={adminView} />}
                    {modal.type === 'cancel' && <ConfirmModal isOpen={true} onClose={handleCloseModal} onConfirm={handleConfirmCancel} title="Termin stornieren?" message="Diese Aktion kann nicht rückgängig gemacht werden." confirmButtonText="Ja, stornieren" icon={faTrashAlt} iconColorClass="text-red-500" />}
                    {modal.type === 'review' && <TestimonialSubmitModal isOpen={true} onClose={handleCloseModal} onSubmitted={handleSaveAndRefresh} appointment={modal.data} />}
                </>
            )}
        </div>
    );
}

export default AppointmentList;