import {
    View, Text, TextInput, TouchableOpacity,
    ScrollView, StatusBar, ActivityIndicator,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import Svg, { Path } from 'react-native-svg';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

WebBrowser.maybeCompleteAuthSession();

const PRIMARY = '#1A1265';
const GOLD = '#C9A84C';
const ERROR = '#FF5252';
const SUCCESS = '#4CAF50';

const GOOGLE_WEB_CLIENT_ID = '112284529288-6p2ppp59okd3ldapiiugvtvkhcun4dnd.apps.googleusercontent.com';

// ─── Validation Rules ─────────────────────────────────────────────────────────
const validators = {
    email: (v) => {
        if (!v.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Enter a valid email (e.g. name@gmail.com)';
        return '';
    },
    password: (v) => {
        if (!v) return 'Password is required';
        return '';
    },
};

const GoogleIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 48 48">
        <Path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.4 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8.9 20-20 0-1.3-.1-2.7-.4-4z" />
        <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
        <Path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.5-2.5-11.3-6.3l-6.6 4.8C9.7 39.6 16.3 44 24 44z" />
        <Path fill="#1565C0" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2c-.4.3 6.1-4.5 6.1-15 0-1.3-.1-2.7-.4-4z" />
    </Svg>
);

const AppleIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </Svg>
);

// ─── Input with real-time validation ─────────────────────────────────────────
const InputField = ({ label, value, onChangeText, placeholder,
    secureTextEntry, keyboardType, error, touched, rightIcon }) => (
    <View style={{ marginBottom: 20 }}>
        <Text style={{
            color: 'rgba(255,255,255,0.7)', fontSize: 13,
            fontWeight: '600', marginBottom: 8,
        }}>
            {label}
        </Text>
        <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 14, borderWidth: 1.5,
            borderColor: touched && error
                ? ERROR
                : touched && !error && value
                    ? SUCCESS
                    : 'rgba(255,255,255,0.15)',
            paddingHorizontal: 16, height: 52,
        }}>
            <TextInput
                style={{ flex: 1, color: '#FFFFFF', fontSize: 15 }}
                placeholder={placeholder}
                placeholderTextColor="rgba(255,255,255,0.30)"
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType || 'default'}
                autoCapitalize="none"
                autoCorrect={false}
            />
            {touched && !error && value && !rightIcon && (
                <Text style={{ color: SUCCESS, fontSize: 16 }}>✓</Text>
            )}
            {rightIcon}
        </View>
        {touched && error ? (
            <Text style={{ color: ERROR, fontSize: 12, marginTop: 5, marginLeft: 4 }}>
                ⚠ {error}
            </Text>
        ) : null}
    </View>
);

