import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Switch,
    Animated,
    Modal,
    StatusBar,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PRIMARY = '#1A1265';
const GOLD = '#C9A84C';
const GOLD_DIM = '#C9A84C22';
const CREAM = '#F9F8FF';
// ──────────────────────────────────────────────────────────────────────────────

const CITIES = [
    'Any', 'Cairo', 'Giza', 'Alexandria', 'New Cairo',
    'Sheikh Zayed', '6th October', 'Heliopolis',
    'Maadi', 'Zamalek', 'Shorouk', 'Nasr City',
];

// Chips that are actually neighborhoods must send both city + neighborhood
// so the backend triggers the precise PostgreSQL-first neighbourhood strategy.
const NEIGHBORHOOD_CITY_MAP = {
    'New Cairo':    { city: 'Cairo', neighborhood: 'New Cairo' },
    'Sheikh Zayed': { city: 'Giza',  neighborhood: 'Sheikh Zayed' },
    '6th October':  { city: 'Giza',  neighborhood: '6th October' },
    'Heliopolis':   { city: 'Cairo', neighborhood: 'Heliopolis' },
    'Maadi':        { city: 'Cairo', neighborhood: 'Maadi' },
    'Zamalek':      { city: 'Cairo', neighborhood: 'Zamalek' },
    'Shorouk':      { city: 'Cairo', neighborhood: 'Shorouk' },
    'Nasr City':    { city: 'Cairo', neighborhood: 'Nasr City' },
};
const TYPES = ['Any', 'Villa', 'Apartment', 'Chalet', 'Townhouse', 'Studio', 'Penthouse', 'Duplex'];
const BUDGET_OPTIONS = [
    { label: 'Any', min: null, max: null },
    { label: 'Under 3M', min: null, max: 3_000_000 },
    { label: '3M – 6M', min: 3_000_000, max: 6_000_000 },
    { label: '6M – 12M', min: 6_000_000, max: 12_000_000 },
    { label: '12M – 25M', min: 12_000_000, max: 25_000_000 },
    { label: '25M+', min: 25_000_000, max: null },
];
const BED_OPTIONS = ['Any', '1', '2', '3', '4', '5+'];
const BATH_OPTIONS = ['Any', '1', '2', '3', '4+'];

// ─── Sub-components ────────────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
    <Text style={{ fontSize: 10, fontWeight: '800', color: '#BCBAD0', letterSpacing: 1.8, marginBottom: 12, marginTop: 24 }}>
        {children}
    </Text>
);

const Chip = ({ label, selected, onPress, gold = false }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={{
            paddingHorizontal: 16, paddingVertical: 9,
            borderRadius: 50, marginRight: 8,
            backgroundColor: selected ? (gold ? GOLD : PRIMARY) : '#fff',
            borderWidth: 1.5,
            borderColor: selected ? (gold ? GOLD : PRIMARY) : '#E4E2F0',
        }}
    >
        <Text style={{ fontSize: 13, fontWeight: selected ? '700' : '500', color: selected ? '#fff' : '#777' }}>
            {label}
        </Text>
    </TouchableOpacity>
);

