import axios from "axios";

// Setze eine Basis-URL für Axios Instanzen, um Wiederholungen zu vermeiden
// Alle Anfragen über diese Instanz werden automatisch 'http://localhost:8080/api/' vorangestellt bekommen.
const instance = axios.create({
    baseURL: "http://localhost:8080/api/"
});

// Request Interceptor: Wird vor jeder Anfrage ausgeführt
// Fügt den JWT-Token zum Authorization-Header hinzu, wenn ein Benutzer angemeldet ist.
instance.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem("user")); // Benutzerdaten aus Local Storage holen

        if (user && user.token) {
            // Wenn ein Token vorhanden ist, füge ihn zum Authorization-Header hinzu
            // Dies ist entscheidend für den Zugriff auf geschützte Backend-Endpunkte
            config.headers["Authorization"] = 'Bearer ' + user.token;
        }
        return config;
    },
    (error) => {
        // Fehlerbehandlung für Request-Fehler (z.B. Netzwerkprobleme)
        return Promise.reject(error);
    }
);

// Response Interceptor: Wird nach jeder Antwort ausgeführt
// Kann optional für globale Fehlerbehandlung verwendet werden (z.B. automatischen Logout bei 401/403)
instance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        // Beispiel für globale 401 (Unauthorized) / 403 (Forbidden) Fehlerbehandlung
        // Wenn der Server 401 oder 403 zurückgibt, könnte der Token abgelaufen oder ungültig sein.
        // In diesem Fall könnte man den Benutzer automatisch ausloggen.
        // Für dieses Projekt ist es optional, aber in echten Anwendungen wichtig.
        // if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        //   // Hier könnte man einen Refresh Token Fluss implementieren oder direkt ausloggen.
        //   // Dies würde den EventBus.dispatch("logout"); von AuthVerify.js ergänzen.
        //   // console.log("Caught 401/403 in interceptor, considering logout or refresh...");
        //   // localStorage.removeItem("user");
        //   // window.location.reload(); // Seite neu laden, um Login-Formular anzuzeigen
        // }
        return Promise.reject(error);
    }
);


// Die AuthService Klasse: Verwaltet die Benutzerauthentifizierung und -registrierung
class AuthService {
    // Meldet einen Benutzer an
    login(username, password) {
        return instance // Nutzt die Axios-Instanz mit Interceptor
            .post("auth/signin", { // Pfad ist relativ zur baseURL der Instanz ("http://localhost:8080/api/auth/signin")
                username,
                password
            })
            .then(response => {
                if (response.data.token) {
                    // Speichert den JWT-Token und Benutzerdaten im Local Storage des Browsers
                    localStorage.setItem("user", JSON.stringify(response.data));
                }
                return response.data;
            });
    }

    // Meldet einen Benutzer ab
    logout() {
        // Entfernt die Benutzerdaten und den Token aus dem Local Storage
        localStorage.removeItem("user");
    }

    // Registriert einen neuen Benutzer
    register(username, email, password, roles) {
        return instance.post("auth/signup", { // Nutzt die Axios-Instanz
            username,
            email,
            password,
            role: roles || ["user"] // Setzt Standardrolle auf "user", falls keine angegeben
        });
    }

    // Ruft die aktuellen Benutzerdaten aus dem Local Storage ab
    getCurrentUser() {
        const userStr = localStorage.getItem("user");
        if (userStr) return JSON.parse(userStr);
        return null;
    }

    // Ruft nur den JWT-Token aus dem Local Storage ab
    getToken() {
        const user = this.getCurrentUser();
        return user ? user.token : null;
    }
}

export default new AuthService(); // Exportiert eine einzelne Instanz des AuthService