package com.friseursalon.backend.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.security.Key;
import java.util.Date;

@Component // Markiert diese Klasse als Spring-Komponente
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${jwt.secret}") // Wert aus application.properties injizieren
    private String jwtSecret;

    @Value("${jwt.expirationMs}") // Wert aus application.properties injizieren
    private int jwtExpirationMs;

    // Methode zum Generieren des JWTs
    public String generateJwtToken(UserDetails userDetails) {
        return Jwts.builder()
                .setSubject((userDetails.getUsername())) // Benutzername als Subjekt
                .setIssuedAt(new Date()) // Ausstellungsdatum
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs)) // Ablaufdatum
                .signWith(key(), SignatureAlgorithm.HS512) // Signieren mit geheimem Schlüssel und Algorithmus
                .compact(); // Zusammenfassen zu String
    }

    private Key key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret)); // Schlüssel dekodieren
    }

    // Methode zum Extrahieren des Benutzernamens aus dem JWT
    public String getUserNameFromJwtToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key()).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    // Methode zum Validieren des JWTs
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(key()).build().parse(authToken);
            return true;
        } catch (MalformedJwtException e) {
            logger.error("Ungültiges JWT Token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JWT Token ist abgelaufen: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT Token wird nicht unterstützt: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT Claims String ist leer: {}", e.getMessage());
        }
        return false;
    }

    // Methode zum Parsen des JWTs aus dem Request Header (Bearer Token)
    public String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7); // "Bearer " Teil entfernen
        }
        return null;
    }
}