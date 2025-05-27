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

// User profile update
api.updateUserProfile = function(profileData) {
    return this.put("/customers/profile", profileData)
        .then(response => {
            // Update user in localStorage if the API call is successful
            const storedUser = JSON.parse(localStorage.getItem("user"));
            if (storedUser) {
                // The backend returns the updated User object (which might not include the token)
                // We need to merge carefully: update relevant fields, keep the token.
                const updatedUser = {
                    ...storedUser, // Keep existing token, roles, etc.
                    ...response.data, // Overwrite with new profile data (firstName, lastName, phoneNumber, email)
                                     // Ensure password is not part of response.data or handle it.
                };
                // Remove password from the object before saving to local storage if it's present
                delete updatedUser.password; 
                localStorage.setItem("user", JSON.stringify(updatedUser));
            }
            return response.data;
        });
};

export default api;