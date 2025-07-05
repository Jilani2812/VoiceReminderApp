import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const RadioButton = ({
  selected,
  onPress,
  style,
  textStyle,
  size = 30,
  color = 'orange',
  text = '',
  ...props
}) => (
  <TouchableOpacity
    style={[styles.radioButton, style]}
    onPress={onPress}
    {...props}
  >
    <Icon
      size={size}
      color={color}
      name={selected ? 'radio-button-checked' : 'radio-button-unchecked'}
    />
    <Text style={textStyle}> {text} </Text>
  </TouchableOpacity>
);

export default RadioButton;

const styles = StyleSheet.create({
  radioButton: {
    marginTop:5,
    marginBottom: 5,
    // borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
