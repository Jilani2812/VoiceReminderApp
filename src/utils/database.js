import PushNotification from 'react-native-push-notification';
import SQLite from 'react-native-sqlite-storage';
// import moment from 'moment-timezone';

const daysOfWeek = {
  "Sunday": 0,
  "Monday": 1,
  "Tuesday": 2,
  "Wednesday": 3,
  "Thursday": 4,
  "Friday": 5,
  "Saturday": 6,
};

const moment = require('moment-timezone');

// Open the database
const db = SQLite.openDatabase(
  {
    name: 'ReminderDB',
    location: 'default',
  },
  () => {
    console.log('Database opened successfully');
  },
  (error) => {
    console.error('Error opening database:', error);
  }
);
export const initializeDatabase = () => {
  db.transaction((tx) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        time TEXT NOT NULL,
        label TEXT NOT NULL,
        repeatType TEXT NOT NULL,   -- 'daily', 'weekly', 'custom'
        repeatDays TEXT,            -- Stores selected days for 'weekly' (e.g., "Mon,Wed,Fri")
        customDates TEXT,           -- Stores dates for 'custom' (e.g., "2024-03-10,2024-03-15")
        snoozeInterval INTEGER,     -- Minutes between snoozes
        snoozeCount INTEGER,        -- Max snooze count
        audioPath TEXT,
        imagePath TEXT
      )`,
      [],
      () => console.log('Reminders table updated successfully'),
      (tx, error) => console.error('Error creating/updating reminders table:', error)
    );
  });
  
};


export const initializeAudioFilesTable = () => {
  db.transaction((tx) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS audio_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fileName TEXT NOT NULL,
        filePath TEXT NOT NULL,
        reminder_id INTEGER,        -- Link audio file to reminder
        FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE CASCADE
      )`,
      [],
      () => console.log('Audio files table updated successfully'),
      (tx, error) => console.error('Error creating audio files table:', error)
    );
  });
};

// export const updateReminder = (reminder, id) => {
//   const db = SQLite.openDatabase('ReminderDB');
//   db.transaction(tx => {
//       tx.executeSql(
//           'UPDATE reminders SET time = ?, label = ?, repeatType = ?, repeatDays = ?, customDates = ?, snoozeInterval = ?, snoozeCount = ?, audioPath = ?, imagePath = ? WHERE id = ?',
//           [reminder.time, reminder.label, reminder.repeatType, reminder.repeatDays, reminder.customDates, reminder.snoozeInterval, reminder.snoozeCount, reminder.audioPath, reminder.imagePath, id],
//           (tx, results) => {
//               console.log('Reminder updated successfully:', results);
//           },
//           (tx, error) => {
//               console.error('Error updating reminder:', error);
//           }
//       );
//   });
// };

export const updateReminder = (reminder, id, callback) => {
    const db = SQLite.openDatabase('ReminderDB');
    db.transaction(tx => {
        tx.executeSql(
            `UPDATE reminders 
             SET time = ?, label = ?, repeatType = ?, repeatDays = ?, customDates = ?, 
                 snoozeInterval = ?, snoozeCount = ?, audioPath = ?, imagePath = ? 
             WHERE id = ?`,
            [
                reminder.time, reminder.label, reminder.repeatType, 
                reminder.repeatDays, reminder.customDates, 
                reminder.snoozeInterval, reminder.snoozeCount, 
                reminder.audioPath, reminder.imagePath, id
            ],
            (tx, results) => {
                if (results.rowsAffected > 0) {
                    console.log("Reminder updated successfully.");
                    callback(true); // Return success
                } else {
                    console.error("Failed to update reminder.");
                    callback(false);
                }
            },
            (tx, error) => {
                console.error("Error updating reminder:", error);
                callback(false);
            }
        );
    });
};

const parseTime = (timeString) => {
  console.log('⏰ Parsing time string:', timeString);

  if (!timeString) {
    console.error("❌ No time string provided!");
    return null;
  }

  // Remove any unwanted characters (like zero-width spaces)
  const cleanedTime = timeString.replace(/[\u200B\u2009\u00A0]/g, '').trim().toLowerCase();

  // Match HH:MM AM/PM format
  const timeParts = cleanedTime.match(/(\d{1,2}):(\d{2})\s*(am|pm)/);

  if (!timeParts) {
    console.error('❌ Invalid time format:', cleanedTime);
    return null;
  }

  const [_, hours, minutes, period] = timeParts;
  let hours24 = parseInt(hours, 10);

  if (period === 'pm' && hours24 < 12) {
    hours24 += 12;
  } else if (period === 'am' && hours24 === 12) {
    hours24 = 0;
  }

  const now = new Date();
  now.setHours(hours24, parseInt(minutes, 10), 0, 0);

  console.log('✅ Parsed Time:', now.toISOString());
  return now;
};

