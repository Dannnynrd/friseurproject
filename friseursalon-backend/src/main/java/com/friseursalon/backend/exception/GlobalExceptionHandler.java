package com.friseursalon.backend.exception;

import com.friseursalon.backend.payload.response.MessageResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Order(Ordered.HIGHEST_PRECEDENCE) // Gibt diesem Handler eine hohe Priorität
@ControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    // Logger für diese Klasse
    private static final Logger globalExceptionLogger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Behandelt Validierungsfehler (z.B. @Valid in Controllern), überschreibt die Standardmethode
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, @NonNull HttpHeaders headers,
            @NonNull HttpStatusCode status, @NonNull WebRequest request) {

        globalExceptionLogger.warn("Validierungsfehler: {}", ex.getMessage());

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString()); // Zeitstempel als String für Konsistenz
        body.put("status", status.value());

        // Sammelt alle Feldfehler mit Feldname und Nachricht
        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(x -> x.getField() + ": " + x.getDefaultMessage())
                .collect(Collectors.toList());

        body.put("errors", errors);
        body.put("message", "Validierungsfehler aufgetreten"); // Allgemeine Nachricht für den Fehler-Typ

        return new ResponseEntity<>(body, headers, status);
    }

    // Handler für Ihre benutzerdefinierte AppointmentConflictException
    @ExceptionHandler(AppointmentConflictException.class)
    public ResponseEntity<MessageResponse> handleAppointmentConflictException(AppointmentConflictException ex, WebRequest request) {
        globalExceptionLogger.warn("Terminkonflikt: {} - Anfrage: {}", ex.getMessage(), request.getDescription(false));
        MessageResponse messageResponse = new MessageResponse(ex.getMessage());
        return new ResponseEntity<>(messageResponse, HttpStatus.CONFLICT); // 409 Conflict
    }

    // Handler für IllegalArgumentException
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<MessageResponse> handleIllegalArgumentException(IllegalArgumentException ex, WebRequest request) {
        globalExceptionLogger.warn("Ungültiges Argument: {} - Anfrage: {}", ex.getMessage(), request.getDescription(false));
        // Es ist oft besser, die genaue ex.getMessage() nicht immer an den Client zu senden,
        // aber für Debugging-Zwecke oder wenn die Nachrichten sicher sind, kann es nützlich sein.
        MessageResponse messageResponse = new MessageResponse("Ungültige Anfrage: " + ex.getMessage());
        return new ResponseEntity<>(messageResponse, HttpStatus.BAD_REQUEST); // 400 Bad Request
    }

    // Handler für DateTimeParseException
    @ExceptionHandler(DateTimeParseException.class)
    public ResponseEntity<MessageResponse> handleDateTimeParseException(DateTimeParseException ex, WebRequest request) {
        globalExceptionLogger.warn("Fehler beim Parsen des Datums: {} - Eingabe: '{}' - Anfrage: {}", ex.getMessage(), ex.getParsedString(), request.getDescription(false));
        MessageResponse messageResponse = new MessageResponse("Ungültiges Datums- oder Zeitformat. Details: " + ex.getMessage());
        return new ResponseEntity<>(messageResponse, HttpStatus.BAD_REQUEST);
    }

    // Sie könnten eine spezifischere "ResourceNotFoundException" erstellen und hier behandeln:
    // @ExceptionHandler(ResourceNotFoundException.class)
    // public ResponseEntity<MessageResponse> handleResourceNotFoundException(ResourceNotFoundException ex, WebRequest request) {
    //     globalExceptionLogger.warn("Ressource nicht gefunden: {} - Anfrage: {}", ex.getMessage(), request.getDescription(false));
    //     MessageResponse messageResponse = new MessageResponse(ex.getMessage());
    //     return new ResponseEntity<>(messageResponse, HttpStatus.NOT_FOUND);
    // }

    // Allgemeiner Handler für andere RuntimeExceptions, die nicht spezifischer abgefangen wurden
    // Dieser sollte als letzter Fallback dienen.
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<MessageResponse> handleGenericRuntimeException(RuntimeException ex, WebRequest request) {
        globalExceptionLogger.error("Unerwarteter Laufzeitfehler - Anfrage: {}", request.getDescription(false), ex); // Loggt den Stacktrace
        // Für den Client eine generische Nachricht senden, um Interna nicht preiszugeben
        MessageResponse messageResponse = new MessageResponse("Ein unerwarteter interner Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.");
        return new ResponseEntity<>(messageResponse, HttpStatus.INTERNAL_SERVER_ERROR); // 500 Internal Server Error
    }

    // Handler für alle anderen Exceptions (Fallback, falls nichts anderes zutrifft)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<MessageResponse> handleAllOtherExceptions(Exception ex, WebRequest request) {
        globalExceptionLogger.error("Allgemeiner Fehler - Anfrage: {}", request.getDescription(false), ex);
        MessageResponse messageResponse = new MessageResponse("Ein allgemeiner Fehler ist aufgetreten.");
        return new ResponseEntity<>(messageResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}