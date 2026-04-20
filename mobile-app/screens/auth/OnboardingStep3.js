import {
    View, Text, TouchableOpacity,
    StatusBar, Animated,
} from 'react-native';
import { useRef } from 'react';

const PRIMARY = '#1A1265';
const PRIMARY_L = '#241980';
const GOLD = '#C9A84C';

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

const OptionCard = ({ emoji, label, sub, onPress }) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        Animated.sequence([
            Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
        ]).start(() => onPress());
    };

    return (
        <Animated.View style={{ transform: [{ scale }], marginBottom: 14 }}>
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={1}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: PRIMARY_L,
                    borderRadius: 18,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.12)',
                }}
            >
                <View style={{
                    width: 48, height: 48, borderRadius: 24,
                    backgroundColor: 'rgba(201,168,76,0.15)',
                    borderWidth: 1, borderColor: 'rgba(201,168,76,0.30)',
                    justifyContent: 'center', alignItems: 'center',
                    marginRight: 16,
                }}>
                    <Text style={{ fontSize: 22 }}>{emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{
                        color: '#FFFFFF',
                        fontSize: 16,
                        fontWeight: '700',
                        marginBottom: 3,
                    }}>
                        {label}
                    </Text>
                    {sub && (
                        <Text style={{
                            color: 'rgba(255,255,255,0.45)',
                            fontSize: 12,
                            lineHeight: 18,
                        }}>
                            {sub}
                        </Text>
                    )}
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>›</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function OnboardingStep3({ navigation, route }) {
    const { investmentStatus, budget } = route.params || {};

    const handleSelect = (goal) => {
        // All onboarding data collected — navigate to SignUp
        // Phase 7: save to AuthContext here
        navigation.navigate('SignUp', {
            investmentStatus,
            budget,
            investmentGoal: goal,
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
                        Step 3 of 3
                    </Text>
                </View>

                <ProgressBar step={3} total={3} />

                {/* Question */}
                <Text style={{
                    color: '#FFFFFF',
                    fontSize: 28,
                    fontWeight: '800',
                    lineHeight: 36,
                    marginBottom: 10,
                }}>
                    What's your main goal?
                </Text>
                <Text style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: 15,
                    lineHeight: 22,
                    marginBottom: 40,
                }}>
                    This helps us recommend the right properties
                </Text>

                {/* Options */}
                <OptionCard
                    emoji="📈"
                    label="Long term appreciation"
                    sub="Focus on properties likely to grow in value"
                    onPress={() => handleSelect('appreciation')}
                />
                <OptionCard
                    emoji="💰"
                    label="Monthly rental income"
                    sub="Properties with strong rental demand"
                    onPress={() => handleSelect('rental')}
                />
                <OptionCard
                    emoji="⚖️"
                    label="A balance of both"
                    sub="Best of rental income and capital growth"
                    onPress={() => handleSelect('balanced')}
                />
            </View>
        </View>
    );
}