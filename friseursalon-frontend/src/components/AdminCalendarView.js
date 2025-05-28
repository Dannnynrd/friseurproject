import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { de } from 'date-fns/locale';
import api from '../services/api.service';
import AppointmentEditModal from './AppointmentEditModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import './AdminCalendarView.css';
import { addMinutes, parseISO, isValid as isValidDate, format as formatDateFns, startOfMonth, endOfMonth } from 'date-fns';

function AdminCalendarView({ currentUser, refreshTrigger, onAppointmentUpdated }) {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const calendarRef = useRef(null);

    // This state holds the start date of the current view (e.g., first day of the month/week)
    // It's updated by FullCalendar's datesSet callback.
    const [currentCalendarApiViewStart, setCurrentCalendarApiViewStart] = useState(new Date());

    // Memoized key for the useEffect dependency, changes only when year/month of currentCalendarApiViewStart changes.
    const currentFetchKey = useMemo(() => {
        if (!isValidDate(currentCalendarApiViewStart)) return new Date().toISOString(); // Fallback
        return formatDateFns(currentCalendarApiViewStart, 'yyyy-MM'); // Key based on year and month
    }, [currentCalendarApiViewStart]);

    const fetchAppointmentsForCalendar = useCallback(async (viewStartDate, viewEndDate) => {
        console.log(`[AdminCalendarView] fetchAppointmentsForCalendar called with: Start=${viewStartDate}, End=${viewEndDate}`);
        setIsLoading(true);
        setError(null); // Reset error at the beginning of a fetch attempt

        if (!isValidDate(viewStartDate) || !isValidDate(viewEndDate)) {
            const errMsg = "Ungültiger Datumsbereich für Kalenderabruf.";
            console.error("[AdminCalendarView]", errMsg, "Raw Start:", viewStartDate, "Raw End:", viewEndDate);
            setError(errMsg);
            setIsLoading(false);
            setEvents([]);
            return;
        }

        const startDateParam = formatDateFns(viewStartDate, 'yyyy-MM-dd');
        const endDateParam = formatDateFns(viewEndDate, 'yyyy-MM-dd');
        console.log(`[AdminCalendarView] API Call Params: start=${startDateParam}, end=${endDateParam}`);

        try {
            const response = await api.get('appointments/by-date-range', {
                params: { start: startDateParam, end: endDateParam },
            });
            console.log("[AdminCalendarView] API response received:", response);

            if (!Array.isArray(response.data)) {
                console.error("[AdminCalendarView] API response data is not an array:", response.data);
                setError("Ungültige Antwort vom Server erhalten.");
                setEvents([]);
                setIsLoading(false); // Ensure loading is false if we exit early
                return;
            }

            const fetchedAppointments = response.data.map(apt => {
                let title = 'Unbekannter Termin';
                if (apt.service && apt.service.name && apt.customer && apt.customer.firstName && apt.customer.lastName) {
                    title = `${apt.service.name} (${apt.customer.firstName} ${apt.customer.lastName})`;
                } else if (apt.service && apt.service.name) {
                    title = apt.service.name;
                }

                let eventEnd = null;
                const appointmentStart = parseISO(apt.startTime);

                if (isValidDate(appointmentStart) && apt.service && typeof apt.service.durationMinutes === 'number' && apt.service.durationMinutes > 0) {
                    eventEnd = addMinutes(appointmentStart, apt.service.durationMinutes);
                } else {
                    console.warn(`[AdminCalendarView] Ungültige oder fehlende Dauer für Termin ID ${apt.id}. Start: ${apt.startTime}, Dauer: ${apt.service?.durationMinutes}`);
                    eventEnd = isValidDate(appointmentStart) ? addMinutes(appointmentStart, 60) : null;
                }

                if (!isValidDate(appointmentStart) || !eventEnd || !isValidDate(eventEnd)) {
                    console.error("[AdminCalendarView] Ungültige Termindaten (Start/Ende) für Kalender-Event:", apt);
                    return null;
                }

                return {
                    id: String(apt.id),
                    title: title,
                    start: appointmentStart,
                    end: eventEnd,
                    allDay: false,
                    extendedProps: { appointmentData: apt },
                };
            }).filter(event => event !== null);

            setEvents(fetchedAppointments);
            console.log("[AdminCalendarView] Processed events, count:", fetchedAppointments.length);
        } catch (err) {
            console.error("[AdminCalendarView] Fehler beim Laden der Termine:", err.response || err.request || err.message);
            let errorMessage = "Termine konnten nicht geladen werden. Details in der Konsole.";
            if (err.response) {
                errorMessage = `Fehler ${err.response.status}: ${err.response.data?.message || err.response.statusText || 'Serverfehler'}`;
                if (err.response.data?.errors && Array.isArray(err.response.data.errors)) {
                    errorMessage += ` Details: ${err.response.data.errors.join("; ")}`;
                }
            } else if (err.request) {
                errorMessage = "Keine Antwort vom Server. Netzwerk prüfen.";
            } else {
                errorMessage = err.message;
            }
            setError(errorMessage);
            setEvents([]); // Clear events on error
        } finally {
            setIsLoading(false);
            console.log("[AdminCalendarView] fetchAppointmentsForCalendar finished. isLoading set to false.");
        }
    }, []); // useCallback with empty dependency array as it's a stable function definition

    // Effect for fetching data based on currentFetchKey (derived from currentCalendarApiViewStart) and refreshTrigger
    useEffect(() => {
        console.log(`[AdminCalendarView] useEffect for data fetch triggered. Key: ${currentFetchKey}, Refresh: ${refreshTrigger}`);
        // Determine the actual start and end of the period to fetch.
        // For month view, this would be start and end of the month currentFetchKey refers to.
        // For week/day view, it's more complex if we only want to fetch for that exact small range.
        // For simplicity, let's fetch for the whole month containing currentCalendarApiViewStart.
        // FullCalendar's datesSet provides more precise start/end for the current view, which is better.

        // This effect is now primarily driven by currentFetchKey (when month/year changes)
        // or refreshTrigger. The initial load is handled by datesSet.
        // If we want this to also handle initial load based on currentFetchKey:
        const dateForFetch = currentCalendarApiViewStart; // Use the state that's updated by datesSet
        const viewStart = startOfMonth(dateForFetch);
        const viewEnd = endOfMonth(dateForFetch);

        fetchAppointmentsForCalendar(viewStart, viewEnd);

    }, [currentFetchKey, refreshTrigger, fetchAppointmentsForCalendar]);

    // Called by FullCalendar when the date range or view changes (including initial load)
    const handleDatesSet = useCallback((dateInfo) => {
        console.log(`[AdminCalendarView] datesSet triggered. View Start: ${dateInfo.startStr}, View End: ${dateInfo.endStr}, View CurrentStart: ${dateInfo.view.currentStart.toISOString()}`);
        // Update the state that drives the fetchKey.
        // Using dateInfo.view.currentStart is often a good reference for the "current" date of the view.
        setCurrentCalendarApiViewStart(new Date(dateInfo.view.currentStart));
        // The fetch will be triggered by the useEffect above due to currentFetchKey changing.
        // OR, if we don't want to rely on currentFetchKey for this specific trigger:
        // fetchAppointmentsForCalendar(dateInfo.start, dateInfo.end); // Direct fetch
    }, []); // No dependency on fetchAppointmentsForCalendar to avoid re-creating this callback if fetchAppointmentsForCalendar changes.
    // This is fine if fetchAppointmentsForCalendar is stable (which it is with useCallback([])).


    const handleEventClick = (clickInfo) => {
        if (clickInfo.event.extendedProps.appointmentData) {
            setSelectedAppointment(clickInfo.event.extendedProps.appointmentData);
        }
    };

    const handleCloseModal = () => {
        setSelectedAppointment(null);
    };

    const handleAppointmentUpdatedInModal = () => {
        handleCloseModal();
        if (onAppointmentUpdated) {
            onAppointmentUpdated();
        }
    };

    console.log('[AdminCalendarView] Render state - isLoading:', isLoading, 'events.length:', events.length, 'error:', error);

    if (isLoading && events.length === 0 && !error) {
        console.log('[AdminCalendarView] Rendering: Loading message (initial)');
        return <div className="loading-message"><FontAwesomeIcon icon={faSpinner} spin /> Kalenderdaten werden geladen...</div>;
    }

    if (error && events.length === 0) {
        console.log('[AdminCalendarView] Rendering: Error message (no events, error present)');
        return <p className="form-message error">{error}</p>;
    }

    if (!isLoading && events.length === 0 && !error) {
        console.log('[AdminCalendarView] Rendering: No appointments message');
        return <p className="text-center text-gray-600 py-4">Keine Termine für den ausgewählten Zeitraum gefunden oder vorhanden.</p>;
    }

    console.log('[AdminCalendarView] Rendering: FullCalendar');
    return (
        <div className="admin-calendar-container">
            {isLoading && <p className="loading-message small absolute-loader"><FontAwesomeIcon icon={faSpinner} spin /> Aktualisiere...</p>}
            {error && <p className="form-message error small absolute-loader" style={{top: '60px', right: '10px', zIndex: 25, background: 'var(--danger-bg-light)', padding: '0.5rem', borderRadius: '4px'}}>{error}</p>}

            <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                }}
                initialView="timeGridWeek"
                locale={de}
                buttonText={{
                    today: 'Heute',
                    month: 'Monat',
                    week: 'Woche',
                    day: 'Tag',
                    list: 'Liste'
                }}
                events={events}
                eventClick={handleEventClick}
                editable={false}
                selectable={false}
                nowIndicator={true}
                firstDay={1}
                slotMinTime="08:00:00"
                slotMaxTime="21:00:00"
                allDaySlot={false}
                height="auto"
                datesSet={handleDatesSet} // This callback is crucial
            />
            {selectedAppointment && currentUser?.roles?.includes("ROLE_ADMIN") && (
                <AppointmentEditModal
                    appointment={selectedAppointment}
                    onClose={handleCloseModal}
                    onAppointmentUpdated={handleAppointmentUpdatedInModal}
                />
            )}
        </div>
    );
}

export default AdminCalendarView;
