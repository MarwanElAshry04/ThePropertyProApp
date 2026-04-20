import axios from 'axios';
import { API_BASE_URL } from '../config';



const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});
// ──────────────────────────────────────────────────────────────────────────────

export const getRecommendations = async (filters = {}) => {
    try {
        // Build the request body — map all filter fields to backend format
        const requestBody = {
            query: filters.query || 'properties in Egypt',
            top_k: filters.limit || 20,

            // Price — accept both snake_case (from SearchFilter) and camelCase (legacy)
            min_price: filters.min_price ?? filters.minPrice ?? 0,
            max_price: filters.max_price ?? filters.maxPrice ?? 100_000_000,

            // Location & type
            city: filters.city || null,
            neighborhood: filters.neighborhood || null,
            property_type: filters.type || filters.propertyType || null,

            // Rooms
            bedrooms: filters.bedrooms || null,
            bathrooms: filters.bathrooms || null,

            // Size (new)
            min_size: filters.min_size || null,
            max_size: filters.max_size || null,

            // Amenities (new)
            has_maid_room: filters.has_maid_room || null,
        };

        console.log('🔍 Calling API:', API_BASE_URL);
        console.log('📤 Request body:', requestBody);

        const response = await api.post('/recommendations/', requestBody);

        console.log('✅ Success! Properties received:', response.data?.properties?.length);
        return {
            success: true,
            data: response.data,
        };

    } catch (error) {
        console.error('❌ API Error:', error.message);
        console.error('❌ Response:', error.response?.data);

        return {
            success: false,
            error: error.message || 'Failed to fetch recommendations',
        };
    }
};

export default api;