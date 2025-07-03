// friseursalon-frontend/src/utils/ics.js

export function generateICS(appointment) {
    const { service, startTime, id } = appointment;
    const date = new Date(startTime);
    const endDate = new Date(date.getTime() + (service.durationMinutes || 60) * 60000);

    const toICSDate = (d) => d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//IhrSalonName//Termin//DE',
        'BEGIN:VEVENT',
        `UID:${id}@ihrsalon.de`,
        `DTSTAMP:${toICSDate(new Date())}`,
        `DTSTART:${toICSDate(date)}`,
        `DTEND:${toICSDate(endDate)}`,
        `SUMMARY:${service.name}`,
        `DESCRIPTION:Ihr Termin für ${service.name}. Wir freuen uns auf Sie!`,
        'LOCATION:Ihr Salon, Musterstraße 1, 12345 Musterstadt',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `termin_${service.name.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}