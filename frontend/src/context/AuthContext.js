import { createContext, useState, useEffect } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    /**
     * Fetch User Profile
     * Gets details like name, role, and must_change_password flag.
     * The token is automatically attached by the interceptor in api.js
     */
    const fetchProfile = async () => {
        try {
            const res = await api.get('users/profile/');
            setUser(res.data);
        } catch (err) {
            console.error("Session expired or invalid token.");
            logout(); 
        } finally {
            setLoading(false);
        }
    };

    /**
     * Effect: Run once on app load
     * Checks if a token exists and attempts to load the user profile.
     */
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            fetchProfile();
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line
    }, []);

    /**
     * Login Function
     * @param {string} email 
     * @param {string} password 
     */
    const login = async (email, password) => {
        try {
            /**
             * We send both 'username' and 'email' keys.
             * 1. SimpleJWT's default serializer looks for 'username'.
             * 2. Our custom User model uses 'email' as the identifier.
             * Providing both ensures the backend finds what it needs.
             */
            const res = await api.post('users/login/', { 
                username: email, 
                email: email,
                password: password 
            });

            // Save the JWT access token
            localStorage.setItem('access_token', res.data.access);
            
            // Immediately fetch profile to update the global 'user' state
            await fetchProfile();
            
            return { success: true };
        } catch (err) {
            // Log the specific error from the server (e.g., 401 Unauthorized)
            console.error("Auth Server Error:", err.response?.data);
            throw err; 
        }
    };

    /**
     * Logout Function
     * Clears storage and resets user state.
     */
    const logout = () => {
        localStorage.removeItem('access_token');
        setUser(null);
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            logout, 
            loading, 
            fetchProfile,
            isAuthenticated: !!user 
        }}>
            {children}
        </AuthContext.Provider>
    );
};