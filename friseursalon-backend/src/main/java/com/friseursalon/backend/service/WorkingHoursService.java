package com.friseursalon.backend.service;

import com.friseursalon.backend.model.WorkingHours;
import com.friseursalon.backend.repository.WorkingHoursRepository;
import org.slf4j.Logger; // Import für SLF4J Logger
import org.slf4j.LoggerFactory; // Import für SLF4J Logger
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class WorkingHoursService {

    private static final Logger logger = LoggerFactory.getLogger(WorkingHoursService.class); // Logger Instanz

    private final WorkingHoursRepository workingHoursRepository;

    @Autowired
    public WorkingHoursService(WorkingHoursRepository workingHoursRepository) {
        this.workingHoursRepository = workingHoursRepository;
    }

    @Transactional
    public WorkingHours setWorkingHours(DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime, boolean isClosed) {
        WorkingHours workingHours = workingHoursRepository.findByDayOfWeek(dayOfWeek)
                .orElse(new WorkingHours(dayOfWeek, startTime, endTime, isClosed));

        if (isClosed) {
            workingHours.setStartTime(null);
            workingHours.setEndTime(null);
        } else {
            workingHours.setStartTime(startTime);
            workingHours.setEndTime(endTime);
        }
        workingHours.setClosed(isClosed);
        logger.debug("Saving single working hours for {}: Start: {}, End: {}, Closed: {}", dayOfWeek, workingHours.getStartTime(), workingHours.getEndTime(), workingHours.isClosed());
        return workingHoursRepository.save(workingHours);
    }

    public Optional<WorkingHours> getWorkingHoursForDay(DayOfWeek dayOfWeek) {
        return workingHoursRepository.findByDayOfWeek(dayOfWeek);
    }

    public List<WorkingHours> getAllWorkingHours() {
        logger.info("getAllWorkingHours called. Fetching from DB and providing defaults.");
        return Arrays.stream(DayOfWeek.values())
                .map(day -> {
                    Optional<WorkingHours> optWh = workingHoursRepository.findByDayOfWeek(day);
                    if (optWh.isPresent()) {
                        WorkingHours whInDb = optWh.get();
                        // Logge den Zustand der Entität, wie sie aus der DB gelesen wurde
                        logger.info("DB Record for {}: ID: {}, Start: {}, End: {}, Closed: {}",
                                day, whInDb.getId(), whInDb.getStartTime(), whInDb.getEndTime(), whInDb.isClosed());
                        return whInDb;
                    } else {
                        // Logge, dass ein Standardwert verwendet wird
                        logger.info("No DB record for {}, providing default.", day);
                        if (day == DayOfWeek.SUNDAY) {
                            return new WorkingHours(day, null, null, true);
                        } else if (day == DayOfWeek.SATURDAY) {
                            return new WorkingHours(day, LocalTime.of(9,0), LocalTime.of(14,0), false);
                        } else {
                            return new WorkingHours(day, LocalTime.of(9,0), LocalTime.of(17,0), false);
                        }
                    }
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public List<WorkingHours> saveAllWorkingHours(List<WorkingHours> workingHoursListFromFrontend) {
        logger.info("Attempting to save all working hours. Input list size: {}", workingHoursListFromFrontend.size());

        List<WorkingHours> entitiesToSaveOrUpdate = workingHoursListFromFrontend.stream().map(whFromFrontend -> {
            logger.debug("Processing day from frontend: ID: {}, Day: {}, Start: {}, End: {}, Closed: {}",
                    whFromFrontend.getId(), whFromFrontend.getDayOfWeek(), whFromFrontend.getStartTime(), whFromFrontend.getEndTime(), whFromFrontend.isClosed());

            WorkingHours entityInDb = workingHoursRepository.findByDayOfWeek(whFromFrontend.getDayOfWeek())
                    .orElse(new WorkingHours());

            if (entityInDb.getId() == null) {
                logger.debug("No existing entity found for day {}. Creating new.", whFromFrontend.getDayOfWeek());
                entityInDb.setDayOfWeek(whFromFrontend.getDayOfWeek());
            } else {
                logger.debug("Found existing entity for day {} with ID: {}", whFromFrontend.getDayOfWeek(), entityInDb.getId());
            }

            if (whFromFrontend.isClosed()) {
                entityInDb.setStartTime(null);
                entityInDb.setEndTime(null);
                entityInDb.setClosed(true);
            } else {
                entityInDb.setStartTime(whFromFrontend.getStartTime());
                entityInDb.setEndTime(whFromFrontend.getEndTime());
                entityInDb.setClosed(false);
            }
            logger.debug("Prepared entity for save/update: ID: {}, Day: {}, Start: {}, End: {}, Closed: {}",
                    entityInDb.getId(), entityInDb.getDayOfWeek(), entityInDb.getStartTime(), entityInDb.getEndTime(), entityInDb.isClosed());
            return entityInDb;
        }).collect(Collectors.toList());

        logger.info("Calling saveAll with {} entities.", entitiesToSaveOrUpdate.size());
        entitiesToSaveOrUpdate.forEach(e -> logger.debug("Entity to save: ID: {}, Day: {}, Start: {}, End: {}, Closed: {}", e.getId(), e.getDayOfWeek(), e.getStartTime(), e.getEndTime(), e.isClosed()));

        List<WorkingHours> savedEntities = workingHoursRepository.saveAll(entitiesToSaveOrUpdate);
        logger.info("saveAll completed. Flushing changes...");
        workingHoursRepository.flush();
        logger.info("Changes flushed. saveAll returned {} entities.", savedEntities.size());
        savedEntities.forEach(e -> logger.info("Persisted entity state: ID: {}, Day: {}, Start: {}, End: {}, Closed: {}", e.getId(), e.getDayOfWeek(), e.getStartTime(), e.getEndTime(), e.isClosed()));

        return savedEntities;
    }
}
