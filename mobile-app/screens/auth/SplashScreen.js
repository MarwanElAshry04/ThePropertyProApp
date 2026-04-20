import { View, Text, StatusBar } from 'react-native';
import { useEffect } from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const PRIMARY = '#1A1265';
const GOLD = '#C9A84C';

// ─── PropertyPro Logo SVG ─────────────────────────────────────────────────────
const Logo = () => (
    <Svg width="80" height="80" viewBox="0 0 80 80" fill="none">
        {/* House body */}
        <Rect x="18" y="38" width="44" height="32" rx="4" fill={GOLD} opacity="0.9" />
        {/* Roof */}
        <Path d="M8 40L40 10L72 40" stroke={GOLD} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Door */}
        <Rect x="32" y="52" width="16" height="18" rx="3" fill={PRIMARY} />
        {/* Dollar sign circle */}
        <Circle cx="58" cy="28" r="12" fill={PRIMARY} />
        <Text
            x="58" y="33"
            textAnchor="middle"
            fill={GOLD}
            fontSize="14"
            fontWeight="bold"
        >$</Text>
    </Svg>
);

export default function SplashScreen({ navigation }) {
    // Auto-advance after 2 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.replace('Welcome');
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={{
            flex: 1,
            backgroundColor: PRIMARY,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: StatusBar.currentHeight || 0,
        }}>
            <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

            {/* Logo */}
            <View style={{ marginBottom: 24 }}>
                <Logo />
            </View>

            {/* App name */}
            <Text style={{
                color: '#FFFFFF',
                fontSize: 32,
                fontWeight: '800',
                letterSpacing: 0.5,
                marginBottom: 8,
            }}>
                PropertyPro
            </Text>

            {/* Tagline */}
            <Text style={{
                color: GOLD,
                fontSize: 13,
                fontWeight: '600',
                letterSpacing: 2,
            }}>
                AI-POWERED REAL ESTATE
            </Text>

            {/* Loading dots */}
            <View style={{
                flexDirection: 'row',
                gap: 8,
                marginTop: 60,
            }}>
                {[0, 1, 2].map((i) => (
                    <View key={i} style={{
                        width: i === 0 ? 24 : 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: i === 0 ? GOLD : 'rgba(255,255,255,0.25)',
                    }} />
                ))}
            </View>
        </View>
    );
}