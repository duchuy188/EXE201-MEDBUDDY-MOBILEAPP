// fcm.ts - File setup FCM cho React Native
import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';

/**
 * Yêu cầu quyền thông báo
 */
export const requestUserPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('iOS: Quyền thông báo được cấp');
    }
    return enabled;
  } else {
    // Android 13+ cần yêu cầu quyền POST_NOTIFICATIONS
    if (Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // Android < 13 không cần xin quyền
  }
};

/**
 * Lấy FCM Token
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Lỗi khi lấy FCM token:', error);
    return null;
  }
};

/**
 * Lắng nghe thay đổi token (khi token bị refresh)
 */
export const onTokenRefresh = (callback: (token: string) => void) => {
  return messaging().onTokenRefresh(callback);
};

/**
 * Xử lý thông báo khi app đang đóng (background/quit state)
 */
export const setupBackgroundHandler = () => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Thông báo nhận được ở background:', remoteMessage);
    // Xử lý thông báo ở đây nếu cần
  });
};

/**
 * Xử lý khi user tap vào thông báo (notification opened)
 */
export const onNotificationOpenedApp = (
  callback: (remoteMessage: any) => void,
) => {
  // App đang ở background và user tap vào notification
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('Notification opened app từ background:', remoteMessage);
    callback(remoteMessage);
  });

  // App đang đóng hoàn toàn và user tap vào notification
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('Notification opened app từ quit state:', remoteMessage);
        callback(remoteMessage);
      }
    });
};

/**
 * Gửi token lên server (để server có thể gửi thông báo)
 */
export const sendTokenToServer = async (token: string) => {
  try {
    // TODO: Thay YOUR_API_URL bằng API endpoint của bạn
    const response = await fetch('YOUR_API_URL/save-fcm-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Thêm authorization header nếu cần
      },
      body: JSON.stringify({
        token,
        platform: Platform.OS,
      }),
    });

    if (response.ok) {
      console.log('Token đã gửi lên server thành công');
    }
  } catch (error) {
    console.error('Lỗi khi gửi token lên server:', error);
  }
};

/**
 * Initialize FCM - Gọi hàm này trong App.tsx hoặc index.js
 */
export const initializeFCM = async () => {
  // 1. Setup background handler
  setupBackgroundHandler();

  // 2. Yêu cầu quyền
  const hasPermission = await requestUserPermission();

  if (hasPermission) {
    // 3. Lấy token
    const token = await getFCMToken();
    
    if (token) {
      // 4. Gửi token lên server
      await sendTokenToServer(token);
    }

    // 5. Lắng nghe token refresh
    onTokenRefresh(async (newToken) => {
      console.log('Token mới:', newToken);
      await sendTokenToServer(newToken);
    });

    // 6. Xử lý khi user tap vào notification
    onNotificationOpenedApp((remoteMessage) => {
      // Navigate đến màn hình cụ thể dựa vào data trong notification
      console.log('User tap vào notification:', remoteMessage.data);
    });
  }
};