package com.friseursalon.backend.repository;

import com.friseursalon.backend.model.BlockedTimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface BlockedTimeSlotRepository extends JpaRepository<BlockedTimeSlot, Long> {

    @Query("SELECT b FROM BlockedTimeSlot b WHERE " +
            "(b.repeating = false AND b.specificDate = :date) OR " + // <<<--- Angepasst von b.isRecurring
            "(b.repeating = true AND b.recurringDayOfWeek = :dayOfWeek)") // <<<--- Angepasst von b.isRecurring
    List<BlockedTimeSlot> findBlocksForDate(@Param("date") LocalDate date, @Param("dayOfWeek") DayOfWeek dayOfWeek);

    // Die folgenden Methoden greifen direkt auf Feldnamen zu, was okay sein sollte
    List<BlockedTimeSlot> findBySpecificDateAndRepeatingFalse(LocalDate specificDate); // <<<--- Angepasst

    List<BlockedTimeSlot> findByRecurringDayOfWeekAndRepeatingTrue(DayOfWeek dayOfWeek); // <<<--- Angepasst
}