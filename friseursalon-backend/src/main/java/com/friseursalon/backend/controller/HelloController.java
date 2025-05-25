package com.friseursalon.backend.controller;

import org.springframework.web.bind.annotation.CrossOrigin; // Diesen Import hinzufügen!
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController // Markiert die Klasse als REST Controller
@RequestMapping("/api/hello") // Basis-Pfad für alle Endpunkte in diesem Controller
@CrossOrigin(origins = "http://localhost:3000") // CORS erlauben für das Frontend
public class HelloController {

    @GetMapping // Behandelt GET-Anfragen an /api/hello
    public String sayHello() {
        return "Hallo vom Friseursalon Backend!";
    }
}