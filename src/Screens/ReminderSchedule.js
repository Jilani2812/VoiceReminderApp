import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { scale } from './Scale';  // Assuming you have a scaling utility
import RNCalendarEvents from 'react-native-calendar-events';
import Header from '../Components/Header';

export default function RepeatScreen({ navigation, route }) {
    const [selectedDays, setSelectedDays] = useState([]);
    const [selectedRepeatOption, setSelectedRepeatOption] = useState('All Days');
    const [showPicker, setShowPicker] = useState(false);
    const [date, setDate] = useState(new Date());
    useEffect(() => {
        if (route.params?.repeatType) {
            console.log('Editing Repeat Type:', route.params.repeatType);
    
            setSelectedRepeatOption(
                route.params.repeatType === 'daily' ? 'All Days' :
                route.params.repeatType === 'weekly' ? 'Specific Days' :
                'Custom'
            );
        }
    
        if (route.params?.repeatDays) {
            console.log('Editing Repeat Days:', route.params.repeatDays);
            setSelectedDays(route.params.repeatDays.split(',')); // Convert string to array
        }
    
        if (route.params?.customDates) {
            console.log('Editing Custom Date:', route.params.customDates);
    
            // Parse date properly
            const parsedDate = new Date(route.params.customDates);
            if (!isNaN(parsedDate.getTime())) {
                setDate(parsedDate);
            } else {
                console.warn("Invalid custom date format:", route.params.customDates);
            }
        }
    }, [route.params]);
    
    useEffect(() => {
        RNCalendarEvents.requestPermissions().then(status => {
            if (status !== 'authorized') {
                console.error('Calendar permissions not granted');
            }
        }).catch(error => {
            console.error('Error requesting calendar permissions:', error);
        });
    }, []);

    const toggleDaySelection = (day) => {
        setSelectedDays(prevDays =>
            prevDays.includes(day) ? prevDays.filter(d => d !== day) : [...prevDays, day]
        );
    };

    const saveEventToCalendar = () => {
        let repeatType = '';
        let repeatDaysString = null;
        let customDateString = null;

        if (selectedRepeatOption === 'All Days') {
            repeatType = 'daily';
        } else if (selectedRepeatOption === 'Specific Days') {
            repeatType = 'weekly';
            repeatDaysString = selectedDays.join(',');
        } else if (selectedRepeatOption === 'Custom') {
            repeatType = 'custom';
            customDateString = date.toISOString(); // Store full date-time
        }

        navigation.navigate('AddReminder', {
            repeatType,
            repeatDays: repeatDaysString,
            customDates: customDateString,  // Pass full datetime string
        });
    };


    const repeatOptions = ['All Days', 'Specific Days', 'Custom'];
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowPicker(false);
        setDate(currentDate);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            {/* <Text style={styles.headerText}>Repeat</Text> */}
            <Header
                shadow
                goBack
                // search
                rightArrow
                titleHeader={'Reminder Schedule'}
                navigation={navigation}
            />
            <View style={{ marginTop:scale(10), paddingHorizontal: scale(15) }}>
            {/* Repeat Options */}
            {repeatOptions.map(option => (
                <TouchableOpacity
                    key={option}
                    style={[
                        styles.optionButton,
                        selectedRepeatOption === option && styles.selectedOption
                    ]}
                    onPress={() => setSelectedRepeatOption(option)}
                >
                    <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
            ))}

            {/* Weekly Selection Section */}
            {selectedRepeatOption === 'Specific Days' && (
                <View style={styles.weeklyContainer}>
                    <Text style={styles.weeklyText}>Select Days</Text>
                    <FlatList
                        data={daysOfWeek}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.dayContainer}
                                onPress={() => toggleDaySelection(item)}
                            >
                                <Text style={styles.dayText}>{item}</Text>
                                {selectedDays.includes(item) && <Text style={styles.checkmark}>✓</Text>}
                            </TouchableOpacity>
                        )}
                        keyExtractor={(item) => item}
                    />
                </View>
            )}

            {/* Custom Date Picker Section */}
            {selectedRepeatOption === 'Custom' && (
                <View style={styles.weeklyContainer}>
                    <Text style={{ ...styles.weeklyText, alignSelf: 'center' }}>Custom</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                            <Text style={styles.label}>Date: </Text>
                            <Text style={styles.timeDisplay}>
                                {date.toLocaleDateString()}  {/* Display selected date */}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowPicker(true)}>
                            <Image source={require('../../image/DatePickerIcon.png')} style={{ height: scale(30), width: scale(30), resizeMode: 'contain' }} />
                        </TouchableOpacity>
                    </View>
                    {showPicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                        />
                    )}
                </View>
            )}

            {/* Cancel and OK Buttons */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={saveEventToCalendar}
                    style={styles.okButton}>
                    <Text style={styles.okButtonText}>OK</Text>
                </TouchableOpacity>
            </View>
        </View>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        // padding: scale(16),
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: 'orange',
        padding: scale(12),
        textAlign: 'center',
        borderTopLeftRadius: scale(8),
        borderTopRightRadius: scale(8),
    },
    optionButton: {
        backgroundColor: '#f0f0f5',
        padding: scale(12),
        marginTop: scale(8),
        borderRadius: scale(8),
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    selectedOption: {
        backgroundColor: '#e0e0eb',
    },
    optionText: {
        fontSize: 16,
        color: 'black',
    },
    weeklyContainer: {
        marginTop: scale(16),
        padding: scale(12),
        borderRadius: scale(8),
        backgroundColor: '#f5f5fa',
    },
    weeklyText: {
        fontSize: 16,
        color: 'black',
        fontWeight: 'bold',
        marginBottom: scale(10),
    },
    dayContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: scale(8),
    },
    dayText: {
        fontSize: 16,
        color: 'black',
    },
    checkmark: {
        color: 'orange',
        fontSize: 18,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: scale(20),
    },
    cancelButton: {
        backgroundColor: 'lightgrey',
        paddingVertical: scale(10),
        paddingHorizontal: scale(30),
        borderRadius: scale(8),
    },
    okButton: {
        backgroundColor: '#FF5C00',
        paddingVertical: scale(10),
        paddingHorizontal: scale(30),
        borderRadius: scale(8),
    },
    cancelButtonText: {
        color: 'black',
        fontSize: 16,
    },
    label: {
        color:'black',
        fontSize:16,
        fontWeight:'bold'
    },
    timeDisplay:{
        color:'black',
        fontSize:16

    },
    okButtonText: {
        color: 'white',
        fontSize: 16,
    },
});