const NumberButton = ({ label, selected, onPress }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        style={{
            width: 54, height: 46,
            borderRadius: 12,
            justifyContent: 'center', alignItems: 'center',
            backgroundColor: selected ? PRIMARY : '#fff',
            borderWidth: 1.5,
            borderColor: selected ? PRIMARY : '#E4E2F0',
            marginRight: 8,
        }}
    >
        <Text style={{ fontSize: 13, fontWeight: '700', color: selected ? '#fff' : '#777' }}>
            {label}
        </Text>
    </TouchableOpacity>
);

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SearchFilter({ visible, onClose, onFiltersChange }) {

    const [query, setQuery] = useState('');
    const [city, setCity] = useState('Any');
    const [propertyType, setPropertyType] = useState('Any');
    const [budget, setBudget] = useState(BUDGET_OPTIONS[0]);
    const [bedrooms, setBedrooms] = useState('Any');
    const [bathrooms, setBathrooms] = useState('Any');
    const [minSize, setMinSize] = useState('');
    const [maxSize, setMaxSize] = useState('');
    const [hasMaidRoom, setHasMaidRoom] = useState(false);

    const slideAnim = useRef(new Animated.Value(600)).current;
    const inputRef = useRef(null);

    // ── Critical fix: don't call onFiltersChange on initial mount ─────────────
    // Only fire when the user actually changes a value
    const hasMounted = useRef(false);

    // Slide animation
    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0, useNativeDriver: true, tension: 70, friction: 12,
            }).start();
            setTimeout(() => inputRef.current?.focus(), 400);
        } else {
            Animated.timing(slideAnim, {
                toValue: 600, duration: 260, useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    // Live filter updates — skips the very first run on mount
    useEffect(() => {
        if (!hasMounted.current) {
            hasMounted.current = true;
            return; // ← skip; SearchProperties already fetched on mount
        }

        // Text input: debounce 600ms. Chip/toggle: fire immediately (0ms)
        const delay = query ? 600 : 0;
        const timer = setTimeout(() => {
            onFiltersChange(buildParams());
        }, delay);

        return () => clearTimeout(timer);
    }, [query, city, propertyType, budget, bedrooms, bathrooms, minSize, maxSize, hasMaidRoom]);

    const buildParams = () => {
        const locationMapping = city !== 'Any' ? NEIGHBORHOOD_CITY_MAP[city] : null;
        return {
            query: query || 'properties in Egypt',
            city: locationMapping ? locationMapping.city : (city !== 'Any' ? city : undefined),
            neighborhood: locationMapping ? locationMapping.neighborhood : undefined,
            type: propertyType !== 'Any' ? propertyType : undefined,
            min_price: budget.min ?? undefined,
            max_price: budget.max ?? undefined,
            bedrooms: bedrooms !== 'Any' ? parseInt(bedrooms) : undefined,
            bathrooms: bathrooms !== 'Any' ? parseInt(bathrooms) : undefined,
            min_size: minSize ? parseInt(minSize) : undefined,
            max_size: maxSize ? parseInt(maxSize) : undefined,
            has_maid_room: hasMaidRoom || undefined,
            limit: 20,
        };
    };

    const resetAll = () => {
        setQuery('');
        setCity('Any');
        setPropertyType('Any');
        setBudget(BUDGET_OPTIONS[0]);
        setBedrooms('Any');
        setBathrooms('Any');
        setMinSize('');
        setMaxSize('');
        setHasMaidRoom(false);
    };

    const activeCount = [
        city !== 'Any', propertyType !== 'Any',
        budget.label !== 'Any',
        bedrooms !== 'Any', bathrooms !== 'Any',
        !!minSize || !!maxSize,
        hasMaidRoom,
    ].filter(Boolean).length;

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
            <Animated.View style={{ flex: 1, backgroundColor: CREAM, transform: [{ translateY: slideAnim }] }}>

                {/* Header */}
                <View style={{ backgroundColor: PRIMARY, paddingTop: (StatusBar.currentHeight || 44) + 12, paddingBottom: 18, paddingHorizontal: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                        <TouchableOpacity onPress={onClose} style={{ marginRight: 14, padding: 4 }}>
                            <Text style={{ color: '#fff', fontSize: 24, lineHeight: 26 }}>←</Text>
                        </TouchableOpacity>
                        <Text style={{ color: GOLD, fontSize: 10, fontWeight: '800', letterSpacing: 2.5, flex: 1 }}>
                            SEARCH & FILTER
                        </Text>
                        {activeCount > 0 && (
                            <TouchableOpacity onPress={resetAll} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
                                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '600' }}>Reset all</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Search input — gold border when active */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', height: 50, backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1.5, borderColor: query.length ? GOLD : 'rgba(255,255,255,0.20)', borderRadius: 14, paddingHorizontal: 14 }}>
                        <Text style={{ fontSize: 15, marginRight: 10, opacity: 0.6 }}>🔍</Text>
                        <TextInput
                            ref={inputRef}
                            style={{ flex: 1, color: '#fff', fontSize: 15 }}
                            placeholder="Describe what you're looking for..."
                            placeholderTextColor="rgba(255,255,255,0.35)"
                            value={query}
                            onChangeText={setQuery}
                            returnKeyType="search"
                            onSubmitEditing={onClose}
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => setQuery('')} style={{ padding: 4 }}>
                                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 20, lineHeight: 22 }}>×</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Filter sections */}
                <ScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
                >
                    {/* City */}
                    <SectionLabel>CITY / LOCATION</SectionLabel>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
                        {CITIES.map(c => <Chip key={c} label={c} selected={city === c} onPress={() => setCity(c)} />)}
                    </ScrollView>

                    {/* Property Type */}
                    <SectionLabel>PROPERTY TYPE</SectionLabel>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
                        {TYPES.map(t => <Chip key={t} label={t} selected={propertyType === t} onPress={() => setPropertyType(t)} />)}
                    </ScrollView>

                    {/* Budget */}
                    <SectionLabel>BUDGET RANGE</SectionLabel>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
                        {BUDGET_OPTIONS.map(b => (
                            <Chip key={b.label} label={b.label} gold selected={budget.label === b.label} onPress={() => setBudget(b)} />
                        ))}
                    </ScrollView>

                    {/* Bedrooms */}
                    <SectionLabel>BEDROOMS</SectionLabel>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {BED_OPTIONS.map(b => <NumberButton key={b} label={b} selected={bedrooms === b} onPress={() => setBedrooms(b)} />)}
                    </View>

                    {/* Bathrooms */}
                    <SectionLabel>BATHROOMS</SectionLabel>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {BATH_OPTIONS.map(b => <NumberButton key={b} label={b} selected={bathrooms === b} onPress={() => setBathrooms(b)} />)}
                    </View>

                    {/* Size */}
                    <SectionLabel>PROPERTY SIZE (SQM)</SectionLabel>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {[{ val: minSize, set: setMinSize, ph: 'Min sqm' }, { val: maxSize, set: setMaxSize, ph: 'Max sqm' }].map(({ val, set, ph }) => (
                            <View key={ph} style={{ flex: 1, height: 46, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: val ? PRIMARY + '60' : '#E4E2F0', paddingHorizontal: 14, justifyContent: 'center' }}>
                                <TextInput
                                    style={{ color: PRIMARY, fontSize: 14 }}
                                    placeholder={ph}
                                    placeholderTextColor="#CCC"
                                    keyboardType="numeric"
                                    value={val}
                                    onChangeText={set}
                                />
                            </View>
                        ))}
                        <Text style={{ color: '#CCC', fontSize: 18, fontWeight: '300' }}>—</Text>
                    </View>

                    {/* Maid's Room */}
                    <SectionLabel>AMENITIES</SectionLabel>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: hasMaidRoom ? PRIMARY + '35' : '#E4E2F0' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: '700', color: PRIMARY }}>Has Maid's Room</Text>
                            <Text style={{ fontSize: 12, color: '#AAA', marginTop: 2 }}>Only show properties with maid's room</Text>
                        </View>
                        <Switch
                            value={hasMaidRoom}
                            onValueChange={setHasMaidRoom}
                            trackColor={{ false: '#E4E2F0', true: PRIMARY }}
                            thumbColor={hasMaidRoom ? GOLD : '#fff'}
                            ios_backgroundColor="#E4E2F0"
                        />
                    </View>

                    {/* Active filters footer */}
                    {activeCount > 0 && (
                        <View style={{ marginTop: 28, padding: 16, backgroundColor: GOLD_DIM, borderRadius: 16, borderWidth: 1, borderColor: GOLD + '35', flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: GOLD, marginRight: 10 }} />
                            <Text style={{ fontSize: 13, color: PRIMARY, flex: 1, lineHeight: 18 }}>
                                <Text style={{ fontWeight: '800' }}>{activeCount} filter{activeCount > 1 ? 's' : ''} active</Text>
                                {' — results updating live'}
                            </Text>
                            <TouchableOpacity onPress={onClose} style={{ backgroundColor: PRIMARY, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 50 }}>
                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>See Results →</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </Animated.View>
        </Modal>
    );
}