import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Image, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { scale } from '../Screens/Scale';

const options = {
  title: 'Select Avatar',
  customButtons: [{ name: 'qwert', title: 'Choose Photo from Device' }],
  storageOptions: {
    skipBackup: true,
    path: 'images',
  },
};

const NewImagePicker = ({ pickerOpen, onImageSelected }) => {

  const [imageSource, setImageSource] = useState(null);

  launchImageLibrary(options, (response) => {
    if (response.didCancel) {
    } else if (response.error) {
    } else if (response.customButton) {
    } else {
      const source = { uri: response.assets[0].uri };
      pickerOpen(false)
      setImageSource(source);
      onImageSelected(response && response.assets[0].uri);

    }
  });


  return (
    <View style={{borderWidth:16}}>
      {imageSource && (
        <Image source={{ uri: imageSource }} style={{ width: 400, height: 400,borderRadius:scale(50),  resizeMode: 'contain' }} />
      )}
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
};

export default NewImagePicker;
