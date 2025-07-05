import React, { useState, useEffect, useRef } from 'react';
import { Button, Image, Modal, PermissionsAndroid, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import NewImagePicker from '../Components/ImagePicker';
import TimePicker from '../Components/TimePicker';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../Components/Header';
import { SCREEN_HEIGHT, SCREEN_WIDTH, scale } from './Scale.js';
import Menu, { MenuItem, MenuDivider } from 'react-native-material-menu';
import DocumentPicker from 'react-native-document-picker';
import { Alert } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { cancelNotification, fetchAudioFiles, initializeAudioFilesTable, initializeDatabase, saveAudioPathToSQLite, saveReminder, updateAudioPath } from '../utils/database.js';
import RNCalendarEvents from 'react-native-calendar-events';
import { checkAndRequestPermissions, requestAudioStoragePermissions, requestMicrophonePermission } from '../utils/Permissions.js'; // Ensure you have this utility
import moment from 'moment-timezone';
import {
    AudioEncoderAndroidType,
    AudioSourceAndroidType,
    AVModeIOSOption,
    AVEncoderAudioQualityIOSType,
    AVEncodingOption,
} from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import RadioButton from '../Components/RadioButtonCustom.js';
import Slider from '@react-native-community/slider';
// At the top of the file, import necessary functions
import { updateReminder } from '../utils/database'; // Ensure this function exists in your database utility

const audioRecorderPlayer = new AudioRecorderPlayer();

export default function AddReminder({ navigation, route }) {
    const [openDropdown, setOpenDropdown] = useState(null); // Track open dropdown
    const [isImagePickerOpen, setImagePickerOpen] = useState(false);
    const [logoChosen, setLogoChosen] = useState(null);
    const [time, setTime] = useState(new Date());
    const [isRecording, setIsRecording] = useState(false);
    const recordingRef = useRef(null);
    const [recordedPath, setRecordedPath] = useState('');
    const [label, setLabel] = useState('');
    const [selectedDays, setSelectedDays] = useState([]);
    const [customDates, setCustomDates] = useState(null);

    const [fileName, setFileName] = useState('');
    const [schedule, setSchedule] = useState([
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },]);
    const [SnoozeOptions, setSnoozeOtions] = useState([
        { label: 'One Time', value: 'one' },
        { label: 'Two Time', value: 'two' },]);
    // const [selectedSnoooze, setSelectedSnoooze] = useState(5);
    const [snoozeInterval, setSnoozeInterval] = useState(2); // Default snooze interval in minutes
    const [snoozeCount, setSnoozeCount] = useState(1);
    const [selectedSchedule, setSelectedSchedule] = useState('daily');
    const [isOpen, setIsOpen] = useState(false);
    const [isSnoozeOpen, setIsSnoozeOpen] = useState(false);
    const [RecordingList, setRecodingsList] = useState([]);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isStopping, setIsStopping] = useState(false); // New state to track stopping

    const [seconds, setSeconds] = useState(0);
    const [minutes, setMinutes] = useState(0);
    const [startCountdown, setStartCountdown] = useState(false);
    // Recording functions
    const [audioPath, setAudioPath] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [alarmType, setAlarmType] = useState('Default');
    const [selectedRecord, setSelectedRecord] = useState(true);
    const [selectedAudio, setSelectedAudio] = useState(false);
    const formattedTime = time && time instanceof Date && !isNaN(time)
        ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
        : 'Select Time';
    const [snoozeModal, setSnoozeModal] = useState(false);
    const [modalHeight, setModalHeight] = useState(SCREEN_HEIGHT * 0.45);

    const _AudioRef = useRef({});

    const dayAbbreviations = {
        Monday: 'MO',
        Tuesday: 'TU',
        Wednesday: 'WE',
        Thursday: 'TH',
        Friday: 'FR',
        Saturday: 'SA',
        Sunday: 'SU'
    };

    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (route.params?.reminder) {
            const reminder = route.params.reminder;
            setLabel(reminder.label);
    
            // Ensure time is properly parsed
            if (reminder.time) {
                let parsedTime;
    
                // Check if time is in string format (e.g., "12:30 PM")
                if (typeof reminder.time === "string" && reminder.time.includes(":")) {
                    const now = new Date();
                    const [hours, minutes] = reminder.time
                        .replace(/[^0-9:]/g, "") // Remove AM/PM for parsing
                        .split(":")
                        .map(Number);
    
                    let isPM = reminder.time.toLowerCase().includes("pm");
                    let adjustedHours = isPM && hours < 12 ? hours + 12 : hours;
    
                    parsedTime = new Date(now.setHours(adjustedHours, minutes, 0, 0));
                } else {
                    // Try parsing as a standard Date string
                    parsedTime = new Date(reminder.time);
                }
    
                if (!isNaN(parsedTime.getTime())) {
                    setTime(parsedTime);
                } else {
                    console.warn("Invalid time format:", reminder.time);
                    setTime(new Date()); // Fallback to current time
                }
            }
    
            setSelectedSchedule(reminder.repeatType);
            setSelectedDays(reminder.repeatDays ? reminder.repeatDays.split(',') : []);
            setCustomDates(reminder.customDates);
            setRecordedPath(reminder.audioPath);
            setLogoChosen(reminder.imagePath);
            setSnoozeInterval(reminder.snoozeInterval);
            setSnoozeCount(reminder.snoozeCount);
            setIsEditing(true);
        }
    }, [route.params]);
    
    
    // Function to select and play audio file
    const selectAudioFile = async () => {
        try {
            const res = await DocumentPicker.pick({
                type: [DocumentPicker.types.audio],
            });
            console.log('Selected file:', res);
            const uri = res[0]?.uri;
            if (uri) {
                console.log('File URI:', uri);
                const filePath = await convertUriToFilePath(uri);
                if (filePath) {
                    // playRecording(filePath);
                    setRecordedPath(filePath);
                } else {
                    console.log('Failed to convert URI to file path');
                }
            } else {
                console.log('Invalid file selected or missing URI');
            }
        } catch (err) {
            if (DocumentPicker.isCancel(err)) {
                console.log('User canceled the picker');
            } else {
                console.error(err);
            }
        }
    };

    // Function to convert content:// URI to file path
    const convertUriToFilePath = async (uri) => {
        try {
            if (uri && uri.startsWith('content://')) {
                // Generate a new path in the app's document directory
                const destPath = `${RNFS.DocumentDirectoryPath}/${new Date().getTime()}.m4a`;

                // Copy the content URI to the app's file system
                await RNFS.copyFile(uri, destPath);

                console.log('File copied to:', destPath);
                return destPath;
            } else {
                console.error('Unsupported URI type or URI is undefined:', uri);
                return null;
            }
        } catch (error) {
            console.error('Error converting URI to file path:', error);
            return null;
        }
    };


    useEffect(() => {
        initializeDatabase(); // Initialize the database
        initializeAudioFilesTable();
    }, []);

    // useEffect(() => {
    //     const requestAudio = async () => {
    //         try {
    //             // setLoading(true);
    //             fetchAudioFiles((audio_files) => {
    //                 console.log('fetchedReminders', audio_files)
    //                 if (Array.isArray(audio_files)) {
    //                     setRecodingsList(audio_files);
    //                 } else if (audio_files && typeof audio_files === 'object') {
    //                     setRecodingsList([audio_files]);
    //                 }
    //             });
    //         } catch (error) {
    //             console.error('Failed to fetch reminders:', error);
    //         } finally {
    //             // setLoading(false);
    //         }
    //     };
    //     requestAudio();
    // }, []);

    useEffect(() => {
        return () => {
            audioRecorderPlayer.stopRecorder();
            audioRecorderPlayer.removeRecordBackListener();
        };
    }, []);

    // useEffect(() => {
    //     if (route.params?.repeatType) {
    //         console.log('route.params.repeatType', route.params.repeatType)
    //         setSelectedSchedule(route.params?.repeatType?.toLowerCase() || 'daily');
    //     }
    //     if (route.params?.repeatDays) {

    //         setSelectedDays(route.params.repeatDays.split(',')); // Convert string to array
    //         console.log('route.params.repeatDays', route.params.repeatDays.split(','))
    //     }
    //     if (route.params?.customDates) {
    //         setCustomDates(route.params.customDates);
    //         console.log('route.params.customDates', route.params.customDates)
    //     }
    // }, [route.params]);
    useEffect(() => {
        if (route.params?.repeatType) {
            console.log('Editing Schedule - repeatType:', route.params.repeatType);
            setSelectedSchedule(route.params.repeatType.toLowerCase() || 'daily');
        }
    
        if (route.params?.repeatDays) {
            console.log('Editing Schedule - repeatDays:', route.params.repeatDays);
            setSelectedDays(route.params.repeatDays.split(',')); // Convert stored string back to an array
        }
    
        if (route.params?.customDates) {
            console.log('Editing Schedule - customDates:', route.params.customDates);
            
            // Ensure proper parsing of the custom date
            const parsedDate = new Date(route.params.customDates);
            if (!isNaN(parsedDate.getTime())) {
                setCustomDates(parsedDate);
            } else {
                console.warn("Invalid custom date format:", route.params.customDates);
            }
        }
    }, [route.params]);
    
    useEffect(() => {
        let interval;
        if (startCountdown) {
            // Start the countdown timer
            interval = setInterval(() => {
                setSeconds(prev => {
                    if (prev === 59) {
                        setMinutes(prevMin => prevMin + 1);
                        return 0;
                    }
                    return prev + 1;
                });
            }, 1000);
        } else {
            // Clear the interval when countdown is stopped
            clearInterval(interval);
        }

        return () => clearInterval(interval); // Cleanup on component unmount
    }, [startCountdown]); // Trigger effect whenever `startCountdown` changes


    const startRecording = async () => {
        if (isRecording) {
            console.log('Recording is already in progress.');
            return;
        }

        try {
            const isPermissionGranted = await requestMicrophonePermission();
            if (!isPermissionGranted) {
                console.log('Microphone permission not granted.');
                return;
            }
            const generateAudioName = () => {
                const timestamp = new Date().toISOString();
                console.log(`audio_recording_${timestamp}`);
                return `audio_recording_${timestamp}.aac`;
            };
            const path = `${RNFS.ExternalDirectoryPath}/${generateAudioName()}`;
            const audioSet = {
                AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
                AudioSourceAndroid: AudioSourceAndroidType.MIC,
                AVModeIOS: AVModeIOSOption.measurement,
                AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
                AVNumberOfChannelsKeyIOS: 2,
                AVFormatIDKeyIOS: AVEncodingOption.aac,
            };

            setStartCountdown(true);
            const uri = await audioRecorderPlayer.startRecorder(path, audioSet);
            setIsRecording(true);
            setAudioPath(uri);
            console.log('Recording started at:', uri);
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    };
    const deleteRecording = async () => {
        setIsRecording(false);
        setRecordedPath('');
        console.log('Recording started at:', uri);

    };

    const stopRecording = async () => {
        console.log('stopRecording called');

        // If no recording is in progress, return early
        if (!isRecording) {
            console.log('No recording in progress.');
            return; // Don't stop if no recording is in progress
        }

        // Prevent multiple stop calls
        if (isStopping) {
            console.log('Already stopping the recording.');
            return; // Prevent multiple calls to stop
        }

        setIsStopping(true); // Set the stopping flag
        setStartCountdown(false); // Stop countdown if recording is stopped

        try {
            // Stop the recording and get the result (URI or file path)
            const result = await audioRecorderPlayer.stopRecorder();
            console.log('Recording stopped. Saved at:', result);

            // Update the recording state to false (no longer recording)
            setIsRecording(false);
            setRecordedPath(result); // Save the URI result

        } catch (error) {
            console.error('Oops! Failed to stop recording:', error);
        } finally {
            setIsStopping(false); // Reset the stopping flag
        }
    };

    const playRecording = async (filepath) => {
        if (!filepath) {
            console.error('No recorded path available to play.');
            return;
        }

        const exists = await RNFS.exists(filepath);
        if (exists) {
            await audioRecorderPlayer.startPlayer(filepath);
            console.log('Playing recording from:', filepath);
        } else {
            console.error('File does not exist at path:', filepath);
        }
    };
    const uploadAudioFile = async (localFilePath, reminderId) => {
        try {
            const fileName = localFilePath.split('/').pop(); // Extract file name

            // Save the file path to SQLite instead of uploading to Firebase
            const savedFilePath = await saveAudioPathToSQLite(label, localFilePath, reminderId);

            console.log('Audio file saved to SQLite, Path:', savedFilePath);
            return savedFilePath;  // Return the saved file path
        } catch (error) {
            console.error('Failed to save audio to SQLite:', error);
            throw error;  // Throw the error to handle it in the caller function
        }
    };

    const handleSave = async () => {
        if (!time || !label) {
            Alert.alert('Error', 'Please complete all fields before saving.');
            return;
        }

        try {

            const formattedTime = time instanceof Date
                ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                : 'Select Time';

            // Request calendar permissions
            const permission = await RNCalendarEvents.requestPermissions();
            if (permission !== 'authorized') {
                Alert.alert('Permission Denied', 'Please allow calendar access to save reminders.');
                return;
            }

            // Combine selected time with selected or current date
            let reminderDate = new Date();
            reminderDate.setHours(time.getHours(), time.getMinutes(), 0, 0); // Set the selected time

            if (selectedSchedule === 'custom' && customDates) {
                reminderDate = new Date(customDates); // Use custom date
                reminderDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
            }

            const startDate = reminderDate.toISOString();

            // Define recurrence rule
            let recurrenceRule = null;
            if (selectedSchedule === 'daily') {
                recurrenceRule = { frequency: 'daily' };  // Correct format
            }
            // else if (selectedSchedule === 'weekly' && selectedDays.length > 0) {
            //     recurrenceRule = { frequency: 'weekly', daysOfWeek: selectedDays.map(day => day.substring(0, 2).toUpperCase()) };
            // } 
            else if (selectedSchedule === 'weekly' && selectedDays.length > 0) {
                recurrenceRule = { frequency: 'weekly', daysOfWeek: selectedDays.map(day => dayAbbreviations[day]) };
            }
            else if (selectedSchedule === 'custom' && customDates) {
                // recurrenceRule = { frequency: 'none', occurrenceDates: [customDates] };
                recurrenceRule = { frequency: 'none', occurrenceDates: [new Date(customDates).toISOString()] };
                // recurrenceRule = { frequency: 'none', occurrenceDates: customDates.map(date => new Date(date).toISOString()) };


            }

            // Save reminder to SQLite
            const reminder = {
                time: formattedTime,
                label: label.trim(),
                repeatType: selectedSchedule,
                repeatDays: selectedSchedule === 'weekly' ? selectedDays.join(',') : null,
                customDates: selectedSchedule === 'custom' ? customDates : null,
                snoozeInterval: snoozeInterval,
                snoozeCount: snoozeCount,
                audioPath: recordedPath || null, // Fixed
                imagePath: logoChosen || null,
            };
            if (isEditing) {
                cancelNotification(route.params.reminder.id);
                 updateReminder(reminder, route.params.reminder.id, (success) => {
                    if (success) {
                        // scheduleNotification(route.params.reminder.id, reminderDate, label, recordedPath);
                        Alert.alert('Success', 'Reminder updated successfully!', [
                            { text: 'OK', onPress: () => navigation.navigate('RecordingListScreen') }
                        ]);
                    } else {
                        Alert.alert('Error', 'Failed to update the reminder.');
                    }
                });
              
            } else {
                saveReminder(reminder, async (success, newReminderId) => {
                    console.log('handleSave reminder', reminder, newReminderId)
                    if (success && newReminderId) {
                        console.log('Reminder ID:', newReminderId);

                        // Save event to calendar (REMOVED `endDate` to prevent crash)
                        const eventId = await RNCalendarEvents.saveEvent(label, {
                            startDate,
                            recurrenceRule,
                            alarms: [{ date: 0 }],  // 5 minutes before
                            notes: label,  // FIXED: Avoid using object
                        });


                        console.log('Event saved to calendar with ID:', eventId);
                        // Save the audio file and link it to the reminder
                        if (recordedPath) {

                            //Save the audio file to SQLite
                            const audioFilePath = recordedPath ? await uploadAudioFile(recordedPath, newReminderId) : null;

                            updateAudioPath(newReminderId, audioFilePath, (success) => {
                                if (success) {
                                    console.log("Audio path updated successfully in reminders table.");
                                } else {
                                    console.error("Failed to update audio path.");
                                }
                            });
                            // ✅ Schedule Notification
                            const notificationDetails = {
                                id: newReminderId.toString(),
                                title: label,
                                message: `It's time for your reminder: ${label}`,
                                date: reminderDate,// Convert moment object to Date
                                allowWhileIdle: true,
                                userInfo: {
                                    reminderId: newReminderId,
                                    label: label,
                                    audioPath: audioFilePath, // Ensure correct audio path is passed
                                },
                            };
                            // PushNotification.localNotificationSchedule(notificationDetails);

                        }
                        else {
                            console.log('no recordedPath');
                        }

                        Alert.alert('Success', 'Reminder saved successfully!', [{ text: 'OK', onPress: () => navigation.navigate('RecordingListScreen') }]);
                    } else {
                        Alert.alert('Error', 'Failed to save the reminder.');
                    }
                });

            }
        } catch (error) {
            console.error('Error saving event:', error);
            Alert.alert('Error', 'Failed to save the reminder to the calendar.');
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <Header
                shadow
                goBack
                titleHeader="Add Recording"
                navigation={navigation}
            />
            <Modal
                animationType="slide"
                transparent={true}
                onRequestClose={() => { }}
                visible={snoozeModal}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' }}>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps='handled'
                        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                        scrollEnabled={false} // Disable scrolling
                    >
                        <View style={{
                            width: SCREEN_WIDTH,
                            height: modalHeight,
                            marginTop: SCREEN_HEIGHT - modalHeight,
                            alignSelf: 'center',
                            backgroundColor: 'white',
                            borderTopLeftRadius: scale(25),
                            borderTopRightRadius: scale(25),
                            paddingHorizontal: scale(15),
                            transition: 'height 0.3s ease-in-out' // Smooth transition for height changes

                        }}>
                            <View style={{ ...styles.rowContainer, marginVertical: scale(20), }}>
                                <Text style={{ fontSize: scale(18), fontWeight: 'bold', marginBottom: scale(10), paddingLeft: scale(10), color: 'grey' }}>
                                    {'Snooze Interval'}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => { setSnoozeModal(false) }}>
                                    <Image source={require('../../image/closeIcon.png')} style={{ width: scale(27), height: scale(27) }} />
                                </TouchableOpacity>

                            </View>
                            <Text style={{
                                fontSize: scale(15),
                                fontWeight: '400',
                                marginBottom: scale(10),
                                paddingLeft: scale(10),
                                color: 'grey'
                            }}>
                                Snooze After
                                <Text style={{ color: 'orange', fontWeight: 'bold' }}> ({snoozeInterval}) </Text>
                                minutes
                            </Text>
                            <View
                                style={{
                                    borderWidth: scale(2),
                                    borderColor: 'lightgrey',
                                    padding: scale(5), // Add padding around the slider
                                    backgroundColor: 'white', // Optional: Background color for better visibility
                                    borderRadius: scale(50), // Optional: Round corners for a better UI
                                    marginTop: scale(10),
                                }}
                            >
                                <Slider
                                    style={{
                                        width: '95%',
                                        alignSelf: 'center',
                                        height: scale(35),
                                    }}
                                    minimumValue={2} // Minimum interval (changed from 0 to match lowerLimit)
                                    maximumValue={30} // Maximum interval
                                    step={1} // Step size
                                    value={snoozeInterval}
                                    minimumTrackTintColor="orange"
                                    maximumTrackTintColor="grey"
                                    thumbTintColor="orange"
                                    onValueChange={(value) => setSnoozeInterval(value)} // Update state on slide
                                />

                            </View>
                            {/* <Text style={{
                                marginTop: scale(10),
                                fontSize: scale(15),
                                fontWeight: '400',
                                marginBottom: scale(10),
                                paddingLeft: scale(10),
                                color: 'grey'
                            }}>
                                Slide to change time interval
                            </Text> */}
                            {/* Number of Snoozes */}
                            <Text style={{
                                fontSize: scale(15),
                                fontWeight: "400",
                                marginTop: scale(15),
                                paddingLeft: scale(10),
                                color: "grey"

                            }}>
                                Number of Snoozes
                                <Text style={{ color: "orange", fontWeight: "bold" }}> ({snoozeCount}) </Text>
                                times
                            </Text>

                            {/* Number of Snoozes Slider */}
                            <View
                                style={{
                                    borderWidth: scale(2),
                                    borderColor: "lightgrey",
                                    padding: scale(5),
                                    backgroundColor: "white",
                                    borderRadius: scale(50),
                                    marginTop: scale(10),
                                }}
                            >
                                <Slider
                                    style={{
                                        width: "95%",
                                        alignSelf: "center",
                                        height: scale(35),
                                    }}
                                    minimumValue={1} // Minimum snooze count
                                    maximumValue={5} // Maximum snooze count
                                    step={1} // Increase snooze count by 1
                                    value={snoozeCount}
                                    minimumTrackTintColor="orange"
                                    maximumTrackTintColor="grey"
                                    thumbTintColor="orange"
                                    onValueChange={(value) => setSnoozeCount(value)}
                                />
                            </View>
                            <TouchableOpacity
                                style={{ backgroundColor: 'orange', width: '100%', height: scale(50), alignSelf: 'center', justifyContent: 'center', alignItems: 'center', borderRadius: scale(10), marginTop: scale(30) }}
                                onPress={() => { setSnoozeModal(false) }}>
                                <Text style={{
                                    // marginTop: scale(10),
                                    fontSize: scale(20),
                                    fontWeight: "bold",
                                    paddingLeft: scale(10),
                                    color: "white"
                                }}>
                                    Done
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </ScrollView>
                </View>
            </Modal>
            <View style={styles.content}>
                {/* Time Picker */}
                <View style={styles.section}>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 0.5 }}><Text style={{ ...styles.label, flex: 1 }}>Time</Text></View>
                        <TouchableOpacity style={{ flex: 0.5 }} onPress={() => setShowTimePicker(true)}>
                            <Text style={{ textAlign: 'right', fontSize: 16, color: 'grey', marginBottom: scale(5), }}>
                                {time ? formattedTime : 'Select Time'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* <Text style={styles.timeDisplay}>{formattedTime}</Text> */}
                </View>

                {/* Label Input */}
                <View style={{ ...styles.section, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', }}>
                    <View style={{ flex: 0.3 }}>
                        <Text style={{ ...styles.label, marginBottom: 0 }}>Label</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter reminder Name"
                        value={label}  // bind value to label state
                        onChangeText={(text) => setLabel(text)}  // update label state on change
                        placeholderTextColor="grey"
                    />
                </View>

                {/* Repeat Option */}
                <View style={styles.rowContainer}>
                    <View style={{ flex: 0.35 }}>
                        <Text style={{ ...styles.label }}>Repeat</Text>
                    </View>
                    <View
                        style={{ flex: 0.7, borderBottomWidth: 1, borderColor: 'lightgrey', padding: scale(10), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: 'grey', fontSize: scale(16) }}>{selectedSchedule}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('RepeatScreen')}>
                            <Text style={{ color: 'orange', fontSize: scale(16) }}>Change</Text>
                        </TouchableOpacity>
                    </View>
                </View>


                <View style={styles.rowContainer}>
                    <View style={{ flex: 0.35 }}>
                        <Text style={{ ...styles.label }}>Snooze</Text>
                    </View>
                    <View
                        style={{ flex: 0.7, borderBottomWidth: 1, borderColor: 'lightgrey', padding: scale(10), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: 'grey', flex: 0.9, fontSize: scale(16) }}>Interval: {snoozeInterval} mins, Repeated {snoozeCount}
                            {snoozeCount > 1 ? ' times' : ' time'}
                        </Text>
                        <TouchableOpacity onPress={() => { setSnoozeModal(true) }} >
                            <Text style={{ color: 'orange', fontSize: scale(16) }}>Change</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Image Picker */}
                <View style={styles.section}>
                    <Text style={styles.label}>Picture</Text>
                    <View style={styles.imagePickerContainer}>
                        <TouchableOpacity style={{}} onPress={() => setImagePickerOpen(true)}>
                            {logoChosen ? (
                                <Image source={{ uri: logoChosen }} style={{ ...styles.image, borderWidth: 2, borderColor: 'lightgrey', borderRadius: scale(60), }} />
                            ) : (
                                <Image
                                    source={require('../../image/ATTACHMENT_ICON.png')}
                                    style={styles.image}
                                />)}
                        </TouchableOpacity>
                    </View>
                </View>
                {/* <View> */}
                <View style={{ width: '90%', alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <RadioButton
                        style={{ marginTop: 10, width: '40%' }}
                        selected={selectedRecord}
                        onPress={() => {
                            setSelectedRecord(true)
                            setSelectedAudio(false)
                            // setCheckedNone(false)
                        }}
                        text={'Record Audio'}
                        color={'orange'}
                        size={25}
                        textStyle={styles.radioButtonText}
                    />
                    <RadioButton
                        style={{ marginTop: 10, width: '40%', }}
                        selected={selectedAudio}
                        onPress={() => {
                            setSelectedAudio(true)
                            setSelectedRecord(false)

                            // setCheckedNone(false)
                        }}
                        text={'Select Audio'}
                        color={'orange'}
                        size={25}
                        textStyle={styles.radioButtonText}
                    />
                </View>
                {/* </View> */}

                {selectedRecord &&
                    (<View style={styles.audioContainer}>
                        {!isRecording ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, justifyContent: 'space-between', borderColor: 'lightgrey', borderRadius: scale(10) }}>
                                <View style={{ padding: scale(10), justifyContent: 'center', backgroundColor: '#EDF1F7', borderRadius: scale(10), flex: 0.8, minHeight: scale(70), marginRight: scale(5) }}>
                                    {recordedPath ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', }}>
                                            <TouchableOpacity style={{ flex: 0.1 }} onPress={() => playRecording(recordedPath)}>
                                                <Image source={require('../../image/PlayIcon.png')} style={{ width: scale(45), height: scale(45), resizeMode: 'contain' }} />

                                            </TouchableOpacity>
                                            <View style={{ flex: 0.8, }}>
                                                <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'grey' }}>
                                                    {recordedPath}
                                                </Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={{ justifyContent: 'center', }}>
                                            <Text style={{ fontSize: 15, color: 'grey' }}>No recording selected yet</Text>


                                        </View>
                                    )}
                                </View>
                                <View style={{ flex: 0.2, justifyContent: "center", alignItems: 'center' }}>
                                    {recordedPath ? (
                                        <TouchableOpacity
                                            onPress={deleteRecording}
                                        >
                                            <Image source={require('../../image/deleteIcon.png')} style={{ width: scale(50), height: scale(50), resizeMode: 'contain' }} />
                                        </TouchableOpacity>) :
                                        (
                                            <TouchableOpacity onPress={startRecording}>
                                                <Image source={require('../../image/recordicon.png')} style={{ width: scale(50), height: scale(50), resizeMode: 'contain' }} />
                                            </TouchableOpacity>)}
                                </View>
                            </View>
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, justifyContent: 'space-between', borderColor: 'lightgrey', borderRadius: scale(10) }}>
                                <View style={{ padding: scale(10), justifyContent: 'center', backgroundColor: '#EDF1F7', borderRadius: scale(10), flex: 0.8, minHeight: scale(70), marginRight: scale(5) }}>

                                    {isRecording && (
                                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: 'grey' }}>
                                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                                        </Text>
                                    )}
                                </View>
                                <View style={{ flex: 0.2, justifyContent: "center", alignItems: 'center' }}>
                                    <TouchableOpacity onPress={stopRecording}>
                                        <Image source={require('../../image/recordicon.png')} style={{ width: scale(50), height: scale(50), resizeMode: 'contain' }} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                    </View>)}

                {selectedAudio && (
                    // <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: scale(10), justifyContent: 'space-between', borderColor: 'lightgrey', borderRadius: scale(10) }}>
                    //     <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderColor: 'lightgrey', borderRadius: scale(10) }}>
                    //         <Menu
                    //             ref={_AudioRef}
                    //             style={{
                    //                 width: '90%',
                    //                 height: SCREEN_HEIGHT / 7,
                    //                 borderColor: '#CACACA',
                    //                 marginTop: scale(72),
                    //             }}
                    //             button={
                    //                 <TouchableOpacity
                    //                     onPress={() => _AudioRef.current?.show()}
                    //                     style={styles.menuStyle}
                    //                 >
                    //                     <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', }}>
                    //                         <TouchableOpacity style={{ flex: 0.1 }} onPress={() => playRecording(RecordingList[0].filePath)}>
                    //                             <Image source={require('../../image/PlayIcon.png')}
                    //                                 style={{ width: scale(45), height: scale(45), resizeMode: 'contain' }} />

                    //                         </TouchableOpacity>
                    //                         <View style={{ flex: 0.9, height: '100%', padding: scale(20), borderRadius: scale(10), backgroundColor: '#EDF1F7', marginLeft: scale(20), }}>
                    //                             <Text
                    //                                 numberOfLines={1}
                    //                                 ellipsizeMode="tail"
                    //                                 style={{ fontSize: scale(13), paddingRight: 20, color: 'grey', }}>
                    //                                 {recordedPath ? fileName : 'No Audio Files Selected'}
                    //                             </Text>
                    //                         </View>
                    //                     </View>
                    //                 </TouchableOpacity>
                    //             }
                    //         >
                    //             <ScrollView style={{ width: '100%' }}>
                    //                 {RecordingList?.map((item, index) => (
                    //                     <MenuItem
                    //                         key={index}
                    //                         style={{ width: '100%', padding: scale(5), marginTop: scale(-10) }}
                    //                         onPress={() => {
                    //                             console.log('Selected:', item.fileName);
                    //                             setFileName(item.fileName);
                    //                             setRecordedPath(item.filePath);
                    //                             _AudioRef.current?.hide();
                    //                         }}
                    //                     >
                    //                          <Text style={{ color: 'grey' }}>
                    //                             {item.fileName}
                    //                         </Text>

                    //                     </MenuItem>
                    //                 ))}
                    //             </ScrollView>
                    //         </Menu>
                    //     </View>
                    // </View>
                    <>
                        <View style={styles.audioContainer}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, justifyContent: 'space-between', borderColor: 'lightgrey', borderRadius: scale(10) }}>
                                <View style={{ padding: scale(10), justifyContent: 'center', backgroundColor: '#EDF1F7', borderRadius: scale(10), flex: 0.8, minHeight: scale(70), marginRight: scale(5) }}>
                                    {recordedPath ? (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', }}>
                                            <TouchableOpacity style={{ flex: 0.1 }} onPress={() => playRecording(recordedPath)}>
                                                <Image source={require('../../image/PlayIcon.png')} style={{ width: scale(45), height: scale(45), resizeMode: 'contain' }} />

                                            </TouchableOpacity>
                                            <View style={{ flex: 0.8, }}>
                                                <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'grey' }}>
                                                    {recordedPath}
                                                </Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={{ justifyContent: 'center', }}>
                                            <Text style={{ fontSize: 15, color: 'grey' }}>No recording selected yet</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={{ flex: 0.2, justifyContent: "center", alignItems: 'center' }}>
                                    {recordedPath ? (
                                        <TouchableOpacity
                                            onPress={deleteRecording}
                                        >
                                            <Image source={require('../../image/deleteIcon.png')} style={{ width: scale(50), height: scale(50), resizeMode: 'contain' }} />
                                        </TouchableOpacity>) :
                                        (
                                            <TouchableOpacity onPress={selectAudioFile}>
                                                <Ionicons name="attach-outline" size={50} color="orange" />
                                            </TouchableOpacity>)}
                                </View>
                            </View>

                        </View>

                    </>
                )}
                {/* Save Button */}
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
            </View>

            {/* Image Picker Modal */}
            {
                isImagePickerOpen && (
                    <NewImagePicker
                        pickerOpen={setImagePickerOpen}
                        onImageSelected={setLogoChosen}
                    />
                )
            }
            {
                showTimePicker &&
                <View style={{ borderWidth: 1, flex: 1 }}>

                    <TimePicker
                        time={time}
                        onTimeChange={(event, selectedTime) => {
                            if (selectedTime) {
                                setTime(selectedTime);
                                setShowTimePicker(false)
                            }
                        }}
                    />
                </View>
            }
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        paddingHorizontal: scale(20),
        paddingVertical: scale(10),
    },
    section: {
        marginVertical: scale(10),
    },
    label: {
        // flex:0.4,
        fontSize: scale(16),
        color: 'black',
        // marginBottom: scale(5),
    },
    timeDisplay: {
        fontSize: 16,
        color: 'grey',
    },
    input: {
        borderBottomWidth: 1,
        borderColor: '#CACACA',
        borderRadius: scale(8),
        paddingHorizontal: scale(10),
        paddingVertical: scale(0),
        marginLeft: scale(10),
        color: 'grey',
        flex: 0.7,
        height: scale(40),
    },
    rowContainer: {
        // borderWidth:1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        // backgroundColor:'orange',
        marginVertical: scale(10),

    },
    optionText: {
        fontSize: 14,
        color: 'grey',
    },
    imagePickerContainer: {
        alignItems: 'center',
    },
    image: {
        width: scale(120),
        height: scale(120),
        alignSelf: 'center',
        resizeMode: 'contain',
    },
    chooseFileText: {
        color: 'grey',
    },
    attachmentIcon: {
        width: scale(45),
        height: scale(45),
        resizeMode: 'contain',
    },
    audioContainer: {
        marginTop: scale(10),
        minHeight: scale(70),
    },
    recordingInfo: {
        marginTop: scale(10),
        fontSize: 16,
        color: '#333',
    },
    saveButton: {
        backgroundColor: 'orange',
        borderRadius: scale(8),
        paddingVertical: scale(12),
        alignItems: 'center',
        marginTop: scale(20),
    },
    saveButtonText: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    waveformContainer: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#f0f0f0', // Optional background color
        borderRadius: 10, // Optional border radius for the container
        alignItems: 'center', // Center align the waveform
    },
    radioButtonText: {
        fontSize: scale(14),
        lineHeight: 15,
        color: 'grey'
    },
    menuStyle: {
        height: scale(70),
        flexDirection: 'row',
        justifyContent: 'space-between',
        // backgroundColor: '#EDF1F7',
        alignItems: 'center',
        paddingHorizontal: scale(8),
        borderWidth: 1,
        borderColor: '#CACACA',
        borderRadius: scale(10),

    },
});
