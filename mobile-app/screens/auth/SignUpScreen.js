import {
    View, Text, TextInput, TouchableOpacity,
    ScrollView, StatusBar, ActivityIndicator,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
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
    fullName: (v) => {
        if (!v.trim()) return 'Full name is required';
        if (v.trim().length < 2) return 'Name must be at least 2 characters';
        if (!/^[a-zA-Z\s'-]+$/.test(v)) return 'Name can only contain letters';
        return '';
    },
    email: (v) => {
        if (!v.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Enter a valid email (e.g. name@gmail.com)';
        return '';
    },
    password: (v) => {
        if (!v) return 'Password is required';
        if (v.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(v)) return 'Password must contain at least one uppercase letter';
        if (!/[0-9]/.test(v)) return 'Password must contain at least one number';
        return '';
    },
    confirmPassword: (v, password) => {
        if (!v) return 'Please confirm your password';
        if (v !== password) return 'Passwords do not match';
        return '';
    },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
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

// ─── Input Field with real-time validation ────────────────────────────────────
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
                autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
                autoCorrect={false}
            />
            {/* Valid checkmark */}
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

export default function SignUpScreen({ navigation, route }) {
    const { investmentStatus, budget, investmentGoal } = route.params || {};
    const { login } = useAuth();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    // ── Touched state — only show errors after field is interacted with ────────
    const [touched, setTouched] = useState({
        fullName: false, email: false, password: false, confirmPassword: false,
    });

    // ── Real-time error state ─────────────────────────────────────────────────
    const [errors, setErrors] = useState({
        fullName: '', email: '', password: '', confirmPassword: '',
    });

    // Validate a single field whenever its value changes
    const validateField = useCallback((field, value) => {
        let error = '';
        if (field === 'fullName') error = validators.fullName(value);
        if (field === 'email') error = validators.email(value);
        if (field === 'password') error = validators.password(value);
        if (field === 'confirmPassword') error = validators.confirmPassword(value, password);
        setErrors(prev => ({ ...prev, [field]: error }));
    }, [password]);

    // Re-validate confirmPassword whenever password changes
    useEffect(() => {
        if (touched.confirmPassword) {
            setErrors(prev => ({
                ...prev,
                confirmPassword: validators.confirmPassword(confirmPassword, password),
            }));
        }
    }, [password]);

    const handleChange = (field, value) => {
        if (field === 'fullName') setFullName(value);
        if (field === 'email') setEmail(value);
        if (field === 'password') setPassword(value);
        if (field === 'confirmPassword') setConfirmPassword(value);

        setTouched(prev => ({ ...prev, [field]: true }));
        validateField(field, value);
    };

    const isFormValid = () =>
        !validators.fullName(fullName) &&
        !validators.email(email) &&
        !validators.password(password) &&
        !validators.confirmPassword(confirmPassword, password);

    // ── Google Sign-In hook ───────────────────────────────────────────────────
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
        const result = await authService.handleGoogleResponse({
            idToken,
            onboardingData: {
                investmentStatus,
                budgetMin: budget?.min ?? null,
                budgetMax: budget?.max ?? null,
                investmentGoal,
            },
        });
        if (result.success) {
            await login(result.data.access_token, result.data.refresh_token, result.data.user);
            navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
        } else {
            setApiError(result.error);
        }
        setGoogleLoading(false);
    };

    // ── Sign Up ───────────────────────────────────────────────────────────────
    const handleSignUp = async () => {
        // Touch all fields to show any remaining errors
        setTouched({ fullName: true, email: true, password: true, confirmPassword: true });
        setErrors({
            fullName: validators.fullName(fullName),
            email: validators.email(email),
            password: validators.password(password),
            confirmPassword: validators.confirmPassword(confirmPassword, password),
        });

        if (!isFormValid()) return;

        setLoading(true);
        setApiError('');

        const result = await authService.register({
            fullName, email, password,
            investmentStatus,
            budgetMin: budget?.min ?? null,
            budgetMax: budget?.max ?? null,
            investmentGoal,
        });

        if (result.success) {
            // Don't call login() yet — user must verify email first
            // Navigate to verify screen, passing tokens to use after verification
            navigation.navigate('VerifyEmail', {
                email: email,
                accessToken: result.data.access_token,
                refreshToken: result.data.refresh_token,
                user: result.data.user,
            });
        } else {
            setApiError(result.error);
        }
        setLoading(false);
    };

    const handleGoogleSignUp = async () => {
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
                    Create your account
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginBottom: 36 }}>
                    You're almost ready!
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
                    label="Full name"
                    value={fullName}
                    onChangeText={(v) => handleChange('fullName', v)}
                    placeholder="Enter your full name"
                    error={errors.fullName}
                    touched={touched.fullName}
                />
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
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
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
                <InputField
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={(v) => handleChange('confirmPassword', v)}
                    placeholder="Confirm your password"
                    secureTextEntry={!showConfirm}
                    error={errors.confirmPassword}
                    touched={touched.confirmPassword}
                    rightIcon={
                        <TouchableOpacity onPress={() => setShowConfirm(p => !p)}>
                            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                                {showConfirm ? 'Hide' : 'Show'}
                            </Text>
                        </TouchableOpacity>
                    }
                />

                {/* Password requirements hint */}
                {touched.password && (
                    <View style={{ marginTop: -12, marginBottom: 16, paddingLeft: 4 }}>
                        {[
                            { label: 'At least 8 characters', ok: password.length >= 8 },
                            { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
                            { label: 'One number', ok: /[0-9]/.test(password) },
                        ].map(({ label, ok }) => (
                            <Text key={label} style={{
                                fontSize: 12, marginBottom: 2,
                                color: ok ? SUCCESS : 'rgba(255,255,255,0.4)',
                            }}>
                                {ok ? '✓' : '○'} {label}
                            </Text>
                        ))}
                    </View>
                )}

                <TouchableOpacity
                    onPress={handleSignUp}
                    disabled={loading || googleLoading}
                    activeOpacity={0.85}
                    style={{
                        height: 56,
                        backgroundColor: loading ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
                        borderRadius: 28, justifyContent: 'center', alignItems: 'center',
                        marginTop: 4, marginBottom: 24,
                        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
                        opacity: isFormValid() ? 1 : 0.7,
                    }}
                >
                    {loading
                        ? <ActivityIndicator color={PRIMARY} />
                        : <Text style={{ color: PRIMARY, fontSize: 16, fontWeight: '800' }}>
                            Create account →
                        </Text>
                    }
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, paddingHorizontal: 16 }}>OR</Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                </View>

                <TouchableOpacity
                    onPress={handleGoogleSignUp}
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
                        gap: 12, marginBottom: 32,
                    }}
                >
                    <AppleIcon />
                    <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>Continue with Apple</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={{ alignItems: 'center' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                        Already have an account?{' '}
                        <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Sign In</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}