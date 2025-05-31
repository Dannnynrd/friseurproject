// friseursalon-frontend/src/components/AdminCalendarView.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours, addMinutes, parseISO } from 'date-fns';
import deLocale from 'date-fns/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../services/api.service';
import styles from './AdminCalendarView.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle, faCalendarPlus, faSyncAlt } from '@fortawesome/free-solid-svg-icons';

import AppointmentEditModal from './AppointmentEditModal';
import AppointmentCreateModal from './AppointmentCreateModal';

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1, locale: deLocale }), // Montag als Wochenstart
    getDay,
    locales: { 'de': deLocale },
});

const messages = {
    allDay: 'Ganztägig',
    previous: 'Zurück',
    next: 'Weiter',
    today: 'Heute',
    month: 'Monat',
    week: 'Woche',
    day: 'Tag',
    agenda: 'Agenda',
    date: 'Datum',
    time: 'Zeit',
    event: 'Termin', // Backend sendet 'Ereignis', aber Kalender verwendet 'Termin'
    noEventsInRange: 'Keine Termine in diesem Bereich.',
    showMore: total => `+ ${total} weitere`,
};

function AdminCalendarView({ onAppointmentAction, currentUser }) {
    // Removed 'appointments' state as 'events' already holds the transformed data for the calendar
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState(Views.WEEK);

    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedEventForEdit, setSelectedEventForEdit] = useState(null);
    const [selectedSlotForCreate, setSelectedSlotForCreate] = useState(null);

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Corrected API endpoint
            const response = await api.get('/api/appointments');
            const fetchedAppointments = response.data || [];
            // setAppointments(fetchedAppointments); // Not strictly needed if events are derived directly

            const calendarEvents = fetchedAppointments.map(apt => {
                const start = parseISO(apt.startTime);
                // Use service.durationMinutes from the nested service object
                const end = addMinutes(start, apt.service?.durationMinutes || 60); // Default to 60min if no duration
                return {
                    id: apt.id,
                    // Access nested properties for title
                    title: `${apt.service?.name || 'Service'} - ${apt.customer?.firstName || ''} ${apt.customer?.lastName || 'Kunde'}`,
                    start,
                    end,
                    allDay: false,
                    resource: apt, // Store the original appointment object
                    status: apt.status
                };
            });
            setEvents(calendarEvents);
        } catch (err) {
            console.error("Error fetching appointments for calendar:", err);
            setError(err.response?.data?.message || "Termine konnten nicht geladen werden.");
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments, onAppointmentAction]);

    const handleSelectEvent = (event) => {
        setSelectedEventForEdit(event.resource); // event.resource contains the full appointment object
        setShowEditModal(true);
    };

    const handleSelectSlot = ({ start, end, action }) => {
        if (action === 'click' && currentView === Views.MONTH) {
            setCurrentDate(start);
            setCurrentView(Views.DAY);
            return;
        }
        if (action === 'select' || (action === 'click' && currentView !== Views.MONTH)) {
            setSelectedSlotForCreate({ start, end, allDay: false });
            setShowCreateModal(true);
        }
    };

    const handleModalClose = () => {
        setShowEditModal(false);
        setShowCreateModal(false);
        setSelectedEventForEdit(null);
        setSelectedSlotForCreate(null);
    };

    const handleModalSave = () => {
        handleModalClose();
        fetchAppointments(); // Reload appointments after save
        if (typeof onAppointmentAction === 'function') {
            onAppointmentAction();
        }
    };

    const eventStyleGetter = (event, start, end, isSelected) => {
        let backgroundColor = '#3174ad'; // Default blue
        let borderColor = '#25567b';
        const status = event.resource?.status; // Status from the original appointment object

        if (status === 'CONFIRMED') {
            backgroundColor = 'var(--success-color, #28a745)';
            borderColor = 'var(--success-color-dark, #1e7e34)';
        } else if (status === 'PENDING') {
            backgroundColor = 'var(--warning-color, #ffc107)';
            borderColor = 'var(--warning-color-dark, #d39e00)';
        } else if (status === 'CANCELLED') {
            backgroundColor = 'var(--danger-color, #dc3545)';
            borderColor = 'var(--danger-color-dark, #b02a37)';
        } else if (status === 'COMPLETED') {
            backgroundColor = 'var(--medium-grey-text, #6c757d)';
            borderColor = 'var(--dark-text, #5a6268)';
        }

        const style = {
            backgroundColor,
            borderRadius: '5px',
            opacity: 0.9,
            color: 'white',
            border: `1px solid ${borderColor}`,
            display: 'block',
            fontSize: '0.8em',
            padding: '3px 5px'
        };
        return { style };
    };

    const minTime = useMemo(() => {
        const d = new Date();
        d.setHours(8, 0, 0);
        return d;
    }, []);

    const maxTime = useMemo(() => {
        const d = new Date();
        d.setHours(20, 0, 0);
        return d;
    }, []);


    if (loading) {
        return (
            <div className="flex justify-center items-center p-10 text-gray-600">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-indigo-500" />
                <p className="ml-3 text-md">Lade Kalenderansicht...</p>
            </div>
        );
    }

    return (
        <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-lg ${styles.adminCalendarContainer}`}>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 font-serif">
                    Terminkalender (Admin)
                </h2>
                <div className="mt-3 sm:mt-0 space-x-2">
                    <button
                        onClick={fetchAppointments}
                        className="p-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        title="Kalender aktualisieren"
                        disabled={loading}
                    >
                        <FontAwesomeIcon icon={loading ? faSpinner : faSyncAlt} spin={loading} />
                    </button>
                    <button
                        onClick={() => { setSelectedSlotForCreate({ start: new Date(), end: addHours(new Date(), 1), allDay: false }); setShowCreateModal(true); }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <FontAwesomeIcon icon={faCalendarPlus} className="mr-2" />
                        Neuer Termin
                    </button>
                </div>
            </div>

            {error && (
                <div className={`mb-4 p-3 rounded-md bg-red-50 text-red-600 border border-red-200 text-sm flex items-center ${styles.message}`}>
                    <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 flex-shrink-0" /> {error}
                </div>
            )}

            <div className={`h-[70vh] md:h-[75vh] ${styles.calendarWrapper}`}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    messages={messages}
                    views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                    defaultView={Views.WEEK}
                    date={currentDate}
                    onNavigate={date => setCurrentDate(date)}
                    onView={view => setCurrentView(view)}
                    selectable={true}
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    eventPropGetter={eventStyleGetter}
                    min={minTime}
                    max={maxTime}
                    step={30}
                    timeslots={2}
                    popup
                    culture='de'
                />
            </div>

            {showEditModal && selectedEventForEdit && (
                <AppointmentEditModal
                    isOpen={showEditModal}
                    onClose={handleModalClose}
                    onSave={handleModalSave}
                    appointmentData={selectedEventForEdit}
                    adminView={true}
                />
            )}
            {showCreateModal && selectedSlotForCreate && (
                <AppointmentCreateModal
                    isOpen={showCreateModal}
                    onClose={handleModalClose}
                    onSave={handleModalSave}
                    selectedSlot={selectedSlotForCreate}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
}

export default AdminCalendarView;