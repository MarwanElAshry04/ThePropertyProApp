import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyDz_e7PzkNe_T_ER-ZO20fx_wD4PPGQrro",
    authDomain: "propertypro-b2f3c.firebaseapp.com",
    projectId: "propertypro-b2f3c",
    storageBucket: "propertypro-b2f3c.firebasestorage.app",
    messagingSenderId: "112284529288",
    appId: "1:112284529288:web:37e7f4edb66768f992a53d",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use AsyncStorage for persistence so Firebase auth state survives app restarts
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export { app, auth };