const convertToAMPM = (utcTime) => {
  const localDate = new Date(utcTime);
  const options = { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Karachi' };
  return localDate.toLocaleString('en-US', options);
};
const convertToLocalTime = (date) => {
  return moment(date).tz("Asia/Karachi").toDate();
};
///////latesttttttttt
const scheduleWeeklyNotifications = (id, label, daysArray, audioPath, imagePath, timeString, snoozeInterval, snoozeCount,) => {
  console.log(`🔍 Scheduling Weekly Notifications for: ${label}, ID: ${id}, Days: ${daysArray}`);

  const reminderTime = parseTime(timeString);
  if (!reminderTime) {
    console.error('❌ Failed to parse reminder time.');
    return;
  }

  const now = new Date();
  const todayIndex = now.getDay(); // Get today’s day index (0 = Sunday, ..., 6 = Saturday)

  daysArray.forEach((day) => {
    const dayIndex = daysOfWeek[day]; // Assuming `daysOfWeek` is a mapping of day names to day indices

    let notificationDate = new Date(now); // Start with the current date and time
    notificationDate.setHours(reminderTime.getHours(), reminderTime.getMinutes(), 0, 0); // Set the hour and minute of the reminder time

    // If today matches the scheduled day and the notification time is in the future
    if (dayIndex === todayIndex && notificationDate > now) {
      console.log(`🔔 Today matches ${day}, scheduling notification for later today at ${notificationDate.toLocaleTimeString()}`);
      
      // Schedule the notification with local time conversion
      console.log(`📅 Scheduling Daily Reminder for ${label} at ${reminderTime.toISOString()}`);
    
      PushNotification.localNotificationSchedule({
        id: id.toString(),
        channelId: "channel-id",
        title: label,
        message: `It's time for your reminder: ${label}`,
        date: reminderTime,
        repeatType: 'day',
        allowWhileIdle: true,
        data: { reminderId: id, label, audioPath, imagePath, time: timeString, snoozeInterval, snoozeCount },
      });
    } else {
      // For future days, calculate the next occurrence of the scheduled day
      let daysUntilNext = (dayIndex - todayIndex + 7) % 7; // Calculate days until the next scheduled day
      if (daysUntilNext === 0) daysUntilNext = 7; // If it's the same day, schedule for next week

      // Add the necessary days to the current date to get the next scheduled day
      notificationDate.setDate(now.getDate() + daysUntilNext);

      console.log(`📅 Scheduled Notification for ${label} on ${day} at ${notificationDate.toLocaleTimeString()}`);
      
      // Schedule the notification for future days with local time conversion
      PushNotification.localNotificationSchedule({
        id: `${id}-${day}`,
        channelId: "channel-id",
        title: label,
        message: `It's time for your reminder: ${label}`,
        date: notificationDate,  // Use the calculated future date
        repeatType: 'week',  // Weekly repeat for future days
        allowWhileIdle: true,
        data: { reminderId: id, label, snoozeInterval, snoozeCount, audioPath, imagePath },
      });
    }
  });

  // Debugging: Check if notifications are scheduled
  PushNotification.getScheduledLocalNotifications((notifications) => {
    console.log("📌 All Scheduled Weekly Notifications:", notifications);
  });
};


const getNextDayOfWeek = (day, reminderTime, timezone) => {
  const now = moment().tz(timezone);
  const todayIndex = now.day();
  const targetIndex = daysOfWeek[day];

  let nextDate = moment().tz(timezone);
  nextDate.hour(reminderTime.getHours()).minute(reminderTime.getMinutes()).second(0).millisecond(0);

  if (targetIndex === todayIndex && nextDate.isAfter(now)) {
    return nextDate.toDate();
  }

  let daysUntilNext = (targetIndex - todayIndex + 7) % 7 || 7;
  nextDate.add(daysUntilNext, 'days');

  console.log(`📅 Next Date for ${day} (Local):`, nextDate.format());
  return nextDate.toDate();
};
const scheduleCustomDateNotifications = (id, label, dateArray, audioPath, imagePath, timeString, snoozeInterval, snoozeCount) => {
  console.log(`🔵 Scheduling Custom Date Notifications for: ${label}, Time: ${timeString}, Dates:`, dateArray);

  if (!Array.isArray(dateArray)) {
    try {
      dateArray = JSON.parse(dateArray);  // Try parsing if it's a stringified array
    } catch (e) {
      console.error("❌ Invalid dateArray format:", dateArray);
      return;
    }
  }

  if (!Array.isArray(dateArray) || dateArray.length === 0) {
    console.error("❌ dateArray is empty or not an array:", dateArray);
    return;
  }

  const reminderTime = parseTime(timeString);
  if (!reminderTime) {
    console.error("❌ Invalid time format:", timeString);
    return;
  }

  const today = new Date().toISOString().split('T')[0];  

  dateArray.forEach((dateString) => {
    let customDate = new Date(dateString);
    customDate.setHours(reminderTime.getHours());
    customDate.setMinutes(reminderTime.getMinutes());
    customDate.setSeconds(0);
    customDate.setMilliseconds(0);

    const customDateString = customDate.toISOString().split('T')[0];  
    
    if (customDateString === today) {
      console.log(`🔔 Scheduling notification for today at ${customDate.toLocaleTimeString()}`);
      PushNotification.localNotificationSchedule({
        id: id.toString(),
        channelId: "channel-id",
        title: label,
        message: `It's time for your reminder: ${label}`,
        date: customDate,
        allowWhileIdle: true,
        data: { reminderId: id, label, audioPath, imagePath, time: timeString, snoozeInterval, snoozeCount },
      });
    } else {
      console.log(`📅 Scheduled Notification for ${label} on ${dateString} (Local Time): ${customDate.toISOString()}`);
      PushNotification.localNotificationSchedule({
        id: `${id}-${dateString}`,
        channelId: "channel-id",
        title: label,
        message: `It's time for your reminder: ${label}`,
        date: customDate,
        allowWhileIdle: true,
        data: { reminderId: id, label, audioPath, imagePath, time: timeString, snoozeInterval, snoozeCount },
      });
    }
  });
};

export const saveReminder = (reminder, callback) => {
  const { time, label, repeatType, repeatDays, customDates, snoozeInterval, snoozeCount, audioPath, imagePath } = reminder;
  console.log('Reminder:', reminder);

  try {
    const reminderTime = parseTime(time); // Parse the provided time string into a moment object
    if (!reminderTime) {
      if (callback) callback(false);
      return;
    }

    console.log('Reminder Time:', reminderTime);

    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO reminders (time, label, repeatType, repeatDays, customDates, snoozeInterval, snoozeCount, audioPath, imagePath) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [time, label, repeatType, repeatDays, customDates, snoozeInterval, snoozeCount, audioPath, imagePath],
        (_, result) => {
          const newReminderId = result.insertId;
          console.log('Reminder saved successfully with ID:', newReminderId);

          try {
            // Schedule daily reminder using local time
            if (repeatType === 'daily') {
              console.log('daily', newReminderId, label, audioPath, imagePath, time, snoozeInterval, snoozeCount )
              PushNotification.localNotificationSchedule({
                id: newReminderId.toString(),
                channelId: "channel-id",
                title: label,
                message: `It's time for your reminder: ${label}`,
                date: reminderTime, // ✅ Correct - Use `Date` object directly
                // Use the local time directly
                repeatType: 'day',
                allowWhileIdle: true,
                data: { reminderId: newReminderId, label, audioPath, imagePath, time, snoozeInterval, snoozeCount },
              });
            } 
            else if (repeatType === 'weekly' && repeatDays) {
              scheduleWeeklyNotifications(newReminderId, label, repeatDays.split(','),  audioPath, imagePath, time, snoozeInterval, snoozeCount);
            } else if (repeatType === 'custom' && customDates) {
              const parsedCustomDates = Array.isArray(customDates)
                ? customDates
                : customDates.split(',');
              scheduleCustomDateNotifications(newReminderId,label,parsedCustomDates, audioPath, imagePath, time, snoozeInterval, snoozeCount);
            }

            console.log("Scheduled Reminder Details:", {
              id: newReminderId.toString(),
              title: label,
              message: `It's time for your reminder: ${label}`,
              date: reminderTime,
            });

            if (callback) callback(true, newReminderId);
          } catch (e) {
            console.error('Error scheduling notification:', e);
            if (callback) callback(false);
          }
        },
        (tx, error) => {
          console.error('Error saving reminder to database:', error);
          if (callback) callback(false);
        }
      );
    });
  } catch (e) {
    console.error('Error in saveReminder function:', e);
    if (callback) callback(false);
  }
};

