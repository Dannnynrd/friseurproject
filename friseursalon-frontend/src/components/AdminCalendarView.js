import React, { useState, useEffect, useCallback, useMemo } from 'react'; // useMemo hinzugefügt
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

    // currentViewDate speichert den Start des aktuell angezeigten Intervalls (z.B. erster Tag der Woche/Monat)
    const [currentCalendarViewDate, setCurrentCalendarViewDate] = useState(new Date());

    // Memoize den abgeleiteten String für die Dependency-Array
    const currentViewFetchKey = useMemo(() => {
        // Wir verwenden Jahr und Monat als Schlüssel für den Datenabruf,
        // um sicherzustellen, dass wir nur neu laden, wenn sich der Monat ändert.
        // Für Wochen- oder Tagesansichten, die monatsübergreifend sein können,
        // ist es wichtig, den Start- und Endtag des sichtbaren Bereichs zu berücksichtigen.
        // FullCalendar's datesSet gibt uns startStr und endStr, die wir nutzen könnten.
        // Für die Logik hier, die auf currentCalendarViewDate basiert, ist YYYY-MM ein guter Anfang.
        return formatDateFns(currentCalendarViewDate, 'yyyy-MM');
    }, [currentCalendarViewDate]);

    const fetchAppointmentsForCalendar = useCallback(async (viewStart, viewEnd) => {
        setIsLoading(true);
        setError(null);

        if (!isValidDate(viewStart) || !isValidDate(viewEnd)) {
            setError("Ungültiger Datumsbereich für Kalenderabruf.");
            setIsLoading(false);
            setEvents([]);
            return;
        }

        const startDateParam = formatDateFns(viewStart, 'yyyy-MM-dd');
        const endDateParam = formatDateFns(viewEnd, 'yyyy-MM-dd');

        console.log(`Fetching appointments from: ${startDateParam} to ${endDateParam}`);

        try {
            const response = await api.get('appointments/by-date-range', {
                params: {
                    start: startDateParam,
                    end: endDateParam,
                },
            });

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
                    console.warn(`Ungültige oder fehlende Dauer für Termin ID ${apt.id}. Start: ${apt.startTime}`);
                    eventEnd = isValidDate(appointmentStart) ? addMinutes(appointmentStart, 60) : null;
                }

                if (!isValidDate(appointmentStart) || !eventEnd || !isValidDate(eventEnd) ) {
                    console.error("Ungültige Termindaten für Kalender-Event:", apt);
                    return null;
                }

                return {
                    id: String(apt.id),
                    title: title,
                    start: appointmentStart,
                    end: eventEnd,
                    allDay: false,
                    extendedProps: {
                        appointmentData: apt,
                    },
                };
            }).filter(event => event !== null);

            setEvents(fetchedAppointments);
        } catch (err) {
            console.error("Fehler beim Laden der Termine für den Kalender:", err);
            let errorMessage = "Termine konnten nicht geladen werden. Bitte Konsole prüfen.";
            if (err.response && err.response.data) {
                if (err.response.data.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
                    errorMessage = err.response.data.errors.join("; ");
                } else if (typeof err.response.data === 'string') {
                    errorMessage = err.response.data;
                } else if (err.response.statusText) {
                    errorMessage = `Fehler: ${err.response.status} ${err.response.statusText}`;
                }
            } else if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
            setEvents([]);
        } finally {
            setIsLoading(false);
        }
    }, []); // fetchAppointmentsForCalendar selbst hat keine direkten state/prop Abhängigkeiten für seine Definition

    useEffect(() => {
        // Bestimme den Datumsbereich basierend auf currentCalendarViewDate
        // Für Monatsansicht: den ganzen Monat. Für andere Ansichten könnte man das anpassen.
        // FullCalendar's `datesSet` liefert präzisere Start/End-Daten der aktuellen Ansicht.
        // Wir verwenden hier currentCalendarViewDate, um den Start des Abrufs zu definieren.
        // Der `datesSet` Handler aktualisiert `currentCalendarViewDate`.

        const firstDayOfViewMonth = startOfMonth(currentCalendarViewDate);
        const lastDayOfViewMonth = endOfMonth(currentCalendarViewDate);

        fetchAppointmentsForCalendar(firstDayOfViewMonth, lastDayOfViewMonth);

    }, [currentViewFetchKey, refreshTrigger, fetchAppointmentsForCalendar]); // Abhängigkeit von currentViewFetchKey


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

    const handleDatesSet = (dateSetInfo) => {
        // dateSetInfo.view.currentStart ist der erste sichtbare Tag der aktuellen Ansicht.
        // dateSetInfo.start und dateSetInfo.end sind die tatsächlichen Start-/Enddaten des Intervalls.
        console.log("datesSet - Start:", dateSetInfo.start, "End:", dateSetInfo.end, "View CurrentStart:", dateSetInfo.view.currentStart);
        setCurrentCalendarViewDate(new Date(dateSetInfo.startStr)); // Oder dateSetInfo.view.currentStart
        // Wichtig ist, dass dies den `currentViewFetchKey` ändert,
        // wenn sich der Monat/Jahr ändert.
    };

    if (isLoading && events.length === 0) {
        return <div className="loading-message"><FontAwesomeIcon icon={faSpinner} spin /> Kalenderdaten werden geladen...</div>;
    }

    if (error) {
        return <p className="form-message error">{error}</p>;
    }

    return (
        <div className="admin-calendar-container">
            {isLoading && events.length > 0 && <p className="loading-message small absolute-loader"><FontAwesomeIcon icon={faSpinner} spin /> Aktualisiere...</p>}
            <FullCalendar
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
                datesSet={handleDatesSet} // Dieser Callback ist entscheidend
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
