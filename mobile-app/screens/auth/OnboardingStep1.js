import {
    View, Text, TouchableOpacity,
    StatusBar, Animated,
} from 'react-native';
import { useRef } from 'react';

const PRIMARY = '#1A1265';
const PRIMARY_L = '#241980';
const GOLD = '#C9A84C';

// ─── Progress Bar ──────────────────────────────────────────────────────────────
const ProgressBar = ({ step, total }) => (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 40 }}>
        {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                backgroundColor: i < step
                    ? GOLD
                    : 'rgba(255,255,255,0.20)',
            }} />
        ))}
    </View>
);

// ─── Option Card ───────────────────────────────────────────────────────────────
const OptionCard = ({ emoji, label, onPress }) => {
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
                <Text style={{
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: '700',
                    flex: 1,
                }}>
                    {label}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>›</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function OnboardingStep1({ navigation }) {
    const handleSelect = (value) => {
        // Store selection and advance — Phase 7 will save to AuthContext
        navigation.navigate('Onboarding2', { investmentStatus: value });
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
                {/* Back + Step label */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ marginRight: 12, padding: 4 }}
                    >
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 24 }}>←</Text>
                    </TouchableOpacity>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' }}>
                        Step 1 of 3
                    </Text>
                </View>

                {/* Progress bar */}
                <ProgressBar step={1} total={3} />

                {/* Question */}
                <Text style={{
                    color: '#FFFFFF',
                    fontSize: 28,
                    fontWeight: '800',
                    lineHeight: 36,
                    marginBottom: 10,
                }}>
                    What brings you here?
                </Text>
                <Text style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: 15,
                    lineHeight: 22,
                    marginBottom: 40,
                }}>
                    This helps us personalise your experience
                </Text>

                {/* Options */}
                <OptionCard
                    emoji="🔍"
                    label="I'm getting into investment"
                    onPress={() => handleSelect('beginner')}
                />
                <OptionCard
                    emoji="🏠"
                    label="I own a few properties"
                    onPress={() => handleSelect('intermediate')}
                />
                <OptionCard
                    emoji="💼"
                    label="I'm an experienced investor"
                    onPress={() => handleSelect('experienced')}
                />
            </View>
        </View>
    );
}