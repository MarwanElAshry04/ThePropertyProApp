import {
    View, Text, TextInput, TouchableOpacity,
    StatusBar, ActivityIndicator, KeyboardAvoidingView,
    Platform, ScrollView,
} from 'react-native';
import { useState } from 'react';
import { authService } from '../../services/authService';

const PRIMARY = '#1A1265';
const GOLD = '#C9A84C';
const CREAM = '#F9F8FF';
const ERROR = '#FF5252';
const SUCCESS = '#4CAF50';

const InputField = ({ label, value, onChange, placeholder, show, onToggle }) => (
    <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: PRIMARY, marginBottom: 8 }}>{label}</Text>
        <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: '#fff', borderRadius: 14,
            borderWidth: 1.5, borderColor: '#ECEAF5',
            paddingHorizontal: 16, height: 52,
        }}>
            <TextInput
                style={{ flex: 1, color: PRIMARY, fontSize: 15 }}
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor="#CCC"
                secureTextEntry={!show}
                autoCapitalize="none"
            />
            <TouchableOpacity onPress={onToggle}>
                <Text style={{ color: '#AAA', fontSize: 13 }}>{show ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
        </View>
    </View>
);

export default function ChangePasswordScreen({ navigation }) {
    const [current, setCurrent] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSave = async () => {
        setError('');
        if (!current) return setError('Enter your current password');
        if (newPass.length < 8) return setError('New password must be at least 8 characters');
        if (!/[A-Z]/.test(newPass)) return setError('New password must contain an uppercase letter');
        if (!/[0-9]/.test(newPass)) return setError('New password must contain a number');
        if (newPass !== confirm) return setError('Passwords do not match');

        setLoading(true);
        const result = await authService.changePassword({
            currentPassword: current,
            newPassword: newPass,
        });

        if (result.success) {
            setSuccess('Password changed successfully!');
            setTimeout(() => navigation.goBack(), 1500);
        } else {
            setError(result.error || 'Failed to change password');
        }
        setLoading(false);
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: CREAM }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
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
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Change Password</Text>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
                <Text style={{ color: '#777', fontSize: 13, marginBottom: 28, lineHeight: 20 }}>
                    Choose a strong password with at least 8 characters, one uppercase letter, and one number.
                </Text>

                <InputField label="Current Password" value={current} onChange={setCurrent} placeholder="Enter current password" show={showCurrent} onToggle={() => setShowCurrent(p => !p)} />
                <InputField label="New Password" value={newPass} onChange={setNewPass} placeholder="Min 8 chars, 1 uppercase, 1 number" show={showNew} onToggle={() => setShowNew(p => !p)} />
                <InputField label="Confirm Password" value={confirm} onChange={setConfirm} placeholder="Confirm new password" show={showConfirm} onToggle={() => setShowConfirm(p => !p)} />

                {/* Password requirements */}
                {newPass.length > 0 && (
                    <View style={{ marginTop: -8, marginBottom: 16 }}>
                        {[
                            { label: 'At least 8 characters', ok: newPass.length >= 8 },
                            { label: 'One uppercase letter', ok: /[A-Z]/.test(newPass) },
                            { label: 'One number', ok: /[0-9]/.test(newPass) },
                        ].map(({ label, ok }) => (
                            <Text key={label} style={{ fontSize: 12, color: ok ? SUCCESS : '#CCC', marginBottom: 2 }}>
                                {ok ? '✓' : '○'} {label}
                            </Text>
                        ))}
                    </View>
                )}

                {error ? <Text style={{ color: ERROR, fontSize: 13, marginBottom: 16 }}>⚠ {error}</Text> : null}
                {success ? <Text style={{ color: SUCCESS, fontSize: 13, marginBottom: 16 }}>✓ {success}</Text> : null}

                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                    activeOpacity={0.85}
                    style={{
                        backgroundColor: PRIMARY, borderRadius: 50,
                        height: 52, justifyContent: 'center', alignItems: 'center',
                    }}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Update Password</Text>
                    }
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}