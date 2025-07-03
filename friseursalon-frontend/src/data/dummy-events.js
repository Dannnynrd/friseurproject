// friseursalon-frontend/src/data/dummy-events.js
import { addHours, startOfHour, subHours } from 'date-fns';

const now = new Date();

export const dummyEvents = [
    {
        id: 1,
        title: 'Haarschnitt - Max Mustermann',
        allDay: false,
        start: subHours(startOfHour(now), 2),
        end: subHours(startOfHour(now), 1),
        status: 'booked',
        employee: 'Anna',
        service: 'Haarschnitt'
    },
    {
        id: 2,
        title: 'Farbe & Styling - Erika Mustermann',
        allDay: false,
        start: addHours(startOfHour(now), 1),
        end: addHours(startOfHour(now), 3),
        status: 'booked',
        employee: 'Ben',
        service: 'Farbe'
    },
    {
        id: 3,
        title: 'Blockiert - Mittagspause',
        allDay: false,
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0),
        status: 'blocked',
    },
    {
        id: 4,
        title: 'Freier Slot',
        allDay: false,
        start: addHours(startOfHour(now), 4),
        end: addHours(startOfHour(now), 5),
        status: 'free',
    },
];