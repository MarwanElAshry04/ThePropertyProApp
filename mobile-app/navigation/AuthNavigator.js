import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/auth/SplashScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import OnboardingStep1 from '../screens/auth/OnboardingStep1';
import OnboardingStep2 from '../screens/auth/OnboardingStep2';
import OnboardingStep3 from '../screens/auth/OnboardingStep3';
import SignUpScreen from '../screens/auth/SignUpScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
    return (
        <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 280,
            }}
        >
            <Stack.Screen
                name="Splash"
                component={SplashScreen}
                options={{ animation: 'none' }}
            />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Onboarding1" component={OnboardingStep1} />
            <Stack.Screen name="Onboarding2" component={OnboardingStep2} />
            <Stack.Screen name="Onboarding3" component={OnboardingStep3} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Navigator>
    );
}