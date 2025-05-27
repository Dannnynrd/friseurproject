package com.friseursalon.backend.exception;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    // Behandelt Validierungsfehler (z.B. @Valid in Controllern)
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());

        // Sammelt alle Feldfehler
        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(x -> x.getField() + ": " + x.getDefaultMessage())
                .collect(Collectors.toList());

        body.put("errors", errors);

        return new ResponseEntity<>(body, headers, status);
    }

    // Behandelt allgemeine RuntimeExceptions (z.B. "nicht gefunden")
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Object> handleRuntimeException(RuntimeException ex, WebRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value()); // Allgemeiner Serverfehler
        body.put("error", "Internal Server Error");
        body.put("message", ex.getMessage()); // Die Nachricht aus der Exception
        body.put("path", request.getDescription(false).replace("uri=", ""));

        // Spezifischere Statuscodes für häufige RuntimeException-Nachrichten
        if (ex.getMessage() != null) {
            String message = ex.getMessage().toLowerCase();
            if (message.contains("nicht gefunden") || message.contains("not found")) {
                body.put("status", HttpStatus.NOT_FOUND.value());
                body.put("error", "Not Found");
                return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
            }
            if (message.contains("bereits vergeben") || message.contains("already exists") || message.contains("e-mail ist bereits vergeben")) {
                body.put("status", HttpStatus.CONFLICT.value());
                body.put("error", "Conflict");
                // Die MessageResponse aus dem AuthController ist hier spezifischer
                if (ex.getMessage().equals("Fehler: E-Mail ist bereits vergeben!")) {
                    body.put("message", ex.getMessage());
                } else {
                    body.put("message", "Eine Ressource mit diesen Daten existiert bereits.");
                }
                return new ResponseEntity<>(body, HttpStatus.CONFLICT);
            }
            // Hier könnten weitere spezifische Behandlungen hinzugefügt werden
        }

        return new ResponseEntity<>(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Du kannst hier weitere @ExceptionHandler-Methoden für andere spezifische Exceptions hinzufügen,
    // z.B. für Authentifizierungs- oder Autorisierungsfehler, falls notwendig.
}