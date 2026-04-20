import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30s for AI analysis calls
    headers: { 'Content-Type': 'application/json' },
});

// Auto-inject access token
api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('propertypro_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const favoritesService = {

    // Get all saved properties
    getFavorites: async () => {
        try {
            const response = await api.get('/favorites/');
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || 'Failed to load favorites' };
        }
    },

    // AI portfolio analysis
    getPortfolioAnalysis: async () => {
        try {
            const response = await api.get('/favorites/analysis');
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || 'Failed to analyze portfolio' };
        }
    },

    // Save a property
    addFavorite: async (propertyId) => {
        try {
            const response = await api.post(`/favorites/${propertyId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || 'Failed to save property' };
        }
    },

    // Remove a property
    removeFavorite: async (propertyId) => {
        try {
            const response = await api.delete(`/favorites/${propertyId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || 'Failed to remove property' };
        }
    },

    // Check if a property is saved
    checkFavorite: async (propertyId) => {
        try {
            const response = await api.get(`/favorites/check/${propertyId}`);
            return { success: true, isFavorite: response.data.is_favorite };
        } catch (error) {
            return { success: false, isFavorite: false };
        }
    },
};