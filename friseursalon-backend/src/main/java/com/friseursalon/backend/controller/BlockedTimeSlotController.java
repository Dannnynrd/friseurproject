package com.friseursalon.backend.controller;

import com.friseursalon.backend.model.BlockedTimeSlot;
import com.friseursalon.backend.payload.response.MessageResponse;
import com.friseursalon.backend.service.BlockedTimeSlotService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/blockedtimeslots")
@CrossOrigin(origins = "http://localhost:3000")
public class BlockedTimeSlotController {

    private static final Logger controllerLogger = LoggerFactory.getLogger(BlockedTimeSlotController.class);

    private final BlockedTimeSlotService blockedTimeSlotService;

    @Autowired
    public BlockedTimeSlotController(BlockedTimeSlotService blockedTimeSlotService) {
        this.blockedTimeSlotService = blockedTimeSlotService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createBlockedTimeSlot(@Valid @RequestBody BlockedTimeSlot blockedTimeSlot) {
        controllerLogger.info("POST /api/blockedtimeslots - Empfangener Request Body: {}", blockedTimeSlot);
        // Logging mit dem neuen Feldnamen
        controllerLogger.info("repeating Wert im empfangenen Request: {}", blockedTimeSlot.isRepeating()); // <<<--- Angepasst
        controllerLogger.info("specificDate Wert im empfangenen Request: {}", blockedTimeSlot.getSpecificDate());
        controllerLogger.info("recurringDayOfWeek Wert im empfangenen Request: {}", blockedTimeSlot.getRecurringDayOfWeek());

        try {
            BlockedTimeSlot createdSlot = blockedTimeSlotService.createBlockedTimeSlot(blockedTimeSlot);
            return new ResponseEntity<>(createdSlot, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            controllerLogger.warn("IllegalArgumentException beim Erstellen von BlockedTimeSlot: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            controllerLogger.error("Unerwarteter Fehler beim Erstellen von BlockedTimeSlot", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new MessageResponse("Interner Serverfehler beim Erstellen der Blockade."));
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BlockedTimeSlot>> getAllBlockedTimeSlots() {
        controllerLogger.info("GET /api/blockedtimeslots - getAllBlockedTimeSlots aufgerufen");
        return ResponseEntity.ok(blockedTimeSlotService.getAllBlockedTimeSlots());
    }

    @GetMapping("/date/{date}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<BlockedTimeSlot>> getBlocksForDate(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        controllerLogger.info("GET /api/blockedtimeslots/date/{} aufgerufen", date);
        return ResponseEntity.ok(blockedTimeSlotService.getBlocksForDate(date));
    }


    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BlockedTimeSlot> getBlockedTimeSlotById(@PathVariable Long id) {
        controllerLogger.info("GET /api/blockedtimeslots/{} aufgerufen", id);
        return blockedTimeSlotService.getBlockedTimeSlotById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateBlockedTimeSlot(@PathVariable Long id, @Valid @RequestBody BlockedTimeSlot blockedTimeSlotDetails) {
        controllerLogger.info("PUT /api/blockedtimeslots/{} - Empfangener Request Body: {}", id, blockedTimeSlotDetails);
        controllerLogger.info("repeating Wert im empfangenen Update-Request: {}", blockedTimeSlotDetails.isRepeating()); // <<<--- Angepasst
        controllerLogger.info("specificDate Wert im empfangenen Update-Request: {}", blockedTimeSlotDetails.getSpecificDate());
        controllerLogger.info("recurringDayOfWeek Wert im empfangenen Update-Request: {}", blockedTimeSlotDetails.getRecurringDayOfWeek());
        try {
            BlockedTimeSlot updatedSlot = blockedTimeSlotService.updateBlockedTimeSlot(id, blockedTimeSlotDetails);
            return ResponseEntity.ok(updatedSlot);
        } catch (IllegalArgumentException e) {
            controllerLogger.warn("IllegalArgumentException beim Update von BlockedTimeSlot {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (RuntimeException ex) {
            controllerLogger.warn("RuntimeException beim Update von BlockedTimeSlot {}: {}", id, ex.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(ex.getMessage()));
        }
        catch (Exception e) {
            controllerLogger.error("Unerwarteter Fehler beim Update von BlockedTimeSlot {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new MessageResponse("Interner Serverfehler beim Aktualisieren der Blockade."));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteBlockedTimeSlot(@PathVariable Long id) {
        controllerLogger.info("DELETE /api/blockedtimeslots/{} aufgerufen", id);
        try {
            blockedTimeSlotService.deleteBlockedTimeSlot(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException ex) {
            controllerLogger.warn("RuntimeException beim Löschen von BlockedTimeSlot {}: {}",id, ex.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(ex.getMessage()));
        }
        catch (Exception e) {
            controllerLogger.error("Unerwarteter Fehler beim Löschen von BlockedTimeSlot {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new MessageResponse("Interner Serverfehler beim Löschen der Blockade."));
        }
    }
}