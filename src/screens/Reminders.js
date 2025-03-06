import React, { useState, useEffect } from 'react';
import { Switch,View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Button, Alert,KeyboardAvoidingView,Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Icon } from 'react-native-elements';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DropDownPicker from 'react-native-dropdown-picker';
import { CheckBox } from 'react-native-elements';

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
  const [isRecurrenceEnabled, setIsRecurrenceEnabled] = useState(false);
  const [recurrence, setRecurrence] = useState('none');  // options: none, daily, weekly, monthly
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentReminder, setCurrentReminder] = useState({
    id: null,
    title: '',
    body: '',
    date: new Date(),
    notificationId: null,
    recurrence:'none'
  });

  const [showRecurrenceOptions, setShowRecurrenceOptions] = useState(false); // New state for recurrence visibility

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

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const actionId = response.actionIdentifier;
      const reminderId = response.notification.request.content.data?.reminderId;
  
      if (!reminderId) return;
  
      if (actionId === 'mark_done') {
        // User tapped "Mark as Done" (Android Only)
        handleDeleteReminder(reminderId);
      } else if (actionId === 'edit') {
        // User tapped "Edit" (Android Only)
        const reminderToEdit = reminders.find(r => r.id === reminderId);
        if (reminderToEdit) {
          setCurrentReminder(reminderToEdit);
          setModalVisible(true);
        }
      } else {
        // **iOS or general notification tap**: Open reminder
        const reminderTapped = reminders.find(r => r.id === reminderId);
        if (reminderTapped) {
          setCurrentReminder(reminderTapped);
          
        }
      }
    });
  
    return () => subscription.remove();
  }, [reminders]);
  

  const loadReminders = async () => {
    try {
      const savedReminders = await AsyncStorage.getItem('@reminders');
      if (savedReminders) {
        const parsedReminders = JSON.parse(savedReminders);
        const updatedReminders = parsedReminders.map(reminder => ({
          ...reminder,
          date: new Date(reminder.date), // Ensure it's a valid Date object
        }));
        setReminders(updatedReminders);
        updatedReminders.forEach(scheduleExistingNotification);
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
          data: { reminderId: reminder.id },  // Include reminder ID for tracking
          sound: 'custom_sound.mp3',
          android: {
            icon: 'ic_notification',
            channelId: 'reminders-channel',
            actions: [
              { identifier: 'mark_done', buttonTitle: 'Mark as Done', options: { opensAppToForeground: true } },
              { identifier: 'edit', buttonTitle: 'Edit', options: { opensAppToForeground: true } }
            ]
          }
        },
        trigger: scheduleRecurrence(reminder.date, reminder.recurrence),
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
      recurrence: 'none',
    });
    setModalVisible(true);
  };

  const generateUniqueId = () => {
    return Math.random().toString(36).substr(2, 9); // Short unique ID
  };
  

  const handleSaveReminder = async () => {
    try {
      if (!currentReminder.title || !currentReminder.date) {
        throw new Error('Title and date are required');
      }
  
      // Create a new notification or update existing one
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: currentReminder.title,
        body: currentReminder.body,
        data: { reminderId: currentReminder.id },  // Include ID for handling tap
        sound: 'custom_sound.mp3',
        android: {
          icon: 'bell',
          channelId: 'reminders-channel',
          actions: [
            { identifier: 'mark_done', buttonTitle: 'Mark as Done', options: { opensAppToForeground: true } },
            { identifier: 'edit', buttonTitle: 'Edit', options: { opensAppToForeground: true } }
          ]
        }
      },
      trigger: currentReminder.date,
    });

    const newReminder = {
      ...currentReminder,
      id: currentReminder.id || generateUniqueId(),
      notificationId,
      recurrence: recurrence,
    };

    // If it's an existing reminder, update it; otherwise, add a new one
    const updatedReminders = currentReminder.id
      ? reminders.map((r) => (r.id === currentReminder.id ? newReminder : r))  // Update the existing reminder
      : [...reminders, newReminder];  // Add new reminder if none exists
  
      // const newReminder = {
      //   ...currentReminder,
      //   id: currentReminder.id || Date.now().toString(),
      //   notificationId,
      //   recurrence: recurrence,
      // };
  
      // const updatedReminders = currentReminder.id
      //   ? reminders.map((r) => (r.id === currentReminder.id ? newReminder : r))
      //   : [...reminders, newReminder];
  
      setReminders(updatedReminders);
      saveReminders(updatedReminders);
      setModalVisible(false);
    

    Alert.alert(
      'Success',
      currentReminder.id ? 'Reminder updated successfully!' : 'Reminder added successfully!',
      [{ text: 'OK' }]
    );
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

  const handleCheckBoxPress = (item) => {
    const updatedReminder = { ...item, completed: !item.completed };
  
    if (updatedReminder.completed) {
      if (updatedReminder.notificationId) {
        Notifications.cancelScheduledNotificationAsync(updatedReminder.notificationId);
      }


      // Show success alert when marked as completed
      Alert.alert('Success', 'Reminder marked as completed!');
    } else {
      scheduleExistingNotification(updatedReminder);
    }
  
    const updatedReminders = reminders.map((r) =>
      r.id === item.id ? updatedReminder : r
    );
    setReminders(updatedReminders);
    saveReminders(updatedReminders);
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
            <View style={styles.checkboxContainer}>
            <CheckBox
  checked={item.completed}
  onPress={() => handleCheckBoxPress(item)}  // Pass 'item' here
  containerStyle={styles.checkbox}
  checkedColor="#008000"
/>

        </View>
              <Text style={styles.reminderTitle}>{item.title}</Text>
              
              <Text>{new Date(item.date).toLocaleString()}</Text>
              {item.body && <Text>{item.body}</Text>}
              <Text style={styles.recurrenceText}>
  Recurrence: {item.recurrence ? item.recurrence.charAt(0).toUpperCase() + item.recurrence.slice(1) : 'None'}
</Text>
            </View>
            <TouchableOpacity onPress={() => { 
        setCurrentReminder(item);  // Set the reminder to be edited
        setModalVisible(true); // Show the modal
      }}>
        <Icon name="edit" type="material" color="#FF9800" />
      </TouchableOpacity>
            
            
<TouchableOpacity onPress={() =>  Alert.alert(
    'Delete Reminder',
    `Are you sure you want to delete the reminder: ${item?.title}?`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          // Delete the reminder notification
          if (item?.notificationId) {
            await Notifications.cancelScheduledNotificationAsync(item.notificationId);
          }

          // Remove from the reminders array
          const updatedReminders = reminders.filter((r) => r.id !== item.id);
          setReminders(updatedReminders);
          saveReminders(updatedReminders);

          // Show success alert
          Alert.alert('Success', 'Reminder deleted successfully!', [{ text: 'OK' }]);
        },
      },
    ],
    { cancelable: true }
  )}>
              <Icon name="delete" type="material" color="#F44336" />
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide">
      <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    style={{ flex: 1 }}
  >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{currentReminder.id ? 'Edit Reminder' : 'Add Reminder'}</Text>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Title *"
            value={currentReminder.title}
            onChangeText={(text) => setCurrentReminder({ ...currentReminder, title: text })}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Description"
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

          {/* Toggle Button to Show/Hide Recurrence Options */}
