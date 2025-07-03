// friseursalon-frontend/src/components/AdminCalendarView.js

import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import deLocale from 'date-fns/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './AdminCalendarView.module.css';

// Beispieldaten und benutzerdefinierte Komponenten importieren
import { dummyEvents } from '../data/dummy-events'; // Beispieldaten
import CustomToolbar from './CalendarToolbar'; // Die neue, benutzerdefinierte Toolbar
import CustomEvent from './CalendarEvent'; // Eine Komponente für die Darstellung der Termine

// Konfiguration des Localizers für date-fns mit deutschem Gebietsschema
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), // Wochenstart am Montag
    getDay,
    locales: {
        'de': deLocale,
    },
});

// Deutsche Texte für den Kalender
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
    event: 'Termin',
    noEventsInRange: 'Keine Termine in diesem Bereich.',
    showMore: total => `+ ${total} weitere`,
};

/**
 * Der neue Admin-Kalender mit modernem Design und erweiterter Funktionalität.
 * Nutzt TailwindCSS für das "Glassmorphism"-Design und react-big-calendar.
 */
function AdminCalendarView() {
    const [events, setEvents] = useState(dummyEvents);
    const [view, setView] = useState(Views.WEEK); // Standardansicht ist die Woche
    const [date, setDate] = useState(new Date());

    // Memoized Callbacks für Performance
    const onView = useCallback((newView) => setView(newView), [setView]);
    const onNavigate = useCallback((newDate) => setDate(newDate), [setDate]);

    // Styling-Logik für die Kalender-Slots (z.B. um den aktuellen Tag hervorzuheben)
    const dayPropGetter = useCallback(
        (date) => ({
            className: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? styles.today_cell : '',
        }),
        []
    );

    // Styling für die einzelnen Termine basierend auf ihrem Status
    const eventPropGetter = useCallback(
        (event) => ({
            className: styles[`event_${event.status || 'default'}`],
        }),
        []
    );

    return (
        <div className={styles.calendar_container}>
            {/* Das ist der "Glas"-Hintergrund */}
            <div className={styles.calendar_background_blur}></div>

            {/* Kalender-Komponente */}
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 'calc(100vh - 120px)' }} // Dynamische Höhe
                messages={messages}
                culture='de'

                // Ansichten und Toolbar
                views={[Views.WEEK, Views.DAY]} // Nur Wochen- und Tagesansicht
                view={view}
                date={date}
                onView={onView}
                onNavigate={onNavigate}
                components={{
                    toolbar: (toolbarProps) => (
                        <CustomToolbar
                            {...toolbarProps}
                            // Platzhalter für Filter-Funktionen
                            onFilterChange={(filterType, value) => console.log(filterType, value)}
                        />
                    ),
                    event: CustomEvent, // Eigene Komponente für Termin-Darstellung
                }}

                // Styling und Interaktion
                popup // Bessere Darstellung bei überlappenden Terminen
                selectable // Erlaubt das Markieren von Zeitfenstern
                dayPropGetter={dayPropGetter}
                eventPropGetter={eventPropGetter}

                // Zeitfenster-Einstellungen
                min={new Date(0, 0, 0, 8, 0, 0)} // Startzeit 08:00 Uhr
                max={new Date(0, 0, 0, 20, 0, 0)} // Endzeit 20:00 Uhr
                step={30} // 30-Minuten-Schritte
                timeslots={2} // Zeigt halbstündige Linien an
            />
        </div>
    );
}

export default AdminCalendarView;