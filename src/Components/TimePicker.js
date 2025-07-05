import React from 'react';
import { View, StyleSheet } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';
// import DatePicker from 'react-native-date-picker'

export default function TimePicker({ time, onTimeChange }) {
    return (
        <View style={styles.pickerContainer}>
            {/* <DatePicker
                mode="time"             // Set the mode to 'time'
                date={time}             // The current selected time as a Date object
                onDateChange={onTimeChange} // Callback triggered on time change
                androidVariant="iosClone"  // Optional for consistent behavior on Android
                is24hourSource="locale"   // Respect user's device settings (12/24-hour format)
            /> */}
            <RNDateTimePicker
                mode="time"
                value={time}
                display="spinner"
                onChange={onTimeChange}
                textColor="#FF5C00"
                themeVariant="light"
                // style={styles.dateTimePicker}
                style={{ width: '100%', height: 150 }} // Ensure enough height
            />
        </View>
    );
}

const styles = StyleSheet.create({
    pickerContainer: {
        borderRadius: 8,
        padding: 5,
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        overflow: 'hidden',  // To maintain contained space
    },
    dateTimePicker: {
        // flex:1,
        width: '100%',
        // backgroundColor:'yellow',
        height: 150,   // Full height of pickerContainer
    },
});
