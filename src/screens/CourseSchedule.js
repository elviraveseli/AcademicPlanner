import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView,Platform,View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Button, ScrollView, Alert } from 'react-native';
import { Icon } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';

const CourseSchedule = () => {
  const navigation = useNavigation();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [currentCourse, setCurrentCourse] = useState({
    id: null,
    name: '',
    startTime: '',
    endTime: '',
    startDate: '',
    endDate: '',
    days: '',
    location: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);
  useEffect(() => {
    setFilteredCourses(courses); // Initialize filteredCourses with all courses
  }, [courses]);

  // Centralized error handler for form validation
  const handleValidationErrors = () => {
    let newErrors = {};

    if (!currentCourse.name.trim()) newErrors.name = 'Course name is required.';
    if (!/^\d{2}:\d{2}$/.test(currentCourse.startTime.trim()))
      newErrors.startTime = 'Start time must be in HH:MM format (24-hour).';
    if (!/^\d{2}:\d{2}$/.test(currentCourse.endTime.trim()))
      newErrors.endTime = 'End time must be in HH:MM format (24-hour).';
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(currentCourse.startDate.trim()))
      newErrors.startDate = 'Start date must be in DD.MM.YYYY format.';
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(currentCourse.endDate.trim()))
      newErrors.endDate = 'End date must be in DD.MM.YYYY format.';

    // Validate that end time is greater than start time
  const [startHour, startMinute] = currentCourse.startTime.split(':').map(Number);
  const [endHour, endMinute] = currentCourse.endTime.split(':').map(Number);

  if (endHour < startHour || (endHour === startHour && endMinute <= startMinute)) {
    newErrors.endTime = 'End time must be greater than start time.';
  }

    const startDateObj = new Date(currentCourse.startDate.split('.').reverse().join('-'));
  const endDateObj = new Date(currentCourse.endDate.split('.').reverse().join('-'));

  if (endDateObj <= startDateObj) {
    newErrors.endDate = 'End date must be greater than start date.';
  }
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const daysArray = currentCourse.days.split(',').map((day) => day.trim());
    const invalidDays = daysArray.filter((day) => !validDays.includes(day));
    if (invalidDays.length > 0) newErrors.days = 'Days must be from Monday to Friday only.';

    if (!currentCourse.location.trim()) newErrors.location = 'Location is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Load courses from AsyncStorage
    const loadCourses = async () => {
      try {
        const savedCourses = await AsyncStorage.getItem('@courses');
        if (savedCourses) setCourses(JSON.parse(savedCourses));
      } catch (e) {
        showError('Failed to load courses. Please try again.');
      }
    };
   

    const saveCourses = async (coursesToSave) => {
      try {
        await AsyncStorage.setItem('@courses', JSON.stringify(coursesToSave));
      } catch (e) {
        showError('Failed to save courses. Please try again.');
      }
    };

  const showError = (message) => {
    Alert.alert('Error', message, [
      { text: 'Retry', onPress: loadCourses }, // Retry option for async operations
      { text: 'Cancel' },
    ]);
  };

  // Handle save course with unique name validation
  const handleSaveCourse = () => {
    // Check for validation errors first
    if (!handleValidationErrors()) return;

    // Check for unique course name
    const courseExists = courses.some((course) => course.name.trim().toLowerCase() === currentCourse.name.trim().toLowerCase() && course.id !== currentCourse.id);
    if (courseExists) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        name: 'Course name must be unique.',
      }));
      return;
    }

      // Proceed with saving or updating the course
      if (currentCourse.id !== null) {
        // Update existing course
        const updatedCourses = courses.map((course) =>
          course.id === currentCourse.id ? currentCourse : course
        );
        setCourses(updatedCourses);
        saveCourses(updatedCourses);
      } else {
        // Add new course
        const newCourse = { ...currentCourse, id: Date.now().toString() };
        const updatedCourses = [...courses, newCourse];
        setCourses(updatedCourses);
        saveCourses(updatedCourses);
      }

      Alert.alert(
        'Success',
        currentCourse.id ? 'Course updated successfully!' : 'Course added successfully!',
        [{ text: 'OK' }]
      );

    setModalVisible(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      const filtered = courses.filter(course =>
        course.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses(courses);
    }
  };

  const handleDateChange = (event, selectedDate, type) => {
    if (type === 'start') {
      setShowStartDatePicker(false);
      if (selectedDate) {
        const formattedDate = selectedDate.toLocaleDateString('en-GB').replace(/\//g, '.');
        setCurrentCourse({ ...currentCourse, startDate: formattedDate });
      }
    } else if (type === 'end') {
      setShowEndDatePicker(false);
      if (selectedDate) {
        const formattedDate = selectedDate.toLocaleDateString('en-GB').replace(/\//g, '.');
        setCurrentCourse({ ...currentCourse, endDate: formattedDate });
      }
    }
  };

  const handleInputFocus = (field) => {
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[field];
      return newErrors;
    });
  };

  // Function to determine if the course is active
  const isCourseActive = (endDate) => {
    const currentDate = new Date();
    const courseEndDate = new Date(
      endDate.split('.').reverse().join('-') // Convert DD.MM.YYYY to YYYY-MM-DD
    );
    return courseEndDate > currentDate;
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
  <Icon name="search" type="material" color="gray" size={20} style={styles.searchIcon} />
  <TextInput
    style={styles.searchInput}
    placeholder="Search by course name"
    value={searchQuery}
    onChangeText={handleSearch}
    placeholderTextColor="black"
  />
</View>
      <FlatList
          data={filteredCourses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.courseItem,
                { backgroundColor: isCourseActive(item.endDate) ? '#d4f7d4' : '#f7d4d4' }, // Light green for active, light red for inactive
              ]}
            >
              <View style={styles.courseInfo}>
                <Text style={styles.courseName}>{item.name}</Text>
                <Text>{item.days} {item.startTime} - {item.endTime}</Text>
                <Text>{item.startDate} - {item.endDate}</Text>
                <Text>{item.location}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => { setCurrentCourse(item); setModalVisible(true); }}>
                  <Icon name="edit" type="material" color="#FFC107" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
  Alert.alert(
    'Confirm Deletion',
    'Are you sure you want to delete this course?',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: () => {
          const updatedCourses = courses.filter(course => course.id !== item.id);
          setCourses(updatedCourses);
          saveCourses(updatedCourses);

          Alert.alert(
            'Success',
            'Course deleted successfully!',
            [{ text: 'OK' }]
          );
        } 
      },
    ]
  );
}}>
  <Icon name="delete" type="material" color="#F44336" />
