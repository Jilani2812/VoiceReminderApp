import React, { useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Waveform, type IWaveformRef } from '@simform_solutions/react-native-audio-waveform';

const CustomWaveform = ({ sourceUri, color = '#4CAF50', scale = 1.0, style }) => {
  const waveformRef = useRef<IWaveformRef>(null);

//   const play = () => {
//     waveformRef.current?.play();
//   };

//   const pause = () => {
//     waveformRef.current?.pause();
//   };

//   const stop = () => {
//     waveformRef.current?.stop();
//   };

  return (
    <View style={[styles.container, style]}>
      <Waveform
        mode="static"
        ref={waveformRef}
        path={sourceUri} // Make sure this path is correct
        candleSpace={2}
        candleWidth={4}
        waveColor={color}
        // scale={scale}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
  },
  waveform: {
    width: '100%',
    height: '100%',
  },
});

export default CustomWaveform;
