// friseursalon-backend/src/main/java/com/friseursalon/backend/service/EmailService.java
package com.friseursalon.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Autowired
    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String to, String token, String baseUrl) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Passwort zurücksetzen für Ihren IMW Salon Account");
        message.setText("Um Ihr Passwort zurückzusetzen, klicken Sie bitte auf den folgenden Link: \n\n"
                + baseUrl + "/passwort-zuruecksetzen?token=" + token + "\n\n"
                + "Wenn Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.");
        mailSender.send(message);
    }
}