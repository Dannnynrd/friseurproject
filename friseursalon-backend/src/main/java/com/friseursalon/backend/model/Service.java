package com.friseursalon.backend.model;

import jakarta.persistence.Entity; // Für die @Entity Annotation
import jakarta.persistence.GeneratedValue; // Für die automatische ID-Generierung
import jakarta.persistence.GenerationType; // Für den Generierungstyp
import jakarta.persistence.Id; // Für die Primärschlüssel-Annotation
import lombok.Data; // Lombok Annotation für Getter, Setter, etc.
import lombok.NoArgsConstructor; // Lombok für einen leeren Konstruktor
import lombok.AllArgsConstructor; // Lombok für einen Konstruktor mit allen Argumenten

@Entity // Markiert diese Klasse als JPA-Entität (wird zu einer Datenbanktabelle)
@Data // Lombok: Generiert Getter, Setter, toString, equals, hashCode automatisch
@NoArgsConstructor // Lombok: Generiert einen Konstruktor ohne Argumente
@AllArgsConstructor // Lombok: Generiert einen Konstruktor mit allen Argumenten
public class Service {

    @Id // Markiert 'id' als Primärschlüssel
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Sagt der Datenbank, dass sie die ID automatisch inkrementieren soll
    private Long id; // Eindeutiger Bezeichner für die Dienstleistung

    private String name; // Name der Dienstleistung (z.B. "Haarschnitt Herren")
    private String description; // Beschreibung der Dienstleistung
    private double price; // Preis der Dienstleistung
    private int durationMinutes; // Dauer der Dienstleistung in Minuten
}