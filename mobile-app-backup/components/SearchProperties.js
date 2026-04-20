import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { getRecommendations } from '../services/api';

export default function SearchProperties({ navigation, route }) {
    // State management
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState(null);

    // Get user data from onboarding (if available)
    const userData = route.params?.userData || {
        name: 'User',
        investmentGoal: 'Long-term growth',
        budgetMin: 0,
        budgetMax: 100000000,
    };

    // Fetch recommendations when component mounts
    useEffect(() => {
        fetchRecommendations();
    }, []);

    // Function to fetch properties from backend
    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            setError(null);

            // Import the helper
            const { buildSearchQuery } = require('../utils/userDataMapper');

            // Build search query based on user's investment goal
            const query = searchQuery || buildSearchQuery(userData.investmentGoal);

            const result = await getRecommendations({
                query: query,
                minPrice: userData.budgetMin,
                maxPrice: userData.budgetMax,
                limit: 20,
            });

            if (result.success) {
                setProperties(result.data.properties);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Handle pull-to-refresh
    const handleRefresh = () => {
        setRefreshing(true);
        fetchRecommendations();
    };

    // Handle search button press
    const handleSearch = () => {
        if (searchQuery.trim()) {
            fetchRecommendations();
        }
    };

    // Property Card Component
    const PropertyCard = ({ property }) => {
        const matchPercentage = Math.round((property.similarity_score || 0.8) * 100);

        return (
            <TouchableOpacity
                className="bg-white mx-4 mb-4 rounded-2xl overflow-hidden shadow-md"
                onPress={() => navigation.navigate('PropertyDetail', { property })}
            >
                {/* Property Image Placeholder */}
                <View className="h-48 bg-gray-300 justify-center items-center">
                    <Text className="text-6xl">📷</Text>
                    <View className="absolute top-2 right-2 bg-primary px-3 py-1.5 rounded-full">
                        <Text className="text-white text-xs font-bold">⭐ {matchPercentage}% Match</Text>
                    </View>
                </View>

                {/* Property Info */}
                <View className="p-4">
                    <Text className="text-xs text-primary font-bold mb-1">{property.type}</Text>
                    <Text className="text-base font-bold text-gray-800 mb-2" numberOfLines={2}>
                        {property.description.substring(0, 50)}...
                    </Text>

                    <View className="flex-row mb-4">
                        <Text className="text-sm text-gray-600 mr-4">📍 {property.city}</Text>
                        <Text className="text-sm text-gray-600 mr-4">🛏️ {property.bedrooms}</Text>
                        <Text className="text-sm text-gray-600">🛁 {property.bathrooms}</Text>
                    </View>

                    <View className="flex-row justify-between items-end">
                        <View>
                            <Text className="text-xl font-bold text-primary">
                                {(property.price / 1000000).toFixed(1)}M EGP
                            </Text>
                            <Text className="text-sm text-gray-600 mt-0.5">{property.size} sqm</Text>
                        </View>
                        <Text className="text-sm text-gray-400">
                            {(property.price_per_sqm / 1000).toFixed(0)}K/sqm
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // Loading State
    if (loading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-secondary p-5">
                <ActivityIndicator size="large" color="#1A1265" />
                <Text className="mt-4 text-base text-gray-600">
                    Finding perfect properties for you...
                </Text>
            </View>
        );
    }

    // Error State
    if (error && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-secondary p-5">
                <Text className="text-base text-red-600 text-center mb-5">❌ {error}</Text>
                <TouchableOpacity
                    className="bg-primary px-8 py-3 rounded-full"
                    onPress={fetchRecommendations}
                >
                    <Text className="text-white text-base font-bold">Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Main UI
    return (
        <View className="flex-1 bg-secondary">
            {/* Header */}
            <View className="bg-primary p-5 pt-12 flex-row justify-between items-start">
                <View className="flex-1">
                    <Text className="text-xl font-bold text-white mb-1">
                        Welcome back, {userData.name}! 👋
                    </Text>
                    <Text className="text-sm text-white opacity-80">
                        What type of property are you looking for today?
                    </Text>
                </View>
                <TouchableOpacity>
                    <Text className="text-3xl">👤</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View className="flex-row p-4 bg-white border-b border-gray-200">
                <TextInput
                    className="flex-1 h-11 bg-secondary rounded-xl px-4 text-base"
                    placeholder="Search properties..."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                />
                <TouchableOpacity
                    className="w-11 h-11 bg-primary rounded-xl justify-center items-center ml-2"
                    onPress={handleSearch}
                >
                    <Text className="text-xl">🔍</Text>
                </TouchableOpacity>
            </View>

            {/* Property List */}
            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                <View className="p-5 pb-2">
                    <Text className="text-lg font-bold text-primary mb-1">
                        Recommended for You
                    </Text>
                    <Text className="text-sm text-gray-600">
                        Based on your preferences • {properties.length} properties
                    </Text>
                </View>

                {properties.map((property, index) => (
                    <PropertyCard key={property.property_id || index} property={property} />
                ))}

                {properties.length === 0 && (
                    <View className="items-center py-12">
                        <Text className="text-lg font-bold text-gray-600 mb-1">
                            No properties found
                        </Text>
                        <Text className="text-sm text-gray-400">
                            Try adjusting your search criteria
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}