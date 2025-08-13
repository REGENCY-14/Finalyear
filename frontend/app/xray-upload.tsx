
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';
import Button from '../components/Button';

export default function XrayUpload() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const pickImageFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setAnalysisComplete(false);
      console.log('X-ray image selected from gallery:', result.assets[0].uri);
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
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setAnalysisComplete(false);
      console.log('X-ray photo taken:', result.assets[0].uri);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setAnalysisComplete(false);
        console.log('X-ray document selected:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const submitForDiagnosis = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an X-ray image first.');
      return;
    }

    setIsAnalyzing(true);
    console.log('Submitting X-ray for AI analysis:', selectedImage);

    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
      Alert.alert(
        'Analysis Complete',
        'X-ray has been analyzed successfully. Proceed to view results.',
        [
          { text: 'View Results', onPress: () => router.push('/diagnosis-results') },
          { text: 'Stay Here', style: 'cancel' }
        ]
      );
    }, 3000);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setAnalysisComplete(false);
    setIsAnalyzing(false);
  };

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={commonStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>X-ray Upload & Analysis</Text>
      </View>

      <ScrollView style={commonStyles.container} contentContainerStyle={commonStyles.scrollContent}>
        <View style={commonStyles.card}>
          <View style={[commonStyles.centerContent, { marginBottom: 24 }]}>
            <Ionicons name="camera" size={48} color={colors.primary} />
            <Text style={[commonStyles.subtitle, { textAlign: 'center', marginTop: 16 }]}>
              Upload Chest X-ray Scan
            </Text>
            <Text style={[commonStyles.textLight, { textAlign: 'center' }]}>
              Select or capture a chest X-ray image for AI-powered analysis
            </Text>
          </View>

          {/* Image Upload Area */}
          {selectedImage ? (
            <View style={commonStyles.centerContent}>
              <Image source={{ uri: selectedImage }} style={[commonStyles.imagePreview, { width: 300, height: 240 }]} />
              <View style={[commonStyles.row, { gap: 12, marginTop: 16 }]}>
                <Button
                  text="Change Image"
                  onPress={clearImage}
                  style={[buttonStyles.secondary, { flex: 1 }]}
                  textStyle={{ color: colors.primary, fontWeight: '600' }}
                />
                {analysisComplete && (
                  <View style={[commonStyles.chip, { backgroundColor: colors.success }]}>
                    <Text style={commonStyles.chipText}>✓ Analyzed</Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <View style={commonStyles.uploadArea}>
              <Ionicons name="cloud-upload-outline" size={64} color={colors.textLight} />
              <Text style={[commonStyles.text, { textAlign: 'center', marginTop: 16 }]}>
                No X-ray image selected
              </Text>
              <Text style={[commonStyles.textLight, { textAlign: 'center', marginTop: 8 }]}>
                Choose an option below to upload an image
              </Text>
            </View>
          )}

          {/* Upload Options */}
          <View style={[commonStyles.section, { marginTop: 24 }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>Upload Options</Text>
            
            <View style={{ gap: 12 }}>
              <Button
                text="📷 Take Photo"
                onPress={takePhoto}
                style={[buttonStyles.secondary, commonStyles.row]}
                textStyle={{ color: colors.primary, fontWeight: '600' }}
              />
              
              <Button
                text="🖼️ Choose from Gallery"
                onPress={pickImageFromGallery}
                style={[buttonStyles.secondary, commonStyles.row]}
                textStyle={{ color: colors.primary, fontWeight: '600' }}
              />
              
              <Button
                text="📁 Select File"
                onPress={pickDocument}
                style={[buttonStyles.secondary, commonStyles.row]}
                textStyle={{ color: colors.primary, fontWeight: '600' }}
              />
            </View>
          </View>

          {/* Analysis Information */}
          <View style={[commonStyles.card, { backgroundColor: colors.background, marginTop: 24 }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>AI Analysis Information</Text>
            <View style={{ gap: 8 }}>
              <Text style={commonStyles.text}>• High-resolution images provide better analysis</Text>
              <Text style={commonStyles.text}>• Supported formats: JPEG, PNG, DICOM</Text>
              <Text style={commonStyles.text}>• Analysis typically takes 30-60 seconds</Text>
              <Text style={commonStyles.text}>• Results include confidence scores and recommendations</Text>
            </View>
          </View>

          {/* Submit Button */}
          <View style={commonStyles.buttonContainer}>
            <Button
              text={isAnalyzing ? 'Analyzing...' : 'Submit for Diagnosis'}
              onPress={submitForDiagnosis}
              style={[
                buttonStyles.primary,
                (!selectedImage || isAnalyzing) && { backgroundColor: colors.textLight }
              ]}
              textStyle={{ 
                color: colors.backgroundAlt, 
                fontWeight: '600',
                opacity: (!selectedImage || isAnalyzing) ? 0.7 : 1
              }}
            />

            {isAnalyzing && (
              <View style={[commonStyles.centerContent, { marginTop: 16 }]}>
                <Text style={[commonStyles.textLight, { textAlign: 'center' }]}>
                  AI is analyzing the X-ray image...
                </Text>
                <Text style={[commonStyles.textLight, { textAlign: 'center', marginTop: 4 }]}>
                  This may take a few moments
                </Text>
              </View>
            )}

            {analysisComplete && (
              <Button
                text="View Diagnosis Results"
                onPress={() => router.push('/diagnosis-results')}
                style={[buttonStyles.success, { marginTop: 12 }]}
                textStyle={{ color: colors.backgroundAlt, fontWeight: '600' }}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
