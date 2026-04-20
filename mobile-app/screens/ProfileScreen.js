import {
    View, Text, TouchableOpacity, ScrollView,
    StatusBar, Image, Alert, ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

const PRIMARY = '#1A1265';
const GOLD = '#C9A84C';
const CREAM = '#F9F8FF';
const ERROR = '#FF5252';

const getInitials = (name) => {
    if (!name) return '??';
    return name.trim().split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('');
};

const formatBudget = (min, max) => {
    if (!min && !max) return 'Flexible';
    if (!min) return `Up to ${(max / 1_000_000).toFixed(0)}M EGP`;
    if (!max) return `${(min / 1_000_000).toFixed(0)}M+ EGP`;
    return `${(min / 1_000_000).toFixed(0)}M – ${(max / 1_000_000).toFixed(0)}M EGP`;
};

const formatGoal = (goal) => ({
    appreciation: 'Long-term appreciation',
    rental: 'Monthly rental income',
    balanced: 'Balance of both',
}[goal] || goal || 'Not set');

const formatStatus = (status) => ({
    beginner: 'Getting into investment',
    intermediate: 'Own a few properties',
    experienced: 'Experienced investor',
}[status] || status || 'Not set');

const ProfileRow = ({ icon, label, value, onPress, showArrow = true, danger = false }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        style={{
            flexDirection: 'row', alignItems: 'center',
            paddingVertical: 14, paddingHorizontal: 20,
            borderBottomWidth: 1, borderBottomColor: '#F0EFF8',
        }}
    >
        <Text style={{ fontSize: 18, marginRight: 14 }}>{icon}</Text>
        <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: danger ? ERROR : PRIMARY }}>
                {label}
            </Text>
            {value ? <Text style={{ fontSize: 12, color: '#AAA', marginTop: 2 }}>{value}</Text> : null}
        </View>
        {showArrow && onPress && <Text style={{ color: '#CCC', fontSize: 18 }}>›</Text>}
    </TouchableOpacity>
);

const SectionHeader = ({ title }) => (
    <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
        <Text style={{ fontSize: 10, fontWeight: '800', color: '#BCBAD0', letterSpacing: 1.8 }}>
            {title}
        </Text>
    </View>
);

export default function ProfileScreen({ navigation }) {
    const { user, logout, updateUser } = useAuth();
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const handlePickPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photo library.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            setUploadingPhoto(true);
            const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
            const res = await authService.updateProfile({ profilePhoto: base64 });
            if (res.success) {
                await updateUser(res.data.user);
            } else {
                Alert.alert('Error', 'Failed to update photo. Try again.');
            }
            setUploadingPhoto(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: async () => await logout() },
        ]);
    };

    return (
        <View style={{ flex: 1, backgroundColor: CREAM }}>
            <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

            {/* Header */}
            <View style={{
                backgroundColor: PRIMARY,
                paddingTop: (StatusBar.currentHeight || 44) + 12,
                paddingBottom: 32, paddingHorizontal: 20,
                alignItems: 'center',
            }}>
                <Text style={{
                    color: GOLD, fontSize: 10, fontWeight: '800',
                    letterSpacing: 2.5, marginBottom: 20, alignSelf: 'flex-start',
                }}>PROPERTY PRO</Text>

                {/* Avatar */}
                <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.85}>
                    <View style={{
                        width: 88, height: 88, borderRadius: 44,
                        backgroundColor: GOLD,
                        justifyContent: 'center', alignItems: 'center',
                        borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)',
                        overflow: 'hidden',
                    }}>
                        {user?.profile_photo ? (
                            <Image
                                source={{ uri: user.profile_photo }}
                                style={{ width: '100%', height: '100%' }}
                                resizeMode="cover"
                            />
                        ) : (
                            <Text style={{ color: PRIMARY, fontSize: 28, fontWeight: '800' }}>
                                {getInitials(user?.full_name)}
                            </Text>
                        )}
                        {uploadingPhoto && (
                            <View style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                justifyContent: 'center', alignItems: 'center',
                            }}>
                                <ActivityIndicator color="#fff" />
                            </View>
                        )}
                    </View>
                    <View style={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: 26, height: 26, borderRadius: 13,
                        backgroundColor: '#fff',
                        justifyContent: 'center', alignItems: 'center',
                        borderWidth: 2, borderColor: PRIMARY,
                    }}>
                        <Text style={{ fontSize: 12 }}>📷</Text>
                    </View>
                </TouchableOpacity>

                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 12, marginBottom: 4 }}>
                    {user?.full_name || 'User'}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
                    {user?.email}
                </Text>

                {user?.is_verified && (
                    <View style={{
                        flexDirection: 'row', alignItems: 'center',
                        backgroundColor: 'rgba(76,175,80,0.2)',
                        borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
                        marginTop: 8, borderWidth: 1, borderColor: 'rgba(76,175,80,0.4)',
                    }}>
                        <Text style={{ color: '#4CAF50', fontSize: 11, fontWeight: '700' }}>✓ Verified Account</Text>
                    </View>
                )}
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

                <SectionHeader title="ACCOUNT" />
                <View style={{ backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#ECEAF5' }}>
                    <ProfileRow icon="👤" label="Personal Information" value={user?.full_name} onPress={() => navigation.navigate('PersonalInfo')} />
                    <ProfileRow icon="🔒" label="Change Password" onPress={() => navigation.navigate('ChangePassword')} />
                </View>

                <SectionHeader title="INVESTMENT PREFERENCES" />
                <View style={{ backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#ECEAF5' }}>
                    <ProfileRow icon="📈" label="Investment Goal" value={formatGoal(user?.investment_goal)} onPress={() => navigation.navigate('EditPreferences')} />
                    <ProfileRow icon="💰" label="Budget Range" value={formatBudget(user?.budget_min, user?.budget_max)} onPress={() => navigation.navigate('EditPreferences')} />
                    <ProfileRow icon="🏠" label="Investor Type" value={formatStatus(user?.investment_status)} onPress={() => navigation.navigate('EditPreferences')} />
                </View>

                <SectionHeader title="APP SETTINGS" />
                <View style={{ backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#ECEAF5' }}>
                    <ProfileRow icon="💱" label="Currency" value="EGP — Egyptian Pound" onPress={() => navigation.navigate('AppSettings')} />
                    <ProfileRow icon="🌐" label="Language" value="English" onPress={() => navigation.navigate('AppSettings')} />
                    <ProfileRow icon="🌙" label="Dark Mode" value="Coming soon" showArrow={false} />
                </View>

                <SectionHeader title="ABOUT" />
                <View style={{ backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#ECEAF5' }}>
                    <ProfileRow icon="❓" label="Help & Support" onPress={() => navigation.navigate('HelpSupport')} />
                    <ProfileRow icon="🔐" label="Privacy Policy" onPress={() => navigation.navigate('Policy', { type: 'privacy' })} />
                    <ProfileRow icon="📋" label="Terms of Service" onPress={() => navigation.navigate('Policy', { type: 'terms' })} />
                    <ProfileRow icon="ℹ️" label="App Version" value="v1.0.0" showArrow={false} />
                </View>

                <View style={{ marginHorizontal: 16, marginTop: 24, marginBottom: 48 }}>
                    <TouchableOpacity
                        onPress={handleLogout}
                        activeOpacity={0.85}
                        style={{
                            backgroundColor: '#fff', borderRadius: 16,
                            paddingVertical: 16, alignItems: 'center',
                            borderWidth: 1.5, borderColor: ERROR + '40',
                        }}
                    >
                        <Text style={{ color: ERROR, fontSize: 15, fontWeight: '700' }}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}