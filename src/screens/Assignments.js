import React, { useState, useEffect } from 'react';
import {Alert, View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Button, Keyboard,ScrollView } from 'react-native';
import { Icon, CheckBox } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from '@react-navigation/native';

const Assignments = () => {
  const navigation = useNavigation();
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState({
    id: null,
    title: '',
    course: '',
    dueDate: new Date(),
    description: '',
    completed: false,
    priority: 'Medium'
  });
  const [errors, setErrors] = useState({
    title: '',
    course: '',
    dueDate: ''
  });
  

  // Dropdown state variables
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('Medium'); // Default value for dropdown
  const [items, setItems] = useState([
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' }
  ]);

  useEffect(() => {
    loadAssignments();
  }, []);
  useEffect(() => {
    setFilteredAssignments(assignments); // Initialize filteredCourses with all courses
    }, [assignments]);


  const filterAssignments = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredAssignments(assignments);  // If search is empty, show all assignments
    } else {
      const filtered = assignments.filter(
        (assignment) =>
          assignment.title.toLowerCase().includes(query.toLowerCase()) ||
          assignment.course.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredAssignments(filtered);
    }
  };

  const loadAssignments = async () => {
    try {
      const savedAssignments = await AsyncStorage.getItem('@assignments');
      if (savedAssignments) {
        const parsedAssignments = JSON.parse(savedAssignments);
        const sortedAssignments = parsedAssignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        setAssignments(sortedAssignments);
      }
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
      completed: false,
      priority: 'Medium'
    });
    setErrors({ title: '', course: '', dueDate: '' });
    setModalVisible(true);
  };

  

  const validateInputs = () => {
  let valid = true;
  let newErrors = { title: '', course: '', dueDate: '' };

  // Check if title is empty
  if (!currentAssignment.title) {
    newErrors.title = 'Title is required';
    valid = false;
  }
  // Check if title is already taken
  else if (assignments.some(a => a.title.toLowerCase() === currentAssignment.title.toLowerCase() && a.id !== currentAssignment.id)) {
    newErrors.title = 'Title must be unique';
    valid = false;
  }
  // Check if course is empty
  if (!currentAssignment.course) {
    newErrors.course = 'Course is required';
    valid = false;
  }
  // Check if due date is selected
  if (!currentAssignment.dueDate) {
    newErrors.dueDate = 'Due Date is required';
    valid = false;
  }

  setErrors(newErrors);
  return valid;
};


