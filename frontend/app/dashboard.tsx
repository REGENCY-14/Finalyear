
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles, colors } from '../styles/commonStyles';

const DashboardCard = ({ title, description, icon, onPress, color = colors.primary }) => (
  <TouchableOpacity style={[commonStyles.card, { borderLeftWidth: 4, borderLeftColor: color }]} onPress={onPress}>
    <View style={commonStyles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[commonStyles.subtitle, { marginBottom: 8 }]}>{title}</Text>
        <Text style={commonStyles.textLight}>{description}</Text>
      </View>
      <Ionicons name={icon} size={32} color={color} />
    </View>
  </TouchableOpacity>
);

export default function Dashboard() {
  const handleLogout = () => {
    console.log('Logging out...');
    router.replace('/auth');
  };

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.headerContainer}>
        <Text style={commonStyles.headerTitle}>Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={commonStyles.backButton}>
          <Ionicons name="log-out-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={commonStyles.container} contentContainerStyle={commonStyles.scrollContent}>
        <View style={[commonStyles.centerContent, { marginBottom: 32 }]}>
          <Ionicons name="medical" size={48} color={colors.primary} />
          <Text style={[commonStyles.title, { marginTop: 16 }]}>
            Welcome, Dr. Smith
          </Text>
          <Text style={commonStyles.textLight}>
            Respiratory Disease Diagnosis System
          </Text>
        </View>

        <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>Quick Actions</Text>

        <DashboardCard
          title="New Patient Registration"
          description="Register a new patient and create their medical profile"
          icon="person-add"
          onPress={() => router.push('/patient-registration')}
          color={colors.primary}
        />

        <DashboardCard
          title="X-ray Analysis"
          description="Upload and analyze chest X-ray scans for diagnosis"
          icon="camera"
          onPress={() => router.push('/xray-upload')}
          color={colors.secondary}
        />

        <DashboardCard
          title="Symptom Assessment"
          description="Record patient symptoms and clinical information"
          icon="clipboard"
          onPress={() => router.push('/symptom-input')}
          color={colors.accent}
        />

        <DashboardCard
          title="View Diagnosis Results"
          description="Review AI-generated diagnosis and treatment recommendations"
          icon="document-text"
          onPress={() => router.push('/diagnosis-results')}
          color={colors.success}
        />

        <View style={[commonStyles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>Recent Activity</Text>
          <View style={{ gap: 12 }}>
            <View style={commonStyles.row}>
              <Text style={commonStyles.text}>Patient: John Doe</Text>
              <Text style={commonStyles.textLight}>2 hours ago</Text>
            </View>
            <View style={commonStyles.row}>
              <Text style={commonStyles.text}>X-ray Analysis: Jane Smith</Text>
              <Text style={commonStyles.textLight}>4 hours ago</Text>
            </View>
            <View style={commonStyles.row}>
              <Text style={commonStyles.text}>Diagnosis: Mike Johnson</Text>
              <Text style={commonStyles.textLight}>1 day ago</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
