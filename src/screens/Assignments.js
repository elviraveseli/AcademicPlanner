import React, { useState, useEffect } from 'react';

import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Button } from 'react-native';

import { Icon, CheckBox } from 'react-native-elements';

import AsyncStorage from '@react-native-async-storage/async-storage';

import DateTimePicker from '@react-native-community/datetimepicker';

const Assignments = () => {

  const [assignments, setAssignments] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [currentAssignment, setCurrentAssignment] = useState({

    id: null,

    title: '',

    course: '',

    dueDate: new Date(),

    description: '',

    completed: false

  });

  useEffect(() => {

    loadAssignments();

  }, []);

  const loadAssignments = async () => {

    try {

      const savedAssignments = await AsyncStorage.getItem('@assignments');

      if (savedAssignments) setAssignments(JSON.parse(savedAssignments));

    } catch (e) {

      console.error('Failed to load assignments', e);

    }

  };

  const saveAssignments = async (assignmentsToSave) => {

    try {

      await AsyncStorage.setItem('@assignments', JSON.stringify(assignmentsToSave));

    } catch (e) {

      console.error('Failed to save assignments', e);

    }

  };

  const handleAddAssignment = () => {

    setCurrentAssignment({

      id: null,

      title: '',

      course: '',

      dueDate: new Date(),

      description: '',

      completed: false

    });

    setModalVisible(true);

  };

  const handleSaveAssignment = () => {

    if (!currentAssignment.title || !currentAssignment.dueDate) return;

    const newAssignment = {

      ...currentAssignment,

      id: currentAssignment.id || Date.now().toString(),

      dueDate: currentAssignment.dueDate.toISOString()

    };

    const updatedAssignments = currentAssignment.id

      ? assignments.map(a => a.id === currentAssignment.id ? newAssignment : a)

      : [...assignments, newAssignment];

    setAssignments(updatedAssignments);

    saveAssignments(updatedAssignments);

    setModalVisible(false);

  };

  const handleDateChange = (event, selectedDate) => {

    setShowDatePicker(false);

    if (selectedDate) {

      setCurrentAssignment({...currentAssignment, dueDate: selectedDate});

    }

  };

  const toggleCompletion = (assignmentId) => {

    const updatedAssignments = assignments.map(a => 

      a.id === assignmentId ? {...a, completed: !a.completed} : a

    );

    setAssignments(updatedAssignments);

    saveAssignments(updatedAssignments);

  };

  const handleDeleteAssignment = (assignmentId) => {

    const updatedAssignments = assignments.filter(a => a.id !== assignmentId);

    setAssignments(updatedAssignments);

    saveAssignments(updatedAssignments);

  };

  return (

    <View style={styles.container}>

      <TouchableOpacity style={styles.addButton} onPress={handleAddAssignment}>

        <Icon name="add" size={30} color="white" />

      </TouchableOpacity>

      <FlatList

        data={assignments}

        keyExtractor={(item) => item.id}

        renderItem={({ item }) => (

          <View style={[styles.assignmentItem, item.completed && styles.completedItem]}>

            <CheckBox

              checked={item.completed}

              onPress={() => toggleCompletion(item.id)}

              containerStyle={styles.checkbox}

            />

            <View style={styles.assignmentInfo}>

              <Text style={styles.assignmentTitle}>{item.title}</Text>

              <Text style={styles.courseName}>{item.course}</Text>

              <Text>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>

              {item.description && <Text>{item.description}</Text>}

            </View>

            <View style={styles.actions}>

              <TouchableOpacity onPress={() => {

                setCurrentAssignment({...item, dueDate: new Date(item.dueDate)});

                setModalVisible(true);

              }}>

                <Icon name="edit" type="material" color="#4CAF50" />

              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleDeleteAssignment(item.id)}>

                <Icon name="delete" type="material" color="#F44336" />

              </TouchableOpacity>

            </View>

          </View>

        )}

      />

      <Modal visible={modalVisible} animationType="slide">

        <View style={styles.modalContent}>

          <Text style={styles.modalTitle}>

            {currentAssignment.id ? 'Edit Assignment' : 'Add Assignment'}

          </Text>

          <TextInput

            style={styles.input}

            placeholder="Assignment Title *"

            value={currentAssignment.title}

            onChangeText={(text) => setCurrentAssignment({...currentAssignment, title: text})}

          />

          <TextInput

            style={styles.input}

            placeholder="Course Name"

            value={currentAssignment.course}

            onChangeText={(text) => setCurrentAssignment({...currentAssignment, course: text})}

          />

          <TouchableOpacity 

            style={styles.input} 

            onPress={() => setShowDatePicker(true)}

          >

            <Text>

              Due Date: {currentAssignment.dueDate.toLocaleDateString()}

            </Text>

          </TouchableOpacity>

          {showDatePicker && (

            <DateTimePicker

              value={currentAssignment.dueDate}

              mode="datetime"

              display="default"

              onChange={handleDateChange}

            />

          )}

          <TextInput

            style={[styles.input, { height: 80 }]}

            placeholder="Description"

            multiline

            value={currentAssignment.description}

            onChangeText={(text) => setCurrentAssignment({...currentAssignment, description: text})}

          />

          <View style={styles.modalButtons}>

            <Button title="Cancel" onPress={() => setModalVisible(false)} color="#999" />

            <Button title="Save" onPress={handleSaveAssignment} color="#2196F3" />

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

  assignmentItem: {

    flexDirection: 'row',

    alignItems: 'center',

    padding: 15,

    marginVertical: 5,

    backgroundColor: '#f8f8f8',

    borderRadius: 5,

  },

  completedItem: {

    backgroundColor: '#e8f5e9',

    opacity: 0.7,

  },

  checkbox: {

    padding: 0,

    margin: 0,

    marginRight: 10,

    backgroundColor: 'transparent',

    borderWidth: 0,

  },

  assignmentInfo: {

    flex: 1,

  },

  assignmentTitle: {

    fontSize: 16,

    fontWeight: 'bold',

  },

  courseName: {

    color: '#666',

    marginVertical: 3,

  },

  actions: {

    flexDirection: 'row',

    gap: 15,

    marginLeft: 10,

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

    justifyContent: 'center',

  },

  modalButtons: {

    flexDirection: 'row',

    justifyContent: 'space-around',

    marginTop: 20,

  },

});

export default Assignments;
