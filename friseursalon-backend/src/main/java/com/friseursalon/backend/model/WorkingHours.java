package com.friseursalon.backend.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty; // Import für @JsonProperty
import jakarta.persistence.*;
import org.slf4j.Logger; // Import für SLF4J Logger
import org.slf4j.LoggerFactory; // Import für SLF4J Logger

import java.time.DayOfWeek;
import java.time.LocalTime;

@Entity
@Table(name = "working_hours")
public class WorkingHours {

    private static final Logger logger = LoggerFactory.getLogger(WorkingHours.class); // Logger Instanz

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private DayOfWeek dayOfWeek;

    @Column(name = "start_time")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @Column(name = "end_time")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    // Explizit @JsonProperty verwenden, um Jackson die genaue Zuordnung zu geben.
    // Der Feldname in Java ist 'isClosed'. Im JSON erwarten/senden wir auch 'isClosed'.
    @JsonProperty("isClosed")
    @Column(nullable = false)
    private boolean isClosed = false;

    public WorkingHours() {
    }

    public WorkingHours(DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime, boolean isClosed) {
        this.dayOfWeek = dayOfWeek;
        this.startTime = startTime;
        this.endTime = endTime;
        this.isClosed = isClosed;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public DayOfWeek getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(DayOfWeek dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    // Getter für boolean 'isClosed'
    // Jackson sollte dies korrekt als 'isClosed' im JSON erkennen, besonders mit @JsonProperty am Feld.
    @JsonProperty("isClosed")
    public boolean isClosed() {
        return isClosed;
    }

    // Setter für boolean 'isClosed'
    // @JsonProperty hier, um sicherzustellen, dass Jackson das JSON-Feld 'isClosed' hierhin mappt.
    @JsonProperty("isClosed")
    public void setClosed(boolean closed) {
        logger.debug("Setter setClosed({}) aufgerufen für Tag {}", closed, this.dayOfWeek != null ? this.dayOfWeek : "UNBEKANNT (vor dayOfWeek Zuweisung)");
        isClosed = closed;
    }

    @Override
    public String toString() {
        return "WorkingHours{" +
                "id=" + id +
                ", dayOfWeek=" + dayOfWeek +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                ", isClosed=" + isClosed + // Hier wird der Feldwert verwendet
                '}';
    }
}
