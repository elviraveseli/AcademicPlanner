import React, { useState, useEffect } from 'react';

import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Button } from 'react-native';

import { Icon } from 'react-native-elements';

import AsyncStorage from '@react-native-async-storage/async-storage';

const GradeCalculator = () => {

  const [courses, setCourses] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);

  const [componentModalVisible, setComponentModalVisible] = useState(false);

  const [currentCourse, setCurrentCourse] = useState({

    id: null,

    name: '',

    components: []

  });

  const [currentComponent, setCurrentComponent] = useState({

    name: '',

    weight: '',

    score: ''

  });

  useEffect(() => {

    loadCourses();

  }, []);

  const loadCourses = async () => {

    try {

      const savedCourses = await AsyncStorage.getItem('@gradeCourses');

      if (savedCourses) setCourses(JSON.parse(savedCourses));

    } catch (e) {

      console.error('Failed to load courses', e);

    }

  };

  const saveCourses = async (coursesToSave) => {

    try {

      await AsyncStorage.setItem('@gradeCourses', JSON.stringify(coursesToSave));

    } catch (e) {

      console.error('Failed to save courses', e);

    }

  };

  const calculateGrade = (components) => {

    let totalWeight = 0;

    let weightedSum = 0;

    

    components.forEach(component => {

      const weight = parseFloat(component.weight) || 0;

      const score = parseFloat(component.score) || 0;

      totalWeight += weight;

      weightedSum += (weight * score) / 100;

    });

    if (totalWeight === 0) return 0;

    return (weightedSum / totalWeight) * 100;

  };

  const handleAddCourse = () => {

    setCurrentCourse({ id: null, name: '', components: [] });

    setModalVisible(true);

  };

  const handleSaveCourse = () => {

    if (!currentCourse.name) return;

    const newCourse = {

      ...currentCourse,

      id: currentCourse.id || Date.now().toString()

    };

    const updatedCourses = currentCourse.id

      ? courses.map(c => c.id === currentCourse.id ? newCourse : c)

      : [...courses, newCourse];

    setCourses(updatedCourses);

    saveCourses(updatedCourses);

    setModalVisible(false);

  };

  const handleAddComponent = (course) => {

    setCurrentCourse(course);

    setCurrentComponent({ name: '', weight: '', score: '' });

    setComponentModalVisible(true);

  };

  const handleSaveComponent = () => {

    if (!currentComponent.name || !currentComponent.weight) return;

    const updatedCourse = {

      ...currentCourse,

      components: [...currentCourse.components, {

        ...currentComponent,

        id: Date.now().toString()

      }]

    };

    const updatedCourses = courses.map(c => 

      c.id === currentCourse.id ? updatedCourse : c

    );

    setCourses(updatedCourses);

    saveCourses(updatedCourses);

    setComponentModalVisible(false);

  };

  const handleDelete = (courseId) => {

    const updatedCourses = courses.filter(c => c.id !== courseId);

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

          <View style={styles.courseCard}>

            <View style={styles.courseHeader}>

              <Text style={styles.courseName}>{item.name}</Text>

              <View style={styles.headerActions}>

                <TouchableOpacity onPress={() => handleAddComponent(item)}>

                  <Icon name="add-circle" color="#4CAF50" size={24} />

                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleDelete(item.id)}>

                  <Icon name="delete" color="#F44336" size={24} />

                </TouchableOpacity>

              </View>

            </View>

            <View style={styles.componentsContainer}>

              {item.components.map(component => (

                <View key={component.id} style={styles.componentItem}>

                  <Text style={styles.componentName}>{component.name}</Text>

                  <Text>{component.weight}%</Text>

                  <Text>{component.score || '0'}%</Text>

                </View>

              ))}

            </View>

            <View style={styles.gradeSummary}>

              <Text style={styles.gradeText}>

                Current Grade: {calculateGrade(item.components).toFixed(1)}%

              </Text>

            </View>

          </View>

        )}

      />

      {/* Course Modal */}

      <Modal visible={modalVisible} animationType="slide">

        <View style={styles.modalContent}>

          <Text style={styles.modalTitle}>

            {currentCourse.id ? 'Edit Course' : 'Add Course'}

          </Text>

          <TextInput

            style={styles.input}

            placeholder="Course Name *"

            value={currentCourse.name}

            onChangeText={(text) => setCurrentCourse({...currentCourse, name: text})}

          />

          <View style={styles.modalButtons}>

            <Button title="Cancel" onPress={() => setModalVisible(false)} color="#999" />

            <Button title="Save" onPress={handleSaveCourse} color="#2196F3" />

          </View>

        </View>

      </Modal>

      {/* Component Modal */}

      <Modal visible={componentModalVisible} animationType="slide">

        <View style={styles.modalContent}>

          <Text style={styles.modalTitle}>Add Grade Component</Text>

          <TextInput

            style={styles.input}

            placeholder="Component Name *"

            value={currentComponent.name}

            onChangeText={(text) => setCurrentComponent({...currentComponent, name: text})}

          />

          <TextInput

            style={styles.input}

            placeholder="Weight (%) *"

            keyboardType="numeric"

            value={currentComponent.weight}

            onChangeText={(text) => setCurrentComponent({...currentComponent, weight: text})}

          />

          <TextInput

            style={styles.input}

            placeholder="Score (%)"

            keyboardType="numeric"

            value={currentComponent.score}

            onChangeText={(text) => setCurrentComponent({...currentComponent, score: text})}

          />

          <View style={styles.modalButtons}>

            <Button title="Cancel" onPress={() => setComponentModalVisible(false)} color="#999" />

            <Button title="Save" onPress={handleSaveComponent} color="#2196F3" />

          </View>

        </View>

      </Modal>

    </View>

  );

};

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

  courseCard: {

    backgroundColor: '#f8f8f8',

    borderRadius: 8,

    padding: 15,

    marginBottom: 10,

  },

  courseHeader: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: 10,

  },

  courseName: {

    fontSize: 18,

    fontWeight: 'bold',

  },

  headerActions: {

    flexDirection: 'row',

    gap: 15,

  },

  componentsContainer: {

    marginVertical: 10,

  },

  componentItem: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    paddingVertical: 8,

    borderBottomWidth: 1,

    borderBottomColor: '#eee',

  },

  componentName: {

    flex: 2,

  },

  gradeSummary: {

    marginTop: 10,

    paddingTop: 10,

    borderTopWidth: 1,

    borderTopColor: '#ddd',

  },

  gradeText: {

    fontSize: 16,

    fontWeight: '600',

    color: '#2196F3',

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

export default GradeCalculator;
