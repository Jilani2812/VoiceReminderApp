import {Dimensions} from 'react-native';

const {width, height} = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 414;
const guidelineBaseHeight = 896;

const scale = size =>
  width > 600
    ? (width / guidelineBaseWidth) * size * 0.61
    : (width / guidelineBaseWidth) * size;
const scaleVertical = size => (height / guidelineBaseHeight) * size;
const scaleModerate = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export {scale, scaleVertical, scaleModerate};


export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SCREEN_HEIGHT = Dimensions.get('window').height;
export const PLATFORM_IOS = Platform.OS === 'ios' ? true : false;
export let isIPhoneX = false;