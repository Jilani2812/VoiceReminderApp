import Toast from 'react-native-toast-message';

export const showToast = (message) => {
    Toast.show({
        type: 'success',
        text1: message,
        position: 'bottom',
    });
};