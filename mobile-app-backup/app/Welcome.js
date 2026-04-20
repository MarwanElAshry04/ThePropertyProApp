import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Welcome({ userName, onNext }) {
  useEffect(() => {
    // Auto-advance to dashboard after 2.5 seconds
    const timer = setTimeout(() => {
      onNext();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient colors={['#1A1265', '#1A1265']} style={styles.container}>
      {/* Small Logo */}
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>🏠</Text>
      </View>

      {/* Welcome Message */}
      <Text style={styles.welcomeText}>Welcome, {userName}!</Text>
      <Text style={styles.subtitle}>We are setting up your experience</Text>

      {/* Loading Dots */}
      <View style={styles.dotsContainer}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoBox: {
    width: 80,
    height: 80,
    backgroundColor: 'white',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 40,
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.7,
    marginBottom: 40,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
    opacity: 0.6,
  },
});