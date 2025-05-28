package com.friseursalon.backend.repository;

import com.friseursalon.backend.model.WorkingHours;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.DayOfWeek;
import java.util.Optional;

public interface WorkingHoursRepository extends JpaRepository<WorkingHours, Long> {
    Optional<WorkingHours> findByDayOfWeek(DayOfWeek dayOfWeek);
}