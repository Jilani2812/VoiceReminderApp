import React from 'react';
import { View, StyleSheet } from 'react-native';
import RNDateTimePicker from '@react-native-community/datetimepicker';

export default function DatePicker({ date, onDateChange }) {
    return (
        <View style={styles.pickerContainer}>
            <RNDateTimePicker
                mode="date"
                value={date}
                display="spinner"
                onChange={onDateChange}
                textColor="black"
                style={styles.dateTimePicker}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    pickerContainer: {
        borderRadius: 8,
        padding: 5,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',  // To maintain contained space
    },
    dateTimePicker: {
        width: '100%',
        height: '100%',  // Full height of pickerContainer
    },
});
