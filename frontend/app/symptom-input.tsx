
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';
import Button from '../components/Button';

export default function SymptomInput() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [selectedComorbidities, setSelectedComorbidities] = useState([]);
  const [formData, setFormData] = useState({
    duration: '',
    severity: '',
    temperature: '',
    bloodPressure: '',
    heartRate: '',
    oxygenSaturation: '',
    respiratoryRate: '',
    additionalNotes: '',
  });

  const symptoms = [
    'Cough', 'Fever', 'Breathlessness', 'Chest Pain', 'Fatigue',
    'Headache', 'Sore Throat', 'Runny Nose', 'Body Aches',
    'Loss of Taste', 'Loss of Smell', 'Nausea', 'Vomiting',
    'Diarrhea', 'Chills', 'Night Sweats'
  ];

  const comorbidities = [
    'Diabetes', 'Hypertension', 'Heart Disease', 'Asthma',
    'COPD', 'Kidney Disease', 'Liver Disease', 'Cancer',
    'Immunocompromised', 'Obesity', 'Smoking History'
  ];

  const severityLevels = ['Mild', 'Moderate', 'Severe', 'Critical'];

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const toggleComorbidity = (comorbidity) => {
    setSelectedComorbidities(prev => 
      prev.includes(comorbidity) 
        ? prev.filter(c => c !== comorbidity)
        : [...prev, comorbidity]
    );
  };

  const handleSubmit = () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert('Error', 'Please select at least one symptom.');
      return;
    }

    if (!formData.duration || !formData.severity) {
      Alert.alert('Error', 'Please fill in duration and severity.');
      return;
    }

    const submissionData = {
      symptoms: selectedSymptoms,
      comorbidities: selectedComorbidities,
      ...formData
    };

    console.log('Symptom and clinical data:', submissionData);
    Alert.alert(
      'Success',
      'Symptom and clinical information recorded successfully!',
      [
        { text: 'Continue to Diagnosis', onPress: () => router.push('/diagnosis-results') },
        { text: 'Stay Here', style: 'cancel' }
      ]
    );
  };

  const renderMultiSelect = (title, items, selectedItems, toggleFunction) => (
    <View style={commonStyles.section}>
      <Text style={commonStyles.subtitle}>{title}</Text>
      <View style={commonStyles.rowWrap}>
        {items.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              commonStyles.chip,
              selectedItems.includes(item) && commonStyles.chipSelected
            ]}
            onPress={() => toggleFunction(item)}
          >
            <Text style={[
              commonStyles.chipText,
              selectedItems.includes(item) && { color: colors.backgroundAlt }
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSeveritySelector = () => (
    <View style={commonStyles.section}>
      <Text style={commonStyles.label}>Severity Level *</Text>
      <View style={commonStyles.rowWrap}>
        {severityLevels.map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              commonStyles.chip,
              formData.severity === level && commonStyles.chipSelected
            ]}
            onPress={() => updateFormData('severity', level)}
          >
            <Text style={[
              commonStyles.chipText,
              formData.severity === level && { color: colors.backgroundAlt }
            ]}>
              {level}
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
        <Text style={commonStyles.headerTitle}>Symptom & Clinical Info</Text>
      </View>

      <ScrollView style={commonStyles.container} contentContainerStyle={commonStyles.scrollContent}>
        <View style={commonStyles.card}>
          <View style={[commonStyles.centerContent, { marginBottom: 24 }]}>
            <Ionicons name="clipboard" size={48} color={colors.primary} />
            <Text style={[commonStyles.subtitle, { textAlign: 'center', marginTop: 16 }]}>
              Patient Symptoms & Clinical Assessment
            </Text>
          </View>

          {/* Symptoms Selection */}
          {renderMultiSelect('Current Symptoms *', symptoms, selectedSymptoms, toggleSymptom)}

          {/* Duration and Severity */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Symptom Duration *</Text>
            <TextInput
              style={commonStyles.input}
              value={formData.duration}
              onChangeText={(value) => updateFormData('duration', value)}
              placeholder="e.g., 3 days, 1 week, 2 months"
              placeholderTextColor={colors.textLight}
            />
          </View>

          {renderSeveritySelector()}

          {/* Vital Signs */}
          <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 16 }]}>Vital Signs</Text>
          
          <View style={commonStyles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={commonStyles.label}>Temperature (°F)</Text>
              <TextInput
                style={commonStyles.input}
                value={formData.temperature}
                onChangeText={(value) => updateFormData('temperature', value)}
                placeholder="98.6"
                placeholderTextColor={colors.textLight}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={commonStyles.label}>Heart Rate (bpm)</Text>
              <TextInput
                style={commonStyles.input}
                value={formData.heartRate}
                onChangeText={(value) => updateFormData('heartRate', value)}
                placeholder="72"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={commonStyles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={commonStyles.label}>Blood Pressure</Text>
              <TextInput
                style={commonStyles.input}
                value={formData.bloodPressure}
                onChangeText={(value) => updateFormData('bloodPressure', value)}
                placeholder="120/80"
                placeholderTextColor={colors.textLight}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={commonStyles.label}>Oxygen Saturation (%)</Text>
              <TextInput
                style={commonStyles.input}
                value={formData.oxygenSaturation}
                onChangeText={(value) => updateFormData('oxygenSaturation', value)}
                placeholder="98"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={commonStyles.label}>Respiratory Rate (breaths/min)</Text>
          <TextInput
            style={commonStyles.input}
            value={formData.respiratoryRate}
            onChangeText={(value) => updateFormData('respiratoryRate', value)}
            placeholder="16"
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
          />

          {/* Comorbidities */}
          {renderMultiSelect('Comorbidities & Medical History', comorbidities, selectedComorbidities, toggleComorbidity)}

          {/* Additional Notes */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Additional Clinical Notes</Text>
            <TextInput
              style={commonStyles.inputMultiline}
              value={formData.additionalNotes}
              onChangeText={(value) => updateFormData('additionalNotes', value)}
              placeholder="Any additional observations, patient complaints, or relevant medical history..."
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Summary */}
          {selectedSymptoms.length > 0 && (
            <View style={[commonStyles.card, { backgroundColor: colors.background }]}>
              <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>Summary</Text>
              <Text style={commonStyles.text}>
                <Text style={{ fontWeight: '600' }}>Symptoms: </Text>
                {selectedSymptoms.join(', ')}
              </Text>
              {selectedComorbidities.length > 0 && (
                <Text style={[commonStyles.text, { marginTop: 8 }]}>
                  <Text style={{ fontWeight: '600' }}>Comorbidities: </Text>
                  {selectedComorbidities.join(', ')}
                </Text>
              )}
              {formData.severity && (
                <Text style={[commonStyles.text, { marginTop: 8 }]}>
                  <Text style={{ fontWeight: '600' }}>Severity: </Text>
                  {formData.severity}
                </Text>
              )}
            </View>
          )}

          <View style={commonStyles.buttonContainer}>
            <Button
              text="Submit Clinical Information"
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
