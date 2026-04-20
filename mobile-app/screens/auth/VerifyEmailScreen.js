import {
    View, Text, TouchableOpacity,
    StatusBar, ActivityIndicator,
    KeyboardAvoidingView, Platform,
    TextInput,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

const PRIMARY = '#1A1265';
const GOLD = '#C9A84C';
const ERROR = '#FF5252';
const SUCCESS = '#4CAF50';

export default function VerifyEmailScreen({ navigation, route }) {
    const { email, accessToken, refreshToken } = route.params || {};
    const { login } = useAuth();

    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const inputRefs = useRef([]);

    // Countdown timer for resend button
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    // ── Handle digit input ────────────────────────────────────────────────────
    const handleDigitChange = (text, index) => {
        const digit = text.replace(/[^0-9]/g, '').slice(-1);
        const newCode = [...code];
        newCode[index] = digit;
        setCode(newCode);
        setError('');

        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        if (digit && index === 5) {
            const fullCode = [...newCode].join('');
            if (fullCode.length === 6) {
                handleVerify(fullCode);
            }
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // ── Verify code ───────────────────────────────────────────────────────────
    const handleVerify = async (fullCode) => {
        const codeToVerify = fullCode || code.join('');
        if (codeToVerify.length < 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await authService.verifyEmail({
                email,
                code: codeToVerify,
            });

            if (result.success) {
                setSuccess('Email verified!');
                // Call login — AppNavigator will automatically switch
                // to MainApp when isAuthenticated becomes true
                await login(
                    accessToken,
                    refreshToken,
                    result.data.user,  // updated user with is_verified: true
                );
                // No navigation.reset needed — AppNavigator handles it
            } else {
                setError(result.error || 'Invalid code. Please try again.');
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (e) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Resend code ───────────────────────────────────────────────────────────
    const handleResend = async () => {
        setResending(true);
        setError('');

        const result = await authService.resendVerification({ email });

        if (result.success) {
            setSuccess('New code sent!');
            setCountdown(60);
            setCanResend(false);
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError('Failed to resend. Try again.');
        }
        setResending(false);
    };

    const fullCode = code.join('');

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: PRIMARY }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

            <View style={{
                flex: 1,
                paddingHorizontal: 24,
                paddingTop: (StatusBar.currentHeight || 44) + 16,
                paddingBottom: 48,
                justifyContent: 'center',
            }}>
                <Text style={{
                    color: GOLD, fontSize: 11, fontWeight: '800',
                    letterSpacing: 2.5, marginBottom: 32, textAlign: 'center',
                }}>
                    PROPERTY PRO
                </Text>

                <View style={{
                    width: 80, height: 80, borderRadius: 40,
                    backgroundColor: 'rgba(201,168,76,0.15)',
                    borderWidth: 1.5, borderColor: GOLD + '40',
                    justifyContent: 'center', alignItems: 'center',
                    alignSelf: 'center', marginBottom: 28,
                }}>
                    <Text style={{ fontSize: 36 }}>📧</Text>
                </View>

                <Text style={{
                    color: '#FFFFFF', fontSize: 26, fontWeight: '800',
                    textAlign: 'center', marginBottom: 12,
                }}>
                    Verify your email
                </Text>
                <Text style={{
                    color: 'rgba(255,255,255,0.55)', fontSize: 14,
                    textAlign: 'center', lineHeight: 22, marginBottom: 8,
                }}>
                    We sent a 6-digit code to
                </Text>
                <Text style={{
                    color: GOLD, fontSize: 15, fontWeight: '700',
                    textAlign: 'center', marginBottom: 40,
                }}>
                    {email}
                </Text>

                {/* 6-digit inputs */}
                <View style={{
                    flexDirection: 'row', justifyContent: 'center',
                    gap: 10, marginBottom: 32,
                }}>
                    {code.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={ref => inputRefs.current[index] = ref}
                            style={{
                                width: 48, height: 58,
                                backgroundColor: digit
                                    ? 'rgba(201,168,76,0.15)'
                                    : 'rgba(255,255,255,0.08)',
                                borderRadius: 14, borderWidth: 1.5,
                                borderColor: digit ? GOLD : 'rgba(255,255,255,0.15)',
                                color: '#FFFFFF', fontSize: 24,
                                fontWeight: '800', textAlign: 'center',
                            }}
                            value={digit}
                            onChangeText={(text) => handleDigitChange(text, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="numeric"
                            maxLength={1}
                            autoFocus={index === 0}
                            selectTextOnFocus
                        />
                    ))}
                </View>

                {error ? (
                    <Text style={{
                        color: ERROR, fontSize: 13,
                        textAlign: 'center', marginBottom: 16,
                    }}>
                        {error}
                    </Text>
                ) : null}

                {success ? (
                    <Text style={{
                        color: SUCCESS, fontSize: 13, fontWeight: '600',
                        textAlign: 'center', marginBottom: 16,
                    }}>
                        ✓ {success}
                    </Text>
                ) : null}

                {/* Verify button */}
                <TouchableOpacity
                    onPress={() => handleVerify()}
                    disabled={loading || fullCode.length < 6}
                    activeOpacity={0.85}
                    style={{
                        height: 56,
                        backgroundColor: fullCode.length === 6
                            ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                        borderRadius: 28,
                        justifyContent: 'center', alignItems: 'center',
                        marginBottom: 24,
                    }}
                >
                    {loading
                        ? <ActivityIndicator color={PRIMARY} />
                        : <Text style={{
                            color: fullCode.length === 6 ? PRIMARY : 'rgba(255,255,255,0.4)',
                            fontSize: 16, fontWeight: '800',
                        }}>
                            Verify Email →
                        </Text>
                    }
                </TouchableOpacity>

                {/* Resend */}
                <View style={{ alignItems: 'center' }}>
                    {canResend ? (
                        <TouchableOpacity onPress={handleResend} disabled={resending}>
                            {resending
                                ? <ActivityIndicator color={GOLD} size="small" />
                                : <Text style={{ color: GOLD, fontSize: 14, fontWeight: '600' }}>
                                    Resend code
                                </Text>
                            }
                        </TouchableOpacity>
                    ) : (
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                            Resend code in{' '}
                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
                                {countdown}s
                            </Text>
                        </Text>
                    )}
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}