export default function SignInScreen({ navigation }) {
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    const [touched, setTouched] = useState({ email: false, password: false });
    const [errors, setErrors] = useState({ email: '', password: '' });

    const handleChange = (field, value) => {
        if (field === 'email') setEmail(value);
        if (field === 'password') setPassword(value);
        setTouched(prev => ({ ...prev, [field]: true }));
        setErrors(prev => ({ ...prev, [field]: validators[field](value) }));
    };

    const isFormValid = () => !validators.email(email) && !validators.password(password);

    // ── Google hook ───────────────────────────────────────────────────────────
    const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
        clientId: GOOGLE_WEB_CLIENT_ID,
    });

    useEffect(() => {
        if (googleResponse?.type === 'success') {
            handleGoogleCallback(googleResponse.params?.id_token);
        } else if (googleResponse?.type === 'error') {
            setApiError('Google Sign-In was cancelled or failed');
            setGoogleLoading(false);
        }
    }, [googleResponse]);

    const handleGoogleCallback = async (idToken) => {
        const result = await authService.handleGoogleResponse({ idToken });
        if (result.success) {
            await login(result.data.access_token, result.data.refresh_token, result.data.user);
            navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
        } else {
            setApiError(result.error);
        }
        setGoogleLoading(false);
    };

    // ── Sign In ───────────────────────────────────────────────────────────────
    const handleSignIn = async () => {
        // Touch all fields
        setTouched({ email: true, password: true });
        const newErrors = {
            email: validators.email(email),
            password: validators.password(password),
        };
        setErrors(newErrors);
        if (newErrors.email || newErrors.password) return;

        setLoading(true);
        setApiError('');

        try {
            const result = await authService.login({ email, password });

            if (result.success) {
                if (result.data.needs_verification) {
                    // Don't call login() yet — navigate to verify first
                    navigation.navigate('VerifyEmail', {
                        email,
                        accessToken: result.data.access_token,
                        refreshToken: result.data.refresh_token,
                    });
                } else {
                    // Fully verified — log in and go to main app
                    await login(
                        result.data.access_token,
                        result.data.refresh_token,
                        result.data.user,
                    );
                }
            } else {
                setApiError(result.error);
            }
        } catch (e) {
            setApiError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setApiError('');
        await googlePromptAsync();
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: PRIMARY }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingHorizontal: 24,
                    paddingTop: (StatusBar.currentHeight || 44) + 16,
                    paddingBottom: 48,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ marginBottom: 32, padding: 4, alignSelf: 'flex-start' }}
                >
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 24 }}>←</Text>
                </TouchableOpacity>

                <Text style={{ color: GOLD, fontSize: 11, fontWeight: '800', letterSpacing: 2.5, marginBottom: 12 }}>
                    PROPERTY PRO
                </Text>
                <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '800', lineHeight: 34, marginBottom: 8 }}>
                    Welcome back
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginBottom: 48 }}>
                    Sign in to your account
                </Text>

                {apiError ? (
                    <View style={{
                        backgroundColor: ERROR + '20', borderRadius: 12,
                        padding: 14, borderWidth: 1, borderColor: ERROR + '50', marginBottom: 20,
                    }}>
                        <Text style={{ color: ERROR, fontSize: 13, textAlign: 'center' }}>{apiError}</Text>
                    </View>
                ) : null}

                <InputField
                    label="Email"
                    value={email}
                    onChangeText={(v) => handleChange('email', v)}
                    placeholder="Enter your email address"
                    keyboardType="email-address"
                    error={errors.email}
                    touched={touched.email}
                />
                <InputField
                    label="Password"
                    value={password}
                    onChangeText={(v) => handleChange('password', v)}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    error={errors.password}
                    touched={touched.password}
                    rightIcon={
                        <TouchableOpacity onPress={() => setShowPassword(p => !p)}>
                            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                                {showPassword ? 'Hide' : 'Show'}
                            </Text>
                        </TouchableOpacity>
                    }
                />

                <TouchableOpacity
                    onPress={() => navigation.navigate('ForgotPassword')}
                    style={{ alignSelf: 'flex-end', marginTop: -8, marginBottom: 32 }}
                >
                    <Text style={{ color: GOLD, fontSize: 13, fontWeight: '600' }}>
                        Forgot password?
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleSignIn}
                    disabled={loading || googleLoading}
                    activeOpacity={0.85}
                    style={{
                        height: 56,
                        backgroundColor: loading ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
                        borderRadius: 28, justifyContent: 'center', alignItems: 'center',
                        marginBottom: 24,
                        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
                        opacity: isFormValid() ? 1 : 0.8,
                    }}
                >
                    {loading
                        ? <ActivityIndicator color={PRIMARY} />
                        : <Text style={{ color: PRIMARY, fontSize: 16, fontWeight: '800' }}>Sign in →</Text>
                    }
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, paddingHorizontal: 16 }}>OR</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                </View>

                <TouchableOpacity
                    onPress={handleGoogleSignIn}
                    disabled={loading || googleLoading || !googleRequest}
                    activeOpacity={0.85}
                    style={{
                        height: 52, backgroundColor: 'rgba(255,255,255,0.08)',
                        borderRadius: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
                        gap: 12, marginBottom: 12,
                    }}
                >
                    {googleLoading
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <><GoogleIcon /><Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Continue with Google</Text></>
                    }
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.85}
                    style={{
                        height: 52, backgroundColor: 'rgba(255,255,255,0.08)',
                        borderRadius: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
                        gap: 12, marginBottom: 40,
                    }}
                >
                    <AppleIcon />
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Continue with Apple</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation.navigate('SignUp')}
                    style={{ alignItems: 'center' }}
                >
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                        Don't have an account?{' '}
                        <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Sign Up</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}