// src/utils/ics.js

/**
 * Generiert eine .ics-Datei für einen Termin und löst den Download aus.
 * @param {object} appointment - Das Terminobjekt aus dem Backend.
 * Muss `id`, `startTime` und ein `service`-Objekt mit `name` und `durationMinutes` enthalten.
 */
export function generateICS(appointment) {
    if (!appointment || !appointment.service || !appointment.startTime || !appointment.id) {
        console.error("Ungültige Termindaten für ICS-Generierung:", appointment);
        alert("Fehler: Termindaten sind unvollständig, Kalendereintrag kann nicht erstellt werden.");
        return;
    }

    const { service, startTime } = appointment;
    const date = new Date(startTime);
    const endDate = new Date(date.getTime() + (service.durationMinutes || 60) * 60000);

    // Konvertiert ein JS-Datum in das ICS-Format (YYYYMMDDTHHMMSSZ)
    const toICSDate = (d) => {
        return d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
    };

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//IhrSalonName//Termin//DE',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `UID:${appointment.id}@ihrsalon.de`, // Eindeutige ID für den Termin
        `DTSTAMP:${toICSDate(new Date())}`,
        `DTSTART:${toICSDate(date)}`,
        `DTEND:${toICSDate(endDate)}`,
        `SUMMARY:Ihr Friseurtermin: ${service.name}`,
        `DESCRIPTION:Ihr gebuchter Termin für die Dienstleistung "${service.name}". Wir freuen uns auf Ihren Besuch!`,
        'LOCATION:IMW Salon, Musterstraße 123, 24105 Kiel', // Passen Sie die Adresse an
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = `termin_${service.name.replace(/\s+/g, '_')}.ics`;

    // Unsichtbaren Link zum DOM hinzufügen, klicken und wieder entfernen
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