</TouchableOpacity>
                
              </View>
              
            </View>
          )}
        />
        
        <View style={styles.buttonContainer}>
        <TouchableOpacity
    style={styles.assignmentButton}
    onPress={() => navigation.navigate('Assignments')}
  >
    <Icon name="assignment" type="material" color="white" size={30} />
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.addButton}
    onPress={() => {
      setCurrentCourse({
        id: null,
        name: '',
        startTime: '',
        endTime: '',
        startDate: '',
        endDate: '',
        days: '',
        location: '',
      });
      setModalVisible(true);
    }}
  >
    <Icon name="add" size={30} color="white" />
  </TouchableOpacity>

  
</View>


      <Modal visible={modalVisible} animationType="slide">
      <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    style={{ flex: 1 }}
  >
        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>{currentCourse.id ? 'Edit Course' : 'Add Course'}</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Course Name:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter course name"
              value={currentCourse.name}
              onChangeText={(text) => setCurrentCourse({ ...currentCourse, name: text })}
              onFocus={() => handleInputFocus('name')}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Start Time (HH:MM):</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter start time (HH:MM)"
              value={currentCourse.startTime}
              onChangeText={(text) => setCurrentCourse({ ...currentCourse, startTime: text })}
              onFocus={() => handleInputFocus('startTime')}
            />
            {errors.startTime && <Text style={styles.errorText}>{errors.startTime}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>End Time (HH:MM):</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter end time (HH:MM)"
              value={currentCourse.endTime}
              onChangeText={(text) => setCurrentCourse({ ...currentCourse, endTime: text })}
              onFocus={() => handleInputFocus('endTime')}
            />
            {errors.endTime && <Text style={styles.errorText}>{errors.endTime}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Start Date (DD.MM.YYYY):</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowStartDatePicker(true)}>
              <Text>{currentCourse.startDate ? currentCourse.startDate : 'Select Date'}</Text>
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={currentCourse.startDate ? new Date(currentCourse.startDate.split('.').reverse().join('-')) : new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => handleDateChange(event, selectedDate, 'start')}
              />
            )}
            {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>End Date (DD.MM.YYYY):</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowEndDatePicker(true)}>
              <Text>{currentCourse.endDate ? currentCourse.endDate : 'Select Date'}</Text>
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker
                value={currentCourse.endDate ? new Date(currentCourse.endDate.split('.').reverse().join('-')) : new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => handleDateChange(event, selectedDate, 'end')}
              />
            )}
            {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Days (e.g., Monday, Tuesday):</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter days"
              value={currentCourse.days}
              onChangeText={(text) => setCurrentCourse({ ...currentCourse, days: text })}
              onFocus={() => handleInputFocus('days')}
            />
            {errors.days && <Text style={styles.errorText}>{errors.days}</Text>}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Location:</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter location"
              value={currentCourse.location}
              onChangeText={(text) => setCurrentCourse({ ...currentCourse, location: text })}
              onFocus={() => handleInputFocus('location')}
            />
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          </View>

            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} color="#999" />
              <Button title="Save" onPress={handleSaveCourse} color="#2196F3" />
            </View>
          </ScrollView>
          </KeyboardAvoidingView>
      </Modal>

       
    </View>
    );
  };

  const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#BBDEFB' },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },

  addButton: {
    backgroundColor: '#1976D2',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },

  assignmentButton: {
    backgroundColor: '#1976D2',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },

  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },

  courseInfo: { flex: 1 },
  courseName: { fontSize: 16, fontWeight: 'bold', color: '#0D47A1' },
  actions: { flexDirection: 'row', gap: 15 },
  modalContent: { padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#1976D2' },
  formGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', color: '#444' },
  input: { borderColor: '#42A5F5', borderWidth: 1, padding: 10, borderRadius: 5, backgroundColor: '#FAFAFA' },
  errorText: { color: '#D32F2F', fontSize: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#42A5F5',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  searchIcon: {
    marginRight: 10,
    color: '#1976D2',
  },

  searchInput: {
    flex: 1,
    height: 40,
    color: '#333',
  },

  modalContent: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    justifyContent: 'center',
    backgroundColor: '#BBDEFB',
  },
});

  
  

export default CourseSchedule;
