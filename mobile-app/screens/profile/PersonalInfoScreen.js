import {
    View, Text, TextInput, TouchableOpacity,
    StatusBar, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

const PRIMARY = '#1A1265';
const GOLD = '#C9A84C';
const CREAM = '#F9F8FF';
const ERROR = '#FF5252';
const SUCCESS = '#4CAF50';

export default function PersonalInfoScreen({ navigation }) {
    const { user, updateUser } = useAuth();
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSave = async () => {
        if (!fullName.trim()) { setError('Name cannot be empty'); return; }
        if (!/^[a-zA-Z\s'-]+$/.test(fullName)) { setError('Name can only contain letters'); return; }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const result = await authService.updateProfile({ fullName: fullName.trim() });

            if (result.success) {
                await updateUser(result.data.user);
                setSuccess('Name updated successfully!');
                setTimeout(() => navigation.goBack(), 1200);
            } else {
                setError(result.error || 'Failed to update. Try again.');
            }
        } catch (e) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);  // ← always runs, screen never freezes
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: CREAM }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

            {/* Header */}
            <View style={{
                backgroundColor: PRIMARY,
                paddingTop: (StatusBar.currentHeight || 44) + 12,
                paddingBottom: 20, paddingHorizontal: 20,
                flexDirection: 'row', alignItems: 'center',
            }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                    <Text style={{ color: '#fff', fontSize: 24 }}>←</Text>
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', flex: 1 }}>
                    Personal Information
                </Text>
            </View>

            <View style={{ padding: 24 }}>
                <Text style={{ color: '#777', fontSize: 13, marginBottom: 24, lineHeight: 20 }}>
                    Update your display name. This is how you'll appear in the app.
                </Text>

                <Text style={{ fontSize: 13, fontWeight: '600', color: PRIMARY, marginBottom: 8 }}>
                    Full Name
                </Text>
                <View style={{
                    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5,
                    borderColor: error ? ERROR : success ? SUCCESS : '#ECEAF5',
                    paddingHorizontal: 16, height: 52, justifyContent: 'center',
                    marginBottom: 8,
                }}>
                    <TextInput
                        style={{ color: PRIMARY, fontSize: 15 }}
                        value={fullName}
                        onChangeText={(v) => { setFullName(v); setError(''); setSuccess(''); }}
                        placeholder="Enter your full name"
                        placeholderTextColor="#CCC"
                        autoCapitalize="words"
                    />
                </View>

                <Text style={{ color: '#AAA', fontSize: 12, marginBottom: 4 }}>
                    Email address cannot be changed.
                </Text>
                <Text style={{ color: '#CCC', fontSize: 13 }}>{user?.email}</Text>

                {error ? <Text style={{ color: ERROR, fontSize: 13, marginTop: 16 }}>⚠ {error}</Text> : null}
                {success ? <Text style={{ color: SUCCESS, fontSize: 13, marginTop: 16 }}>✓ {success}</Text> : null}

                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                    activeOpacity={0.85}
                    style={{
                        backgroundColor: PRIMARY, borderRadius: 50,
                        height: 52, justifyContent: 'center', alignItems: 'center',
                        marginTop: 32,
                    }}
                >
                    {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Save Changes</Text>
                    }
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}