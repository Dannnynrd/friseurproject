import axios from "axios";

const API_BASE_URL = "http://localhost:8080/api/";

const api = axios.create({
    baseURL: API_BASE_URL
});

// Request Interceptor: Fügt den JWT-Token zu jeder Anfrage hinzu
api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.token) {
            config.headers["Authorization"] = 'Bearer ' + user.token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Optional für Fehlerbehandlung (z.B. Logout bei 401/403)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Hier könnte man global auf 401/403 Fehler reagieren
        // z.B. EventBus.dispatch("logout"); bei 401 wenn Token wirklich abgelaufen ist
        return Promise.reject(error);
    }
);

export default api;