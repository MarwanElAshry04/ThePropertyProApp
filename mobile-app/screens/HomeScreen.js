import {
    View, Text, ScrollView, StatusBar,
    TouchableOpacity, Image, ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { favoritesService } from '../services/favoritesService';
import { getPropertyImage } from '../utils/propertyImages';

const PRIMARY = '#1A1265';
const GOLD = '#C9A84C';
const GOLD_DIM = '#C9A84C20';
const CREAM = '#F9F8FF';

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
};

const formatMoney = (amount) => {
    if (!amount) return '0';
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
    return amount.toString();
};

const formatGoal = (goal) => ({
    appreciation: 'Long-term appreciation',
    rental: 'Monthly rental income',
    balanced: 'Balance of both',
}[goal] || 'Not set');

const MetricCard = ({ icon, label, value, sub, color }) => (
    <View style={{
        flex: 1, backgroundColor: '#fff',
        borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: '#ECEAF5',
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    }}>
        <Text style={{ fontSize: 22, marginBottom: 8 }}>{icon}</Text>
        <Text style={{ fontSize: 11, color: '#AAA', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 }}>
            {label.toUpperCase()}
        </Text>
        <Text style={{ fontSize: 20, fontWeight: '800', color: color || PRIMARY, marginBottom: 2 }}>
            {value}
        </Text>
        {sub && <Text style={{ fontSize: 11, color: '#BBB' }}>{sub}</Text>}
    </View>
);

const SavedPropertyCard = ({ property }) => {
    const imageUri = getPropertyImage(property.property_id, property.type || property.property_type);
    const priceM = ((property.price || 0) / 1_000_000).toFixed(1);

    return (
        <View style={{
            width: 200, marginRight: 14,
            borderRadius: 16, backgroundColor: '#fff',
            overflow: 'hidden',
            shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.10, shadowRadius: 10, elevation: 5,
        }}>
            <View style={{ height: 120 }}>
                <Image
                    source={{ uri: imageUri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                />
                <View style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.15)',
                }} />
                <View style={{
                    position: 'absolute', bottom: 8, left: 8,
                    backgroundColor: GOLD, borderRadius: 10,
                    paddingHorizontal: 8, paddingVertical: 3,
                }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>❤️ SAVED</Text>
                </View>
            </View>
            <View style={{ padding: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: PRIMARY, marginBottom: 4 }} numberOfLines={1}>
                    {property.city || 'Egypt'}
                </Text>
                <Text style={{ fontSize: 11, color: '#999', marginBottom: 6 }} numberOfLines={1}>
                    {property.neighborhood || property.type || property.property_type || 'Property'}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: PRIMARY }}>
                    {priceM}M EGP
                </Text>
            </View>
        </View>
    );
};

