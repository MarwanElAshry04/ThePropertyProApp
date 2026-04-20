import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';

// Secure storage keys 
const ACCESS_TOKEN_KEY = 'propertypro_access_token';
const REFRESH_TOKEN_KEY = 'propertypro_refresh_token';
const USER_KEY = 'propertypro_user';

// Context 
const AuthContext = createContext(null);

// Provider
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);   // true while checking stored token
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // On app start — check if user is already logged in 
    useEffect(() => {
        checkStoredAuth();
    }, []);

    const checkStoredAuth = async () => {
        try {
            const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
            const storedUser = await SecureStore.getItemAsync(USER_KEY);

            if (storedRefreshToken && storedUser) {
                // Try to get a fresh access token using the stored refresh token
                const result = await authService.refreshToken(storedRefreshToken);

                if (result.success) {
                    // Valid session — restore auth state
                    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, result.data.access_token);
                    setAccessToken(result.data.access_token);
                    setUser(result.data.user);
                    setIsAuthenticated(true);
                    console.log(' Auto-login successful:', result.data.user.email);
                } else {
                    // Refresh token expired — clear everything
                    await clearStoredAuth();
                    console.log(' Session expired — user must log in again');
                }
            }
        } catch (error) {
            console.error('Auth check error:', error);
            await clearStoredAuth();
        } finally {
            setIsLoading(false);
        }
    };

    // Save auth data to secure storage 
    const saveAuthData = async (accessToken, refreshToken, userData) => {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
    };

    // Clear auth data from secure storage 
    const clearStoredAuth = async () => {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
    };

    // Login
    const login = async (accessToken, refreshToken, userData) => {
        await saveAuthData(accessToken, refreshToken, userData);
        setAccessToken(accessToken);
        setUser(userData);
        setIsAuthenticated(true);
    };

    // Logout 
    const logout = async () => {
        try {
            const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
            if (storedRefreshToken) {
                // Tell backend to invalidate the refresh token
                await authService.logout(storedRefreshToken);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            await clearStoredAuth();
            setUser(null);
            setAccessToken(null);
            setIsAuthenticated(false);
        }
    };

    // Update user data (e.g. after editing profile)
    const updateUser = async (updatedUser) => {
        setUser(updatedUser);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
    };

    // Get stored refresh token (used by authService interceptor)
    const getRefreshToken = async () => {
        return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    };

    return (
        <AuthContext.Provider value={{
            user,
            accessToken,
            isLoading,
            isAuthenticated,
            login,
            logout,
            updateUser,
            getRefreshToken,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider');
    }
    return context;
}