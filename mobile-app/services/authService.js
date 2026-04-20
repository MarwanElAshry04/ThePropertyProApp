import axios from 'axios';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { auth } from './firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config';


WebBrowser.maybeCompleteAuthSession();


const authApi = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});

// ─── Inject access token automatically on every request ──────────────────────
authApi.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('propertypro_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const authService = {

    // ── Register ──────────────────────────────────────────────────────────────
    register: async ({ fullName, email, password, investmentStatus,
        budgetMin, budgetMax, investmentGoal }) => {
        try {
            const response = await authApi.post('/auth/register', {
                full_name: fullName,
                email,
                password,
                investment_status: investmentStatus,
                budget_min: budgetMin,
                budget_max: budgetMax,
                investment_goal: investmentGoal,
            });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || 'Registration failed' };
        }
    },

    // ── Login ─────────────────────────────────────────────────────────────────
    login: async ({ email, password }) => {
        try {
            const response = await authApi.post('/auth/login', { email, password });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || 'Invalid credentials' };
        }
    },

    // ── Verify email ──────────────────────────────────────────────────────────
    verifyEmail: async ({ email, code }) => {
        try {
            const response = await authApi.post('/auth/verify-email', { email, code });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || 'Invalid or expired code' };
        }
    },

    // ── Resend verification ───────────────────────────────────────────────────
    resendVerification: async ({ email }) => {
        try {
            const response = await authApi.post('/auth/resend-verification', { email });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: 'Failed to resend code' };
        }
    },

    // ── Forgot password ───────────────────────────────────────────────────────
    forgotPassword: async ({ email }) => {
        try {
            const response = await authApi.post('/auth/forgot-password', { email });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: 'Failed to send reset code' };
        }
    },

    // ── Reset password ────────────────────────────────────────────────────────
    resetPassword: async ({ email, code, newPassword }) => {
        try {
            const response = await authApi.post('/auth/reset-password', {
                email, code, new_password: newPassword,
            });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || 'Invalid or expired code' };
        }
    },

    // ── Update profile ────────────────────────────────────────────────────────
    updateProfile: async ({ fullName, investmentStatus, budgetMin,
        budgetMax, investmentGoal, profilePhoto }) => {
        try {
            const response = await authApi.put('/auth/profile', {
                full_name: fullName ?? undefined,
                investment_status: investmentStatus ?? undefined,
                budget_min: budgetMin ?? undefined,
                budget_max: budgetMax ?? undefined,
                investment_goal: investmentGoal ?? undefined,
                profile_photo: profilePhoto ?? undefined,
            });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || 'Failed to update profile' };
        }
    },

    // ── Change password ───────────────────────────────────────────────────────
    changePassword: async ({ currentPassword, newPassword }) => {
        try {
            const response = await authApi.post('/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword,
            });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || 'Failed to change password' };
        }
    },

    // ── Google Sign-In ────────────────────────────────────────────────────────
    handleGoogleResponse: async ({ idToken, onboardingData = {} }) => {
        try {
            if (!idToken) throw new Error('No ID token received from Google');
            const credential = GoogleAuthProvider.credential(idToken);
            const firebaseResult = await signInWithCredential(auth, credential);
            const firebaseToken = await firebaseResult.user.getIdToken();

            const response = await authApi.post('/auth/google', {
                firebase_token: firebaseToken,
                full_name: firebaseResult.user.displayName,
                investment_status: onboardingData.investmentStatus,
                budget_min: onboardingData.budgetMin,
                budget_max: onboardingData.budgetMax,
                investment_goal: onboardingData.investmentGoal,
            });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || 'Google Sign-In failed' };
        }
    },

    // ── Refresh token ─────────────────────────────────────────────────────────
    refreshToken: async (refreshToken) => {
        try {
            const response = await authApi.post('/auth/refresh', {
                refresh_token: refreshToken,
            });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: 'Session expired' };
        }
    },

    // ── Logout ────────────────────────────────────────────────────────────────
    logout: async (refreshToken) => {
        try {
            await authApi.post('/auth/logout', { refresh_token: refreshToken });
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    },
};