import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View, AppState, BackHandler } from "react-native";
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import { scale } from "./Scale";
import PushNotification from 'react-native-push-notification'; // Make sure PushNotification is configured
import { fetchReminders } from "../utils/database";


const audioRecorderPlayer = new AudioRecorderPlayer();

const Alarmdisplay = ({ route, navigation }) => {
    console.log('route.params', route.params)
    const { reminderId, label, audioPath, imagePath, time, snoozeInterval, snoozeCount } = route.params || {};
    const [appState, setAppState] = useState(AppState.currentState); // Track app state (active or background)
    const [alarms, setAlarms] = useState([]); // State to hold multiple alarms
    const [formattedTime, setFormattedTime] = useState(''); // State to hold formatted time


    const handleSnooze = async () => {
        console.log('Snooze pressed');
        const newSnoozeCount = route.params?.snoozeCount > 0 ? route.params.snoozeCount - 1 : 0;
        // Calculate the time for the next snooze
        const snoozeTime = new Date().getTime() + snoozeInterval * 60 * 1000; // Current time + snoozeInterval (in milliseconds)
        
        const formattedTime = new Date(snoozeTime).toLocaleString();
        console.log('formattedTime',formattedTime)
        // Reschedule the alarm notification
        PushNotification.localNotificationSchedule({
            id: route.params?.reminderId.toString(), // Use the reminder ID from params to keep track
            channelId: "channel-id", // Specify your channel ID here
            title: route.params?.label, // The alarm label
            message: `It's time for your reminder: ${route.params?.label}`, // The reminder message
            date: new Date(snoozeTime), // The time when the alarm should go off
            // repeatType: 'day', // Optional: You can add repeatType if necessary
            allowWhileIdle: true, // Allows notification to trigger even when the device is idle
            data: {
                reminderId: route.params?.reminderId, // Pass the reminder ID along with other data if needed
                label: route.params?.label,
                audioPath: route.params?.audioPath,
                imagePath: route.params?.imagePath,
                time:formattedTime,
                snoozeInterval, // Pass snooze interval as part of the data
                snoozeCount: route.params?.snoozeCount, // Pass the snooze count
            },
        });
    
        // Optionally, update the state for snooze count and other UI changes
        console.log('⏰ Snooze set for',snoozeInterval, 'minutes. Remaining snoozes:', snoozeCount);
        
        // Navigate to the Recording List Screen or close the app if opened from notification
        if (route.params?.isFromNotification) {
            BackHandler.exitApp(); // Close the app if opened from notification
        } else {
            navigation.navigate('RecordingListScreen');
        }
    };
    // Example function to handle snooze for each alarm
    // const handleSnooze = async (alarmId) => {
    //     try {
    //         // Fetch the latest reminders first
    //         fetchReminders('', (fetchedReminders) => {
    //             console.log('Fetched Reminders:', fetchedReminders);
                
    //             // Set the latest reminders to state
    //             setAlarms(fetchedReminders);
    
    //             // Find the specific alarm after fetching
    //             const alarm = fetchedReminders.find(a => a.id === alarmId);
    
    //             if (!alarm) {
    //                 console.error('Alarm not found');
    //                 return;
    //             }
    
    //             if (alarm.snoozeCount > 0) {
    //                 // Calculate new snooze time
    //                 const snoozeTime = new Date().getTime() + alarm.snoozeInterval * 60 * 1000;
    //                 const newSnoozeCount = alarm.snoozeCount - 1;
    
    //                 // Update alarm state
    //                 setAlarms((prevAlarms) => prevAlarms.map((a) => {
    //                     if (a.id === alarmId) {
    //                         return { ...a, snoozeCount: newSnoozeCount }; // Update snooze count
    //                     }
    //                     return a;
    //                 }));
    
    //                 // Reschedule notification
    //                 PushNotification.localNotificationSchedule({
    //                     id: alarmId.toString(),
    //                     channelId: 'channel-id',
    //                     title: alarm.label,
    //                     message: `It's time for your reminder: ${alarm.label}`,
    //                     date: new Date(snoozeTime),
    //                     repeatType: 'day',
    //                     allowWhileIdle: true,
    //                     data: {
    //                         reminderId: alarm.id,
    //                         label: alarm.label,
    //                         audioPath: alarm.audioPath,
    //                         imagePath: alarm.imagePath,
    //                         snoozeInterval: alarm.snoozeInterval,
    //                         time: snoozeTime,
    //                         snoozeCount: newSnoozeCount,
    //                     },
    //                 });
    
    //                 console.log('Snooze set for', alarm.snoozeInterval, 'minutes. Remaining snoozes:', newSnoozeCount);
    
    //                 if (newSnoozeCount === 0) {
    //                     console.log('Max snooze reached for alarm', alarmId);
    //                     audioRecorderPlayer.stopPlayer(); // Stop audio when max snoozes are reached
                      
    //                     console.log("Audio stopped");
    //                     if (route.params?.isFromNotification) {
    //                         console.log("🚪 Closing app (opened from notification)...");
    //                         BackHandler.exitApp(); // ✅ Closes the app
    //                     } else {
    //                         console.log("🔄 Navigating back to RecordingListScreen");
    //                         navigation.navigate('RecordingListScreen');
    //                     }
    //                 }
    //             } else {
    //                 console.log('Snooze count exhausted for alarm', alarmId);
    //                 audioRecorderPlayer.stopPlayer(); // Stop audio when no snoozes are left
    //                 console.log("Audio stopped");
    //                 if (route.params?.isFromNotification) {
    //                     console.log("🚪 Closing app (opened from notification)...");
    //                     BackHandler.exitApp(); // ✅ Closes the app
    //                 } else {
    //                     console.log("🔄 Navigating back to RecordingListScreen");
    //                     navigation.navigate('RecordingListScreen');
    //                 }
    //             }
    //         });
    
    //     } catch (error) {
    //         console.error('Failed to snooze alarm:', error);
    //     }
    // };
    

    useEffect(() => {

        // Handle app state changes
        const handleAppStateChange = (nextAppState) => {
            if (appState.match(/inactive|background/) && nextAppState === 'active') {
                console.log('App has come to the foreground!');
                // Optional: Restart audio if needed when app comes to the foreground
            } else if (nextAppState.match(/active/) && appState !== 'active') {
                console.log('App has gone to the background!');
                audioRecorderPlayer.stopPlayer(); // Stop audio when app goes to the background
            }
            setAppState(nextAppState);
        };

        // Add event listener for app state changes
        const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

        // Cleanup the event listener when the component is unmounted
        return () => {
            appStateSubscription.remove();  // Use remove() instead of removeEventListener
        };
    }, [appState]);

    useEffect(() => {
        console.log('route.params', route.params)
        // setFormattedTime(time); // Format time to readable string
        // console.log('Formatted Time:', formattedTime);
    }, []);

    useEffect(() => {
        const playAudio = async () => {
            if (!audioPath) return console.error("No audio path provided");

            const exists = await RNFS.exists(audioPath);
            if (exists) {
                await audioRecorderPlayer.startPlayer(audioPath);
                console.log("Playing audio from:", audioPath);
            } else {
                console.error("Audio file does not exist:", audioPath);
            }
        };

        playAudio();

        return () => {
            audioRecorderPlayer.stopPlayer();
        };
    }, [audioPath]);

    const handleStop = async () => {
        await audioRecorderPlayer.stopPlayer();
        console.log("Audio stopped");
        if (route.params?.isFromNotification) {
            console.log("🚪 Closing app (opened from notification)...");
            BackHandler.exitApp(); // ✅ Closes the app
        } else {
            console.log("🔄 Navigating back to RecordingListScreen");
            navigation.navigate('RecordingListScreen');
        }
    };


    // const handleSnooze = async () => {
    //     console.log('Snooze pressed');

    //     // Check if there are any snoozes left
    //     if (snoozeCount > 0) {
    //         // Calculate the time for the next snooze (current time + snooze interval)
    //         const snoozeTime = new Date().getTime() + snoozeInterval * 60 * 1000; // Current time + snooze interval in milliseconds

    //         // Decrement the snooze count
    //         const newSnoozeCount = snoozeCount - 1;

    //         // Reschedule the alarm notification if snooze count is greater than 0
    //         PushNotification.localNotificationSchedule({
    //             id: route.params?.reminderId.toString(), // Use the reminder ID
    //             channelId: "channel-id", // Specify your channel ID
    //             title: route.params?.label, // The alarm label
    //             message: `It's time for your reminder: ${route.params?.label}`, // The reminder message
    //             date: new Date(snoozeTime), // The time when the alarm should go off
    //             repeatType: 'day', // Optional: you can use repeatType if necessary
    //             allowWhileIdle: true, // Allows notification to trigger when the device is idle
    //             data: {
    //                 reminderId: route.params?.reminderId, // Pass the reminder ID along with other data
    //                 label: route.params?.label,
    //                 audioPath: route.params?.audioPath,
    //                 imagePath: route.params?.imagePath,
    //                 snoozeInterval, // Pass snooze interval
    //                 snoozeCount: newSnoozeCount, // Pass the updated snooze count
    //             },
    //         });

    //         // Update the snooze count
    //         console.log('Snooze set for', snoozeInterval, 'minutes, Snoozes remaining:', newSnoozeCount);

    //         // If snooze count reaches 0, stop scheduling further snooze notifications
    //         if (newSnoozeCount === 0) {
    //             console.log('Max snooze reached. Stopping further snoozes.');
    //             // Optionally, stop the audio or notify the user that the alarm won't snooze anymore
    //             audioRecorderPlayer.stopPlayer(); // Stop audio (if playing)
    //             // Optionally, navigate or show a message to the user
    //             navigation.navigate('RecordingListScreen'); // Navigate to the list screen (or anywhere else)
    //         }

    //     } else {
    //         // If no snoozes left, stop the alarm
    //         console.log('Snooze count exhausted. Alarm will not snooze anymore.');
    //         audioRecorderPlayer.stopPlayer(); // Stop audio
    //         navigation.navigate('RecordingListScreen'); // Optionally navigate or handle as needed
    //     }
    // };

    return (
        <View style={edit.mainview}>
            <View style={edit.realtime}></View>

            <View style={edit.displaylogoview}>
                {imagePath ?
                    <Image source={{ uri: imagePath }} style={{ ...edit.displaylogoimg, borderWidth: 4, borderColor: 'white', borderRadius: scale(150) }} /> :
                    <Image source={require('../../image/vnrwhite.png')} style={edit.displaylogoimg} />}
            </View>

            <View style={edit.titleview}>
                <Text style={edit.titletext}>{label}</Text>
            </View>

            <View style={edit.titleview}>
                {/* <Text style={edit.titletext}>{formattedTime}</Text> */}
                <Text style={edit.titletext}>{time}</Text>
            </View>

            <View style={edit.alarmbtn}>
            <TouchableOpacity style={edit.snoozebtn} onPress={() => handleSnooze(reminderId)}>
                    <Image source={require('../../image/snooze.png')} style={edit.snoozebtn} />
                </TouchableOpacity>

                <TouchableOpacity style={edit.stopbtn} onPress={handleStop}>
                    <Image source={require('../../image/stop.png')} style={edit.stopbtn} />
                </TouchableOpacity>
            </View>
        </View>
    );
};
const edit = StyleSheet.create({
    mainview: {
        width: '100%',
        height: '100%',
        backgroundColor: '#FF5003'
    },
    realtime: {
        width: '100%',
        height: 100,
        backgroundColor: 'transparent',
    },

    displaylogoview: {
        width: '100%',
        height: 250,
        backgroundColor: 'transparent',
        marginBottom: scale(20)
    },

    displaylogoimg: {
        width: 200,
        height: 200,
        backgroundColor: 'transparent',
        alignSelf: 'center',
    },
    titleview: {

        width: '100%',
        height: 50,
        backgroundColor: 'transparent'
    },
    titletext: {
        fontSize: 30,
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#FFFFFF'

    },
    alarmbtn: {
        width: '100%',
        height: '150',
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginTop: scale(120)
    },
    snoozebtn: {
        width: 80,
        height: 110,
    },
    stopbtn: {
        width: 80,
        height: 110,
    }

})
export default Alarmdisplay;