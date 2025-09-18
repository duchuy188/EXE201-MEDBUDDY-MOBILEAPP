import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface VoicePickerProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{label: string; value: string}>;
  label: string;
}

const VoicePicker: React.FC<VoicePickerProps> = ({
  value,
  onValueChange,
  options,
  label
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={value}
          onValueChange={onValueChange}
          style={styles.picker}
        >
          {options.map(({label, value}) => (
            <Picker.Item
              key={value}
              label={label}
              value={value}
            />
          ))}
        </Picker>
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
  pickerContainer: {
    backgroundColor: '#F0F6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B6D5FA',
    overflow: 'hidden',
  },
  picker: {
    backgroundColor: '#F0F6FF',
    color: '#1E293B',
    height: 50,
  },
});

export default VoicePicker;
