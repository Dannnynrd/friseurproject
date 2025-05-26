// Importiert die globale Axios-Instanz, die bereits Interceptoren für Basis-URL und Authentifizierungstoken enthält.
import api from "./api.service";

// Die AuthService Klasse: Verwaltet die Benutzerauthentifizierung und -registrierung
class AuthService {
    // Meldet einen Benutzer an
    // Parameter:
    // - email: Die E-Mail-Adresse des Benutzers (wird als Benutzername für den Login verwendet)
    // - password: Das Passwort des Benutzers
    login(email, password) {
        return api // Nutzt die globale Axios-Instanz
            .post("auth/signin", { // Sendet eine POST-Anfrage an den "/api/auth/signin" Endpunkt
                // Die baseURL ("http://localhost:8080/api/") wird automatisch von der 'api'-Instanz vorangestellt.
                email, // E-Mail des Benutzers
                password // Passwort des Benutzers
            })
            .then(response => {
                // Wenn die Antwort einen Token enthält (erfolgreicher Login)
                if (response.data.token) {
                    // Speichert die Benutzerdaten (inklusive Token) im Local Storage des Browsers.
                    // JSON.stringify ist notwendig, da Local Storage nur Strings speichern kann.
                    localStorage.setItem("user", JSON.stringify(response.data));
                }
                // Gibt die Daten der Antwort zurück (enthält Token, Benutzer-ID, Rollen etc.)
                return response.data;
            });
    }

    // Meldet einen Benutzer ab
    logout() {
        // Entfernt die Benutzerdaten und den Token aus dem Local Storage.
        // Dies ist der Standardweg, um einen Benutzer im Frontend auszuloggen.
        localStorage.removeItem("user");
    }

    // Registriert einen neuen Benutzer
    // Parameter:
    // - firstName: Vorname des neuen Benutzers
    // - lastName: Nachname des neuen Benutzers
    // - email: E-Mail-Adresse des neuen Benutzers
    // - password: Passwort für den neuen Benutzer
    // - phoneNumber: Telefonnummer des neuen Benutzers (optional)
    // - roles: Ein Set von Rollen-Strings (z.B. ["user", "admin"]). Standard ist ["user"].
    register(firstName, lastName, email, password, phoneNumber, roles) {
        return api.post("auth/signup", { // Sendet eine POST-Anfrage an den "/api/auth/signup" Endpunkt
            firstName,
            lastName,
            email,
            password,
            phoneNumber,
            role: roles || ["user"] // Setzt Standardrolle auf "user", falls keine angegeben
        });
    }

    // Ruft die aktuellen Benutzerdaten aus dem Local Storage ab
    getCurrentUser() {
        // Holt den "user"-Eintrag aus dem Local Storage
        const userStr = localStorage.getItem("user");
        // Wenn ein Eintrag vorhanden ist, parse ihn von JSON zurück zu einem Objekt.
        if (userStr) return JSON.parse(userStr);
        // Andernfalls gib null zurück (kein Benutzer angemeldet).
        return null;
    }

    // Ruft nur den JWT-Token aus dem Local Storage ab
    getToken() {
        // Holt den aktuellen Benutzer
        const user = this.getCurrentUser();
        // Wenn ein Benutzer vorhanden ist und einen Token hat, gib den Token zurück.
        // Andernfalls gib null zurück.
        return user ? user.token : null;
    }
}

// Exportiert eine einzelne, neue Instanz des AuthService.
// Dies ermöglicht es anderen Teilen der Anwendung, AuthService.login(), AuthService.logout() etc. direkt aufzurufen.
export default new AuthService();
