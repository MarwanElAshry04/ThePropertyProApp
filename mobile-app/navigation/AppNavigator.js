import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();
const PRIMARY = '#1A1265';
const GOLD = '#C9A84C';

function LoadingScreen() {
    return (
        <View style={{
            flex: 1, backgroundColor: PRIMARY,
            justifyContent: 'center', alignItems: 'center',
        }}>
            <ActivityIndicator size="large" color={GOLD} />
        </View>
    );
}

export default function AppNavigator() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return <LoadingScreen />;

    return (
        // key prop forces NavigationContainer to fully remount when auth state changes
        // This ensures logout always resets to the Welcome screen
        <NavigationContainer key={isAuthenticated ? 'authenticated' : 'unauthenticated'}>
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
                {isAuthenticated ? (
                    <Stack.Screen name="MainApp" component={TabNavigator} />
                ) : (
                    <>
                        <Stack.Screen name="Auth" component={AuthNavigator} />
                        <Stack.Screen name="MainApp" component={TabNavigator} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}