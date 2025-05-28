import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction'; // Interaction plugin is needed for select
import listPlugin from '@fullcalendar/list';
import { de } from 'date-fns/locale';
import api from '../services/api.service';
import AppointmentEditModal from './AppointmentEditModal';
import AppointmentCreateModal from './AppointmentCreateModal'; // Import the new modal
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import './AdminCalendarView.css';
import { addMinutes, parseISO, isValid as isValidDate, format as formatDateFns, getDay, parse } from 'date-fns';

// Helper to convert backend DayOfWeek (MONDAY, TUESDAY etc.) to FullCalendar's integer (0=Sunday, 1=Monday, ...)
const dayOfWeekToFCDay = (dayOfWeekString) => {
    const mapping = {
        "MONDAY": 1, "TUESDAY": 2, "WEDNESDAY": 3, "THURSDAY": 4,
        "FRIDAY": 5, "SATURDAY": 6, "SUNDAY": 0,
    };
    return mapping[dayOfWeekString.toUpperCase()];
};

function AdminCalendarView({ currentUser, refreshTrigger, onAppointmentUpdated }) {
    const [appointmentEvents, setAppointmentEvents] = useState([]);
    const [businessHoursConfig, setBusinessHoursConfig] = useState([]);
    const [blockedSlotEvents, setBlockedSlotEvents] = useState([]);

    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
    const [isLoadingStaticData, setIsLoadingStaticData] = useState(true);
    const [error, setError] = useState(null);

    const [selectedAppointmentForEdit, setSelectedAppointmentForEdit] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedSlotInfo, setSelectedSlotInfo] = useState(null); // For new appointment start/end

    const calendarRef = useRef(null);
    const initialStaticDataFetchedRef = useRef(false);

    const fetchAppointmentsForCalendar = useCallback(async (viewStartDate, viewEndDate) => {
        console.log('[AdminCalendarView] Fetching appointments for range - Start:', viewStartDate, 'End:', viewEndDate);
        setIsLoadingAppointments(true);
        setError(null);

        if (!isValidDate(viewStartDate) || !isValidDate(viewEndDate)) {
            setError("Ungültiger Datumsbereich für Terminabruf.");
            setIsLoadingAppointments(false);
            if (isInitialLoading) setIsInitialLoading(false);
            setAppointmentEvents([]);
            return;
        }

        const startDateParam = formatDateFns(viewStartDate, 'yyyy-MM-dd');
        const endDateParam = formatDateFns(viewEndDate, 'yyyy-MM-dd');

        try {
            const response = await api.get('appointments/by-date-range', {
                params: { start: startDateParam, end: endDateParam },
            });

            if (!Array.isArray(response.data)) {
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
                        id: `apt-${String(apt.id)}`,
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
            setError(err.response?.data?.message || "Termine konnten nicht geladen werden.");
            setAppointmentEvents([]);
        } finally {
            setIsLoadingAppointments(false);
            if (isInitialLoading && !isLoadingStaticData) setIsInitialLoading(false);
            console.log("[AdminCalendarView] fetchAppointmentsForCalendar finished.");
        }
    }, [isInitialLoading, isLoadingStaticData]);

    const fetchStaticCalendarData = useCallback(async () => {
        console.log('[AdminCalendarView] Fetching static calendar data');
        setIsLoadingStaticData(true);
        setError(null);
        let workingHoursError = null;
        let blockedSlotsError = null;

        try {
            const whResponse = await api.get('/workinghours');
            if (Array.isArray(whResponse.data)) {
                const fcBusinessHours = whResponse.data
                    .filter(wh => !wh.isClosed && wh.startTime && wh.endTime)
                    .map(wh => ({
                        daysOfWeek: [dayOfWeekToFCDay(wh.dayOfWeek)],
                        startTime: wh.startTime.substring(0, 5),
                        endTime: wh.endTime.substring(0, 5),
                    }));
                setBusinessHoursConfig(fcBusinessHours);
            } else { workingHoursError = "Arbeitszeiten-Datenformat ungültig."; }
        } catch (err) { workingHoursError = err.response?.data?.message || "Arbeitszeiten konnten nicht geladen werden."; }

        try {
            const bsResponse = await api.get('/blockedtimeslots');
            if (Array.isArray(bsResponse.data)) {
                const fcBlockedSlots = bsResponse.data.map(bs => {
                    const title = bs.description || 'Blockiert';
                    if (bs.repeating && bs.recurringDayOfWeek && bs.startTime && bs.endTime) {
                        return {
                            id: `bs-recurring-${bs.id}`, title: title,
                            daysOfWeek: [dayOfWeekToFCDay(bs.recurringDayOfWeek)],
                            startTime: bs.startTime.substring(0, 5), endTime: bs.endTime.substring(0, 5),
                            display: 'background', className: 'fc-event-blocked-slot fc-event-blocked-recurring',
                            extendedProps: { type: 'blocked-recurring', blockedSlotData: bs }
                        };
                    } else if (!bs.repeating && bs.specificDate && bs.startTime && bs.endTime) {
                        const date = parseISO(bs.specificDate);
                        if (!isValidDate(date)) return null;
                        const startTime = parse(bs.startTime, 'HH:mm:ss', new Date());
                        const endTime = parse(bs.endTime, 'HH:mm:ss', new Date());
                        if (!isValidDate(startTime) || !isValidDate(endTime)) return null;
                        const startDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startTime.getHours(), startTime.getMinutes());
                        const endDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), endTime.getHours(), endTime.getMinutes());
                        if (!isValidDate(startDateTime) || !isValidDate(endDateTime)) return null;
                        return {
                            id: `bs-specific-${bs.id}`, title: title,
                            start: startDateTime, end: endDateTime, allDay: false,
                            display: 'background', className: 'fc-event-blocked-slot fc-event-blocked-specific',
                            extendedProps: { type: 'blocked-specific', blockedSlotData: bs }
                        };
                    }
                    return null;
                }).filter(event => event !== null);
                setBlockedSlotEvents(fcBlockedSlots);
            } else { blockedSlotsError = "Geblockte Zeiten-Datenformat ungültig."; }
        } catch (err) { blockedSlotsError = err.response?.data?.message || "Geblockte Zeiten konnten nicht geladen werden."; }

        if (workingHoursError || blockedSlotsError) {
            setError([workingHoursError, blockedSlotsError].filter(Boolean).join('; '));
        }
    }, []);

    useEffect(() => {
        console.log("[AdminCalendarView] useEffect for static data triggered. Refresh:", refreshTrigger);
        setIsLoadingStaticData(true);
        fetchStaticCalendarData().finally(() => {
            setIsLoadingStaticData(false);
            initialStaticDataFetchedRef.current = true;
            if (isInitialLoading && !isLoadingAppointments) setIsInitialLoading(false);
            console.log("[AdminCalendarView] Static data loading finished.");
        });
    }, [refreshTrigger, fetchStaticCalendarData]);

    const handleDatesSet = useCallback((dateInfo) => {
        console.log(`[AdminCalendarView] datesSet triggered. View Start: ${dateInfo.startStr}, View End: ${dateInfo.endStr}`);
        if (initialStaticDataFetchedRef.current || !isInitialLoading) {
            fetchAppointmentsForCalendar(dateInfo.start, dateInfo.end);
        } else {
            // This ensures that if static data is still loading when datesSet is first called,
            // appointments are fetched once static data is done.
            // However, datesSet is the primary trigger for appointment loading.
            // We might need to call fetchAppointments directly here or ensure static data loads first.
            // For now, let's assume static data will be loaded by its own effect.
            // If appointments depend on static data (e.g. for validation), this needs careful handling.
            console.log("[AdminCalendarView] datesSet: Waiting for initial static data fetch to complete for appointments.");
            // To ensure appointments are loaded after static data on initial mount:
            if (isInitialLoading && !initialStaticDataFetchedRef.current) {
                // Delay appointment fetch until static data is likely fetched or trigger it inside static data's finally block.
                // For simplicity, let's allow datesSet to trigger it; the loading states will manage UI.
            }
            fetchAppointmentsForCalendar(dateInfo.start, dateInfo.end); // Fetch appointments regardless, initial load logic handles UI
        }
    }, [fetchAppointmentsForCalendar, isInitialLoading]);

    const handleEventClick = (clickInfo) => {
        if (clickInfo.event.extendedProps.type === 'appointment' && clickInfo.event.extendedProps.appointmentData) {
            setSelectedAppointmentForEdit(clickInfo.event.extendedProps.appointmentData);
        }
    };

    const handleDateSelect = (selectInfo) => {
        console.log("[AdminCalendarView] Date selected:", selectInfo);
        // Check if selection is within business hours if desired
        // For now, just open the modal
        const calendarApi = selectInfo.view.calendar;
        calendarApi.unselect(); // Clear current selection

        // Prevent opening create modal if a click on an event happened almost simultaneously
        // This is a bit of a race condition guard.
        if(selectedAppointmentForEdit) return;

        setSelectedSlotInfo({
            start: selectInfo.start,
            end: selectInfo.end,
            allDay: selectInfo.allDay,
            startStr: selectInfo.startStr,
            endStr: selectInfo.endStr,
        });
        setShowCreateModal(true);
    };

    const handleCloseEditModal = () => setSelectedAppointmentForEdit(null);
    const handleCloseCreateModal = () => {
        setShowCreateModal(false);
        setSelectedSlotInfo(null); // Clear selection info
    };

    const handleAppointmentModified = () => { // Used for both create and update
        handleCloseEditModal();
        handleCloseCreateModal();
        if (onAppointmentUpdated) onAppointmentUpdated(); // This will update refreshTrigger
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
            {(isLoadingAppointments || isLoadingStaticData) && !isInitialLoading && <p className="loading-message small absolute-loader"><FontAwesomeIcon icon={faSpinner} spin /> Aktualisiere...</p>}
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
                        left: 'prev,next today', center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                    }}
                    initialView="timeGridWeek"
                    locale={de}
                    buttonText={{ today: 'Heute', month: 'Monat', week: 'Woche', day: 'Tag', list: 'Liste' }}
                    events={combinedEvents}
                    businessHours={businessHoursConfig}
                    eventClick={handleEventClick}
                    selectable={true} // Allow date/time selection
                    selectMirror={true} // Show a placeholder while selecting
                    selectOverlap={false} // Prevent selecting over existing events (appointments)
                    selectAllow={(selectInfoAllow) => {
                        // Optional: More fine-grained control over where selection is allowed.
                        // e.g., prevent selection in the past or on blocked slots.
                        // For now, businessHours and selectOverlap handle most cases.
                        return selectInfoAllow.start >= new Date(); // Prevent selection in the past
                    }}
                    select={handleDateSelect} // Callback for when a date/time range is selected
                    editable={false}
                    nowIndicator={true}
                    firstDay={1}
                    slotMinTime="08:00:00"
                    slotMaxTime="21:00:00"
                    allDaySlot={false}
                    height="auto"
                    datesSet={handleDatesSet}
                />
            </div>

            {selectedAppointmentForEdit && currentUser?.roles?.includes("ROLE_ADMIN") && (
                <AppointmentEditModal
                    appointment={selectedAppointmentForEdit}
                    onClose={handleCloseEditModal}
                    onAppointmentUpdated={handleAppointmentModified}
                />
            )}

            {showCreateModal && selectedSlotInfo && currentUser?.roles?.includes("ROLE_ADMIN") && (
                <AppointmentCreateModal
                    isOpen={showCreateModal}
                    onClose={handleCloseCreateModal}
                    onAppointmentCreated={handleAppointmentModified}
                    selectedSlot={selectedSlotInfo}
                    // Pass any other necessary props like available services if fetched here
                />
            )}
        </div>
    );
}

export default AdminCalendarView;
