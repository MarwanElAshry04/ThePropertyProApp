import {
    View, Text, Image, TouchableOpacity,
    ScrollView, ActivityIndicator,
    RefreshControl, StatusBar, Animated,
} from 'react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getRecommendations } from '../services/api';
import { favoritesService } from '../services/favoritesService';
import { useAuth } from '../context/AuthContext';
import SearchFilter from './SearchFilter';
import PropertyDetail from './PropertyDetail';
import { getPropertyImage } from '../utils/propertyImages';

const PRIMARY = '#1A1265';
const GOLD = '#C9A84C';
const GOLD_DIM = '#C9A84C28';
const CREAM = '#F9F8FF';

const buildDefaultQuery = (user) => {
    if (!user) return 'properties in Egypt';

    const parts = [];

    if (user.investment_goal === 'rental') parts.push('high rental yield');
    if (user.investment_goal === 'appreciation') parts.push('high appreciation potential');
    if (user.investment_goal === 'balanced') parts.push('good investment');

    if (user.investment_status === 'beginner') parts.push('affordable');
    if (user.investment_status === 'experienced') parts.push('premium');

    if (user.budget_max) {
        const maxM = (user.budget_max / 1_000_000).toFixed(0);
        parts.push(`under ${maxM} million EGP`);
    }

    parts.push('properties in Egypt');
    return parts.join(' ');
};
export default function SearchProperties() {
    const { user } = useAuth();

    const [properties, setProperties] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterParams, setFilterParams] = useState({ query: 'properties in Egypt', limit: 20 }); const [activeFilters, setActiveFilters] = useState(0);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);


    const [favorites, setFavorites] = useState(new Set());
    const [togglingId, setTogglingId] = useState(null);

    const debounceRef = useRef(null);
    const isFirstLoad = useRef(true);

    useEffect(() => {
        const defaultQuery = buildDefaultQuery(user);
        const defaultParams = {
            query: defaultQuery,
            limit: 20,
        };
        setFilterParams(defaultParams);
        fetchProperties(defaultParams);
    }, []);


    const loadFavorites = async () => {
        const result = await favoritesService.getFavorites();
        if (result.success) {
            const ids = new Set(result.data.favorites.map(f => f.property_id));
            setFavorites(ids);
        }
    };


    const handleToggleFavorite = async (property) => {

        if (!user) return;

        const id = property.property_id;
        const isSaved = favorites.has(id);
        setTogglingId(id);
        console.log(' Toggling favorite:', id, 'isSaved:', isSaved); // ← add this


        setFavorites(prev => {
            const next = new Set(prev);
            isSaved ? next.delete(id) : next.add(id);
            return next;
        });

        const result = isSaved
            ? await favoritesService.removeFavorite(id)
            : await favoritesService.addFavorite(id);

        if (!result.success) {
            // Revert on failure
            setFavorites(prev => {
                const next = new Set(prev);
                isSaved ? next.add(id) : next.delete(id);
                return next;
            });
        }
        setTogglingId(null);
    };

    const fetchProperties = async (params) => {
        try {
            if (isFirstLoad.current) setInitialLoading(true);
            else setFetching(true);
            setError(null);

            const result = await getRecommendations({ ...params, limit: params.limit || 20 });
            if (result.success) setProperties(result.data.properties);
            else setError(result.error);
        } catch (err) {
            setError('Could not connect. Make sure your backend is running.');
        } finally {
            setInitialLoading(false);
            setFetching(false);
            setRefreshing(false);
            isFirstLoad.current = false;
        }
    };

    const handleFiltersChange = useCallback((newParams) => {
        // If the query was cleared, replace with personalized default
        const enrichedParams = {
            ...newParams,
            query: (!newParams.query || newParams.query === 'properties in Egypt')
                ? buildDefaultQuery(user)
                : newParams.query,
        };

        setFilterParams(enrichedParams);
        const count = [
            newParams.city, newParams.type,
            newParams.min_price, newParams.max_price,
            newParams.bedrooms, newParams.bathrooms,
            newParams.min_size, newParams.max_size,
            newParams.has_maid_room,
        ].filter(Boolean).length;
        setActiveFilters(count);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchProperties(enrichedParams), 500);
    }, [user]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchProperties(filterParams);
        loadFavorites();
    };

    const handleCardPress = (property) => {
        setSelectedProperty(property);
        setDetailOpen(true);
    };

    const getSimilarProperties = (property) => {
        if (!property) return [];
        return properties
            .filter(p => p.property_id !== property.property_id && p.type === property.type)
            .slice(0, 6);
    };

    const PropertyCard = ({ property }) => {
        const matchPct = Math.max(0, Math.min(100, Math.round((property.similarity_score || 0.8) * 100))); const isTopMatch = matchPct >= 90;
        const priceM = (property.price / 1_000_000).toFixed(1);
        const pricePerSqmK = (property.price_per_sqm / 1000).toFixed(0);
        const imageUri = getPropertyImage(property.property_id, property.type);
        const isFav = favorites.has(property.property_id);
        const isToggling = togglingId === property.property_id;

        // Heart scale animation
        const heartScale = useRef(new Animated.Value(1)).current;

        const animateHeart = (onComplete) => {
            Animated.sequence([
                Animated.timing(heartScale, { toValue: 1.35, duration: 100, useNativeDriver: true }),
                Animated.timing(heartScale, { toValue: 1, duration: 100, useNativeDriver: true }),
            ]).start(() => onComplete());
        };

        const handleHeart = () => {
            animateHeart(() => handleToggleFavorite(property));
        };

        return (
            <TouchableOpacity
                onPress={() => handleCardPress(property)}
                style={{
                    marginHorizontal: 16, marginBottom: 16,
                    borderRadius: 20, backgroundColor: '#FFFFFF',
                    overflow: 'hidden',
                    shadowColor: PRIMARY,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.13, shadowRadius: 16, elevation: 7,
                }}
                activeOpacity={0.92}
            >
                {/* Image Hero */}
                <View style={{ height: 190, backgroundColor: PRIMARY }}>
                    <Image
                        source={{ uri: imageUri }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />
                    <View style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.18)',
                    }} />

                    {/* Type pill */}
                    <View style={{
                        position: 'absolute', bottom: 12, left: 12,
                        paddingHorizontal: 10, paddingVertical: 4,
                        borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.45)',
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
                    }}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1.2 }}>
                            {(property.type || 'PROPERTY').toUpperCase()}
                        </Text>
                    </View>

                    {/* Match badge */}
                    <View style={{
                        position: 'absolute', top: 12, right: 12,
                        paddingHorizontal: 10, paddingVertical: 5,
                        borderRadius: 20,
                        backgroundColor: isTopMatch ? GOLD : 'rgba(0,0,0,0.45)',
                        borderWidth: isTopMatch ? 0 : 1,
                        borderColor: 'rgba(255,255,255,0.3)',
                        flexDirection: 'row', alignItems: 'center',
                    }}>
                        <Text style={{ fontSize: 9, marginRight: 3, color: '#fff' }}>★</Text>
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>
                            {matchPct}% Match
                        </Text>
                    </View>

                    {/* Heart button */}
                    <TouchableOpacity
                        onPress={handleHeart}
                        activeOpacity={0.8}
                        style={{
                            position: 'absolute', bottom: 12, right: 12,
                            width: 36, height: 36, borderRadius: 18,
                            backgroundColor: isFav
                                ? 'rgba(255,59,59,0.9)'
                                : 'rgba(0,0,0,0.40)',
                            borderWidth: 1,
                            borderColor: isFav ? 'rgba(255,100,100,0.5)' : 'rgba(255,255,255,0.3)',
                            justifyContent: 'center', alignItems: 'center',
                        }}
                    >
                        {isToggling ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Animated.Text style={{
                                fontSize: 16,
                                transform: [{ scale: heartScale }],
                            }}>
                                {isFav ? '❤️' : '🤍'}
                            </Animated.Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Card Body */}
                <View style={{ padding: 16 }}>
                    <View style={{ width: 32, height: 2, backgroundColor: GOLD, borderRadius: 2, marginBottom: 10 }} />
                    <Text
                        numberOfLines={2}
                        style={{ fontSize: 15, fontWeight: '700', color: PRIMARY, lineHeight: 22, marginBottom: 10 }}
                    >
                        {property.description?.substring(0, 70)}...
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontSize: 12, color: '#888', marginRight: 14 }}>📍 {property.city}</Text>
                        <Text style={{ fontSize: 12, color: '#888', marginRight: 14 }}>🛏  {property.bedrooms} Bed</Text>
                        <Text style={{ fontSize: 12, color: '#888' }}>🛁 {property.bathrooms} Bath</Text>
                    </View>
                    <View style={{ height: 1, backgroundColor: '#F0EFF8', marginBottom: 12 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <View>
                            <Text style={{ fontSize: 10, color: '#AAA', marginBottom: 2, letterSpacing: 0.5 }}>TOTAL PRICE</Text>
                            <Text style={{ fontSize: 20, fontWeight: '800', color: PRIMARY }}>{priceM}M EGP</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 10, color: '#AAA', marginBottom: 2, letterSpacing: 0.5 }}>SIZE</Text>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: '#555' }}>{property.size} sqm</Text>
                            <Text style={{ fontSize: 11, color: GOLD, fontWeight: '600', marginTop: 1 }}>{pricePerSqmK}K / sqm</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };


    if (initialLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: CREAM }}>
                <View style={{
                    backgroundColor: PRIMARY,
                    paddingTop: (StatusBar.currentHeight || 44) + 12,
                    paddingBottom: 20, paddingHorizontal: 20,
                }}>
                    <Text style={{ color: GOLD, fontSize: 10, fontWeight: '700', letterSpacing: 2 }}>PROPERTY PRO</Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{
                        width: 72, height: 72, borderRadius: 36,
                        backgroundColor: GOLD_DIM,
                        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
                    }}>
                        <ActivityIndicator size="large" color={GOLD} />
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: PRIMARY }}>Finding perfect properties</Text>
                    <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>AI-powered search in progress...</Text>
                </View>
            </View>
        );
    }

    // ─── Error ─────────────────────────────────────────────────────────────────
    if (error && properties.length === 0) {
        return (
            <View style={{ flex: 1, paddingTop: StatusBar.currentHeight || 44, backgroundColor: CREAM }}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: PRIMARY, textAlign: 'center', marginBottom: 8 }}>Connection failed</Text>
                    <Text style={{ fontSize: 13, color: '#999', textAlign: 'center', marginBottom: 8 }}>{error}</Text>
                    <Text style={{ fontSize: 12, color: '#BBB', textAlign: 'center', marginBottom: 28 }}>
                        Make sure your backend is running:{'\n'}uvicorn main:app --reload --host 0.0.0.0 --port 8000
                    </Text>
                    <TouchableOpacity
                        onPress={() => fetchProperties(filterParams)}
                        style={{ paddingHorizontal: 32, paddingVertical: 14, borderRadius: 50, backgroundColor: PRIMARY }}
                    >
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: CREAM }}>

            {/* Header */}
            <View style={{
                backgroundColor: PRIMARY,
                paddingTop: (StatusBar.currentHeight || 44) + 12,
                paddingBottom: 20, paddingHorizontal: 20,
            }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: GOLD, fontSize: 10, fontWeight: '800', letterSpacing: 2.5, marginBottom: 6 }}>
                            PROPERTY PRO
                        </Text>
                        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 28 }}>
                            Welcome{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''} 👋
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 3 }}>
                            Find your perfect investment
                        </Text>
                    </View>
                    <TouchableOpacity style={{
                        width: 44, height: 44, borderRadius: 22,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1.5, borderColor: GOLD + '80',
                        justifyContent: 'center', alignItems: 'center',
                    }}>
                        <Text style={{ fontSize: 20 }}>👤</Text>
                    </TouchableOpacity>
                </View>

                {/* Search bar */}
                <TouchableOpacity
                    onPress={() => setFilterOpen(true)}
                    activeOpacity={0.85}
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                    <View style={{
                        flex: 1, flexDirection: 'row', alignItems: 'center',
                        height: 46,
                        backgroundColor: 'rgba(255,255,255,0.10)',
                        borderWidth: 1,
                        borderColor: activeFilters > 0 ? GOLD + '90' : 'rgba(255,255,255,0.18)',
                        borderRadius: 14, paddingHorizontal: 14, marginRight: 10,
                    }}>
                        <Text style={{ fontSize: 15, marginRight: 8, opacity: 0.7 }}>🔍</Text>
                        <Text style={{ flex: 1, color: 'rgba(255,255,255,0.40)', fontSize: 14 }}>
                            {filterParams.query && !filterParams.query.startsWith('high') && !filterParams.query.startsWith('good') && !filterParams.query.startsWith('affordable') && !filterParams.query.startsWith('premium') && filterParams.query !== 'properties in Egypt'
                                ? filterParams.query
                                : 'City, type, or description...'}
                        </Text>
                        {activeFilters > 0 && (
                            <View style={{
                                backgroundColor: GOLD, width: 20, height: 20,
                                borderRadius: 10, justifyContent: 'center', alignItems: 'center',
                            }}>
                                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{activeFilters}</Text>
                            </View>
                        )}
                    </View>
                    <View style={{
                        width: 46, height: 46, borderRadius: 14,
                        backgroundColor: GOLD,
                        justifyContent: 'center', alignItems: 'center',
                        shadowColor: GOLD, shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.4, shadowRadius: 8, elevation: 5,
                    }}>
                        <View style={{ gap: 4, alignItems: 'center' }}>
                            <View style={{ width: 18, height: 2, backgroundColor: '#fff', borderRadius: 1 }} />
                            <View style={{ width: 13, height: 2, backgroundColor: '#fff', borderRadius: 1 }} />
                            <View style={{ width: 8, height: 2, backgroundColor: '#fff', borderRadius: 1 }} />
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Section Header */}
            <View style={{
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
            }}>
                <View>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: PRIMARY }}>
                        {activeFilters > 0 ? 'Filtered Results' : 'Recommended for You'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                        {fetching
                            ? <ActivityIndicator size="small" color={GOLD} style={{ marginRight: 6 }} />
                            : <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD, marginRight: 6 }} />
                        }
                        <Text style={{ fontSize: 12, color: '#999' }}>
                            {fetching ? 'Updating results...' : `AI-powered • ${properties.length} properties found`}
                        </Text>
                    </View>
                </View>
                {activeFilters > 0 ? (
                    <TouchableOpacity
                        onPress={() => setFilterOpen(true)}
                        style={{
                            paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
                            backgroundColor: GOLD_DIM, borderWidth: 1, borderColor: GOLD + '50',
                            flexDirection: 'row', alignItems: 'center', gap: 5,
                        }}
                    >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: GOLD }}>
                            {activeFilters} filter{activeFilters > 1 ? 's' : ''}
                        </Text>
                        <Text style={{ fontSize: 11, color: GOLD }}>✕</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={() => setFilterOpen(true)}
                        style={{
                            paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                            borderWidth: 1, borderColor: PRIMARY + '30', backgroundColor: PRIMARY + '08',
                        }}
                    >
                        <Text style={{ fontSize: 12, fontWeight: '600', color: PRIMARY }}>Filter ↕</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Property List */}
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={PRIMARY}
                        colors={[PRIMARY]}
                    />
                }
            >
                {properties.map((property) => (
                    <PropertyCard key={property.property_id} property={property} />
                ))}
                {!fetching && properties.length === 0 && (
                    <View style={{ alignItems: 'center', paddingVertical: 60, paddingHorizontal: 32 }}>
                        <Text style={{ fontSize: 52, marginBottom: 16 }}>🏙️</Text>
                        <Text style={{ fontSize: 17, fontWeight: '700', color: PRIMARY, textAlign: 'center', marginBottom: 6 }}>
                            No properties found
                        </Text>
                        <Text style={{ fontSize: 13, color: '#AAA', textAlign: 'center' }}>
                            Try adjusting your filters or a different search
                        </Text>
                        <TouchableOpacity
                            onPress={() => setFilterOpen(true)}
                            style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 50, backgroundColor: PRIMARY }}
                        >
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Adjust Filters</Text>
                        </TouchableOpacity>
                    </View>
                )}
                <View style={{ height: 32 }} />
            </ScrollView>

            {/* Filter Modal */}
            <SearchFilter
                visible={filterOpen}
                onClose={() => setFilterOpen(false)}
                onFiltersChange={handleFiltersChange}
            />

            {/* Property Detail Modal */}
            <PropertyDetail
                visible={detailOpen}
                property={selectedProperty}
                similarProperties={getSimilarProperties(selectedProperty)}
                onClose={() => {
                    setDetailOpen(false);
                    setTimeout(() => setSelectedProperty(null), 300);
                }}
            />
        </View>
    );
}