
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';
import Button from '../components/Button';

export default function PatientRegistration() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    sex: '',
    bloodGroup: '',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
  });
  const [profileImage, setProfileImage] = useState(null);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const sexOptions = ['Male', 'Female', 'Other'];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      console.log('Profile image selected:', result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      console.log('Profile photo taken:', result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    const requiredFields = ['firstName', 'lastName', 'age', 'sex', 'bloodGroup', 'phone'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    console.log('Patient registration data:', { ...formData, profileImage });
    Alert.alert(
      'Success',
      'Patient registered successfully!',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const renderSelector = (label, value, options, field) => (
    <View style={commonStyles.section}>
      <Text style={commonStyles.label}>{label} *</Text>
      <View style={commonStyles.rowWrap}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              commonStyles.chip,
              value === option && commonStyles.chipSelected
            ]}
            onPress={() => updateFormData(field, option)}
          >
            <Text style={[
              commonStyles.chipText,
              value === option && { color: colors.backgroundAlt }
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={commonStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Patient Registration</Text>
      </View>

      <ScrollView style={commonStyles.container} contentContainerStyle={commonStyles.scrollContent}>
        <View style={commonStyles.card}>
          <Text style={[commonStyles.subtitle, { textAlign: 'center', marginBottom: 24 }]}>
            New Patient Profile
          </Text>

          {/* Profile Photo Section */}
          <View style={[commonStyles.centerContent, { marginBottom: 24 }]}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={commonStyles.imagePreview} />
            ) : (
              <View style={[commonStyles.imagePreview, commonStyles.centerContent, { backgroundColor: colors.background }]}>
                <Ionicons name="person" size={64} color={colors.textLight} />
              </View>
            )}
            
            <View style={[commonStyles.row, { gap: 12, marginTop: 16 }]}>
              <Button
                text="Take Photo"
                onPress={takePhoto}
                style={[buttonStyles.secondary, { flex: 1 }]}
                textStyle={{ color: colors.primary, fontWeight: '600' }}
              />
              <Button
                text="Choose Photo"
                onPress={pickImage}
                style={[buttonStyles.secondary, { flex: 1 }]}
                textStyle={{ color: colors.primary, fontWeight: '600' }}
              />
            </View>
          </View>

          {/* Personal Information */}
          <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>Personal Information</Text>
          
          <View style={commonStyles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={commonStyles.label}>First Name *</Text>
              <TextInput
                style={commonStyles.input}
                value={formData.firstName}
                onChangeText={(value) => updateFormData('firstName', value)}
                placeholder="First name"
                placeholderTextColor={colors.textLight}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={commonStyles.label}>Last Name *</Text>
              <TextInput
                style={commonStyles.input}
                value={formData.lastName}
                onChangeText={(value) => updateFormData('lastName', value)}
                placeholder="Last name"
                placeholderTextColor={colors.textLight}
              />
            </View>
          </View>

          <Text style={commonStyles.label}>Age *</Text>
          <TextInput
            style={commonStyles.input}
            value={formData.age}
            onChangeText={(value) => updateFormData('age', value)}
            placeholder="Enter age"
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
          />

          {renderSelector('Sex', formData.sex, sexOptions, 'sex')}
          {renderSelector('Blood Group', formData.bloodGroup, bloodGroups, 'bloodGroup')}

          {/* Contact Information */}
          <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 16 }]}>Contact Information</Text>
          
          <Text style={commonStyles.label}>Phone Number *</Text>
          <TextInput
            style={commonStyles.input}
            value={formData.phone}
            onChangeText={(value) => updateFormData('phone', value)}
            placeholder="Enter phone number"
            placeholderTextColor={colors.textLight}
            keyboardType="phone-pad"
          />

          <Text style={commonStyles.label}>Email Address</Text>
          <TextInput
            style={commonStyles.input}
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            placeholder="Enter email address"
            placeholderTextColor={colors.textLight}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={commonStyles.label}>Address</Text>
          <TextInput
            style={commonStyles.inputMultiline}
            value={formData.address}
            onChangeText={(value) => updateFormData('address', value)}
            placeholder="Enter full address"
            placeholderTextColor={colors.textLight}
            multiline
            numberOfLines={3}
          />

          {/* Emergency Contact */}
          <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 16 }]}>Emergency Contact</Text>
          
          <Text style={commonStyles.label}>Emergency Contact Name</Text>
          <TextInput
            style={commonStyles.input}
            value={formData.emergencyContact}
            onChangeText={(value) => updateFormData('emergencyContact', value)}
            placeholder="Enter emergency contact name"
            placeholderTextColor={colors.textLight}
          />

          <Text style={commonStyles.label}>Emergency Contact Phone</Text>
          <TextInput
            style={commonStyles.input}
            value={formData.emergencyPhone}
            onChangeText={(value) => updateFormData('emergencyPhone', value)}
            placeholder="Enter emergency contact phone"
            placeholderTextColor={colors.textLight}
            keyboardType="phone-pad"
          />

          <View style={commonStyles.buttonContainer}>
            <Button
              text="Register Patient"
              onPress={handleSubmit}
              style={buttonStyles.primary}
              textStyle={{ color: colors.backgroundAlt, fontWeight: '600' }}
            />
            <Button
              text="Cancel"
              onPress={() => router.back()}
              style={buttonStyles.secondary}
              textStyle={{ color: colors.primary, fontWeight: '600' }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
