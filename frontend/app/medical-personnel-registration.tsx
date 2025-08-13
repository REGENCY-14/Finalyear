import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RegistrationForm {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'doctor' | 'nurse' | 'radiologist' | 'admin';
  license_number: string;
  specialization: string;
  phone: string;
}

const MedicalPersonnelRegistration = () => {
  const [formData, setFormData] = useState<RegistrationForm>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'doctor',
    license_number: '',
    specialization: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<RegistrationForm>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<RegistrationForm> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.first_name) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    }

    if (!formData.last_name) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.length < 2) {
      newErrors.last_name = 'Last name must be at least 2 characters';
    }

    if (!formData.license_number) {
      newErrors.license_number = 'License number is required';
    } else if (formData.license_number.length < 5) {
      newErrors.license_number = 'License number must be at least 5 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Get auth token from storage
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        return;
      }

      const response = await fetch('http://localhost:3000/api/medical-personnel/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert(
          'Success',
          'Medical personnel registered successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setFormData({
                  email: '',
                  password: '',
                  first_name: '',
                  last_name: '',
                  role: 'doctor',
                  license_number: '',
                  specialization: '',
                  phone: '',
                });
                setErrors({});
                // Navigate back to auth screen
                router.back();
              },
            },
          ]
        );
      } else {
        if (response.status === 400) {
          Alert.alert('Validation Error', result.message || 'Please check your input and try again.');
        } else if (response.status === 401) {
          Alert.alert('Authentication Error', 'Your session has expired. Please log in again.');
        } else if (response.status === 403) {
          Alert.alert('Access Denied', 'You do not have permission to register medical personnel. Admin role required.');
        } else {
          Alert.alert('Error', result.message || 'An unexpected error occurred. Please try again.');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: keyof RegistrationForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBackToAuth = () => {
    router.back();
  };

  const renderInput = (
    field: keyof RegistrationForm,
    label: string,
    placeholder: string,
    keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default',
    secureTextEntry = false
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, errors[field] && styles.inputError]}
        placeholder={placeholder}
        value={formData[field]}
        onChangeText={(value) => updateForm(field, value)}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToAuth}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Register Medical Personnel</Text>
        <Text style={styles.subtitle}>
          Create new accounts for doctors, nurses, radiologists, and administrators
        </Text>
      </View>

      <View style={styles.form}>
        {renderInput('email', 'Email Address', 'dr.smith@hospital.com', 'email-address')}
        {renderInput('password', 'Password', 'Enter password (min 8 characters)', 'default', true)}
        {renderInput('first_name', 'First Name', 'John')}
        {renderInput('last_name', 'Last Name', 'Smith')}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Role</Text>
          <View style={[styles.pickerContainer, errors.role && styles.inputError]}>
            <Picker
              selectedValue={formData.role}
              onValueChange={(value) => updateForm('role', value)}
              style={styles.picker}
            >
              <Picker.Item label="Doctor" value="doctor" />
              <Picker.Item label="Nurse" value="nurse" />
              <Picker.Item label="Radiologist" value="radiologist" />
              <Picker.Item label="Admin" value="admin" />
            </Picker>
          </View>
          {errors.role && <Text style={styles.errorText}>{errors.role}</Text>}
        </View>

        {renderInput('license_number', 'License Number', 'MD12345')}
        {renderInput('specialization', 'Specialization (Optional)', 'Cardiology')}
        {renderInput('phone', 'Phone Number (Optional)', '+1234567890', 'phone-pad')}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Register Personnel</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    padding: 8,
  },
  backButtonText: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 5,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default MedicalPersonnelRegistration;