// friseursalon-frontend/src/services/auth.service.js
import api from "./api.service";
import EventBus from "../common/EventBus";

const AUTH_API_PATH = "auth/";
const USER_API_PATH = "users/";

const register = (firstName, lastName, email, password, phoneNumber) => {
    return api.post(AUTH_API_PATH + "signup", {
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
    });
};

const login = (email, password) => {
    return api
        .post(AUTH_API_PATH + "signin", {
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
};

const getCurrentUser = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error("Fehler beim Parsen des Benutzers aus dem LocalStorage:", e);
            localStorage.removeItem("user");
            return null;
        }
    }
    return null;
};

const updateProfile = async (profileData) => {
    try {
        const response = await api.put(USER_API_PATH + "profile", profileData);
        const currentUser = getCurrentUser();
        if (currentUser) {
            const updatedUser = {
                ...currentUser,
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                phoneNumber: profileData.phoneNumber,
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            EventBus.dispatch("profileUpdated", updatedUser);
        }
        return response.data;
    } catch (error) {
        console.error("Fehler beim Aktualisieren des Profils im AuthService:", error.response?.data?.message || error.message);
        throw error.response?.data || error;
    }
};

const changePassword = async (currentPassword, newPassword) => {
    try {
        const response = await api.post(USER_API_PATH + "change-password", {
            currentPassword,
            newPassword,
        });
        return response.data;
    } catch (error) {
        console.error("Fehler beim Ändern des Passworts im AuthService:", error.response?.data?.message || error.message);
        throw error.response?.data || error;
    }
};

// NEU: Passwort vergessen
const forgotPassword = (email) => {
    return api.post(AUTH_API_PATH + "forgot-password", {
        email,
    });
};

// NEU: Passwort zurücksetzen
const resetPassword = (token, newPassword) => {
    return api.post(AUTH_API_PATH + "reset-password", {
        token,
        newPassword,
    });
};

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
    forgotPassword, // NEU
    resetPassword,  // NEU
    getToken,
};

export default AuthServiceMethods;