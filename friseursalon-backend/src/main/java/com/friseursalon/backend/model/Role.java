package com.friseursalon.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "roles") // Wichtig: "user" ist ein reserviertes Wort in einigen DBs, daher "roles"
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING) // Speichert den Enum-Namen als String in der DB
    @Column(length = 20)
    private ERole name;
}