import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function QuestionThree({ onNext, onBack }) {
  const [selected, setSelected] = useState(null);

  const goalOptions = [
    { id: 1, text: "Long term appreciation", emoji: "📈" },
    { id: 2, text: "Monthly rental income", emoji: "💰" },
    { id: 3, text: "A balance of both", emoji: "⚖️" }
  ];

  const handleSelect = (id) => {
    setSelected(id);
    // Auto-advance after selection
    setTimeout(() => {
      onNext({ investmentGoal: id });
    }, 300);
  };

  return (
    <LinearGradient colors={['#1A1265', '#1A1265']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.stepText}>Step 3 of 3</Text>
      </View>

      {/* Progress Bar - Full! */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>What is your main goal?</Text>
      <Text style={styles.subtitle}>This helps us recommend the right properties</Text>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {goalOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              selected === option.id && styles.optionCardSelected
            ]}
            onPress={() => handleSelect(option.id)}
          >
            <Text style={styles.optionEmoji}>{option.emoji}</Text>
            <Text style={styles.optionText}>{option.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backArrow: {
    color: 'white',
    fontSize: 24,
  },
  stepText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
    opacity: 0.8,
  },
  progressContainer: {
    marginBottom: 40,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: 'white',
    borderRadius: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.7,
    marginBottom: 40,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'white',
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  optionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});