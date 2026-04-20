import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import PersonalInfoScreen from '../screens/profile/PersonalInfoScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import EditPreferencesScreen from '../screens/profile/EditPreferencesScreen';
import AppSettingsScreen from '../screens/profile/AppSettingsScreen';
import { HelpSupportScreen, PolicyScreen } from '../screens/profile/HelpAndPolicyScreens';

const Stack = createNativeStackNavigator();

export default function ProfileNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="ProfileMain" component={ProfileScreen} />
            <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="EditPreferences" component={EditPreferencesScreen} />
            <Stack.Screen name="AppSettings" component={AppSettingsScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="Policy" component={PolicyScreen} />
        </Stack.Navigator>
    );
}