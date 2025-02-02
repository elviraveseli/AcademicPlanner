import React, { useState, useEffect } from 'react';

import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Button } from 'react-native';

import { Icon } from 'react-native-elements';

import AsyncStorage from '@react-native-async-storage/async-storage';

const CourseSchedule = () => {

  const [courses, setCourses] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);

  const [currentCourse, setCurrentCourse] = useState({

    id: null,

    name: '',

    time: '',

    days: '',

    location: ''

  });

  // Load saved courses on mount

  useEffect(() => {

    loadCourses();

  }, []);

  const loadCourses = async () => {

    try {

      const savedCourses = await AsyncStorage.getItem('@courses');

      if (savedCourses) setCourses(JSON.parse(savedCourses));

    } catch (e) {

      console.error('Failed to load courses', e);

    }

  };

  const saveCourses = async (coursesToSave) => {

    try {

      await AsyncStorage.setItem('@courses', JSON.stringify(coursesToSave));

    } catch (e) {

      console.error('Failed to save courses', e);

    }

  };

  const handleAddCourse = () => {

    setCurrentCourse({

      id: null,

      name: '',

      time: '',

      days: '',

      location: ''

    });

    setModalVisible(true);

  };

  const handleSaveCourse = () => {

    if (currentCourse.id !== null) {

      // Update existing course

      const updatedCourses = courses.map(course => 

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

    setModalVisible(false);

  };

  const handleEditCourse = (course) => {

    setCurrentCourse(course);

    setModalVisible(true);

  };

  const handleDeleteCourse = (courseId) => {

    const updatedCourses = courses.filter(course => course.id !== courseId);

    setCourses(updatedCourses);

    saveCourses(updatedCourses);

  };

  return (

    <View style={styles.container}>

      <TouchableOpacity style={styles.addButton} onPress={handleAddCourse}>

        <Icon name="add" size={30} color="white" />

      </TouchableOpacity>

      <FlatList

        data={courses}

        keyExtractor={(item) => item.id}

        renderItem={({ item }) => (

          <View style={styles.courseItem}>

            <View style={styles.courseInfo}>

              <Text style={styles.courseName}>{item.name}</Text>

              <Text>{item.days} {item.time}</Text>

              <Text>{item.location}</Text>

            </View>

            <View style={styles.actions}>

              <TouchableOpacity onPress={() => handleEditCourse(item)}>

                <Icon name="edit" type="material" color="#4CAF50" />

              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleDeleteCourse(item.id)}>

                <Icon name="delete" type="material" color="#F44336" />

              </TouchableOpacity>

            </View>

          </View>

        )}

      />

      <Modal visible={modalVisible} animationType="slide">

        <View style={styles.modalContent}>

          <Text style={styles.modalTitle}>

            {currentCourse.id ? 'Edit Course' : 'Add Course'}

          </Text>

          

          <TextInput

            style={styles.input}

            placeholder="Course Name"

            value={currentCourse.name}

            onChangeText={(text) => setCurrentCourse({...currentCourse, name: text})}

          />

          

          <TextInput

            style={styles.input}

            placeholder="Time (e.g., 9:00 AM - 10:30 AM)"

            value={currentCourse.time}

            onChangeText={(text) => setCurrentCourse({...currentCourse, time: text})}

          />

          

          <TextInput

            style={styles.input}

            placeholder="Days (e.g., Mon, Wed, Fri)"

            value={currentCourse.days}

            onChangeText={(text) => setCurrentCourse({...currentCourse, days: text})}

          />

          

          <TextInput

            style={styles.input}

            placeholder="Location"

            value={currentCourse.location}

            onChangeText={(text) => setCurrentCourse({...currentCourse, location: text})}

          />

          <View style={styles.modalButtons}>

            <Button title="Cancel" onPress={() => setModalVisible(false)} color="#999" />

            <Button title="Save" onPress={handleSaveCourse} color="#2196F3" />

          </View>

        </View>

      </Modal>

    </View>

  );

};

const styles = StyleSheet.create({

  container: {

    flex: 1,

    padding: 20,

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

  courseItem: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    padding: 15,

    marginVertical: 5,

    backgroundColor: '#f8f8f8',

    borderRadius: 5,

  },

  courseInfo: {

    flex: 1,

  },

  courseName: {

    fontSize: 16,

    fontWeight: 'bold',

    marginBottom: 5,

  },

  actions: {

    flexDirection: 'row',

    gap: 15,

    alignItems: 'center',

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

  input: {

    height: 40,

    borderColor: '#ddd',

    borderWidth: 1,

    marginBottom: 15,

    padding: 10,

    borderRadius: 5,

  },

  modalButtons: {

    flexDirection: 'row',

    justifyContent: 'space-around',

    marginTop: 20,

  },

});
export default CourseSchedule;