export const saveaudio = (reminder, callback) => {
  const { time, label, repeatType, repeatDays, customDates, snoozeInterval, snoozeCount, audioPath, imagePath } = reminder;
  console.log('Reminder:', reminder);

  try {
    const reminderTime = parseTime(time); // Parse the provided time string into a moment object
    if (!reminderTime) {
      if (callback) callback(false);
      return;
    }

    console.log('Reminder Time:', reminderTime);

    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO important ( label, audioPath, ) VALUES (?, ?, )',
        [ label, audioPath,],
        (_, result) => {
          const newReminderId = result.insertId;
          console.log('Reminder saved successfully with ID:', newReminderId);

          try {
            // Schedule daily reminder using local time
            if (repeatType === 'daily') {
              console.log('daily', newReminderId, label, audioPath, imagePath, time, snoozeInterval, snoozeCount )
              PushNotification.localNotificationSchedule({
                id: newReminderId.toString(),
                channelId: "channel-id",
                title: label,
                message: `It's time for your reminder: ${label}`,
                date: reminderTime, // ✅ Correct - Use `Date` object directly
                // Use the local time directly
                repeatType: 'day',
                allowWhileIdle: true,
                data: { reminderId: newReminderId, label, audioPath, imagePath, time, snoozeInterval, snoozeCount },
              });
            } 
            else if (repeatType === 'weekly' && repeatDays) {
              scheduleWeeklyNotifications(newReminderId, label, repeatDays.split(','),  audioPath, imagePath, time, snoozeInterval, snoozeCount);
            } else if (repeatType === 'custom' && customDates) {
              const parsedCustomDates = Array.isArray(customDates)
                ? customDates
                : customDates.split(',');
              scheduleCustomDateNotifications(newReminderId,label,parsedCustomDates, audioPath, imagePath, time, snoozeInterval, snoozeCount);
            }

            console.log("Scheduled Reminder Details:", {
              id: newReminderId.toString(),
              title: label,
              message: `It's time for your reminder: ${label}`,
              date: reminderTime,
            });

            if (callback) callback(true, newReminderId);
          } catch (e) {
            console.error('Error scheduling notification:', e);
            if (callback) callback(false);
          }
        },
        (tx, error) => {
          console.error('Error saving reminder to database:', error);
          if (callback) callback(false);
        }
      );
    });
  } catch (e) {
    console.error('Error in saveReminder function:', e);
    if (callback) callback(false);
  }
};

