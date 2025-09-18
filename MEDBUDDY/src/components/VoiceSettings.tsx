import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface VoiceOption {
  label: string;
  value: string;
}

interface SpeedOption {
  label: string;
  value: number;
}

interface VoiceSettingsProps {
  voiceOptions: VoiceOption[];
  speedOptions: SpeedOption[];
  selectedVoice: string;
  selectedSpeed: number;
  onVoiceChange: (voice: string) => void;
  onSpeedChange: (speed: number) => void;
  onTestVoice: () => void;
}

const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  voiceOptions,
  speedOptions,
  selectedVoice,
  selectedSpeed,
  onVoiceChange,
  onSpeedChange,
  onTestVoice
}) => {
  return (
    <View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Giọng đọc</Text>
        <View style={styles.optionsContainer}>
          {voiceOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                selectedVoice === option.value && styles.selectedOption
              ]}
              onPress={() => onVoiceChange(option.value)}
            >
              <Text style={[
                styles.optionText,
                selectedVoice === option.value && styles.selectedOptionText
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.testVoiceButton}
          onPress={onTestVoice}
        >
          <Text style={styles.testVoiceText}>
            Nghe thử giọng đọc
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tốc độ đọc</Text>
        <View style={styles.optionsContainer}>
          {speedOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                selectedSpeed === option.value && styles.selectedOption
              ]}
              onPress={() => onSpeedChange(option.value)}
            >
              <Text style={[
                styles.optionText,
                selectedSpeed === option.value && styles.selectedOptionText
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '500',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    flex: 1,
    backgroundColor: '#F0F6FF',
    padding: 12,
    borderRadius: 10,
    minWidth: '45%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B6D5FA',
  },
  selectedOption: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  optionText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#1E293B',
    fontWeight: 'bold',
  },
  testVoiceButton: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#B6D5FA',
  },
  testVoiceText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default VoiceSettings;
