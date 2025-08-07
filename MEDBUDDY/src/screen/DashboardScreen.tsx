import React from 'react';
import { View, Text } from 'react-native';

interface DashboardScreenProps {
  userType: 'patient' | 'family';
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ userType }) => {
  // Bạn có thể thêm UI chi tiết ở đây dựa trên code bạn gửi trước đó
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
        {userType === 'family' ? 'Dashboard cho người thân' : 'Dashboard cho người bệnh'}
      </Text>
    </View>
  );
};

export default DashboardScreen;
