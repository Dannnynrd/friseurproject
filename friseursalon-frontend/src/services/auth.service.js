// src/services/auth.service.js
import api from "./api.service"; // Stellt sicher, dass api.service.js korrekt importiert wird
import EventBus from "../common/EventBus";

// Die Basis-URL für Authentifizierungs-Endpunkte, relativ zur API_BASE_URL in api.service.js
const AUTH_API_PATH = "auth/"; // Relativer Pfad für Authentifizierung
// Die Basis-URL für Benutzer-bezogene Aktionen, relativ zur API_BASE_URL in api.service.js
const USER_API_PATH = "users/"; // Relativer Pfad für Benutzeraktionen

const register = (firstName, lastName, email, password, phoneNumber) => {
    return api.post(AUTH_API_PATH + "signup", { // Verwendet relativen Pfad
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        // Die Rolle wird serverseitig standardmäßig auf ROLE_USER gesetzt,
        // es sei denn, es wird explizit anders im Backend gehandhabt.
        // Für eine explizite Rollenzuweisung müsste das SignupRequest DTO im Backend angepasst werden.
    });
};

const login = (email, password) => {
    return api
        .post(AUTH_API_PATH + "signin", { // Verwendet relativen Pfad
            email,
            password,
        })
        .then((response) => {
            if (response.data.token) {
                localStorage.setItem("user", JSON.stringify(response.data));
            }
            return response.data;
        });
};

const logout = () => {
    localStorage.removeItem("user");
    // Optional: API-Call an ein /api/auth/signout Backend-Endpoint, falls serverseitige Session-Invalidierung nötig ist.
    // EventBus.dispatch("logout"); // Wird typischerweise von der Komponente ausgelöst, die logOut aufruft.
};

const getCurrentUser = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error("Fehler beim Parsen des Benutzers aus dem LocalStorage:", e);
            localStorage.removeItem("user"); // Fehlerhaften Eintrag entfernen
            return null;
        }
    }
    return null;
};

// Profil aktualisieren
const updateProfile = async (profileData) => {
    // profileData sollte ein Objekt sein wie { firstName, lastName, phoneNumber }
    try {
        // Korrekter Endpunkt: PUT /api/users/profile
        // api.service.js hat baseURL: "http://localhost:8080/api/"
        // USER_API_PATH ist "users/", also wird der Pfad zu "users/profile"
        const response = await api.put(USER_API_PATH + "profile", profileData);

        const currentUser = getCurrentUser();
        if (currentUser) {
            // Erstelle ein neues User-Objekt mit den aktualisierten Daten.
            // Die Backend-Antwort ist nur eine MessageResponse, daher müssen wir die Daten clientseitig mergen.
            const updatedUser = {
                ...currentUser, // Behalte bestehende Daten wie id, email, token, roles
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                phoneNumber: profileData.phoneNumber,
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            EventBus.dispatch("profileUpdated", updatedUser); // Informiere andere Teile der App
        }
        return response.data; // Enthält { message: "Profil erfolgreich aktualisiert." }
    } catch (error) {
        console.error("Fehler beim Aktualisieren des Profils im AuthService:", error.response?.data?.message || error.message);
        throw error.response?.data || error; // Wirf den Fehler weiter, damit er in der Komponente behandelt werden kann
    }
};

// Passwort ändern
const changePassword = async (currentPassword, newPassword) => {
    try {
        // Korrekter Endpunkt: POST /api/users/change-password
        const response = await api.post(USER_API_PATH + "change-password", {
            currentPassword,
            newPassword,
        });
        return response.data; // Enthält { message: "Passwort erfolgreich geändert." }
    } catch (error) {
        console.error("Fehler beim Ändern des Passworts im AuthService:", error.response?.data?.message || error.message);
        throw error.response?.data || error;
    }
};

// Token abrufen (nützlich für api.service.js Interceptor, falls direkt verwendet)
const getToken = () => {
    const user = getCurrentUser();
    return user ? user.token : null;
};


const AuthServiceMethods = {
    register,
    login,
    logout,
    getCurrentUser,
    updateProfile,
    changePassword,
    getToken, // Exportiere getToken, falls es extern benötigt wird
};

export default AuthServiceMethods;
