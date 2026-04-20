import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

import SearchProperties from '../components/SearchProperties';
import HomeScreen from '../screens/HomeScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileNavigator from './ProfileNavigator';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PRIMARY = '#1A1265';
const GOLD = '#C9A84C';
const INACTIVE = '#BBBBBB';
// ──────────────────────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator();

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const HomeIcon = ({ color }) => (
    <Svg width="22" height="20" viewBox="0 0 22 20" fill="none">
        <Path
            d="M1 9L11 1L21 9V19H14V13H8V19H1V9Z"
            stroke={color} strokeWidth="2"
            strokeLinejoin="round" strokeLinecap="round"
        />
    </Svg>
);

const SearchIcon = ({ color }) => (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <Circle cx="8.5" cy="8.5" r="6.5" stroke={color} strokeWidth="2" />
        <Path d="M13.5 13.5L18.5 18.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
);

const ChatIcon = ({ color }) => (
    <Svg width="22" height="20" viewBox="0 0 22 20" fill="none">
        <Rect x="1" y="1" width="20" height="14" rx="3" stroke={color} strokeWidth="2" />
        <Path d="M7 19L11 15L15 19" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </Svg>
);

const ProfileIcon = ({ color }) => (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <Circle cx="10" cy="6" r="4.5" stroke={color} strokeWidth="2" />
        <Path
            d="M1 19C1 14.582 5.029 11 10 11C14.971 11 19 14.582 19 19"
            stroke={color} strokeWidth="2" strokeLinecap="round"
        />
    </Svg>
);

// ─── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
    { name: 'Home', label: 'Home', Icon: HomeIcon },
    { name: 'Search', label: 'Search', Icon: SearchIcon },
    { name: 'Chat', label: 'Chat', Icon: ChatIcon },
    { name: 'Profile', label: 'Profile', Icon: ProfileIcon },
];

// ─── Custom Tab Bar ────────────────────────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }) {
    const insets = useSafeAreaInsets();

    return (
        <View style={{
            flexDirection: 'row',
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#ECEAF5',
            paddingTop: 10,
            paddingBottom: insets.bottom + 6,  // safe area for iOS home indicator
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 12,
        }}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;
                const tab = TABS.find(t => t.name === route.name);
                const color = isFocused ? PRIMARY : INACTIVE;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });
                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        onPress={onPress}
                        activeOpacity={0.7}
                        style={{ flex: 1, alignItems: 'center', gap: 4 }}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                    >
                        {/* Icon */}
                        {tab && <tab.Icon color={color} />}

                        {/* Label */}
                        <Text style={{
                            fontSize: 10,
                            fontWeight: isFocused ? '700' : '500',
                            color,
                        }}>
                            {tab?.label}
                        </Text>

                        {/* Active dot indicator */}
                        {isFocused && (
                            <View style={{
                                width: 20, height: 3,
                                borderRadius: 2,
                                backgroundColor: PRIMARY,
                                marginTop: 1,
                            }} />
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

// ─── Tab Navigator ─────────────────────────────────────────────────────────────
export default function TabNavigator() {
    return (
        <Tab.Navigator
            initialRouteName="Search"
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Search" component={SearchProperties} />
            <Tab.Screen name="Chat" component={ChatScreen} />
            <Tab.Screen name="Profile" component={ProfileNavigator} />
        </Tab.Navigator>
    );
}