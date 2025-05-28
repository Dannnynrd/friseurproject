package com.friseursalon.backend.service;

import com.friseursalon.backend.model.BlockedTimeSlot;
import com.friseursalon.backend.repository.BlockedTimeSlotRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class BlockedTimeSlotService {

    private static final Logger logger = LoggerFactory.getLogger(BlockedTimeSlotService.class);
    private final BlockedTimeSlotRepository blockedTimeSlotRepository;

    @Autowired
    public BlockedTimeSlotService(BlockedTimeSlotRepository blockedTimeSlotRepository) {
        this.blockedTimeSlotRepository = blockedTimeSlotRepository;
    }

    @Transactional
    public BlockedTimeSlot createBlockedTimeSlot(BlockedTimeSlot slot) {
        if (slot.getStartTime() == null || slot.getEndTime() == null) {
            logger.warn("Start- oder Endzeit ist null für neue Blockade: {}", slot);
            throw new IllegalArgumentException("Start- und Endzeit dürfen nicht leer sein.");
        }
        if (slot.getStartTime().isAfter(slot.getEndTime()) || slot.getStartTime().equals(slot.getEndTime())) {
            logger.warn("Ungültige Zeit für Blockade: Start {}, Ende {}", slot.getStartTime(), slot.getEndTime());
            throw new IllegalArgumentException("Die Endzeit muss nach der Startzeit liegen.");
        }

        if (slot.isRepeating()) { // <<<--- Angepasst
            slot.setSpecificDate(null);
            if (slot.getRecurringDayOfWeek() == null) {
                logger.warn("Fehlender Wochentag für wiederkehrende Blockade: {}", slot);
                throw new IllegalArgumentException("Für wiederkehrende Blockaden muss ein Wochentag angegeben werden.");
            }
        } else {
            slot.setRecurringDayOfWeek(null);
            if (slot.getSpecificDate() == null) {
                logger.warn("Fehlendes Datum für einmalige Blockade: {}", slot);
                throw new IllegalArgumentException("Für einmalige Blockaden muss ein spezifisches Datum angegeben werden.");
            }
        }
        logger.info("Erstelle geblockten Zeitslot: {}", slot);
        return blockedTimeSlotRepository.save(slot);
    }

    public List<BlockedTimeSlot> getAllBlockedTimeSlots() {
        return blockedTimeSlotRepository.findAll();
    }

    public Optional<BlockedTimeSlot> getBlockedTimeSlotById(Long id) {
        return blockedTimeSlotRepository.findById(id);
    }

    @Transactional
    public BlockedTimeSlot updateBlockedTimeSlot(Long id, BlockedTimeSlot slotDetails) {
        BlockedTimeSlot existingSlot = blockedTimeSlotRepository.findById(id)
                .orElseThrow(() -> {
                    logger.warn("BlockedTimeSlot mit ID {} nicht gefunden für Update.", id);
                    return new RuntimeException("Geblockter Zeitslot nicht gefunden für ID: " + id);
                });

        if (slotDetails.getStartTime() == null || slotDetails.getEndTime() == null) {
            logger.warn("Start- oder Endzeit ist null für Update von Blockade {}: {}", id, slotDetails);
            throw new IllegalArgumentException("Start- und Endzeit dürfen nicht leer sein.");
        }
        if (slotDetails.getStartTime().isAfter(slotDetails.getEndTime()) || slotDetails.getStartTime().equals(slotDetails.getEndTime())) {
            logger.warn("Ungültige Zeit für Update von Blockade {}: Start {}, Ende {}", id, slotDetails.getStartTime(), slotDetails.getEndTime());
            throw new IllegalArgumentException("Die Endzeit muss nach der Startzeit liegen.");
        }

        existingSlot.setDescription(slotDetails.getDescription());
        existingSlot.setStartTime(slotDetails.getStartTime());
        existingSlot.setEndTime(slotDetails.getEndTime());
        existingSlot.setRepeating(slotDetails.isRepeating()); // <<<--- Angepasst

        if (existingSlot.isRepeating()) { // <<<--- Angepasst
            existingSlot.setSpecificDate(null);
            existingSlot.setRecurringDayOfWeek(slotDetails.getRecurringDayOfWeek());
            if (existingSlot.getRecurringDayOfWeek() == null) {
                logger.warn("Fehlender Wochentag für Update von wiederkehrender Blockade {}: {}", id, existingSlot);
                throw new IllegalArgumentException("Für wiederkehrende Blockaden muss ein Wochentag angegeben werden.");
            }
        } else {
            existingSlot.setRecurringDayOfWeek(null);
            existingSlot.setSpecificDate(slotDetails.getSpecificDate());
            if (existingSlot.getSpecificDate() == null) {
                logger.warn("Fehlendes Datum für Update von einmaliger Blockade {}: {}", id, existingSlot);
                throw new IllegalArgumentException("Für einmalige Blockaden muss ein spezifisches Datum angegeben werden.");
            }
        }

        logger.info("Aktualisiere geblockten Zeitslot mit ID {}: {}", id, existingSlot);
        return blockedTimeSlotRepository.save(existingSlot);
    }

    @Transactional
    public void deleteBlockedTimeSlot(Long id) {
        if (!blockedTimeSlotRepository.existsById(id)) {
            logger.warn("BlockedTimeSlot mit ID {} nicht gefunden zum Löschen.", id);
            throw new RuntimeException("Geblockter Zeitslot nicht gefunden für ID: " + id);
        }
        logger.info("Lösche geblockten Zeitslot mit ID: {}", id);
        blockedTimeSlotRepository.deleteById(id);
    }

    public List<BlockedTimeSlot> getBlocksForDate(LocalDate date) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        logger.debug("Suche Blockaden für Datum {} (Wochentag: {})", date, dayOfWeek);
        // Query muss eventuell angepasst werden, wenn Spaltennamen sich ändern (sollte aber nicht, da nur Feldname geändert)
        List<BlockedTimeSlot> blocks = blockedTimeSlotRepository.findBlocksForDate(date, dayOfWeek);
        logger.debug("{} Blockaden gefunden für {}", blocks.size(), date);
        return blocks;
    }
}