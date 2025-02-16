import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Button, Alert } from 'react-native';
import { Icon } from 'react-native-elements';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentReminder, setCurrentReminder] = useState({
    id: null,
    title: '',
    body: '',
    date: new Date(),
    notificationId: null,
  });

  // Request notification permissions
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please enable notifications for reminders');
      }

      // Set up notification channels for Android
      const channelId = 'reminders-channel';
      await Notifications.setNotificationChannelAsync(channelId, {
        name: 'Reminders Channel',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      loadReminders();
    })();
  }, []);

  const loadReminders = async () => {
    try {
      const savedReminders = await AsyncStorage.getItem('@reminders');
      if (savedReminders) {
        const parsedReminders = JSON.parse(savedReminders);
        setReminders(parsedReminders);
        // Reschedule notifications on load
        parsedReminders.forEach(scheduleExistingNotification);
      }
    } catch (e) {
      console.error('Failed to load reminders', e);
    }
  };

  const saveReminders = async (remindersToSave) => {
    try {
      await AsyncStorage.setItem('@reminders', JSON.stringify(remindersToSave));
    } catch (e) {
      console.error('Failed to save reminders', e);
    }
  };

  const scheduleExistingNotification = async (reminder) => {
    if (new Date(reminder.date) > new Date()) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
          sound: 'default',  // Default sound for notifications
          android: {
            icon: 'ic_notification',  // Set custom icon for Android (add it in your resources)
          },
        },
        trigger: reminder.date,
      });
      return notificationId;
    }
    return null;
  };

  const handleAddReminder = () => {
    setCurrentReminder({
      id: null,
      title: '',
      body: '',
      date: new Date(),
      notificationId: null,
    });
    setModalVisible(true);
  };

  const handleSaveReminder = async () => {
    try {
      if (!currentReminder.title || !currentReminder.date) {
        throw new Error('Title and date are required');
      }

      // Schedule notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: currentReminder.title,
          body: currentReminder.body,
          sound: 'default',  // Default sound for notifications
          android: {
            icon: 'ic_notification',  // Set custom icon for Android (add it in your resources)
          },
        },
        trigger: currentReminder.date,
      });

      const newReminder = {
        ...currentReminder,
        id: currentReminder.id || Date.now().toString(),
        notificationId,
      };

      const updatedReminders = currentReminder.id
        ? reminders.map((r) => (r.id === currentReminder.id ? newReminder : r))
        : [...reminders, newReminder];

      setReminders(updatedReminders);
      saveReminders(updatedReminders);
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    const reminderToDelete = reminders.find((r) => r.id === reminderId);
    if (reminderToDelete?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(reminderToDelete.notificationId);
    }

    const updatedReminders = reminders.filter((r) => r.id !== reminderId);
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setCurrentReminder({ ...currentReminder, date: selectedDate });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={handleAddReminder}>
        <Icon name="add" size={30} color="white" />
      </TouchableOpacity>

      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.reminderItem}>
            <View style={styles.reminderInfo}>
              <Text style={styles.reminderTitle}>{item.title}</Text>
              <Text>{new Date(item.date).toLocaleString()}</Text>
              {item.body && <Text>{item.body}</Text>}
            </View>
            <TouchableOpacity onPress={() => handleDeleteReminder(item.id)}>
              <Icon name="delete" type="material" color="#F44336" />
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{currentReminder.id ? 'Edit Reminder' : 'Add Reminder'}</Text>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter reminder title *"
            value={currentReminder.title}
            onChangeText={(text) => setCurrentReminder({ ...currentReminder, title: text })}
          />
          
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Enter reminder description (Optional)"
            multiline
            value={currentReminder.body}
            onChangeText={(text) => setCurrentReminder({ ...currentReminder, body: text })}
          />
          
          <Text style={styles.label}>Select Date & Time</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
            <Text>{currentReminder.date.toLocaleString()}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={currentReminder.date}
              mode="datetime"
              display="default"
              onChange={handleDateChange}
            />
          )}

          <View style={styles.modalButtons}>
            <Button title="Cancel" onPress={() => setModalVisible(false)} color="#999" />
            <Button title="Save" onPress={handleSaveReminder} color="#2196F3" />
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Add styles from previous screens (similar structure)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#2196F3',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  modalContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 15,
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
});

export default Reminders;
