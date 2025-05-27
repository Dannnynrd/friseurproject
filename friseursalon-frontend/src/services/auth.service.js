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
                email,
                password
            })
            .then(response => {
                if (response.data.token) {
                    localStorage.setItem("user", JSON.stringify(response.data));
                }
                return response.data;
            })
            .catch(error => {
                // Wenn das Backend eine strukturierte Fehlermeldung sendet, diese weitergeben
                if (error.response && error.response.data) {
                    throw error.response.data;
                }
                throw error; // Andernfalls den ursprünglichen Fehler weiterwerfen
            });
    }

    logout() {
        localStorage.removeItem("user");
    }

    register(firstName, lastName, email, password, phoneNumber, roles) {
        return api.post("auth/signup", {
            firstName,
            lastName,
            email,
            password,
            phoneNumber,
            role: roles || ["user"]
        })
            .then(response => {
                return response.data;
            })
            .catch(error => {
                if (error.response && error.response.data) {
                    throw error.response.data;
                }
                throw error;
            });
    }

    getCurrentUser() {
        const userStr = localStorage.getItem("user");
        if (userStr) return JSON.parse(userStr);
        return null;
    }

    getToken() {
        const user = this.getCurrentUser();
        return user ? user.token : null;
    }
}

// Instanz der Klasse erstellen und dann exportieren
const authService = new AuthService();
export default authService;