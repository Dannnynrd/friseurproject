package com.friseursalon.backend.service;

import com.friseursalon.backend.model.Appointment;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.time.format.FormatStyle;
import java.util.Locale;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Autowired
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendPasswordResetEmail(String to, String token, String baseUrl) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Passwort zurücksetzen für Ihren IMW Salon Account");
        message.setText("Um Ihr Passwort zurückzusetzen, klicken Sie bitte auf den folgenden Link: \n\n"
                + baseUrl + "/passwort-zuruecksetzen?token=" + token + "\n\n"
                + "Wenn Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.");
        mailSender.send(message);
    }

    /**
     * NEU: Sendet eine Bestätigungs-E-Mail für einen neu erstellten Termin.
     * Diese Methode wird asynchron ausgeführt.
     * @param appointment Der erstellte Termin mit allen relevanten Daten.
     */
    @Async
    public void sendAppointmentConfirmationEmail(Appointment appointment) {
        if (appointment.getCustomer() == null || appointment.getCustomer().getEmail() == null) {
            // Loggen oder Fehlerbehandlung, falls keine E-Mail-Adresse vorhanden ist.
            System.err.println("Fehler: Kunde oder E-Mail-Adresse für Termin " + appointment.getId() + " ist null.");
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(appointment.getCustomer().getEmail());
        message.setSubject("Ihre Terminbestätigung bei IMW Salon");

        // Formatierer für Datum und Zeit auf Deutsch
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofLocalizedDate(FormatStyle.LONG).withLocale(Locale.GERMAN);
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm", Locale.GERMAN);

        String text = String.format(
                "Hallo %s %s,\n\n" +
                        "vielen Dank für Ihre Buchung. Ihr Termin wurde erfolgreich bestätigt.\n\n" +
                        "Hier sind die Details:\n" +
                        "- Dienstleistung: %s\n" +
                        "- Datum: %s\n" +
                        "- Uhrzeit: %s Uhr\n\n" +
                        "Wir freuen uns auf Ihren Besuch!\n\n" +
                        "Mit freundlichen Grüßen,\n" +
                        "Ihr Team vom IMW Salon",
                appointment.getCustomer().getFirstName(),
                appointment.getCustomer().getLastName(),
                appointment.getService().getName(),
                appointment.getStartTime().format(dateFormatter),
                appointment.getStartTime().format(timeFormatter)
        );

        message.setText(text);
        mailSender.send(message);
    }
}
