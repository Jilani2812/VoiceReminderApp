import React, { useEffect, useState, useCallback } from "react";
import { Alert, ScrollView, FlatList, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View, TextInput, I18nManager } from "react-native";
import Header from "../Components/Header";
import { SCREEN_WIDTH, scale } from "./Scale";
import PlayIcon from "../../image/PlayIcon.png";
import PauseIcon from "../../image/PauseIcon.png";
import { SafeAreaView } from "react-native-safe-area-context";
import { deleteReminder, fetchReminders } from "../utils/database";
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const audioRecorderPlayer = new AudioRecorderPlayer();

const Tooltip = ({ visible, onEdit, onDelete }) => {
    if (!visible) return null;
    return (
        
        
        <View style={styles.tooltip}>
            <View style={styles.tooltipContainer}>
                <TouchableOpacity onPress={onEdit} style={styles.tooltipButton}>
                    <Image
                        source={require('../../image/editProductIcon.png')}
                        style={styles.tooltipIcon}
                    />
                    <Text style={styles.tooltipText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onDelete} style={styles.tooltipButton}>
                    <Image
                        source={require('../../image/deleteIcon.png')}
                        style={styles.tooltipIcon}
                    />
                    <Text style={styles.tooltipText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function RecordingScreen({ navigation }) {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tooltipID, setTooltipID] = useState(null);
    const [recordingId, setRecordingId] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentAudioPath, setCurrentAudioPath] = useState(null);
    const [playStates, setPlayStates] = useState({});

    const [searchTerm, setSearchTerm] = useState('');


    useEffect(() => {
        const requestReminders = async () => {
            try {
                setLoading(true);
                fetchReminders(searchTerm, (fetchedReminders) => {
                    console.log('fetchedReminders', fetchedReminders);
                    setReminders(fetchedReminders);
                });
            } catch (error) {
                console.error('Failed to fetch reminders:', error);
            } finally {
                setLoading(false);
            }
        };

        requestReminders(); // Fetch reminders whenever the search term changes
    }, [searchTerm]);  // The effect will run again when the search term changes

    // useEffect(() => {
    //     const requestReminders = async () => {
    //         try {
    //             setLoading(true);
    //             fetchReminders((fetchedReminders) => {
    //                 console.log('fetchedReminders', fetchedReminders)
    //                 if (Array.isArray(fetchedReminders)) {
    //                     setReminders(fetchedReminders);
    //                 } else if (fetchedReminders && typeof fetchedReminders === 'object') {
    //                     setReminders([fetchedReminders]);
    //                 }
    //             });
    //         } catch (error) {
    //             console.error('Failed to fetch reminders:', error);
    //         } finally {
    //             setLoading(false);
    //         }
    //     };
    //     requestReminders();
    // }, []);

    const deleteReminders = async (reminderId) => {
        try {
            // Add your delete logic here (e.g., deleting from local database or file)
            console.log(`Deleting reminder with ID: ${reminderId}`);

            // Example delete logic (replace with your own):
            deleteReminder(reminderId);

            // Fetch reminders again after deletion
            fetchReminders('', (fetchedReminders) => {
                console.log('fetchedReminders after deletion', fetchedReminders);
                setReminders(fetchedReminders);
            });
        } catch (error) {
            console.error('Error deleting reminder:', error);
        }
    };
    const playRecording = async (recordedPath) => {
        const exists = await RNFS.exists(recordedPath);
        if (exists) {
            if (isPlaying) {
                // If audio is already playing, pause it
                await audioRecorderPlayer.pausePlayer();
                setIsPlaying(false); // Update the state to reflect the pause
                console.log('Audio paused');
            } else {
                // If audio is not playing, start playing it
                await audioRecorderPlayer.startPlayer(recordedPath);
                setIsPlaying(true); // Update the state to reflect the play
                setCurrentAudioPath(recordedPath); // Update the current audio path
                console.log('Playing recording from:', recordedPath);
            }
        } else {
            console.error('File does not exist at path:', recordedPath);
        }
    };

    const toggleRecording = (id) => {
        setRecordingId((prev) => (prev === id ? null : id));
    };

    const confirmDelete = (id) => {
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this reminder?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', onPress: () => deleteReminders(id) },
        ]);
    };

    const renderRecording = useCallback(
        (item, index) => {
            if (!item) {
                return null; // Return null if item is undefined or null
            }

            // Check if playState exists for the item.id, if not set it to false
            const isPlaying = playStates[item.id];

            return (
                <View style={{ ...styles.recordingCard, zIndex: -index }}>
                    <View style={styles.recordingInfo}>
                        {/* Play/Pause Button */}
                        <TouchableOpacity onPress={() => playRecording(item.audioPath, item.id)}>
                            <View style={styles.playButton}>
                                <Image
                                    source={
                                        isPlaying // Check if this recording is playing
                                            ? require('../../image/PauseIcon.png')
                                            : require('../../image/PlayIcon.png')
                                    }
                                    style={{ width: scale(45), height: scale(45), resizeMode: 'contain' }}
                                />
                            </View>
                        </TouchableOpacity>

                        {/* Recording Label and Date/Time */}
                        <View style={{ flex: 0.8 }}>
                            <Text style={styles.title}>{item.label}</Text>
                            <Text style={styles.date}>
                                {item.date} {item.time}
                            </Text>
                        </View>

                        {/* More Options Button */}
                        <TouchableOpacity
                            onPress={() => setTooltipID(tooltipID === item.id ? '' : item.id)}
                            style={styles.moreButton}
                        >
                            <Image
                                source={require('../../image/Options.png')}
                                style={{
                                    height: 20,
                                    width: 20,
                                    resizeMode: 'contain',
                                }}
                            />
                        </TouchableOpacity>

                        {/* Tooltip for Edit/Delete */}
                        {item.id === tooltipID && (

                            <Tooltip
                                visible={true}
                                onEdit={() => {
                                    setTooltipID('');
                                    navigation.navigate('AddReminder', { reminder: item });
                                }}
                                onDelete={() => {
                                    setTooltipID('');
                                    confirmDelete(item.id); // Handle confirmation for delete
                                }}
                                style={{
                                    position: 'absolute',
                                    top: scale(10),  // Adjust the positioning as needed
                                    right: scale(5),  // Adjust the positioning as needed
                                    zIndex: 9999,  // Apply a high zIndex when tooltip is visible
                                }}
                            />
                        )}
                    </View>
                </View>
            );
        },
        [tooltipID, playStates] // Dependency on playStates to re-render when play state changes
    );

    // const renderRecording = useCallback(
    //     ({ item }) => (
    //         <View style={styles.recordingCard}>
    //             <View style={styles.recordingInfo}>
    //                 {/* Play/Pause Button */}
    //                 <TouchableOpacity onPress={() => playRecording(item.audioPath, item.id)}>
    //                     <View style={styles.playButton}>
    //                         <Image
    //                             source={
    //                                 playStates[item.id] // Check if this recording is playing
    //                                     ? require('../../image/PauseIcon.png')
    //                                     : require('../../image/PlayIcon.png')
    //                             }
    //                             style={{ width: scale(45), height: scale(45), resizeMode: 'contain' }}
    //                         />
    //                     </View>
    //                 </TouchableOpacity>

    //                 {/* Recording Label and Date/Time */}
    //                 <View style={{ flex: 0.8 }}>
    //                     <Text style={styles.title}>{item.label}</Text>
    //                     <Text style={styles.date}>
    //                         {item.date} {item.time}
    //                     </Text>
    //                 </View>

    //                 {/* More Options Button */}
    //                 <TouchableOpacity
    //                     onPress={() => setTooltipID(tooltipID === item.id ? '' : item.id)}
    //                     style={styles.moreButton}
    //                 >
    //                     <Image
    //                         source={require('../../image/Options.png')}
    //                         style={{
    //                             height: 20,
    //                             width: 20,
    //                             resizeMode: 'contain',
    //                         }}
    //                     />
    //                 </TouchableOpacity>

    //                 {/* Tooltip for Edit/Delete */}
    //                 {item.id === tooltipID && (
    //                     <Tooltip
    //                         visible={true}
    //                         onEdit={() => {
    //                             setTooltipID('');
    //                             // Handle edit action here (navigate or open edit modal)
    //                         }}
    //                         onDelete={() => {
    //                             setTooltipID('');
    //                             confirmDelete(item.id); // Handle confirmation for delete
    //                         }}
    //                     />
    //                 )}
    //             </View>
    //         </View>
    //     ),
    //     [tooltipID, playStates] // Dependency on playStates to re-render when play state changes
    // );

    return (
        <View style={styles.container}>
            <Header
                shadow
                goBack
                // search
                rightArrow
                titleHeader={'Recording'}
                navigation={navigation}
            />
            <View style={{ flex: 1 }}>
                <View
                 style={{marginHorizontal: scale(10), marginVertical: scale(10)}}
                 >
                    <View style={styles.row}>
                        <View style={[styles.inputContainer, { backgroundColor:'#FFFFFF'  }]}>
                        <TextInput
                            style={styles.input}
                            placeholder={'Search Recording'}
                            placeholderTextColor="#868686"
                            keyboardType="default"
                            autoCapitalize="none"
                            autoCorrect={false}
                            textAlign={I18nManager.isRTL ? 'right' : 'left'}
                            value={searchTerm} // Bind the input value to the search term
                            onChangeText={setSearchTerm}  // Update searchTerm when the user types
                        />
                            <View style={styles.iconContainer}>
                                <FontAwesome name="search" size={22} color={'#868686'} />
                            </View>

                          
                        </View>
                    </View>
                </View>
               
               
               {/*------------------- IMPORTANT REMINDER ADD ----------------------  */}
                <View>
                      <TouchableOpacity
                       style={styles.addimportant}
                       onPress={() => navigation.navigate('importantreminder')}>
                     <Text style={styles.importantButtonText}>Important Reminder</Text>
                      </TouchableOpacity>
                </View>


                {loading ? (
                    <Text style={styles.loadingText}>Loading reminders...</Text>
                ) : (
                    <ScrollView contentContainerStyle={{ padding: scale(5) }}>
                        {reminders && reminders.length > 0 ? (
                            reminders.filter(item => item).map((item, index) => renderRecording(item, index))
                        ) : (
                            <SafeAreaView style={styles.main}>
                                <Image
                                    source={require('../../image/5209989.jpg')}
                                    style={styles.setbackgroundimg}
                                />
                                <Image
                                    source={require('../../image/dotted_lines_spiral_arrows_set.png')}
                                    style={styles.setdottedimagebackground}
                                />
                                <TouchableOpacity onPress={() => { }}>
                                    <Text
                                        style={{
                                            fontWeight: 'bold',
                                            fontSize: 18,
                                            color: '#FF5C00',
                                        }}
                                    >
                                        Tap the '+' icon to create your first reminder!
                                    </Text>
                                </TouchableOpacity>
                            </SafeAreaView>
                        )}
                    </ScrollView>
                    // <ScrollView
                    //     contentContainerStyle={{ paddingBottom: scale(30) }}
                    // // onScroll={handleScroll}
                    // // scrollEventThrottle={16}
                    // >
                    //     {reminders && reminders.length > 0 ? (
                    //         reminders.map((item, index) => renderRecording(item, index))
                    //     ) : (
                    //         <SafeAreaView style={styles.main}>
                    //             <Image
                    //                 source={require('../../image/5209989.jpg')}
                    //                 style={styles.setbackgroundimg}
                    //             />
                    //             <Image
                    //                 source={require('../../image/dotted_lines_spiral_arrows_set.png')}
                    //                 style={styles.setdottedimagebackground}
                    //             />
                    //             <TouchableOpacity onPress={() => { }}>
                    //                 <Text
                    //                     style={{
                    //                         fontWeight: 'bold',
                    //                         fontSize: 18,
                    //                         color: '#FF5C00',
                    //                     }}
                    //                 >
                    //                     Tap the '+' icon to create your first reminder!
                    //                 </Text>
                    //             </TouchableOpacity>
                    //         </SafeAreaView>
                    //     )}
                    // </ScrollView>
                )}
            </View>
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('AddReminder')}
            >
                <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    icon: {
        width: scale(50),
        height: scale(50),
    },
    listContent: {
        padding: scale(10),
        // flex:1
        // paddingBottom: scale(120)
    },
    recordingCard: {
        backgroundColor: "#EDF1F7",
        borderRadius: 10,
        padding: scale(15),
        marginVertical: scale(5),
    },
    recordingInfo: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        flex: 1
    },
    playButton: {
        flex: 0.1
    },
    title: {
        color: 'black',
        fontSize: 18,
        fontWeight: "bold",
    },
    date: {
        color: "#555",
        fontSize: 14,
        marginTop: scale(5)
    },
    moreButton: {
        marginLeft: 15,
        flex: 0.1,
    },
    actions: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 10,
    },
    actionButton: {
        padding: 10,
        borderRadius: 5,
    },
    pauseText: {
        color: "red",
        fontWeight: "bold",
    },
    editText: {
        color: "#FFA500",
        fontWeight: "bold",
    },
    deleteText: {
        color: "red",
        fontWeight: "bold",
    },
    addButton: {
        backgroundColor: "#FF5003",
        width: scale(60),
        height: scale(60),
        borderRadius: scale(30),
        position: "absolute",
        bottom: 50,
        right: 20,
        justifyContent: "center",
        alignItems: "center",
    },

    addimportant: {
        backgroundColor: "#FF5088",
        width: scale(200),
        height: scale(60),
        marginLeft:200,
        borderRadius:scale(10),
        alignSelf:'center',
        right: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    addButtonText: {
        color: "#FFF",
        borderColor: 'black',
        fontSize: 30,
        fontWeight: "bold",
    },
    importantButtonText: {
        color: "#FFF",
        borderColor: 'black',
        fontSize: 15,
        fontWeight: "bold",
    },
    // tooltip: {
    //     position: 'absolute',
    //     top: 40, // Adjust this value to match the positioning of the tooltip relative to the trigger element
    //     right: 10, // Adjust this for alignment
    //     backgroundColor: '#FFF',
    //     borderRadius: 5,
    //     shadowColor: '#000',
    //     shadowOffset: { width: 0, height: 2 },
    //     shadowOpacity: 0.1,
    //     shadowRadius: 4,
    //     elevation: 3, // For Android shadow
    // },
    // tooltipContainer: {
    //     height: scale(25), // Tooltip button height
    //     borderTopLeftRadius: 5,
    //     borderTopRightRadius: 5,
    //     alignItems: 'center',
    //     flexDirection: 'row',
    // },
    tooltipButton: {
        height: scale(25),
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
        alignItems: 'center',
        flexDirection: 'row'

    },
    tooltipIcon: {
        width: scale(20),
        height: scale(20),
        resizeMode: 'contain',
    },
    tooltipText: {
        color: 'grey',
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
        paddingLeft: scale(10),
    },
    tooltip: {
        position: 'absolute',
        width: scale(90),
        backgroundColor: '#FFFFFF',
        borderRadius: 5,
        top: scale(30),
        right: scale(30),
        borderWidth: 0.3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 1,
        // zIndex: 100,
    },
    tooltipContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 5,
        // borderWidth:1,
        overflow: 'hidden',
        padding: scale(5)
    },
    main: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    setbackgroundimg: {
        width: '98%',
        height: scale(200),

        resizeMode: 'contain'
    },
    setdottedimagebackground: {
        width: '50%',
        resizeMode: 'contain',
        height: scale(180),
        alignSelf: 'center',
        marginVertical: scale(30)
    },
    alingtext: {
        textAlign: 'center',
        fontSize: 15
    },
    recordingview: {
        width: '100%',
        height: 100,
        backgroundColor: '#FFFFFF'
    },
    recordimg: {
        width: scale(80),
        height: scale(80),
        alignSelf: 'center',
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
    color:'black',
    flex: 0.9,
    paddingHorizontal:scale(10),
    height: 40,
  },

})

// import React, { useEffect, useState } from 'react';
// import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import { fetchReminders } from '../path/to/database';

// export default function ReminderList({ navigation }) {
//   const [reminders, setReminders] = useState([]);

//   useEffect(() => {
//     fetchReminders((data) => setReminders(data));
//   }, []);

//   const renderReminder = ({ item }) => (
//     <TouchableOpacity style={styles.item} onPress={() => console.log(item)}>
//       <Text style={styles.label}>{item.label}</Text>
//       <Text style={styles.time}>{item.time}</Text>
//       <Text style={styles.details}>
//         {item.schedule} | Snooze: {item.snooze}
//       </Text>
//     </TouchableOpacity>
//   );

//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={reminders}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={renderReminder}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: '#FFFFFF',
//   },
//   item: {
//     padding: 16,
//     marginVertical: 8,
//     backgroundColor: '#F9F9F9',
//     borderRadius: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 4,
//   },
//   time: {
//     fontSize: 14,
//     color: '#555',
//     marginBottom: 4,
//   },
//   details: {
//     fontSize: 12,
//     color: '#777',
//   },
// });
