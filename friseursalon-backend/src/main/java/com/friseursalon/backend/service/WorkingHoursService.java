package com.friseursalon.backend.service;

import com.friseursalon.backend.model.WorkingHours;
import com.friseursalon.backend.repository.WorkingHoursRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class WorkingHoursService {

    private final WorkingHoursRepository workingHoursRepository;

    @Autowired
    public WorkingHoursService(WorkingHoursRepository workingHoursRepository) {
        this.workingHoursRepository = workingHoursRepository;
    }

    @Transactional
    public WorkingHours setWorkingHours(DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime, boolean isClosed) {
        WorkingHours workingHours = workingHoursRepository.findByDayOfWeek(dayOfWeek)
                .orElse(new WorkingHours(dayOfWeek, startTime, endTime, isClosed));

        workingHours.setStartTime(startTime);
        workingHours.setEndTime(endTime);
        workingHours.setClosed(isClosed);
        return workingHoursRepository.save(workingHours);
    }

    public Optional<WorkingHours> getWorkingHoursForDay(DayOfWeek dayOfWeek) {
        return workingHoursRepository.findByDayOfWeek(dayOfWeek);
    }

    public List<WorkingHours> getAllWorkingHours() {
        return workingHoursRepository.findAll();
    }
}