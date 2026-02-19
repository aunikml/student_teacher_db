import axios from 'axios';

/**
 * Axios Instance Setup
 * Configures a base URL for all API requests and sets a default
 * Content-Type header for JSON data. This can be overridden for specific
 * requests (e.g., 'multipart/form-data' for file uploads).
 */
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/', // IMPORTANT: Confirm your Django backend's port (8000 or 8001)
    headers: {
        'Content-Type': 'application/json', // Default for most (JSON) requests
    }
});

/**
 * REQUEST INTERCEPTOR
 * This interceptor runs BEFORE every outgoing API request.
 * Its primary job is to automatically attach the JWT access token
 * from local storage to the Authorization header, using the 'Bearer' scheme.
 */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config; // Always return the modified config
    },
    (error) => {
        // Handle request errors (e.g., network issues before sending the request)
        return Promise.reject(error);
    }
);

/**
 * RESPONSE INTERCEPTOR
 * This interceptor runs AFTER a response is received from the API.
 * Its main purpose is to gracefully handle authentication failures (401 Unauthorized).
 * If a 401 is received, it clears the invalid token and redirects the user to login.
 */
api.interceptors.response.use(
    (response) => response, // If the response is successful (e.g., 2xx status), just pass it through.
    (error) => {
        // Check if the error response exists and its status is 401 (Unauthorized)
        if (error.response && error.response.status === 401) {
            console.warn("Authentication Error: Your session is invalid or has expired. Redirecting to login.");
            
            // 1. Clear any invalid/expired token from local storage
            localStorage.removeItem('access_token');
            
            // 2. Redirect the user to the login page
            // This prevents an infinite redirect loop if the user is already on the login page
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
                // Optionally, show a user-friendly alert
                alert("Your session has expired. Please log in again to continue.");
            }
        }
        // For all other types of errors (e.g., 400 Bad Request, 403 Forbidden, 500 Internal Server Error),
        // re-throw the error so that the calling component's catch block can handle it.
        return Promise.reject(error);
    }
);

export default api;