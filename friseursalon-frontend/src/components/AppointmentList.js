// src/components/AppointmentList.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.service';
import styles from './AppointmentList.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarCheck, faSpinner, faExclamationTriangle, faStar, faEdit, faTrashAlt,
    faClock, faCalendarPlus, faRedo, faUser, faChevronDown, faSearch,
    faSort, faSortUp, faSortDown, faCheckCircle, faTimesCircle, faEllipsisV
} from '@fortawesome/free-solid-svg-icons';
import { format, parseISO, isPast, isFuture, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { generateICS } from '../utils/ics';

import AppointmentEditModal from './AppointmentEditModal';
import ConfirmModal from './ConfirmModal';
import TestimonialSubmitModal from './TestimonialSubmitModal';

const ROWS_PER_PAGE = 10;

// Hilfsfunktion, um Statusinformationen zu erhalten
const getStatusInfo = (status) => {
    switch (status) {
        case 'CONFIRMED':
            return { text: 'Bestätigt', className: styles.statusConfirmed, icon: faCheckCircle };
        case 'COMPLETED':
            return { text: 'Abgeschlossen', className: styles.statusCompleted, icon: faCheckCircle };
        case 'CANCELLED':
            return { text: 'Storniert', className: styles.statusCancelled, icon: faTimesCircle };
        default:
            return { text: 'Ausstehend', className: styles.statusPending, icon: faClock };
    }
};

// Hauptkomponente
function AppointmentList({ adminView = false, refreshTrigger, onAppointmentAction }) {
    const [allAppointments, setAllAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState({ type: null, data: null });
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'startTime', direction: 'descending' });
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    // Abrufen der Termine vom Backend
    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const url = adminView ? 'appointments/sorted' : 'appointments/my-appointments';
            const { data } = await api.get(url);
            setAllAppointments(data || []);
        } catch (err) {
            setError(err.response?.data?.message || "Termine konnten nicht geladen werden.");
        } finally {
            setLoading(false);
        }
    }, [adminView]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments, refreshTrigger]);

    // Memoized-Funktion für das Sortieren und Filtern der Termine
    const sortedAndFilteredAppointments = useMemo(() => {
        let sortableItems = [...allAppointments];

        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            sortableItems = sortableItems.filter(item => {
                return (
                    item.customer?.firstName?.toLowerCase().includes(lowercasedFilter) ||
                    item.customer?.lastName?.toLowerCase().includes(lowercasedFilter) ||
                    item.service?.name?.toLowerCase().includes(lowercasedFilter)
                );
            });
        }

        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let valA, valB;

                switch (sortConfig.key) {
                    case 'customer':
                        valA = `${a.customer?.lastName} ${a.customer?.firstName}`.toLowerCase();
                        valB = `${b.customer?.lastName} ${b.customer?.firstName}`.toLowerCase();
                        break;
                    case 'service':
                        valA = a.service?.name?.toLowerCase();
                        valB = b.service?.name?.toLowerCase();
                        break;
                    default:
                        valA = a[sortConfig.key];
                        valB = b[sortConfig.key];
                }

                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        return sortableItems;
    }, [allAppointments, searchTerm, sortConfig]);

    useEffect(() => {
        setFilteredAppointments(sortedAndFilteredAppointments);
        setCurrentPage(1);
    }, [sortedAndFilteredAppointments]);


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

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return faSort;
        return sortConfig.direction === 'ascending' ? faSortUp : faSortDown;
    };

    const paginatedAppointments = filteredAppointments.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);
    const totalPages = Math.ceil(filteredAppointments.length / ROWS_PER_PAGE);

    if (loading) return <div className={styles.centeredMessage}><FontAwesomeIcon icon={faSpinner} spin size="2x" /><p>Lade Termine...</p></div>;
    if (error) return <div className={`${styles.message} ${styles.error}`}><FontAwesomeIcon icon={faExclamationTriangle} /> {error}</div>;

    const renderEmptyState = (view) => (
        <div className={styles.emptyState}>
            <FontAwesomeIcon icon={faCalendarCheck} />
            <h3>{view === 'user' ? 'Keine Termine gefunden' : 'Keine Termine für diese Ansicht'}</h3>
            <p>{view === 'user' ? 'Sie haben aktuell keine gebuchten Termine.' : 'Passen Sie Ihre Filter an oder legen Sie einen neuen Termin an.'}</p>
            {!adminView && <button onClick={() => navigate('/buchen')} className={styles.primaryButton}>Jetzt Termin buchen</button>}
        </div>
    );

    const renderUserView = () => {
        const upcoming = filteredAppointments.filter(app => isFuture(parseISO(app.startTime)) && app.status !== 'CANCELLED');
        const past = filteredAppointments.filter(app => isPast(parseISO(app.startTime)) || app.status === 'CANCELLED');

        return (
            <div className={styles.userViewContainer}>
                <h1 className={styles.pageTitle}>Meine Termine</h1>
                {upcoming.length > 0 && <h2 className={styles.sectionTitle}>Anstehend</h2>}
                {upcoming.length === 0 && past.length === 0 && renderEmptyState('user')}
                <div className={styles.cardGrid}>
                    {upcoming.map(app => <AppointmentCard key={app.id} appointment={app} onAction={handleAction} />)}
                </div>

                {past.length > 0 && <h2 className={`${styles.sectionTitle} ${styles.pastTitle}`}>Vergangen & Storniert</h2>}
                <div className={styles.cardGrid}>
                    {past.map(app => <AppointmentCard key={app.id} appointment={app} onAction={handleAction} isPast />)}
                </div>
            </div>
        );
    };

    const renderAdminView = () => (
        <div className={styles.adminViewContainer}>
            <div className={styles.adminHeader}>
                <h1 className={styles.pageTitle}>Terminverwaltung</h1>
                <div className={styles.searchContainer}>
                    <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Kunde oder Service suchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            </div>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                    <tr>
                        <th onClick={() => requestSort('customer')}>Kunde <FontAwesomeIcon icon={getSortIcon('customer')} /></th>
                        <th onClick={() => requestSort('service')}>Service <FontAwesomeIcon icon={getSortIcon('service')} /></th>
                        <th onClick={() => requestSort('startTime')}>Datum & Zeit <FontAwesomeIcon icon={getSortIcon('startTime')} /></th>
                        <th onClick={() => requestSort('status')}>Status <FontAwesomeIcon icon={getSortIcon('status')} /></th>
                        <th>Aktionen</th>
                    </tr>
                    </thead>
                    <tbody>
                    {paginatedAppointments.length > 0 ? paginatedAppointments.map(app => (
                        <tr key={app.id}>
                            <td>
                                <div className={styles.customerCell}>
                                    <div className={styles.avatar}>{app.customer.firstName.charAt(0)}{app.customer.lastName.charAt(0)}</div>
                                    <div>
                                        <div className={styles.customerName}>{app.customer.firstName} {app.customer.lastName}</div>
                                        <div className={styles.customerEmail}>{app.customer.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td>{app.service.name}</td>
                            <td>{format(parseISO(app.startTime), 'dd.MM.yy, HH:mm', { locale: de })} Uhr</td>
                            <td>
                                    <span className={`${styles.statusBadge} ${getStatusInfo(app.status).className}`}>
                                        <FontAwesomeIcon icon={getStatusInfo(app.status).icon} />
                                        {getStatusInfo(app.status).text}
                                    </span>
                            </td>
                            <td>
                                <div className={styles.actionCell}>
                                    <button onClick={() => handleAction('edit', app)} className={styles.actionButton} title="Bearbeiten">
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="5">{renderEmptyState('admin')}</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Zurück</button>
                    <span>Seite {currentPage} von {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Weiter</button>
                </div>
            )}
        </div>
    );

    return (
        <>
            {adminView ? renderAdminView() : renderUserView()}
            <AppointmentEditModal isOpen={modal.type === 'edit'} onClose={handleCloseModal} onSave={handleSaveAndRefresh} appointmentData={modal.data} adminView={adminView} />
            <ConfirmModal isOpen={modal.type === 'cancel'} onClose={handleCloseModal} onConfirm={handleConfirmCancel} title="Termin stornieren" message="Möchten Sie diesen Termin wirklich stornieren? Dies kann nicht rückgängig gemacht werden." />
            <TestimonialSubmitModal isOpen={modal.type === 'review'} onClose={handleCloseModal} onSubmitted={handleSaveAndRefresh} appointment={modal.data} />
        </>
    );
}

// Sub-Komponente für die Benutzeransicht-Karten
const AppointmentCard = ({ appointment, onAction, isPast = false }) => {
    const status = getStatusInfo(appointment.status);
    const countdown = isFuture(parseISO(appointment.startTime)) ? differenceInDays(parseISO(appointment.startTime), new Date()) : -1;

    return (
        <div className={`${styles.appointmentCard} ${isPast ? styles.pastCard : ''}`}>
            <div className={styles.cardHeader}>
                <span className={`${styles.statusBadge} ${status.className}`}>
                    <FontAwesomeIcon icon={status.icon} />
                    {status.text}
                </span>
                {!isPast && countdown >= 0 && (
                    <span className={styles.countdown}>
                        {countdown === 0 ? 'Heute' : `in ${countdown + 1} Tagen`}
                    </span>
                )}
            </div>
            <div className={styles.cardBody}>
                <h3 className={styles.serviceName}>{appointment.service.name}</h3>
                <p className={styles.dateTime}>
                    <FontAwesomeIcon icon={faCalendarCheck} />
                    {format(parseISO(appointment.startTime), 'EEEE, dd. MMMM yyyy', { locale: de })}
                </p>
                <p className={styles.dateTime}>
                    <FontAwesomeIcon icon={faClock} />
                    {format(parseISO(appointment.startTime), 'HH:mm', { locale: de })} Uhr
                </p>
            </div>
            <div className={styles.cardFooter}>
                <UserActions appointment={appointment} onAction={onAction} />
            </div>
        </div>
    );
};

// Sub-Komponente für die Benutzer-Aktionen
const UserActions = ({ appointment, onAction }) => {
    const navigate = useNavigate();
    const isUpcoming = isFuture(parseISO(appointment.startTime)) && appointment.status !== 'CANCELLED';

    const bookAgain = (service) => {
        if (service && service.id) navigate(`/buchen?service=${service.id}`);
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

export default AppointmentList;