const handleSaveAssignment = () => {
  if (!validateInputs()) return;

  // Check if the title already exists in other assignments
  if (assignments.some(a => a.title.toLowerCase() === currentAssignment.title.toLowerCase() && a.id !== currentAssignment.id)) {
    setErrors((prevErrors) => ({
      ...prevErrors,
      title: 'Title must be unique',  // Set the error message for duplicate titles
    }));
    return;
  }

  const newAssignment = {
    ...currentAssignment,
    id: currentAssignment.id || Date.now().toString(),
    dueDate: currentAssignment.dueDate.toISOString()
  };

  const updatedAssignments = currentAssignment.id
    ? assignments.map(a => a.id === currentAssignment.id ? newAssignment : a)
    : [...assignments, newAssignment];

  const sortedAssignments = updatedAssignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  setAssignments(sortedAssignments);
  saveAssignments(sortedAssignments);

  setModalVisible(false);

  Alert.alert(
    'Success',
    currentAssignment.id ? 'Assignment updated successfully!' : 'Assignment added successfully!',
    [{ text: 'OK' }]
  );
};


  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setCurrentAssignment({ ...currentAssignment, dueDate: selectedDate });
    }
  };

  const toggleCompletion = (assignmentId) => {
    const updatedAssignments = assignments.map(a =>
      a.id === assignmentId ? { ...a, completed: !a.completed } : a
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
        <View style={styles.searchContainer}>
  <Icon name="search" type="material" color="gray" size={20} style={styles.searchIcon} />
  <TextInput
    style={styles.searchInput}
    placeholder="Search by course or assignment"
    value={searchQuery}
    onChangeText={filterAssignments}
    placeholderTextColor="black"
  />
</View>


        

        <FlatList
          data={filteredAssignments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.assignmentItem, item.completed && styles.completedItem]}>
              <CheckBox
                checked={item.completed}
                onPress={() => toggleCompletion(item.id)}
                containerStyle={styles.checkbox}
                checkedColor="#008000"
              />
              <View style={styles.assignmentInfo}>
                <Text style={styles.assignmentTitle}>{item.title}</Text>
                <Text style={styles.courseName}>{item.course}</Text>
                <Text>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
                {item.description && <Text>{item.description}</Text>}
                <Text>Priority: {item.priority}</Text>
              </View>
              <View style={styles.actions}>
               

                <TouchableOpacity onPress={() => {
                  setCurrentAssignment({ ...item, dueDate: new Date(item.dueDate) });
                  setModalVisible(true);
                }}>
                  <Icon name="edit" type="material" color="#FFC107" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this assignment?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            // Proceed with deletion only when 'Delete' is pressed
            const updatedAssignments = assignments.filter(a => a.id !==item.id);
            setAssignments(updatedAssignments);
            saveAssignments(updatedAssignments);
    
            // Show success alert
            Alert.alert(
              'Success',
              'Assignment deleted successfully!',
              [{ text: 'OK' }]
            );
          }
        },
      ]
    )}>
                  <Icon name="delete" type="material" color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

          
                  <View style={styles.buttonContainer}>
                  <TouchableOpacity
                      style={styles.gradeButton} // Apply the styled button
                      onPress={() => navigation.navigate('Grades')}
                    >
                      <Icon
                        name="calculate"  // Use the assignment icon
                        type="material"     // Use material icons
                        color="white"       // White color for the icon
                        size={30}           // Icon size
                      />
                    </TouchableOpacity>
                  
                    <TouchableOpacity style={styles.addButton} onPress={handleAddAssignment}>
          <Icon name="add" size={30} color="white" />
        </TouchableOpacity>
        </View>

        <Modal visible={modalVisible} animationType="slide">
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {currentAssignment.id ? 'Edit Assignment' : 'Add Assignment'}
            </Text>

            {/* Title Label and Input */}
            <Text style={styles.inputLabel}>Assignment Title *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              placeholder="Enter title"
              value={currentAssignment.title}
              onChangeText={(text) => setCurrentAssignment({ ...currentAssignment, title: text })}
            />
            {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}

            {/* Course Name Label and Input */}
            <Text style={styles.inputLabel}>Course Name *</Text>
            <TextInput
              style={[styles.input, errors.course && styles.inputError]} 
              placeholder="Enter course name"
              value={currentAssignment.course}
              onChangeText={(text) => setCurrentAssignment({ ...currentAssignment, course: text })}
            />
            {errors.course ? <Text style={styles.errorText}>{errors.course}</Text> : null}

            {/* Due Date Label and Picker */}
            <Text style={styles.inputLabel}>Due Date *</Text>
            <TouchableOpacity 
              style={styles.input} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text>
                Due Date: {currentAssignment.dueDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {errors.dueDate ? <Text style={styles.errorText}>{errors.dueDate}</Text> : null}

            {showDatePicker && (
              <DateTimePicker
                value={currentAssignment.dueDate}
                mode="datetime"
                display="default"
                onChange={handleDateChange}
              />
            )}

            {/* Description Label and Input */}
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Enter description"
              multiline
              value={currentAssignment.description}
              onChangeText={(text) => setCurrentAssignment({ ...currentAssignment, description: text })}
              onSubmitEditing={() => Keyboard.dismiss()}
              blurOnSubmit={true}
            />
            <Text style={styles.inputLabel}>Priority</Text>
            <DropDownPicker
              open={open}
              value={value}
              items={items}
              setOpen={setOpen}
              setValue={setValue}
              setItems={setItems}
              containerStyle={styles.dropdownContainer}
              style={styles.dropdown}
              dropDownStyle={styles.dropdownList}
              onChangeValue={(itemValue) => setCurrentAssignment({ ...currentAssignment, priority: itemValue })}
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

  gradeButton: {
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

  assignmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
  },

  completedItem: {
    backgroundColor: '#B9F6CA',
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
});


export default Assignments;
