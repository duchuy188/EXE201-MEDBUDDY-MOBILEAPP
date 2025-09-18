import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Option {
  label: string;
  value: any;
}

interface CustomPickerProps {
  options: Option[];
  selectedValue: any;
  onValueChange: (value: any) => void;
  label: string;
}

const CustomPicker: React.FC<CustomPickerProps> = ({
  options,
  selectedValue,
  onValueChange,
  label
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={String(option.value)}
            style={[
              styles.option,
              selectedValue === option.value && styles.selectedOption
            ]}
            onPress={() => onValueChange(option.value)}
          >
            <Text style={[
              styles.optionText,
              selectedValue === option.value && styles.selectedOptionText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    backgroundColor: '#F0F6FF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B6D5FA',
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#B6D5FA',
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
});

export default CustomPicker;
