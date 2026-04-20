import {
    View, Text, TouchableOpacity,
    StatusBar, Animated,
} from 'react-native';
import { useRef } from 'react';

const PRIMARY = '#1A1265';
const PRIMARY_L = '#241980';
const GOLD = '#C9A84C';
const GOLD_DIM = '#C9A84C20';

const ProgressBar = ({ step, total }) => (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 40 }}>
        {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                backgroundColor: i < step ? GOLD : 'rgba(255,255,255,0.20)',
            }} />
        ))}
    </View>
);

const BUDGETS = [
    { label: 'Under $200K', sub: 'Up to 3M EGP', value: { max: 3_000_000 } },
    { label: '$200K – $400K', sub: '3M – 6M EGP', value: { min: 3_000_000, max: 6_000_000 } },
    { label: '$400K – $750K', sub: '6M – 12M EGP', value: { min: 6_000_000, max: 12_000_000 } },
    { label: 'Over $750K', sub: '12M+ EGP', value: { min: 12_000_000 } },
];

const BudgetCard = ({ label, sub, onPress }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        Animated.sequence([
            Animated.timing(scale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
        ]).start(() => onPress());
    };

    return (
        <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={1}
                style={{
                    backgroundColor: PRIMARY_L,
                    borderRadius: 18,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.12)',
                    minHeight: 110,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <Text style={{
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: '800',
                    textAlign: 'center',
                    marginBottom: 6,
                }}>
                    {label}
                </Text>
                <Text style={{
                    color: GOLD,
                    fontSize: 11,
                    fontWeight: '600',
                    textAlign: 'center',
                }}>
                    {sub}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function OnboardingStep2({ navigation, route }) {
    const { investmentStatus } = route.params || {};

    const handleSelect = (budgetValue) => {
        navigation.navigate('Onboarding3', {
            investmentStatus,
            budget: budgetValue,
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: PRIMARY }}>
            <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

            <View style={{
                flex: 1,
                paddingHorizontal: 24,
                paddingTop: (StatusBar.currentHeight || 44) + 16,
                paddingBottom: 32,
            }}>
                {/* Back + Step */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ marginRight: 12, padding: 4 }}
                    >
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 24 }}>←</Text>
                    </TouchableOpacity>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' }}>
                        Step 2 of 3
                    </Text>
                </View>

                <ProgressBar step={2} total={3} />

                {/* Question */}
                <Text style={{
                    color: '#FFFFFF',
                    fontSize: 28,
                    fontWeight: '800',
                    lineHeight: 36,
                    marginBottom: 10,
                }}>
                    What's your budget?
                </Text>
                <Text style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: 15,
                    lineHeight: 22,
                    marginBottom: 40,
                }}>
                    This helps us show you properties you can afford
                </Text>

                {/* 2×2 Grid */}
                <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <BudgetCard
                            label={BUDGETS[0].label}
                            sub={BUDGETS[0].sub}
                            onPress={() => handleSelect(BUDGETS[0].value)}
                        />
                        <BudgetCard
                            label={BUDGETS[1].label}
                            sub={BUDGETS[1].sub}
                            onPress={() => handleSelect(BUDGETS[1].value)}
                        />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <BudgetCard
                            label={BUDGETS[2].label}
                            sub={BUDGETS[2].sub}
                            onPress={() => handleSelect(BUDGETS[2].value)}
                        />
                        <BudgetCard
                            label={BUDGETS[3].label}
                            sub={BUDGETS[3].sub}
                            onPress={() => handleSelect(BUDGETS[3].value)}
                        />
                    </View>
                </View>

                {/* Flexible budget link */}
                <TouchableOpacity
                    onPress={() => handleSelect({ min: null, max: null })}
                    style={{ marginTop: 28, alignItems: 'center', paddingVertical: 8 }}
                    activeOpacity={0.7}
                >
                    <Text style={{
                        color: 'rgba(255,255,255,0.45)',
                        fontSize: 14,
                        textDecorationLine: 'underline',
                    }}>
                        I'm flexible with budget
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}