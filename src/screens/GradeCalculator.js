import React, { useState, useEffect } from 'react';

import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Button ,ScrollView} from 'react-native';

import { Icon } from 'react-native-elements';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { TouchableWithoutFeedback, Keyboard } from 'react-native'; // Import the necessary components
import { useRoute } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

const GradeCalculator = () => {
  const navigation = useNavigation();

  const route = useRoute();
  const assignment = route.params?.assignment;

  const [courses, setCourses] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);

  const [componentModalVisible, setComponentModalVisible] = useState(false);

  const [isComponentSaved, setIsComponentSaved] = useState(true); // For component

  const [isCourseSaved, setIsCourseSaved] = useState(true); // For course


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


  const calculateGPA = (components) => {
    const totalWeight = components.reduce((sum, component) => sum + parseFloat(component.weight) || 0, 0);
    const weightedSum = components.reduce((sum, component) => sum + (parseFloat(component.weight) * parseFloat(component.score) || 0), 0);
  
    if (totalWeight === 0) return 0; // No components to calculate
  
    // Calculate the overall grade percentage
    const percentage = (weightedSum / totalWeight);
  
    console.log(`Grade Percentage: ${percentage}%`); // Log grade percentage
  
    // Convert percentage to GPA (assuming a 4.0 scale)
    if (percentage >= 90) return 10;
    if (percentage >= 80) return 9;
    if (percentage >= 70) return 8;
    if (percentage >= 60) return 7;
    if (percentage >= 50) return 6;
    return 5; // Below 60% is a failing grade, GPA = 0
  };
  
  
  

  const handleAddCourse = () => {

    setCurrentCourse({ id: null, name: '', components: [] });

    setModalVisible(true);

  };

  const handleSaveCourse = () => {
    if (!currentCourse.name) return;
  
    const newCourse = {
      ...currentCourse,
      id: currentCourse.id || Date.now().toString(),
    };
  
    const updatedCourses = currentCourse.id
      ? courses.map((c) => (c.id === currentCourse.id ? newCourse : c))
      : [...courses, newCourse];
  
    setCourses(updatedCourses);
    saveCourses(updatedCourses);
    setModalVisible(false);
    setIsCourseSaved(true); // Set course saved state to true
  };

  const handleAddComponent = (course) => {

    setCurrentCourse(course);

    setCurrentComponent({ name: '', weight: '', score: '' });

    setComponentModalVisible(true);

  };

 
  
  const handleSaveComponent = () => {
    // Validation for component name, weight, and score
    if (!currentComponent.name.trim()) {
      alert('Component name is required');
      return;
    }
  
    if (!currentComponent.weight || isNaN(currentComponent.weight) || parseFloat(currentComponent.weight) <= 0) {
      alert('Weight must be a positive number');
      return;
    }
  
    // Optionally, validate score if it's provided (it may be empty or missing)
    if (currentComponent.score && (isNaN(currentComponent.score) || parseFloat(currentComponent.score) < 0 || parseFloat(currentComponent.score) > 100)) {
      alert('Score must be a number between 0 and 100');
      return;
    }
  
    // Check for uniqueness of the component name within the same course
    const isNameUnique = !currentCourse.components.some(
      (component) => component.name.toLowerCase() === currentComponent.name.toLowerCase() && component.id !== currentComponent.id
    );
  
    if (!isNameUnique) {
      alert('Component name must be unique within the course');
      return;
    }
  
    const totalWeight = currentCourse.components.reduce(
      (sum, component) => sum + parseFloat(component.weight) || 0,
      0
    );
  
    const newWeight = parseFloat(currentComponent.weight) || 0;
  
    if (totalWeight + newWeight > 100) {
      alert('Total weight of components cannot exceed 100%');
      return;
    }
  
    let updatedComponents;
    if (currentComponent.id) {
      // Editing an existing component
      updatedComponents = currentCourse.components.map((component) =>
        component.id === currentComponent.id
          ? { ...component, name: currentComponent.name, weight: currentComponent.weight, score: currentComponent.score }
          : component
      );
    } else {
      // Adding a new component
      updatedComponents = [
        ...currentCourse.components,
        {
          ...currentComponent,
          id: Date.now().toString(), // Assign a unique ID for the new component
        },
      ];
    }
  
    const updatedCourse = {
      ...currentCourse,
      components: updatedComponents,
    };
  
    const updatedCourses = courses.map((c) => (c.id === currentCourse.id ? updatedCourse : c));
  
    setCourses(updatedCourses);
    saveCourses(updatedCourses);
    setIsComponentSaved(true); // Set to true after saving the component
    setComponentModalVisible(false);
  };
  
  
  
  
  

  const handleDelete = (courseId) => {

    const updatedCourses = courses.filter(c => c.id !== courseId);

    setCourses(updatedCourses);

    saveCourses(updatedCourses);

  };

  const handleDeleteComponent = (courseId, componentId) => {
    const updatedCourse = courses.find((c) => c.id === courseId);
    updatedCourse.components = updatedCourse.components.filter(
      (component) => component.id !== componentId
    );
    const updatedCourses = courses.map((c) => (c.id === courseId ? updatedCourse : c));
    setCourses(updatedCourses);
    saveCourses(updatedCourses);
  };

  const handleEditComponent = (courseId, component) => {
    setCurrentCourse(courses.find((c) => c.id === courseId));
    setCurrentComponent(component);
    setComponentModalVisible(true);
  };

  return (

    
        <View style={styles.container}>
          

          <TouchableOpacity style={styles.addButton} onPress={handleAddCourse}>

            <Icon name="add" size={30} color="white" />

          </TouchableOpacity>

          <TouchableOpacity
              style={styles.reminderButton} // Apply the styled button
              onPress={() => navigation.navigate('Reminders')}
            >
              <Icon
                name="notifications"  // You can change the icon name based on the icon you prefer
                type="material"        // Use material icons or other types depending on your library
                color="white"          // White color for the icon
                size={30}              // Icon size
              />
            </TouchableOpacity>

          
            
        
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.courseCard}>
                <View style={styles.courseHeader}>
                  <Text style={styles.courseName}>{item.name}</Text>
                  <View style={styles.headerActions}>
                    {isCourseSaved && (
                      <>
                        <TouchableOpacity onPress={() => handleAddComponent(item)}>
                          <Icon name="add-circle" color="#4CAF50" size={24} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(item.id)}>
                          <Icon name="delete" color="#F44336" size={24} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>

              <View style={styles.componentsContainer}>
                {item.components.map((component) => (
                  <View key={component.id} style={styles.componentItem}>
                    <View style={styles.componentDetail}>
                      <Text style={styles.label1}>Assignment:</Text>
                      <Text style={styles.componentName}>{component.name}</Text>
                    </View>
                    <View style={styles.componentDetail}>
                      <Text style={styles.label1}>Weight:</Text>
                      <Text>{component.weight}%</Text>
                    </View>
                    <View style={styles.componentDetail}>
                      <Text style={styles.label1}>Score:</Text>
                      <Text>{component.score || '0'}%</Text>
                    </View>
                    <View style={styles.componentActions}>
                      {isComponentSaved && (
                        <>
                          <TouchableOpacity onPress={() => handleEditComponent(item.id, component)}>
                            <Icon name="edit" color="#FFC107" size={20} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteComponent(item.id, component.id)}>
                            <Icon name="delete" color="#F44336" size={20} />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.gradeSummary}>
                <Text style={styles.gradeText}>
                  Current Grade: {calculateGrade(item.components).toFixed(1)}%
                </Text>
                <Text style={styles.gpaText}>
                  GPA: {calculateGPA(item.components).toFixed(2)} / 10
                </Text>
              </View>

              <View>
                <Text>Grade Calculator</Text>
                {assignment && <Text>Tracking Grades for: {assignment.title}</Text>}
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
              onChangeText={(text) => setCurrentCourse({ ...currentCourse, name: text })}
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} color="#999" />
              <Button title="Save" onPress={handleSaveCourse} color="#2196F3" />
            </View>
          </View>
        </Modal>

        {/* Component Modal */}
        <Modal visible={componentModalVisible} animationType="slide">
          <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Grade Component</Text>
            <Text style={styles.label}>Component Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter component name"
              value={currentComponent.name}
              onChangeText={(text) => setCurrentComponent({ ...currentComponent, name: text })}
            />
            <Text style={styles.label}>Weight (%) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter weight"
              keyboardType="numeric"
              value={currentComponent.weight}
              onChangeText={(text) => setCurrentComponent({ ...currentComponent, weight: text })}
            />
            <Text style={styles.label}>Score (%)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter score (optional)"
              keyboardType="numeric"
              value={currentComponent.score}
              onChangeText={(text) => setCurrentComponent({ ...currentComponent, score: text })}
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setComponentModalVisible(false)} color="#999" />
              <Button title="Save" onPress={handleSaveComponent} color="#2196F3" />
            </View>
          </View>
          </ScrollView>
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

  componentActions: {
    flexDirection: 'row',
    gap: 10,
  },
  componentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    marginBottom: 10,  
  },

  componentName: {

    flex: 2,

  },
  componentDetail: {
    marginHorizontal: 5, // Add some space between weight and score
  },

  label1: {
    fontWeight: 'bold', // Make label text bold
    marginBottom: 5, // Adds space between label and value
    fontSize: 10, // Adjust font size for clarity
    color: '#555', // Make the label color slightly darker for better contrast
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
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },

  modalButtons: {

    flexDirection: 'row',

    justifyContent: 'space-around',

    marginTop: 20,

  },
  gpaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800', // Use a different color for GPA
  },


  reminderButton: {
  backgroundColor: '#2196F3', // Blue background color
  padding: 12, // Padding for the button
  borderRadius: 50, // Circle button
  alignItems: 'center', // Center icon inside the button
  justifyContent: 'center', // Align icon in the center
  width: 60, // Width of the button (adjust as necessary)
  height: 60, // Height of the button (same as width to make it circular)
  position: 'absolute', // Position it absolutely
  bottom: 20, // Distance from the bottom edge
  left: 20, // Distance from the left edge
  zIndex: 1, // Make sure it's on top of other content
},
});

export default GradeCalculator;
