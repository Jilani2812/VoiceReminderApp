
import React, { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { scale } from "./Scale";

export default function Mainscreen({ navigation, route }) {

  //old
  // useEffect(() => {
  //   // If the screen was opened from a notification, skip the timer
  //   if (route.params?.isFromNotification) {
  //     console.log("App opened from notification, skipping timer.");
  //     return; // Skip the timer if opened from a notification
  //   }

  //   // Otherwise, start the timer
  //   const timer = setTimeout(() => {
  //     navigation.navigate('RecordingListScreen');
  //   }, 5000); // Delay in milliseconds

  //   // Cleanup the timer on unmount
  //   return () => clearTimeout(timer);
  // }, [navigation, route.params?.isFromNotification]);

  useEffect(() => {
    console.log("🏁 Welcome screen mounted");

    // ✅ Prevent timer if app was opened via notification
    if (route.params?.isFromNotification) {
      console.log("🚫 Skipping auto-navigation: Opened from Notification");
      return;
    }

    console.log("⏳ Navigating to RecordingListScreen in 5 seconds...");
    const timer = setTimeout(() => {
      navigation.navigate('RecordingListScreen');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigation, route.params?.isFromNotification]);

  return (
    <SafeAreaView style={styles.mainview}>
      <Image source={require('../../image/vnr.png')} style={styles.logoimg} />

      <View style={styles.logoview}>
        <Image source={require('../../image/7806.jpg')} style={styles.VoiceApp} />
        <Text style={styles.welcometext}>
          Welcome To{"\n"}
          Voice Note Reminder
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',  // Ensures content is vertically centered
  },
  logoview: {
    width: '100%',
    marginVertical: scale(30),
    resizeMode: 'contain'
  },
  logoimg: {
    width: '50%',
    height: scale(180),
    marginTop: scale(100),
    alignSelf: 'center',
    resizeMode: 'contain'
  },
  VoiceApp: {
    width: '98%',
    height: scale(250),
    alignSelf: 'center',
    resizeMode: 'contain'
  },
  welcometext: {
    alignSelf: 'center',
    fontSize: 20,
    textAlign: 'center',
    color: '#FF5003',
    fontWeight: '900',
    marginTop: scale(20),  // Adding some spacing between the image and text
  }
});
