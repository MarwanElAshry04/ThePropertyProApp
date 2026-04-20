import {
    View, Text, TouchableOpacity, ScrollView, StatusBar,
} from 'react-native';
import { useState } from 'react';

const PRIMARY = '#1A1265';
const GOLD = '#C9A84C';
const CREAM = '#F9F8FF';

const ToggleOption = ({ label, selected, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={{
            flex: 1, paddingVertical: 12,
            alignItems: 'center', borderRadius: 10,
            backgroundColor: selected ? PRIMARY : 'transparent',
        }}
    >
        <Text style={{
            fontSize: 14, fontWeight: '700',
            color: selected ? '#fff' : '#AAA',
        }}>
            {label}
        </Text>
    </TouchableOpacity>
);

const SectionCard = ({ children }) => (
    <View style={{
        backgroundColor: '#fff', borderRadius: 16,
        marginHorizontal: 16, marginBottom: 16,
        overflow: 'hidden', borderWidth: 1, borderColor: '#ECEAF5',
        padding: 16,
    }}>
        {children}
    </View>
);

export default function AppSettingsScreen({ navigation }) {
    const [currency, setCurrency] = useState('EGP');
    const [language, setLanguage] = useState('EN');

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
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>App Settings</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingTop: 24 }}>

                {/* Currency */}
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#BCBAD0', letterSpacing: 1.8, paddingHorizontal: 20, marginBottom: 12 }}>
                    CURRENCY
                </Text>
                <SectionCard>
                    <Text style={{ fontSize: 13, color: '#777', marginBottom: 14, lineHeight: 20 }}>
                        Choose how prices are displayed throughout the app.
                    </Text>
                    <View style={{
                        flexDirection: 'row', backgroundColor: '#F0EFF8',
                        borderRadius: 12, padding: 4,
                    }}>
                        <ToggleOption label="🇪🇬 EGP" selected={currency === 'EGP'} onPress={() => setCurrency('EGP')} />
                        <ToggleOption label="🇺🇸 USD" selected={currency === 'USD'} onPress={() => setCurrency('USD')} />
                    </View>
                    {currency === 'USD' && (
                        <Text style={{ color: GOLD, fontSize: 12, marginTop: 10, textAlign: 'center' }}>
                            USD prices use approximate exchange rates
                        </Text>
                    )}
                </SectionCard>

                {/* Language */}
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#BCBAD0', letterSpacing: 1.8, paddingHorizontal: 20, marginBottom: 12 }}>
                    LANGUAGE
                </Text>
                <SectionCard>
                    <Text style={{ fontSize: 13, color: '#777', marginBottom: 14, lineHeight: 20 }}>
                        Choose your preferred language.
                    </Text>
                    <View style={{
                        flexDirection: 'row', backgroundColor: '#F0EFF8',
                        borderRadius: 12, padding: 4,
                    }}>
                        <ToggleOption label="🇬🇧 English" selected={language === 'EN'} onPress={() => setLanguage('EN')} />
                        <ToggleOption label="🇪🇬 العربية" selected={language === 'AR'} onPress={() => setLanguage('AR')} />
                    </View>
                    {language === 'AR' && (
                        <View style={{
                            backgroundColor: GOLD + '20', borderRadius: 10, padding: 12, marginTop: 10,
                            borderWidth: 1, borderColor: GOLD + '40',
                        }}>
                            <Text style={{ color: GOLD, fontSize: 12, textAlign: 'center', fontWeight: '600' }}>
                                📌 Arabic (RTL) support coming soon
                            </Text>
                        </View>
                    )}
                </SectionCard>

                {/* Dark Mode */}
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#BCBAD0', letterSpacing: 1.8, paddingHorizontal: 20, marginBottom: 12 }}>
                    APPEARANCE
                </Text>
                <SectionCard>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: PRIMARY }}>Dark Mode</Text>
                            <Text style={{ fontSize: 12, color: '#AAA', marginTop: 2 }}>Switch to a dark theme</Text>
                        </View>
                        <View style={{
                            backgroundColor: GOLD + '20', borderRadius: 20,
                            paddingHorizontal: 12, paddingVertical: 5,
                            borderWidth: 1, borderColor: GOLD + '40',
                        }}>
                            <Text style={{ color: GOLD, fontSize: 11, fontWeight: '700' }}>Coming Soon</Text>
                        </View>
                    </View>
                </SectionCard>
            </ScrollView>
        </View>
    );
}