// ---------------------------------------------




export const fetchReminders = (searchTerm, callback) => {
  const searchParam = searchTerm ? `%${searchTerm}%` : null;

  // Query depending on whether search term exists
  const query = searchTerm
    ? 'SELECT * FROM reminders WHERE label LIKE ?'
    : 'SELECT * FROM reminders';

  // Debugging logs to check parameters
  console.log('Executing query:', query);
  console.log('Search Term:', searchTerm);
  console.log('Formatted Search Param:', searchParam);

  // Open the database transaction
  db.transaction((tx) => {
    tx.executeSql(
      query,
      searchParam ? [searchParam] : [], // Pass parameter if search term exists, else pass empty array
      (_, result) => {
        console.log('Query result:', result);
        if (callback) callback(result.rows.raw());
      },
      (tx, error) => {
        // console.error('SQL Error:', error);
        // console.error('Transaction Error:', tx);
      }
    );
  });
};

// Delete a reminder
export const deleteReminder = (id, callback) => {
  console.log('deleteReminder ID:', id);
  db.transaction((tx) => {
    tx.executeSql(
      'DELETE FROM reminders WHERE id = ?',
      [id],
      (_, result) => {
        console.log('Reminder deleted successfully:', result);
        if (callback) callback(true);
      },
      (tx, error) => {
        console.error('Error deleting reminder:', error);
        if (callback) callback(false);
      }
    );
  });
};
export const fetchAudioFiles = (callback) => {
  db.transaction((tx) => {
    tx.executeSql(
      'SELECT * FROM audio_files',
      [],
      (_, result) => {
        if (callback) callback(result.rows.raw());
        console.log('result', result)
      },
      (tx, error) => {
        console.error('Error fetching reminders:', error);
      }
    );
  });
};

export const saveAudioPathToSQLite = async (fileName, filePath, reminderId) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'INSERT INTO audio_files (fileName, filePath, reminder_id) VALUES (?, ?, ?)',
        [fileName, filePath, reminderId],
        (_, result) => {
          console.log(`Audio file (${fileName}) linked to reminder ID:`, reminderId);
          resolve(filePath);
        },
        (tx, error) => {
          console.error('Error saving audio path:', error);
          reject(error);
        }
      );
    });
  });
};

// database.js

export const updateAudioPath = (newReminderId, audioFilePath, callback) => {
  try {
    // Open a transaction to update the reminder's audio path
    db.transaction((tx) => {
      tx.executeSql(
        'UPDATE reminders SET audioPath = ? WHERE id = ?',
        [audioFilePath, newReminderId],
        () => {
          console.log("Audio path updated in reminders table");
          // Execute callback with success status
          if (callback) callback(true);
        },
        (tx, error) => {
          console.error("Error updating audio path:", error);
          // Execute callback with failure status
          if (callback) callback(false);
        }
      );
    });
  } catch (error) {
    console.error('Error in updateAudioPath:', error);
    if (callback) callback(false);
  }
};


