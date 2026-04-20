import {
    View, Text, Image, TouchableOpacity,
    ScrollView, FlatList, Linking, Share,
    Modal, Animated, Dimensions, StatusBar,
    ActivityIndicator,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { getPropertyImages, getPropertyImage } from '../utils/propertyImages';
import { chatService } from '../services/chatService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PRIMARY = '#1A1265';
const GOLD = '#C9A84C';
const GOLD_DIM = '#C9A84C22';
const CREAM = '#F9F8FF';
const SUCCESS = '#2E7D32';

export default function PropertyDetail({ visible, property, similarProperties = [], onClose }) {
    const [activeImage, setActiveImage] = useState(0);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const imageListRef = useRef(null);

    useEffect(() => {
        if (visible) {
            setActiveImage(0);
            setAiAnalysis(null);
            setAiError('');
            Animated.spring(slideAnim, {
                toValue: 0, useNativeDriver: true,
                tension: 65, friction: 12,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT, duration: 280, useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    if (!property) return null;

    const images = getPropertyImages(property.property_id, property.type, 5);
    const matchPct = Math.round((property.similarity_score || 0.8) * 100);
    const priceM = (property.price / 1_000_000).toFixed(1);
    const pricePerSqmK = (property.price_per_sqm / 1000).toFixed(0);

    // ── AI Analysis ───────────────────────────────────────────────────────────
    const handleGenerateAnalysis = async () => {
        setAiLoading(true);
        setAiError('');
        const result = await chatService.analyzeInvestment(property.property_id);
        if (result.success) {
            setAiAnalysis(result.data);
        } else {
            setAiError(result.error || 'Failed to generate analysis. Please try again.');
        }
        setAiLoading(false);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message:
                    `Check out this ${property.type} in ${property.city}!\n\n` +
                    `📍 ${property.neighborhood}, ${property.city}\n` +
                    `💰 ${priceM}M EGP\n` +
                    `🛏 ${property.bedrooms} Bed • 🛁 ${property.bathrooms} Bath • 📐 ${property.size} sqm\n\n` +
                    `View listing: ${property.url}`,
            });
        } catch (e) { console.log('Share error:', e); }
    };

    const handleOpenListing = () => {
        Linking.openURL(property.url).catch(() => console.log('Could not open URL'));
    };

    const handleImageScroll = (e) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setActiveImage(index);
    };

    // ─── Component helpers ────────────────────────────────────────────────────
    const SectionHeader = ({ title }) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 3, height: 18, backgroundColor: GOLD, borderRadius: 2, marginRight: 10 }} />
            <Text style={{ fontSize: 15, fontWeight: '800', color: PRIMARY }}>{title}</Text>
        </View>
    );

    const StatPill = ({ label, value, accent = false }) => (
        <View style={{
            flex: 1, backgroundColor: accent ? PRIMARY : '#fff',
            borderRadius: 14, padding: 14, alignItems: 'center',
            borderWidth: 1, borderColor: accent ? PRIMARY : '#ECEAF5',
        }}>
            <Text style={{ fontSize: 10, color: accent ? 'rgba(255,255,255,0.6)' : '#AAA', letterSpacing: 0.5, marginBottom: 4 }}>
                {label}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: accent ? '#fff' : PRIMARY }}>
                {value}
            </Text>
        </View>
    );

    const InvestmentRow = ({ label, value, sub, highlight = false }) => (
        <View style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0EFF8',
        }}>
            <Text style={{ fontSize: 13, color: '#777' }}>{label}</Text>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: highlight ? SUCCESS : PRIMARY }}>
                    {value}
                </Text>
                {sub && <Text style={{ fontSize: 11, color: '#AAA', marginTop: 1 }}>{sub}</Text>}
            </View>
        </View>
    );

    const SimilarCard = ({ item }) => {
        const img = getPropertyImage(item.property_id, item.type);
        const pM = (item.price / 1_000_000).toFixed(1);
        const pct = Math.round((item.similarity_score || 0.8) * 100);
        return (
            <TouchableOpacity
                style={{
                    width: 200, marginRight: 12,
                    borderRadius: 16, backgroundColor: '#fff', overflow: 'hidden',
                    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.10, shadowRadius: 10, elevation: 4,
                }}
                activeOpacity={0.88}
            >
                <View style={{ height: 110, backgroundColor: PRIMARY }}>
                    <Image source={{ uri: img }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.15)' }} />
                    <View style={{
                        position: 'absolute', top: 8, right: 8,
                        backgroundColor: pct >= 90 ? GOLD : 'rgba(0,0,0,0.5)',
                        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
                    }}>
                        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>★ {pct}%</Text>
                    </View>
                </View>
                <View style={{ padding: 10 }}>
                    <View style={{ width: 20, height: 2, backgroundColor: GOLD, borderRadius: 1, marginBottom: 6 }} />
                    <Text style={{ fontSize: 11, color: PRIMARY, fontWeight: '700' }} numberOfLines={1}>
                        {item.type} • {item.city}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: PRIMARY, marginTop: 4 }}>{pM}M EGP</Text>
                    <Text style={{ fontSize: 10, color: '#888', marginTop: 2 }}>🛏 {item.bedrooms} · 📐 {item.size} sqm</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
            <Animated.View style={{ flex: 1, backgroundColor: CREAM, transform: [{ translateY: slideAnim }] }}>

                {/* Image Carousel */}
                <View style={{ height: 300, backgroundColor: PRIMARY }}>
                    <FlatList
                        ref={imageListRef}
                        data={images} horizontal pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleImageScroll} scrollEventThrottle={16}
                        keyExtractor={(_, i) => i.toString()}
                        renderItem={({ item }) => (
                            <View style={{ width: SCREEN_WIDTH, height: 300 }}>
                                <Image source={{ uri: item }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)' }} />
                            </View>
                        )}
                    />
                    <View style={{
                        position: 'absolute', bottom: 16, alignSelf: 'center',
                        backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
                    }}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{activeImage + 1} / {images.length}</Text>
                    </View>
                    <View style={{ position: 'absolute', bottom: 50, alignSelf: 'center', flexDirection: 'row', gap: 6 }}>
                        {images.map((_, i) => (
                            <View key={i} style={{
                                width: i === activeImage ? 20 : 6, height: 6, borderRadius: 3,
                                backgroundColor: i === activeImage ? GOLD : 'rgba(255,255,255,0.5)',
                            }} />
                        ))}
                    </View>
                    <TouchableOpacity onPress={onClose} style={{
                        position: 'absolute', top: (StatusBar.currentHeight || 44) + 8, left: 16,
                        width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)',
                        justifyContent: 'center', alignItems: 'center',
                    }}>
                        <Text style={{ color: '#fff', fontSize: 20, lineHeight: 22 }}>←</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleShare} style={{
                        position: 'absolute', top: (StatusBar.currentHeight || 44) + 8, right: 16,
                        width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)',
                        justifyContent: 'center', alignItems: 'center',
                    }}>
                        <Text style={{ fontSize: 16 }}>↗️</Text>
                    </TouchableOpacity>
                    <View style={{
                        position: 'absolute', top: (StatusBar.currentHeight || 44) + 8,
                        alignSelf: 'center', left: SCREEN_WIDTH / 2 - 50,
                        backgroundColor: matchPct >= 90 ? GOLD : 'rgba(0,0,0,0.45)',
                        paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                    }}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>★ {matchPct}% Match</Text>
                    </View>
                </View>

                {/* Scrollable Content */}
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

                    {/* Title Block */}
                    <View style={{ padding: 20, paddingBottom: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <View style={{ backgroundColor: PRIMARY + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginRight: 8 }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: PRIMARY }}>{property.type?.toUpperCase()}</Text>
                            </View>
                            <View style={{ backgroundColor: GOLD_DIM, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: GOLD }}>{property.price_category}</Text>
                            </View>
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: PRIMARY, lineHeight: 26, marginBottom: 8 }}>
                            {property.description?.substring(0, 80)}...
                        </Text>
                        <Text style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>
                            📍 {property.neighborhood}, {property.city}
                        </Text>
                    </View>

                    {/* Quick Stats */}
                    <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 20 }}>
                        <StatPill label="BEDS" value={`${property.bedrooms}`} accent />
                        <StatPill label="BATHS" value={`${property.bathrooms}`} />
                        <StatPill label="SIZE" value={`${property.size}m²`} />
                        <StatPill label="MAID" value={property.has_maid_room ? 'Yes' : 'No'} />
                    </View>

                    <View style={{ height: 8, backgroundColor: '#F0EFF8' }} />

                    {/* Pricing */}
                    <View style={{ padding: 20 }}>
                        <SectionHeader title="Pricing Details" />
                        <InvestmentRow label="Total Price" value={`${priceM}M EGP`} />
                        <InvestmentRow label="Price per sqm" value={`${pricePerSqmK}K EGP`} />
                        <InvestmentRow label="Property Size" value={`${property.size} sqm`} />
                        <InvestmentRow label="Price Category" value={property.price_category} />
                    </View>

                    <View style={{ height: 8, backgroundColor: '#F0EFF8' }} />

                    {/* Property Details */}
                    <View style={{ padding: 20 }}>
                        <SectionHeader title="Property Details" />
                        <InvestmentRow label="Type" value={property.type} />
                        <InvestmentRow label="City" value={property.city} />
                        <InvestmentRow label="Neighborhood" value={property.neighborhood} />
                        <InvestmentRow label="Bedrooms" value={`${property.bedrooms} (${property.bedroom_category})`} />
                        <InvestmentRow label="Bathrooms" value={`${property.bathrooms}`} />
                        <InvestmentRow label="Maid's Room" value={property.has_maid_room ? '✓ Yes' : '✗ No'} />
                        <View style={{ marginTop: 16 }}>
                            <Text style={{ fontSize: 12, color: '#AAA', letterSpacing: 0.5, marginBottom: 8 }}>DESCRIPTION</Text>
                            <Text style={{ fontSize: 13, color: '#555', lineHeight: 22 }}>{property.description}</Text>
                        </View>
                    </View>

                    <View style={{ height: 8, backgroundColor: '#F0EFF8' }} />

                    {/* ── AI Investment Analysis ── */}
                    <View style={{ padding: 20 }}>
                        <SectionHeader title="AI Investment Analysis" />

                        {/* Initial state — show button */}
                        {!aiAnalysis && !aiLoading && (
                            <>
                                <View style={{
                                    backgroundColor: PRIMARY, borderRadius: 16, padding: 18, marginBottom: 16,
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                        <View style={{
                                            width: 32, height: 32, borderRadius: 16, backgroundColor: GOLD,
                                            justifyContent: 'center', alignItems: 'center', marginRight: 10,
                                        }}>
                                            <Text style={{ fontSize: 16 }}>🧠</Text>
                                        </View>
                                        <View>
                                            <Text style={{ color: GOLD, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 }}>
                                                AI ANALYSIS
                                            </Text>
                                            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                                                Powered by GPT-4o-mini
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 20 }}>
                                        Get a personalized investment analysis based on this property's location,
                                        price, and Egyptian market conditions — tailored to your investment profile.
                                    </Text>
                                </View>

                                {aiError ? (
                                    <Text style={{ color: '#FF5252', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
                                        ⚠️ {aiError}
                                    </Text>
                                ) : null}

                                <TouchableOpacity
                                    onPress={handleGenerateAnalysis}
                                    activeOpacity={0.85}
                                    style={{
                                        backgroundColor: GOLD, borderRadius: 14,
                                        paddingVertical: 14, alignItems: 'center',
                                        shadowColor: GOLD, shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
                                    }}
                                >
                                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>
                                        🧠 Generate AI Analysis
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Loading */}
                        {aiLoading && (
                            <View style={{
                                backgroundColor: PRIMARY, borderRadius: 16, padding: 24, alignItems: 'center',
                            }}>
                                <ActivityIndicator color={GOLD} size="large" style={{ marginBottom: 12 }} />
                                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                                    Analyzing investment potential...
                                </Text>
                                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>
                                    Checking market data for {property.city}
                                </Text>
                            </View>
                        )}

                        {/* Result */}
                        {aiAnalysis && !aiLoading && (
                            <View>
                                {/* Metric chips */}
                                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                                    <View style={{
                                        flex: 1, backgroundColor: '#E8F5E9', borderRadius: 14, padding: 14,
                                        alignItems: 'center', borderWidth: 1, borderColor: '#C8E6C9',
                                    }}>
                                        <Text style={{ fontSize: 10, color: SUCCESS, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 }}>
                                            MONTHLY INCOME
                                        </Text>
                                        <Text style={{ fontSize: 18, fontWeight: '800', color: SUCCESS }}>
                                            {(aiAnalysis.monthly_income / 1000).toFixed(0)}K EGP
                                        </Text>
                                    </View>
                                    <View style={{
                                        flex: 1, backgroundColor: GOLD_DIM, borderRadius: 14, padding: 14,
                                        alignItems: 'center', borderWidth: 1, borderColor: GOLD + '40',
                                    }}>
                                        <Text style={{ fontSize: 10, color: GOLD, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 }}>
                                            ANNUAL ROI
                                        </Text>
                                        <Text style={{ fontSize: 18, fontWeight: '800', color: GOLD }}>
                                            {aiAnalysis.annual_roi}%
                                        </Text>
                                    </View>
                                    <View style={{
                                        flex: 1, backgroundColor: PRIMARY + '10', borderRadius: 14, padding: 14,
                                        alignItems: 'center', borderWidth: 1, borderColor: PRIMARY + '20',
                                    }}>
                                        <Text style={{ fontSize: 10, color: PRIMARY, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 }}>
                                            YIELD RATE
                                        </Text>
                                        <Text style={{ fontSize: 18, fontWeight: '800', color: PRIMARY }}>
                                            {aiAnalysis.yield_rate}%
                                        </Text>
                                    </View>
                                </View>

                                {/* AI verdict */}
                                <View style={{ backgroundColor: PRIMARY, borderRadius: 16, padding: 18, marginBottom: 12 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                        <Text style={{ fontSize: 18, marginRight: 8 }}>🧠</Text>
                                        <Text style={{ color: GOLD, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>
                                            AI VERDICT
                                        </Text>
                                    </View>
                                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 22 }}>
                                        {aiAnalysis.analysis}
                                    </Text>
                                </View>

                                <TouchableOpacity onPress={handleGenerateAnalysis} style={{ alignItems: 'center', paddingVertical: 8 }}>
                                    <Text style={{ color: '#AAA', fontSize: 12 }}>↻ Regenerate analysis</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={{ height: 8, backgroundColor: '#F0EFF8' }} />

                    {/* Similar Properties */}
                    {similarProperties.length > 0 && (
                        <View style={{ paddingTop: 20, paddingBottom: 8 }}>
                            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                                <SectionHeader title="Similar Properties" />
                            </View>
                            <FlatList
                                data={similarProperties} horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item) => item.property_id.toString()}
                                contentContainerStyle={{ paddingHorizontal: 20 }}
                                renderItem={({ item }) => <SimilarCard item={item} />}
                            />
                        </View>
                    )}
                </ScrollView>

                {/* Sticky Bottom CTA */}
                <View style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    backgroundColor: '#fff', paddingHorizontal: 20,
                    paddingTop: 16, paddingBottom: 32,
                    borderTopWidth: 1, borderTopColor: '#F0EFF8',
                    flexDirection: 'row', gap: 12,
                }}>
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={{ fontSize: 10, color: '#AAA', letterSpacing: 0.5 }}>TOTAL PRICE</Text>
                        <Text style={{ fontSize: 22, fontWeight: '800', color: PRIMARY }}>{priceM}M EGP</Text>
                        <Text style={{ fontSize: 11, color: GOLD, fontWeight: '600' }}>{pricePerSqmK}K / sqm</Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleOpenListing}
                        style={{
                            backgroundColor: PRIMARY, paddingHorizontal: 24,
                            borderRadius: 16, justifyContent: 'center', alignItems: 'center',
                            shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
                        }}
                    >
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>View Listing</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2 }}>propertyfinder.eg</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Modal>
    );
}