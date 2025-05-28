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
import { addMinutes, parseISO, isValid as isValidDate, format as formatDateFns, getDay, parse } from 'date-fns';

// Helper to convert backend DayOfWeek (MONDAY, TUESDAY etc.) to FullCalendar's integer (0=Sunday, 1=Monday, ...)
const dayOfWeekToFCDay = (dayOfWeekString) => {
    const mapping = {
        "MONDAY": 1,
        "TUESDAY": 2,
        "WEDNESDAY": 3,
        "THURSDAY": 4,
        "FRIDAY": 5,
        "SATURDAY": 6,
        "SUNDAY": 0,
    };
    return mapping[dayOfWeekString.toUpperCase()]; // Ensure uppercase for matching
};

function AdminCalendarView({ currentUser, refreshTrigger, onAppointmentUpdated }) {
    const [appointmentEvents, setAppointmentEvents] = useState([]);
    const [businessHoursConfig, setBusinessHoursConfig] = useState([]);
    const [blockedSlotEvents, setBlockedSlotEvents] = useState([]);

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
    const [isLoadingStaticData, setIsLoadingStaticData] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const calendarRef = useRef(null);
    const initialStaticDataFetchedRef = useRef(false); // Track if static data has been fetched at least once

    const fetchAppointmentsForCalendar = useCallback(async (viewStartDate, viewEndDate) => {
        console.log('[AdminCalendarView] Fetching appointments for range - Start:', viewStartDate, 'End:', viewEndDate);
        setIsLoadingAppointments(true);
        setError(null); // Clear previous errors for this specific fetch

        if (!isValidDate(viewStartDate) || !isValidDate(viewEndDate)) {
            const errMsg = "Ungültiger Datumsbereich für Terminabruf.";
            console.error("[AdminCalendarView]", errMsg, "Raw Start:", viewStartDate, "Raw End:", viewEndDate);
            setError(errMsg);
            setIsLoadingAppointments(false);
            if (isInitialLoading) setIsInitialLoading(false); // Ensure initial loading state is cleared
            setAppointmentEvents([]);
            return;
        }

        const startDateParam = formatDateFns(viewStartDate, 'yyyy-MM-dd');
        const endDateParam = formatDateFns(viewEndDate, 'yyyy-MM-dd');

        try {
            const response = await api.get('appointments/by-date-range', {
                params: { start: startDateParam, end: endDateParam },
            });

            console.log("[AdminCalendarView] Appointments API response received:", response.data);

            if (!Array.isArray(response.data)) {
                console.error("[AdminCalendarView] Appointments API response data is not an array:", response.data);
                setError("Ungültige Termin-Antwort vom Server.");
                setAppointmentEvents([]);
            } else {
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
                        eventEnd = isValidDate(appointmentStart) ? addMinutes(appointmentStart, 60) : null;
                    }

                    if (!isValidDate(appointmentStart) || !eventEnd || !isValidDate(eventEnd) ) return null;

                    return {
                        id: `apt-${String(apt.id)}`, // Prefix ID to avoid clashes
                        title: title,
                        start: appointmentStart,
                        end: eventEnd,
                        allDay: false,
                        extendedProps: { appointmentData: apt, type: 'appointment' },
                        className: 'fc-event-appointment',
                    };
                }).filter(event => event !== null);
                setAppointmentEvents(fetchedAppointments);
            }
        } catch (err) {
            console.error("[AdminCalendarView] Fehler beim Laden der Termine:", err);
            setError(err.response?.data?.message || "Termine konnten nicht geladen werden.");
            setAppointmentEvents([]);
        } finally {
            setIsLoadingAppointments(false);
            if (isInitialLoading && !isLoadingStaticData) setIsInitialLoading(false); // Clear initial if all data types are done
            console.log("[AdminCalendarView] fetchAppointmentsForCalendar finished.");
        }
    }, [isInitialLoading, isLoadingStaticData]);

    const fetchStaticCalendarData = useCallback(async () => {
        console.log('[AdminCalendarView] Fetching static calendar data (working hours, blocked slots)');
        setIsLoadingStaticData(true);
        setError(null); // Clear previous static data errors
        let workingHoursError = null;
        let blockedSlotsError = null;

        try {
            // Fetch Working Hours
            const whResponse = await api.get('/workinghours');
            console.log("[AdminCalendarView] Working Hours API response:", whResponse.data);
            if (Array.isArray(whResponse.data)) {
                const fcBusinessHours = whResponse.data
                    .filter(wh => !wh.isClosed && wh.startTime && wh.endTime)
                    .map(wh => ({
                        daysOfWeek: [dayOfWeekToFCDay(wh.dayOfWeek)],
                        startTime: wh.startTime.substring(0, 5), // HH:mm
                        endTime: wh.endTime.substring(0, 5),     // HH:mm
                    }));
                setBusinessHoursConfig(fcBusinessHours);
                console.log('[AdminCalendarView] Business hours config set:', fcBusinessHours);
            } else {
                console.error("[AdminCalendarView] Working hours response data is not an array:", whResponse.data);
                workingHoursError = "Arbeitszeiten-Datenformat ungültig.";
            }
        } catch (err) {
            console.error("[AdminCalendarView] Fehler beim Laden der Arbeitszeiten:", err);
            workingHoursError = err.response?.data?.message || "Arbeitszeiten konnten nicht geladen werden.";
        }

        try {
            // Fetch Blocked Time Slots
            const bsResponse = await api.get('/blockedtimeslots');
            console.log("[AdminCalendarView] Blocked Slots API response:", bsResponse.data);
            if (Array.isArray(bsResponse.data)) {
                const fcBlockedSlots = bsResponse.data.map(bs => {
                    const title = bs.description || 'Blockiert';
                    if (bs.repeating && bs.recurringDayOfWeek && bs.startTime && bs.endTime) {
                        return {
                            id: `bs-recurring-${bs.id}`,
                            title: title,
                            daysOfWeek: [dayOfWeekToFCDay(bs.recurringDayOfWeek)],
                            startTime: bs.startTime.substring(0, 5), // HH:mm
                            endTime: bs.endTime.substring(0, 5),     // HH:mm
                            display: 'background',
                            className: 'fc-event-blocked-slot fc-event-blocked-recurring',
                            extendedProps: { type: 'blocked-recurring', blockedSlotData: bs }
                        };
                    } else if (!bs.repeating && bs.specificDate && bs.startTime && bs.endTime) {
                        const date = parseISO(bs.specificDate);
                        if (!isValidDate(date)) return null;

                        const startTime = parse(bs.startTime, 'HH:mm:ss', new Date()); // Assuming HH:mm:ss
                        const endTime = parse(bs.endTime, 'HH:mm:ss', new Date());

                        if (!isValidDate(startTime) || !isValidDate(endTime)) return null;

                        const startDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startTime.getHours(), startTime.getMinutes());
                        const endDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), endTime.getHours(), endTime.getMinutes());

                        if (!isValidDate(startDateTime) || !isValidDate(endDateTime)) return null;

                        return {
                            id: `bs-specific-${bs.id}`,
                            title: title,
                            start: startDateTime,
                            end: endDateTime,
                            allDay: false,
                            display: 'background',
                            className: 'fc-event-blocked-slot fc-event-blocked-specific',
                            extendedProps: { type: 'blocked-specific', blockedSlotData: bs }
                        };
                    }
                    return null; // Invalid structure
                }).filter(event => event !== null);
                setBlockedSlotEvents(fcBlockedSlots);
                console.log('[AdminCalendarView] Blocked slot events set:', fcBlockedSlots);
            } else {
                console.error("[AdminCalendarView] Blocked slots response data is not an array:", bsResponse.data);
                blockedSlotsError = "Geblockte Zeiten-Datenformat ungültig.";
            }
        } catch (err) {
            console.error("[AdminCalendarView] Fehler beim Laden der geblockten Zeiten:", err);
            blockedSlotsError = err.response?.data?.message || "Geblockte Zeiten konnten nicht geladen werden.";
        }

        if (workingHoursError || blockedSlotsError) {
            const combinedError = [workingHoursError, blockedSlotsError].filter(Boolean).join('; ');
            setError(combinedError);
        }

    }, []);

    // Fetch static data on mount and when refreshTrigger changes
    useEffect(() => {
        console.log("[AdminCalendarView] useEffect for static data triggered. Refresh:", refreshTrigger);
        setIsLoadingStaticData(true);
        fetchStaticCalendarData().finally(() => {
            setIsLoadingStaticData(false);
            initialStaticDataFetchedRef.current = true;
            if (isInitialLoading && !isLoadingAppointments) setIsInitialLoading(false); // Clear initial if all data types are done
            console.log("[AdminCalendarView] Static data loading finished.");
        });
    }, [refreshTrigger, fetchStaticCalendarData]);

    const handleDatesSet = useCallback((dateInfo) => {
        console.log(`[AdminCalendarView] datesSet triggered. View Start: ${dateInfo.startStr}, View End: ${dateInfo.endStr}`);
        if (initialStaticDataFetchedRef.current || !isInitialLoading) { // Ensure static data is loaded or initial phase is passed
            fetchAppointmentsForCalendar(dateInfo.start, dateInfo.end);
        } else {
            console.log("[AdminCalendarView] datesSet: Waiting for initial static data fetch to complete.");
        }
    }, [fetchAppointmentsForCalendar, isInitialLoading]);

    const handleEventClick = (clickInfo) => {
        if (clickInfo.event.extendedProps.type === 'appointment' && clickInfo.event.extendedProps.appointmentData) {
            setSelectedAppointment(clickInfo.event.extendedProps.appointmentData);
        }
    };

    const handleCloseModal = () => setSelectedAppointment(null);

    const handleAppointmentUpdatedInModal = () => {
        handleCloseModal();
        if (onAppointmentUpdated) onAppointmentUpdated();
    };

    const combinedEvents = useMemo(() => {
        return [...appointmentEvents, ...blockedSlotEvents];
    }, [appointmentEvents, blockedSlotEvents]);

    const overallIsLoading = isInitialLoading || isLoadingAppointments || isLoadingStaticData;

    console.log('[AdminCalendarView] Render state - Overall Loading:', overallIsLoading, 'Initial:', isInitialLoading, 'Appt:', isLoadingAppointments, 'Static:', isLoadingStaticData, 'events.length:', combinedEvents.length, 'error:', error);

    if (isInitialLoading) {
        return <div className="loading-message initial-loading-overlay"><FontAwesomeIcon icon={faSpinner} spin /> Kalenderdaten werden geladen...</div>;
    }

    return (
        <div className="admin-calendar-container">
            {(isLoadingAppointments || isLoadingStaticData) && <p className="loading-message small absolute-loader"><FontAwesomeIcon icon={faSpinner} spin /> Aktualisiere...</p>}
            {error && <p className="form-message error small absolute-loader" style={{top: '60px', right: '10px', zIndex: 25, background: 'var(--danger-bg-light)', padding: '0.5rem', borderRadius: '4px'}}>{error}</p>}

            {!overallIsLoading && combinedEvents.length === 0 && !error && (
                <div className="calendar-empty-message-container">
                    <p className="text-center text-gray-600 py-4">
                        Keine Termine für den ausgewählten Zeitraum gefunden oder vorhanden.
                    </p>
                </div>
            )}

            <div style={{ visibility: isInitialLoading ? 'hidden' : 'visible' }}>
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
                    buttonText={{ today: 'Heute', month: 'Monat', week: 'Woche', day: 'Tag', list: 'Liste' }}
                    events={combinedEvents}
                    businessHours={businessHoursConfig}
                    eventClick={handleEventClick}
                    editable={false}
                    selectable={false}
                    nowIndicator={true}
                    firstDay={1}
                    slotMinTime="08:00:00"
                    slotMaxTime="21:00:00"
                    allDaySlot={false}
                    height="auto"
                    datesSet={handleDatesSet}
                />
            </div>
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
