package com.friseursalon.backend.security.details;

import com.friseursalon.backend.model.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

public class UserDetailsImpl implements UserDetails {
    private static final long serialVersionUID = 1L;

    private Long id;
    // private String username; // DIESE ZEILE ENTFERNEN (Email wird jetzt der Username)
    private String email; // Bleibt
    private String password;

    // NEUE FELDER HINZUFÜGEN
    private String firstName;
    private String lastName;
    private String phoneNumber;

    private Collection<? extends GrantedAuthority> authorities;

    // Konstruktor anpassen
    public UserDetailsImpl(Long id, String email, String password, String firstName, String lastName, String phoneNumber,
                           Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.authorities = authorities;
    }

    // Factory-Methode zum Erstellen aus deinem User-Modell anpassen
    public static UserDetailsImpl build(User user) {
        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName().name()))
                .collect(Collectors.toList());

        return new UserDetailsImpl(
                user.getId(),
                user.getEmail(), // Email als "Username" für UserDetailsImpl
                user.getPassword(),
                user.getFirstName(), // NEUES FELD
                user.getLastName(),  // NEUES FELD
                user.getPhoneNumber(), // NEUES FELD
                authorities);
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getFirstName() { return firstName; } // NEUER GETTER
    public String getLastName() { return lastName; }   // NEUER GETTER
    public String getPhoneNumber() { return phoneNumber; } // NEUER GETTER


    @Override
    public String getUsername() {
        return email; // WICHTIG: Email wird jetzt als Benutzername zurückgegeben
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    // Standard-Methoden von UserDetails
    @Override
    public boolean isAccountNonExpired() { return true; }
    @Override
    public boolean isAccountNonLocked() { return true; }
    @Override
    public boolean isCredentialsNonExpired() { return true; }
    @Override
    public boolean isEnabled() { return true; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserDetailsImpl user = (UserDetailsImpl) o;
        return Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}