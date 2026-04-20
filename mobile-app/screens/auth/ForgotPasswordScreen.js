import {
    View, Text, TextInput, TouchableOpacity,
    StatusBar, ActivityIndicator,
    KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useState, useRef } from 'react';
import { authService } from '../../services/authService';

const PRIMARY = '#1A1265';
const GOLD = '#C9A84C';
const ERROR = '#FF5252';
const SUCCESS = '#4CAF50';

export default function ForgotPasswordScreen({ navigation }) {

    // 3 steps: 'email' → 'code' → 'password'
    const [step, setStep] = useState('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const inputRefs = useRef([]);

    // ── Step 1: Send reset code ───────────────────────────────────────────────
    const handleSendCode = async () => {
        if (!email.includes('@')) {
            setError('Enter a valid email address');
            return;
        }
        setLoading(true);
        setError('');

        try {
            await authService.forgotPassword({ email });
        } catch (_) { }

        // Always advance — never reveal if email exists
        setLoading(false);
        setStep('code');
    };

    // ── Step 2: Code digit inputs ─────────────────────────────────────────────
    const handleDigitChange = (text, index) => {
        const digit = text.replace(/[^0-9]/g, '').slice(-1);
        const newCode = [...code];
        newCode[index] = digit;
        setCode(newCode);
        setError('');

        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto advance to password step when all 6 digits filled
        if (digit && index === 5) {
            const fullCode = [...newCode].join('');
            if (fullCode.length === 6) setStep('password');
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // ── Step 3: Reset password ────────────────────────────────────────────────
    const handleResetPassword = async () => {
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (newPassword !== confirmPass) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const result = await authService.resetPassword({
                email,
                code: code.join(''),
                newPassword,
            });

            if (result.success) {
                // Show success message then go to Sign In
                setSuccess('Password reset successfully!');
                setTimeout(() => {
                    navigation.replace('SignIn');
                }, 1500);
            } else {
                setError(result.error || 'Invalid or expired code. Please try again.');
                // Go back to code step so user can request a new code
                setStep('code');
                setCode(['', '', '', '', '', '']);
            }
        } catch (e) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: PRIMARY }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingHorizontal: 24,
                    paddingTop: (StatusBar.currentHeight || 44) + 16,
                    paddingBottom: 48,
                    justifyContent: 'center',
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Back button */}
                <TouchableOpacity
                    onPress={() => {
                        if (step === 'email') navigation.goBack();
                        else if (step === 'code') setStep('email');
                        else setStep('code');
                    }}
                    style={{ marginBottom: 32, padding: 4, alignSelf: 'flex-start' }}
                >
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 24 }}>←</Text>
                </TouchableOpacity>

                <Text style={{
                    color: GOLD, fontSize: 11, fontWeight: '800',
                    letterSpacing: 2.5, marginBottom: 12,
                }}>
                    PROPERTY PRO
                </Text>

                {/* ── STEP 1: Email ── */}
                {step === 'email' && (
                    <>
                        <Text style={{
                            color: '#FFFFFF', fontSize: 26, fontWeight: '800',
                            lineHeight: 34, marginBottom: 12,
                        }}>
                            Forgot password?
                        </Text>
                        <Text style={{
                            color: 'rgba(255,255,255,0.55)', fontSize: 14,
                            lineHeight: 22, marginBottom: 40,
                        }}>
                            Enter your email and we'll send you a reset code.
                        </Text>

                        <Text style={{
                            color: 'rgba(255,255,255,0.7)', fontSize: 13,
                            fontWeight: '600', marginBottom: 8,
                        }}>
                            Email
                        </Text>
                        <View style={{
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            borderRadius: 14, borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.15)',
                            paddingHorizontal: 16, height: 52,
                            justifyContent: 'center', marginBottom: 32,
                        }}>
                            <TextInput
                                style={{ color: '#FFFFFF', fontSize: 15 }}
                                placeholder="Enter your email address"
                                placeholderTextColor="rgba(255,255,255,0.30)"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        {error ? (
                            <Text style={{ color: ERROR, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
                                {error}
                            </Text>
                        ) : null}

                        <TouchableOpacity
                            onPress={handleSendCode}
                            disabled={loading}
                            activeOpacity={0.85}
                            style={{
                                height: 56,
                                backgroundColor: loading ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
                                borderRadius: 28, justifyContent: 'center', alignItems: 'center',
                            }}
                        >
                            {loading
                                ? <ActivityIndicator color={PRIMARY} />
                                : <Text style={{ color: PRIMARY, fontSize: 16, fontWeight: '800' }}>
                                    Send Reset Code →
                                </Text>
                            }
                        </TouchableOpacity>
                    </>
                )}

                {/* ── STEP 2: Code ── */}
                {step === 'code' && (
                    <>
                        <View style={{
                            width: 72, height: 72, borderRadius: 36,
                            backgroundColor: 'rgba(201,168,76,0.15)',
                            borderWidth: 1.5, borderColor: GOLD + '40',
                            justifyContent: 'center', alignItems: 'center',
                            alignSelf: 'center', marginBottom: 24,
                        }}>
                            <Text style={{ fontSize: 32 }}>🔑</Text>
                        </View>

                        <Text style={{
                            color: '#FFFFFF', fontSize: 26, fontWeight: '800',
                            textAlign: 'center', marginBottom: 12,
                        }}>
                            Enter reset code
                        </Text>
                        <Text style={{
                            color: 'rgba(255,255,255,0.55)', fontSize: 14,
                            textAlign: 'center', lineHeight: 22, marginBottom: 8,
                        }}>
                            We sent a 6-digit code to
                        </Text>
                        <Text style={{
                            color: GOLD, fontSize: 15, fontWeight: '700',
                            textAlign: 'center', marginBottom: 36,
                        }}>
                            {email}
                        </Text>

                        <View style={{
                            flexDirection: 'row', justifyContent: 'center',
                            gap: 10, marginBottom: 28,
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
                            <Text style={{ color: ERROR, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                                {error}
                            </Text>
                        ) : null}

                        <TouchableOpacity
                            onPress={() => code.join('').length === 6 && setStep('password')}
                            disabled={code.join('').length < 6}
                            activeOpacity={0.85}
                            style={{
                                height: 56,
                                backgroundColor: code.join('').length === 6
                                    ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
                                borderRadius: 28, justifyContent: 'center', alignItems: 'center',
                            }}
                        >
                            <Text style={{
                                color: code.join('').length === 6
                                    ? PRIMARY : 'rgba(255,255,255,0.4)',
                                fontSize: 16, fontWeight: '800',
                            }}>
                                Continue →
                            </Text>
                        </TouchableOpacity>
                    </>
                )}

                {/* ── STEP 3: New Password ── */}
                {step === 'password' && (
                    <>
                        <Text style={{
                            color: '#FFFFFF', fontSize: 26, fontWeight: '800',
                            lineHeight: 34, marginBottom: 12,
                        }}>
                            Set new password
                        </Text>
                        <Text style={{
                            color: 'rgba(255,255,255,0.55)', fontSize: 14,
                            lineHeight: 22, marginBottom: 36,
                        }}>
                            Choose a strong password for your account.
                        </Text>

                        {/* New password field */}
                        <Text style={{
                            color: 'rgba(255,255,255,0.7)', fontSize: 13,
                            fontWeight: '600', marginBottom: 8,
                        }}>New Password</Text>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            borderRadius: 14, borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.15)',
                            paddingHorizontal: 16, height: 52, marginBottom: 20,
                        }}>
                            <TextInput
                                style={{ flex: 1, color: '#FFFFFF', fontSize: 15 }}
                                placeholder="Enter new password"
                                placeholderTextColor="rgba(255,255,255,0.30)"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowPassword(p => !p)}>
                                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                                    {showPassword ? 'Hide' : 'Show'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Confirm password field */}
                        <Text style={{
                            color: 'rgba(255,255,255,0.7)', fontSize: 13,
                            fontWeight: '600', marginBottom: 8,
                        }}>Confirm Password</Text>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            borderRadius: 14, borderWidth: 1,
                            borderColor: 'rgba(255,255,255,0.15)',
                            paddingHorizontal: 16, height: 52, marginBottom: 32,
                        }}>
                            <TextInput
                                style={{ flex: 1, color: '#FFFFFF', fontSize: 15 }}
                                placeholder="Confirm new password"
                                placeholderTextColor="rgba(255,255,255,0.30)"
                                value={confirmPass}
                                onChangeText={setConfirmPass}
                                secureTextEntry={!showConfirm}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowConfirm(p => !p)}>
                                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
                                    {showConfirm ? 'Hide' : 'Show'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {error ? (
                            <Text style={{ color: ERROR, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                                {error}
                            </Text>
                        ) : null}

                        {/* Success state */}
                        {success ? (
                            <View style={{
                                backgroundColor: 'rgba(76,175,80,0.15)',
                                borderRadius: 12, padding: 16,
                                borderWidth: 1, borderColor: SUCCESS + '50',
                                alignItems: 'center', marginBottom: 16,
                            }}>
                                <Text style={{ fontSize: 28, marginBottom: 8 }}>✅</Text>
                                <Text style={{
                                    color: SUCCESS, fontSize: 15,
                                    fontWeight: '700', textAlign: 'center',
                                }}>
                                    {success}
                                </Text>
                                <Text style={{
                                    color: 'rgba(255,255,255,0.5)',
                                    fontSize: 13, marginTop: 4, textAlign: 'center',
                                }}>
                                    Taking you to Sign In...
                                </Text>
                            </View>
                        ) : null}

                        {!success && (
                            <TouchableOpacity
                                onPress={handleResetPassword}
                                disabled={loading}
                                activeOpacity={0.85}
                                style={{
                                    height: 56,
                                    backgroundColor: loading ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
                                    borderRadius: 28, justifyContent: 'center', alignItems: 'center',
                                }}
                            >
                                {loading
                                    ? <ActivityIndicator color={PRIMARY} />
                                    : <Text style={{ color: PRIMARY, fontSize: 16, fontWeight: '800' }}>
                                        Reset Password →
                                    </Text>
                                }
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}