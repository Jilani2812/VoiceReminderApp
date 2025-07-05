import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { Platform, PermissionsAndroid } from 'react-native';

export const requestMicrophonePermission = async () => {
  let permission = null;

  if (Platform.OS === 'android') {
    permission = PERMISSIONS.ANDROID.RECORD_AUDIO;
  } else {
    permission = PERMISSIONS.IOS.MICROPHONE;
  }

  if (!permission) {
    console.error('Error: Permission string is null');
    return false;
  }

  try {
    const result = await request(permission);
    if (result === RESULTS.GRANTED) {
      console.log('Microphone permission granted');
      return true;
    } else {
      console.log('Microphone permission denied');
      return false;
    }
  } catch (error) {
    console.error('Error requesting microphone permission:', error);
    return false;
  }
};
