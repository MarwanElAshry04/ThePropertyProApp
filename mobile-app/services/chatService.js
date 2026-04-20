import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30s for AI responses
    headers: { 'Content-Type': 'application/json' },
});

// Auto-inject access token
api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('propertypro_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const chatService = {

    // RAG chat — send message + history
    ask: async ({ message, history = [] }) => {
        try {
            const response = await api.post('/chat/ask', {
                message,
                history: history.map(m => ({
                    role: m.role,
                    content: m.content,
                })),
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Chat error:', error.response?.data || error.message);
            return { success: false, error: error.response?.data?.detail || 'Failed to get response' };
        }
    },

    // Investment analysis for a single property
    analyzeInvestment: async (propertyId) => {
        try {
            const response = await api.post('/chat/analyze', {
                property_id: propertyId,
            });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || 'Failed to analyze property' };
        }
    },
};