export default function HomeScreen({ navigation }) {
    const { user } = useAuth();

    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const loadData = async () => {
        try {
            setError('');
            const result = await favoritesService.getPortfolioAnalysis();
            if (result.success) {
                setAnalysis(result.data);
            } else {
                setError(result.error || 'Failed to load portfolio');
            }
        } catch (e) {
            setError('Could not load portfolio data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const firstName = user?.full_name?.split(' ')[0] || 'Investor';
    const hasProperties = analysis?.property_count > 0;

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: CREAM }}>
                <View style={{
                    backgroundColor: PRIMARY,
                    paddingTop: (StatusBar.currentHeight || 44) + 12,
                    paddingBottom: 20, paddingHorizontal: 20,
                }}>
                    <Text style={{ color: GOLD, fontSize: 10, fontWeight: '800', letterSpacing: 2.5 }}>PROPERTY PRO</Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={GOLD} />
                    <Text style={{ color: '#AAA', fontSize: 13, marginTop: 16 }}>Analyzing your portfolio...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: CREAM }}>
            <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

            {/* Header */}
            <View style={{
                backgroundColor: PRIMARY,
                paddingTop: (StatusBar.currentHeight || 44) + 12,
                paddingBottom: 24, paddingHorizontal: 20,
            }}>
                <Text style={{ color: GOLD, fontSize: 10, fontWeight: '800', letterSpacing: 2.5, marginBottom: 16 }}>
                    PROPERTY PRO
                </Text>
                <Text style={{ color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 4 }}>
                    {getGreeting()}, {firstName} 👋
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
                    {hasProperties
                        ? `You have ${analysis.property_count} saved propert${analysis.property_count > 1 ? 'ies' : 'y'}`
                        : 'Start saving properties to build your portfolio'
                    }
                </Text>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={PRIMARY} colors={[PRIMARY]} />
                }
            >
                {hasProperties ? (
                    <>
                        {/* Portfolio Metrics */}
                        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#BCBAD0', letterSpacing: 1.8, marginBottom: 12 }}>
                                PORTFOLIO SNAPSHOT
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                                <MetricCard
                                    icon="🏦" label="Portfolio Value"
                                    value={`${formatMoney(analysis.portfolio_value)} EGP`}
                                    sub={`${analysis.property_count} propert${analysis.property_count > 1 ? 'ies' : 'y'}`}
                                    color={PRIMARY}
                                />
                                <MetricCard
                                    icon="💰" label="Est. Monthly Income"
                                    value={`${formatMoney(analysis.monthly_income)} EGP`}
                                    sub="Rental estimate" color="#2E7D32"
                                />
                            </View>
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                                <MetricCard
                                    icon="📈" label="Avg. Annual ROI"
                                    value={`${analysis.annual_roi}%`}
                                    sub="Market average" color={GOLD}
                                />
                                <MetricCard
                                    icon="🎯" label="Investment Goal"
                                    value={formatGoal(user?.investment_goal)}
                                    color={PRIMARY}
                                />
                            </View>
                        </View>

                        {/* AI Insight */}
                        <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
                            <View style={{
                                backgroundColor: PRIMARY, borderRadius: 18, padding: 18,
                                shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
                            }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                    <View style={{
                                        width: 32, height: 32, borderRadius: 16,
                                        backgroundColor: GOLD,
                                        justifyContent: 'center', alignItems: 'center', marginRight: 10,
                                    }}>
                                        <Text style={{ fontSize: 16 }}>🧠</Text>
                                    </View>
                                    <View>
                                        <Text style={{ color: GOLD, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 }}>
                                            AI PORTFOLIO INSIGHT
                                        </Text>
                                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>
                                            Powered by GPT-4o-mini
                                        </Text>
                                    </View>
                                </View>
                                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 21 }}>
                                    {analysis.ai_insight}
                                </Text>
                            </View>
                        </View>

                        {/* Saved Properties horizontal scroll */}
                        <View style={{ marginBottom: 20 }}>
                            <View style={{
                                flexDirection: 'row', justifyContent: 'space-between',
                                alignItems: 'center', paddingHorizontal: 16, marginBottom: 14,
                            }}>
                                <Text style={{ fontSize: 15, fontWeight: '800', color: PRIMARY }}>Saved Properties</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                                    <Text style={{ fontSize: 13, color: GOLD, fontWeight: '600' }}>Find More →</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                                {analysis.breakdown.map((prop) => (
                                    <SavedPropertyCard key={prop.property_id} property={prop} />
                                ))}
                            </ScrollView>
                        </View>

                        {/* Per Property Breakdown */}
                        <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#BCBAD0', letterSpacing: 1.8, marginBottom: 12 }}>
                                PROPERTY BREAKDOWN
                            </Text>
                            {analysis.breakdown.map((prop) => (
                                <View key={prop.property_id} style={{
                                    backgroundColor: '#fff', borderRadius: 14,
                                    padding: 16, marginBottom: 10,
                                    borderWidth: 1, borderColor: '#ECEAF5',
                                    flexDirection: 'row', alignItems: 'center',
                                }}>
                                    <View style={{
                                        width: 36, height: 36, borderRadius: 18,
                                        backgroundColor: GOLD_DIM,
                                        justifyContent: 'center', alignItems: 'center', marginRight: 14,
                                    }}>
                                        <Text style={{ fontSize: 16 }}>🏠</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: PRIMARY }}>
                                            {prop.city || 'Egypt'}{prop.type ? ` • ${prop.type}` : ''}
                                        </Text>
                                        <Text style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                                            {formatMoney(prop.price)} EGP • {prop.annual_roi}% ROI
                                        </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={{ fontSize: 12, color: '#AAA' }}>Monthly</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#2E7D32' }}>
                                            {formatMoney(prop.monthly_income)} EGP
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
                ) : (
                    /* Empty State */
                    <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingTop: 60 }}>
                        <View style={{
                            width: 100, height: 100, borderRadius: 50,
                            backgroundColor: GOLD_DIM, borderWidth: 1.5, borderColor: GOLD + '40',
                            justifyContent: 'center', alignItems: 'center', marginBottom: 24,
                        }}>
                            <Text style={{ fontSize: 44 }}>🏠</Text>
                        </View>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: PRIMARY, textAlign: 'center', marginBottom: 10 }}>
                            Your portfolio is empty
                        </Text>
                        <Text style={{ fontSize: 14, color: '#AAA', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
                            Save properties by tapping the ❤️ button on any property card. Your AI portfolio analysis will appear here.
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Search')}
                            style={{ backgroundColor: PRIMARY, borderRadius: 50, paddingHorizontal: 32, paddingVertical: 14 }}
                            activeOpacity={0.85}
                        >
                            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Browse Properties →</Text>
                        </TouchableOpacity>

                        {/* User preferences card */}
                        <View style={{
                            width: '100%', backgroundColor: '#fff', borderRadius: 16,
                            padding: 16, marginTop: 32, borderWidth: 1, borderColor: '#ECEAF5',
                        }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#BCBAD0', letterSpacing: 1.8, marginBottom: 14 }}>
                                YOUR INVESTMENT PROFILE
                            </Text>
                            {[
                                { label: 'Goal', value: formatGoal(user?.investment_goal) },
                                { label: 'Experience', value: user?.investment_status || 'Not set' },
                                {
                                    label: 'Budget', value: user?.budget_min && user?.budget_max
                                        ? `${formatMoney(user.budget_min)} – ${formatMoney(user.budget_max)} EGP`
                                        : 'Flexible'
                                },
                            ].map(({ label, value }) => (
                                <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <Text style={{ fontSize: 13, color: '#AAA' }}>{label}</Text>
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: PRIMARY }}>{value}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Quick Actions */}
                <View style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 40 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#BCBAD0', letterSpacing: 1.8, marginBottom: 12 }}>
                        QUICK ACTIONS
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Search')}
                            style={{ flex: 1, backgroundColor: PRIMARY, borderRadius: 14, padding: 16, alignItems: 'center' }}
                            activeOpacity={0.85}
                        >
                            <Text style={{ fontSize: 24, marginBottom: 6 }}>🔍</Text>
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' }}>Search Properties</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Chat')}
                            style={{ flex: 1, backgroundColor: GOLD, borderRadius: 14, padding: 16, alignItems: 'center' }}
                            activeOpacity={0.85}
                        >
                            <Text style={{ fontSize: 24, marginBottom: 6 }}>🤖</Text>
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' }}>AI Assistant</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}