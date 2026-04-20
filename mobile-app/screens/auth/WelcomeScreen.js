import {
    View, Text, TouchableOpacity,
    StatusBar, Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PRIMARY = '#1A1265';
const GOLD = '#C9A84C';
const GOLD_DIM = '#C9A84C20';

// ─── Decorative background shapes ─────────────────────────────────────────────
const BgDecor = () => (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {/* Top right circle */}
        <View style={{
            position: 'absolute', top: -60, right: -60,
            width: 220, height: 220, borderRadius: 110,
            backgroundColor: 'rgba(201,168,76,0.08)',
        }} />
        {/* Middle left circle */}
        <View style={{
            position: 'absolute', top: SCREEN_HEIGHT * 0.3, left: -80,
            width: 200, height: 200, borderRadius: 100,
            backgroundColor: 'rgba(255,255,255,0.04)',
        }} />
        {/* Bottom right circle */}
        <View style={{
            position: 'absolute', bottom: 100, right: -40,
            width: 160, height: 160, borderRadius: 80,
            backgroundColor: 'rgba(201,168,76,0.06)',
        }} />
    </View>
);

// ─── Property illustration ─────────────────────────────────────────────────────
const PropertyIllustration = () => (
    <View style={{
        width: 180, height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    }}>
        <Svg width="100" height="100" viewBox="0 0 100 100" fill="none">
            {/* House */}
            <Rect x="20" y="48" width="60" height="42" rx="4" fill={GOLD} opacity="0.85" />
            {/* Roof */}
            <Path d="M10 50L50 16L90 50" stroke={GOLD} strokeWidth="5"
                strokeLinecap="round" strokeLinejoin="round" />
            {/* Door */}
            <Rect x="38" y="64" width="24" height="26" rx="3" fill={PRIMARY} />
            {/* Windows */}
            <Rect x="24" y="56" width="14" height="12" rx="2" fill={PRIMARY} opacity="0.7" />
            <Rect x="62" y="56" width="14" height="12" rx="2" fill={PRIMARY} opacity="0.7" />
            {/* Gold coin */}
            <Circle cx="76" cy="28" r="14" fill={GOLD} />
            <Text style={{
                position: 'absolute', top: 16, left: 67,
                color: PRIMARY, fontSize: 16, fontWeight: '800',
            }}>$</Text>
        </Svg>
        <Text style={{
            position: 'absolute', top: 72, left: 72,
            color: PRIMARY, fontSize: 20, fontWeight: '800',
        }}>$</Text>
    </View>
);

export default function WelcomeScreen({ navigation }) {
    return (
        <View style={{ flex: 1, backgroundColor: PRIMARY }}>
            <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
            <BgDecor />

            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 32,
                paddingTop: StatusBar.currentHeight || 44,
            }}>
                {/* Brand label */}
                <Text style={{
                    color: GOLD,
                    fontSize: 11,
                    fontWeight: '800',
                    letterSpacing: 3,
                    marginBottom: 48,
                }}>
                    PROPERTY PRO
                </Text>

                {/* Illustration */}
                <View style={{
                    width: 180, height: 180,
                    borderRadius: 90,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.10)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 48,
                }}>
                    <Text style={{ fontSize: 72 }}>🏠</Text>
                </View>

                {/* Headline */}
                <Text style={{
                    color: '#FFFFFF',
                    fontSize: 30,
                    fontWeight: '800',
                    textAlign: 'center',
                    lineHeight: 38,
                    marginBottom: 12,
                }}>
                    Invest Smarter{'\n'}in Egyptian Real Estate
                </Text>

                {/* Subtitle */}
                <Text style={{
                    color: 'rgba(255,255,255,0.55)',
                    fontSize: 15,
                    textAlign: 'center',
                    lineHeight: 22,
                    marginBottom: 56,
                }}>
                    AI-powered recommendations from{'\n'}18,963 properties across Egypt
                </Text>

                {/* Get Started button */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('Onboarding1')}
                    activeOpacity={0.85}
                    style={{
                        width: '100%',
                        height: 56,
                        backgroundColor: GOLD,
                        borderRadius: 28,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 16,
                        shadowColor: GOLD,
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.4,
                        shadowRadius: 16,
                        elevation: 8,
                    }}
                >
                    <Text style={{
                        color: '#FFFFFF',
                        fontSize: 17,
                        fontWeight: '800',
                        letterSpacing: 0.3,
                    }}>
                        Get Started →
                    </Text>
                </TouchableOpacity>

                {/* Sign In link */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('SignIn')}
                    activeOpacity={0.7}
                    style={{ paddingVertical: 12 }}
                >
                    <Text style={{
                        color: 'rgba(255,255,255,0.55)',
                        fontSize: 14,
                        textAlign: 'center',
                    }}>
                        Already have an account?{' '}
                        <Text style={{
                            color: '#FFFFFF',
                            fontWeight: '700',
                            textDecorationLine: 'underline',
                        }}>
                            Sign In
                        </Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}