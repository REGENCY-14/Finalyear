
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';
import Button from '../components/Button';

export default function AuthScreen() {
  const handleSignIn = () => {
    router.push('/signin');
  };

  const handleRegister = () => {
    router.push('/medical-personnel-registration');
  };

  return (
    <ScrollView style={commonStyles.container} contentContainerStyle={commonStyles.scrollContent}>
      <View style={commonStyles.centerContent}>
        <View style={[commonStyles.card, { width: '100%', maxWidth: 400 }]}>
          <View style={[commonStyles.centerContent, { marginBottom: 32 }]}>
            <Ionicons name="medical" size={64} color={colors.primary} />
            <Text style={[commonStyles.title, { marginTop: 16 }]}>
              MedDiagnosis AI
            </Text>
            <Text style={commonStyles.textLight}>
              Respiratory Disease Diagnosis System
            </Text>
          </View>

          <Text style={commonStyles.subtitle}>
            Choose Your Action
          </Text>

          <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: 32 }]}>
            Access your medical dashboard or create a new account for medical personnel
          </Text>

          <View style={commonStyles.buttonContainer}>
            <Button
              text="Sign In"
              onPress={handleSignIn}
              style={buttonStyles.primary}
              textStyle={{ color: colors.backgroundAlt, fontWeight: '600' }}
            />

            <Button
              text="Register New Personnel"
              onPress={handleRegister}
              style={buttonStyles.secondary}
              textStyle={{ color: colors.primary, fontWeight: '600' }}
            />
          </View>

          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Text style={[commonStyles.textLight, { textAlign: 'center', fontSize: 12 }]}>
              For authorized healthcare personnel only
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
