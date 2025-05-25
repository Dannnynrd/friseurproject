package com.friseursalon.backend.security.jwt;

import com.friseursalon.backend.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class AuthTokenFilter extends OncePerRequestFilter {
    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserService userService; // Hier ist dein UserService gemeint

    private static final Logger logger = LoggerFactory.getLogger(AuthTokenFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = jwtUtils.parseJwt(request); // JWT aus dem Request extrahieren
            if (jwt != null && jwtUtils.validateJwtToken(jwt)) { // JWT validieren
                String username = jwtUtils.getUserNameFromJwtToken(jwt); // Benutzername aus JWT holen

                UserDetails userDetails = userService.loadUserByUsername(username); // Benutzerdetails laden

                // Authentifizierungsobjekt erstellen
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null, // Kein Passwort hier, da JWT schon authentifiziert ist
                                userDetails.getAuthorities()); // Rollen/Authorities des Benutzers

                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Benutzer im SecurityContextHolder setzen (so dass Spring Security ihn als authentifiziert erkennt)
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            logger.error("Kann Benutzerauthentifizierung nicht setzen: {}", e.getMessage());
        }

        filterChain.doFilter(request, response); // Anfrage zur nächsten Filterkette weiterleiten
    }
}