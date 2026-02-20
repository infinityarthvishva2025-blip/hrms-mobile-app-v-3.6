import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// HRMS API Base URL
const API_BASE_URL = 'http://192.168.1.75:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds timeout
});

// Request Interceptor - Add token to requests
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error fetching token from AsyncStorage', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor - Handle errors globally
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;

            if (status === 401) {
                // Unauthorized - clear token and redirect to login
                await AsyncStorage.removeItem('userToken');
                await AsyncStorage.removeItem('userData');
                // Navigation will be handled by RootNavigator checking token state
            }

            console.error('API Error:', {
                status,
                message: data?.message || 'Unknown error',
                endpoint: error.config?.url
            });
        } else if (error.request) {
            // Request made but no response
            console.error('Network Error: No response from server');
        } else {
            // Error in request setup
            console.error('Request Error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api;
