import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { scale } from '../Screens/Scale';

const SearchHeader = ({
  contentContainerStyle,
  containerStyle,
  placeholder = 'Search Recording',
  onChangeText,
  value,
  backgroundColor ='#FFFFFF',
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.row}>
        <View style={[styles.inputContainer, { backgroundColor }]}>
        
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#868686"
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            textAlign={I18nManager.isRTL ? 'right' : 'left'}
            value={value}
            onChangeText={onChangeText}
          />
            <View style={styles.iconContainer}>
            <FontAwesome name="search" size={22} color={'#868686'} />
          </View>
        </View>
      </View>
    </View>
  );
};


export default SearchHeader;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: scale(10),

  },
  row: {
    flexDirection: 'row',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(25),
    backgroundColor:'white',
    height: 40,
    padding:scale(5),
    marginVertical: scale(5),
    // ...colors.SHADOW,
    elevation: 21,
  },
  iconContainer: {
    marginRight:scale(5),
    flex: 0.1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 0.9,
    paddingHorizontal:scale(10),
    height: 40,
  },
});
