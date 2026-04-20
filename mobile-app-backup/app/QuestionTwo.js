import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function QuestionTwo({ onNext, onBack }) {
  const [selected, setSelected] = useState(null);

  const budgetOptions = [
    { id: 1, label: "Under $200K" },
    { id: 2, label: "$200K - $400K" },
    { id: 3, label: "$400K - $750K" },
    { id: 4, label: "Over $750K" }
  ];

  const handleSelect = (id) => {
    setSelected(id);
    // Auto-advance after selection
    setTimeout(() => {
      onNext({ budget: id });
    }, 300);
  };

  return (
    <LinearGradient colors={['#1A1265', '#1A1265']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.stepText}>Step 2 of 3</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '66%' }]} />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>What is your budget?</Text>
      <Text style={styles.subtitle}>This helps us show you properties you can afford</Text>

      {/* Budget Grid - 2x2 */}
      <View style={styles.gridContainer}>
        {budgetOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.budgetCard,
              selected === option.id && styles.budgetCardSelected
            ]}
            onPress={() => handleSelect(option.id)}
          >
            <Text style={styles.budgetText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Flexible Budget Link */}
      <TouchableOpacity style={styles.flexibleButton}>
        <Text style={styles.flexibleText}>I am flexible with budget</Text>
      </TouchableOpacity>
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  budgetCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    width: '47%',
    height: 120,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'white',
  },
  budgetText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  flexibleButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  flexibleText: {
    color: 'white',
    fontSize: 14,
    textDecorationLine: 'underline',
    opacity: 0.8,
  },
});