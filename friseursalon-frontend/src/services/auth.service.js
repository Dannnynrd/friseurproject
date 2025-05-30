// File: friseursalon-frontend/src/services/auth.service.js
import api from "./api.service"; // Your existing configured Axios instance

class AuthService {
    login(email, password) {
        return api
            .post("auth/signin", { email, password })
            .then(response => {
                if (response.data.token) {
                    localStorage.setItem("user", JSON.stringify(response.data));
                }
                return response.data;
            })
            .catch(error => {
                if (error.response && error.response.data) {
                    throw error.response.data;
                }
                throw error;
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

    // --- NEW METHODS (STUBBED - Require Backend Implementation) ---

    /**
     * Updates the user's profile information.
     * @param {object} profileData - Object containing fields to update (e.g., { firstName, lastName, phoneNumber })
     * @returns {Promise<object>} - Promise resolving with the updated user data from the backend.
     */
    async updateProfile(profileData) {
        const currentUser = this.getCurrentUser();
        if (!currentUser || !currentUser.id) {
            return Promise.reject(new Error("User not authenticated or user ID missing."));
        }

        // **BACKEND REQUIRED**: This needs a backend endpoint like PUT /api/users/profile
        // The endpoint should:
        // 1. Authenticate the user (e.g., via JWT).
        // 2. Validate the incoming profileData.
        // 3. Update the user's details in the database.
        // 4. Return the updated user information (or at least the fields that were changed).
        try {
            console.log(`[AuthService STUB] Updating profile for user ID ${currentUser.id} with:`, profileData);
            // const response = await api.put(`/users/${currentUser.id}/profile`, profileData); // Example API call

            // Simulate API call and response
            await new Promise(resolve => setTimeout(resolve, 700));
            const response = {
                data: {
                    // Simulate backend returning the updated fields, or the full user object
                    ...currentUser, // Start with existing user data
                    ...profileData,   // Override with new data
                    // Backend might return a more specific structure, adjust as needed
                    message: "Profile updated successfully on backend (simulated)"
                }
            };


            // After successful backend update, update the user in localStorage
            if (response.data) {
                const storedUser = JSON.parse(localStorage.getItem("user"));
                // Merge the updated fields into the stored user object.
                // Ensure the structure matches what your backend returns and what your app expects.
                const updatedStoredUser = {
                    ...storedUser,
                    firstName: response.data.firstName,
                    lastName: response.data.lastName,
                    phoneNumber: response.data.phoneNumber,
                    // Important: DO NOT update token, id, email, or roles here unless the backend explicitly returns new ones.
                };
                localStorage.setItem("user", JSON.stringify(updatedStoredUser));
                console.log("[AuthService STUB] localStorage updated with new profile info.");
                return updatedStoredUser; // Return the updated user data (or relevant part)
            }
            // Fallback if response.data is not as expected
            return profileData;
        } catch (error) {
            console.error("[AuthService STUB] Error updating profile:", error);
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw error;
        }
    }

    /**
     * Changes the current user's password.
     * @param {string} currentPassword - The user's current password.
     * @param {string} newPassword - The new password.
     * @returns {Promise<object>} - Promise resolving with a success message from the backend.
     */
    async changePassword(currentPassword, newPassword) {
        const currentUser = this.getCurrentUser();
        if (!currentUser || !currentUser.id) {
            return Promise.reject(new Error("User not authenticated or user ID missing."));
        }

        // **BACKEND REQUIRED**: This needs a backend endpoint like POST /api/users/change-password
        // The endpoint should:
        // 1. Authenticate the user.
        // 2. Verify the currentPassword.
        // 3. Validate and hash the newPassword.
        // 4. Update the user's password in the database.
        // 5. Optionally, invalidate old tokens if your security model requires it.
        try {
            console.log(`[AuthService STUB] Changing password for user ID ${currentUser.id}`);
            // const response = await api.post(`/users/change-password`, { currentPassword, newPassword }); // Example API call

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            const response = { data: { message: "Password changed successfully on backend (simulated)" } };

            return response.data; // Typically just a success message
        } catch (error) {
            console.error("[AuthService STUB] Error changing password:", error);
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw error;
        }
    }
}

const authServiceInstance = new AuthService();
export default authServiceInstance;