<Text style={styles.label}>Enable Recurrence</Text>
<TouchableOpacity
  style={[styles.toggleButton, isRecurrenceEnabled && styles.toggleButtonActive]}  // Toggle button styling
  onPress={() => setIsRecurrenceEnabled((prev) => !prev)}
>
 <Switch
 value={isRecurrenceEnabled}
 onValueChange={(newValue) => setIsRecurrenceEnabled(newValue)}
 trackColor={{ false: '#767577', true: '#81b0ff' }}  // Optional: Change the track color
 thumbColor={isRecurrenceEnabled ? '#2196F3' : '#f4f3f4'}  // Optional: Customize thumb color
/>
</TouchableOpacity>

            {isRecurrenceEnabled && (
              <>
                <Text style={styles.label}>Recurrence</Text>
                <DropDownPicker
      open={showRecurrenceOptions}
      value={recurrence}
      items={[
        { label: 'None', value: 'none' },
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
      ]}
      setOpen={setShowRecurrenceOptions}
      setValue={setRecurrence}
      containerStyle={styles.dropdownContainer}
      style={styles.dropdown}
      dropDownStyle={styles.dropdownList}
      onChangeValue={(itemValue) => setRecurrence(itemValue)}
    />
  </>
             
            )}

          <View style={styles.modalButtons}>
            <Button title="Cancel" onPress={() => setModalVisible(false)} color="#999" />
            <Button title="Save" onPress={handleSaveReminder} color="#2196F3" />
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// Add styles from previous screens (similar structure)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#E3F2FD', // Light blue background for a fresh look
  },
  checkbox: {
    padding: 0,
    margin: 0,
    marginRight: 10,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  markAsDoneText: {
    marginLeft: 10,  // Adds space between checkbox and text
    fontSize: 16,
    color: '#333',
  },
  checkbox: {
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
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
  ToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#FAFAFA', // Light gray background for toggle button
    borderColor: '#42A5F5', // Blue border for toggle button
    borderWidth: 1,
    marginBottom: 15,
  },
  
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#FFFFFF', // White background for reminder items
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D47A1', // Dark blue for reminder titles
    marginBottom: 5,
  },
  modalContent: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF', // White background for modal
    borderRadius: 10, // Rounded corners for modal
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1976D2', // Dark blue for modal title
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444', // Dark gray for labels
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: '#42A5F5', // Blue border for inputs
    borderWidth: 1,
    marginBottom: 15,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#FAFAFA', // Light gray background for inputs
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  reminderActionsRow: {
    flexDirection: 'row',
    gap: 15,
    marginLeft: 10,
  },
  
  recurrenceOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  option: {
    padding: 10,
    fontSize: 14,
    color: '#333',
  },
  selectedOption: {
    padding: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  recurrenceText: {
    marginTop: 5,
    fontSize: 12,
    color: '#888',
  },
  dropdown: {
    backgroundColor: '#FAFAFA', // Light gray background for dropdown
    borderColor: '#42A5F5', // Blue border for dropdown
    borderWidth: 1,
    borderRadius: 5,
  },
  dropdownList: {
    backgroundColor: '#FAFAFA', // Light gray background for dropdown list
    borderColor: '#42A5F5', // Blue border for dropdown list
    borderWidth: 1,
    borderRadius: 5,
  },
});

export default Reminders;