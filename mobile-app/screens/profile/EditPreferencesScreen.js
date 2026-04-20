import {
    View, Text, TouchableOpacity, ScrollView,
    StatusBar, ActivityIndicator, Animated,
} from 'react-native';
import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

const PRIMARY = '#1A1265';
const PRIMARY_L = '#241980';
const GOLD = '#C9A84C';
const CREAM = '#F9F8FF';
const SUCCESS = '#4CAF50';

const GOALS = [
    { value: 'appreciation', label: 'Long-term appreciation', emoji: '📈', sub: 'Focus on properties that grow in value' },
    { value: 'rental', label: 'Monthly rental income', emoji: '💰', sub: 'Properties with strong rental demand' },
    { value: 'balanced', label: 'A balance of both', emoji: '⚖️', sub: 'Best of rental income and capital growth' },
];

const STATUSES = [
    { value: 'beginner', label: "I'm getting into investment", emoji: '🔍' },
    { value: 'intermediate', label: 'I own a few properties', emoji: '🏠' },
    { value: 'experienced', label: "I'm an experienced investor", emoji: '💼' },
];

const BUDGETS = [
    { label: 'Under 3M', min: null, max: 3_000_000 },
    { label: '3M – 6M', min: 3_000_000, max: 6_000_000 },
    { label: '6M – 12M', min: 6_000_000, max: 12_000_000 },
    { label: '12M – 25M', min: 12_000_000, max: 25_000_000 },
    { label: '25M+', min: 25_000_000, max: null },
    { label: 'Flexible', min: null, max: null },
];

const OptionCard = ({ emoji, label, sub, selected, onPress }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const press = () => {
        Animated.sequence([
            Animated.timing(scale, { toValue: 0.97, duration: 60, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 60, useNativeDriver: true }),
        ]).start(() => onPress());
    };
    return (
        <Animated.View style={{ transform: [{ scale }], marginBottom: 10 }}>
            <TouchableOpacity
                onPress={press} activeOpacity={1}
                style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: selected ? PRIMARY : '#fff',
                    borderRadius: 14, padding: 16,
                    borderWidth: 1.5,
                    borderColor: selected ? PRIMARY : '#ECEAF5',
                }}
            >
                <Text style={{ fontSize: 22, marginRight: 14 }}>{emoji}</Text>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: selected ? '#fff' : PRIMARY }}>
                        {label}
                    </Text>
                    {sub && <Text style={{ fontSize: 12, color: selected ? 'rgba(255,255,255,0.6)' : '#AAA', marginTop: 2 }}>{sub}</Text>}
                </View>
                {selected && <Text style={{ color: GOLD, fontSize: 18 }}>✓</Text>}
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function EditPreferencesScreen({ navigation }) {
    const { user, updateUser } = useAuth();

    const currentBudget = BUDGETS.find(b => b.min === user?.budget_min && b.max === user?.budget_max) || BUDGETS[5];

    const [goal, setGoal] = useState(user?.investment_goal || '');
    const [status, setStatus] = useState(user?.investment_status || '');
    const [budget, setBudget] = useState(currentBudget);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const handleSave = async () => {
        setLoading(true);
        setSuccess('');

        const result = await authService.updateProfile({
            investmentGoal: goal,
            investmentStatus: status,
            budgetMin: budget.min,
            budgetMax: budget.max,
        });

        if (result.success) {
            await updateUser(result.data.user);
            setSuccess('Preferences saved!');
            setTimeout(() => navigation.goBack(), 1200);
        }
        setLoading(false);
    };

    return (
        <View style={{ flex: 1, backgroundColor: CREAM }}>
            <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

            <View style={{
                backgroundColor: PRIMARY,
                paddingTop: (StatusBar.currentHeight || 44) + 12,
                paddingBottom: 20, paddingHorizontal: 20,
                flexDirection: 'row', alignItems: 'center',
            }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                    <Text style={{ color: '#fff', fontSize: 24 }}>←</Text>
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Investment Preferences</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>

                <Text style={{ fontSize: 10, fontWeight: '800', color: '#BCBAD0', letterSpacing: 1.8, marginBottom: 12 }}>INVESTMENT GOAL</Text>
                {GOALS.map(g => (
                    <OptionCard key={g.value} {...g} selected={goal === g.value} onPress={() => setGoal(g.value)} />
                ))}

                <Text style={{ fontSize: 10, fontWeight: '800', color: '#BCBAD0', letterSpacing: 1.8, marginTop: 20, marginBottom: 12 }}>INVESTOR TYPE</Text>
                {STATUSES.map(s => (
                    <OptionCard key={s.value} {...s} selected={status === s.value} onPress={() => setStatus(s.value)} />
                ))}

                <Text style={{ fontSize: 10, fontWeight: '800', color: '#BCBAD0', letterSpacing: 1.8, marginTop: 20, marginBottom: 12 }}>BUDGET RANGE (EGP)</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                    {BUDGETS.map(b => (
                        <TouchableOpacity
                            key={b.label}
                            onPress={() => setBudget(b)}
                            style={{
                                paddingHorizontal: 16, paddingVertical: 10,
                                borderRadius: 50,
                                backgroundColor: budget.label === b.label ? GOLD : '#fff',
                                borderWidth: 1.5,
                                borderColor: budget.label === b.label ? GOLD : '#ECEAF5',
                            }}
                        >
                            <Text style={{
                                fontSize: 13, fontWeight: '700',
                                color: budget.label === b.label ? '#fff' : PRIMARY,
                            }}>
                                {b.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {success ? (
                    <Text style={{ color: SUCCESS, fontSize: 13, textAlign: 'center', marginTop: 8 }}>✓ {success}</Text>
                ) : null}

                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                    activeOpacity={0.85}
                    style={{
                        backgroundColor: PRIMARY, borderRadius: 50,
                        height: 52, justifyContent: 'center', alignItems: 'center',
                        marginTop: 24,
                    }}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Save Preferences</Text>
                    }
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}