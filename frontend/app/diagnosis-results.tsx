
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { commonStyles, colors, buttonStyles } from '../styles/commonStyles';
import Button from '../components/Button';

export default function DiagnosisResults() {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Mock diagnosis data
  const diagnosisData = {
    patientName: 'John Doe',
    patientAge: 45,
    diagnosisDate: new Date().toLocaleDateString(),
    primaryDiagnosis: 'Pneumonia',
    confidence: 87,
    riskLevel: 'Medium',
    symptoms: ['Cough', 'Fever', 'Breathlessness', 'Chest Pain'],
    findings: [
      'Consolidation in right lower lobe',
      'Increased opacity in lung fields',
      'No pleural effusion detected',
      'Heart size within normal limits'
    ],
    recommendations: [
      'Antibiotic therapy (Amoxicillin 500mg, 3x daily for 7 days)',
      'Rest and increased fluid intake',
      'Follow-up chest X-ray in 2 weeks',
      'Monitor temperature and symptoms',
      'Return if symptoms worsen'
    ],
    followUp: 'Schedule follow-up appointment in 1 week',
    medications: [
      { name: 'Amoxicillin', dosage: '500mg', frequency: '3x daily', duration: '7 days' },
      { name: 'Ibuprofen', dosage: '400mg', frequency: 'As needed', duration: 'For fever/pain' },
      { name: 'Cough Syrup', dosage: '10ml', frequency: '2x daily', duration: '5 days' }
    ]
  };

  const getRiskColor = (risk) => {
    switch (risk.toLowerCase()) {
      case 'low': return colors.success;
      case 'medium': return colors.warning;
      case 'high': return colors.danger;
      default: return colors.textLight;
    }
  };

  const getRiskStyle = (risk) => {
    switch (risk.toLowerCase()) {
      case 'low': return commonStyles.riskLow;
      case 'medium': return commonStyles.riskMedium;
      case 'high': return commonStyles.riskHigh;
      default: return {};
    }
  };

  const generatePDFReport = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 20px; }
              .title { color: #2E86AB; font-size: 24px; font-weight: bold; }
              .subtitle { color: #2C3E50; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
              .risk-${diagnosisData.riskLevel.toLowerCase()} { 
                padding: 10px; 
                border-radius: 5px; 
                background-color: ${diagnosisData.riskLevel.toLowerCase() === 'low' ? '#D4EDDA' : 
                                   diagnosisData.riskLevel.toLowerCase() === 'medium' ? '#FFF3CD' : '#F8D7DA'};
              }
              ul { padding-left: 20px; }
              li { margin-bottom: 5px; }
              .medication { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">MedDiagnosis AI - Diagnosis Report</h1>
              <p>Generated on ${diagnosisData.diagnosisDate}</p>
            </div>
            
            <div class="section">
              <h2 class="subtitle">Patient Information</h2>
              <p><strong>Name:</strong> ${diagnosisData.patientName}</p>
              <p><strong>Age:</strong> ${diagnosisData.patientAge}</p>
              <p><strong>Date:</strong> ${diagnosisData.diagnosisDate}</p>
            </div>
            
            <div class="section">
              <h2 class="subtitle">Diagnosis</h2>
              <p><strong>Primary Diagnosis:</strong> ${diagnosisData.primaryDiagnosis}</p>
              <p><strong>Confidence Level:</strong> ${diagnosisData.confidence}%</p>
              <div class="risk-${diagnosisData.riskLevel.toLowerCase()}">
                <strong>Risk Level:</strong> ${diagnosisData.riskLevel}
              </div>
            </div>
            
            <div class="section">
              <h2 class="subtitle">Clinical Findings</h2>
              <ul>
                ${diagnosisData.findings.map(finding => `<li>${finding}</li>`).join('')}
              </ul>
            </div>
            
            <div class="section">
              <h2 class="subtitle">Treatment Recommendations</h2>
              <ul>
                ${diagnosisData.recommendations.map(rec => `<li>${rec}</li>`).join('')}
              </ul>
            </div>
            
            <div class="section">
              <h2 class="subtitle">Prescribed Medications</h2>
              ${diagnosisData.medications.map(med => `
                <div class="medication">
                  <strong>${med.name}</strong><br>
                  Dosage: ${med.dosage}<br>
                  Frequency: ${med.frequency}<br>
                  Duration: ${med.duration}
                </div>
              `).join('')}
            </div>
            
            <div class="section">
              <h2 class="subtitle">Follow-up Care</h2>
              <p>${diagnosisData.followUp}</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      console.log('PDF generated:', uri);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Diagnosis Report'
        });
      } else {
        Alert.alert('Success', 'PDF report generated successfully!');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF report.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={commonStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Diagnosis Results</Text>
        <TouchableOpacity onPress={() => router.push('/dashboard')} style={commonStyles.backButton}>
          <Ionicons name="home" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={commonStyles.container} contentContainerStyle={commonStyles.scrollContent}>
        {/* Header */}
        <View style={[commonStyles.card, commonStyles.centerContent]}>
          <Ionicons name="document-text" size={48} color={colors.primary} />
          <Text style={[commonStyles.title, { marginTop: 16 }]}>AI Diagnosis Report</Text>
          <Text style={commonStyles.textLight}>Generated on {diagnosisData.diagnosisDate}</Text>
        </View>

        {/* Patient Info */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Patient Information</Text>
          <View style={commonStyles.row}>
            <Text style={commonStyles.text}>{diagnosisData.patientName}</Text>
            <Text style={commonStyles.textLight}>Age: {diagnosisData.patientAge}</Text>
          </View>
        </View>

        {/* Primary Diagnosis */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Primary Diagnosis</Text>
          <Text style={[commonStyles.title, { fontSize: 24, color: colors.primary, marginBottom: 16 }]}>
            {diagnosisData.primaryDiagnosis}
          </Text>
          
          <View style={commonStyles.row}>
            <View style={[commonStyles.chip, { backgroundColor: colors.primary }]}>
              <Text style={commonStyles.chipText}>Confidence: {diagnosisData.confidence}%</Text>
            </View>
            <View style={[commonStyles.chip, getRiskStyle(diagnosisData.riskLevel), { backgroundColor: getRiskColor(diagnosisData.riskLevel) }]}>
              <Text style={[commonStyles.chipText, { color: colors.backgroundAlt }]}>
                Risk: {diagnosisData.riskLevel}
              </Text>
            </View>
          </View>
        </View>

        {/* Clinical Findings */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Clinical Findings</Text>
          {diagnosisData.findings.map((finding, index) => (
            <View key={index} style={[commonStyles.row, { marginBottom: 8 }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[commonStyles.text, { marginLeft: 12, flex: 1 }]}>{finding}</Text>
            </View>
          ))}
        </View>

        {/* Treatment Recommendations */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Treatment Recommendations</Text>
          {diagnosisData.recommendations.map((recommendation, index) => (
            <View key={index} style={[commonStyles.row, { marginBottom: 8, alignItems: 'flex-start' }]}>
              <Text style={[commonStyles.text, { color: colors.primary, marginRight: 8 }]}>•</Text>
              <Text style={[commonStyles.text, { flex: 1 }]}>{recommendation}</Text>
            </View>
          ))}
        </View>

        {/* Medications */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.subtitle}>Prescribed Medications</Text>
          {diagnosisData.medications.map((medication, index) => (
            <View key={index} style={[commonStyles.card, { backgroundColor: colors.background, marginBottom: 12 }]}>
              <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                {medication.name}
              </Text>
              <Text style={commonStyles.textLight}>Dosage: {medication.dosage}</Text>
              <Text style={commonStyles.textLight}>Frequency: {medication.frequency}</Text>
              <Text style={commonStyles.textLight}>Duration: {medication.duration}</Text>
            </View>
          ))}
        </View>

        {/* Follow-up Care */}
        <View style={[commonStyles.card, { backgroundColor: colors.background }]}>
          <Text style={commonStyles.subtitle}>Follow-up Care</Text>
          <View style={commonStyles.row}>
            <Ionicons name="calendar" size={24} color={colors.primary} />
            <Text style={[commonStyles.text, { marginLeft: 12, flex: 1 }]}>
              {diagnosisData.followUp}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={commonStyles.buttonContainer}>
          <Button
            text={isGeneratingPDF ? 'Generating PDF...' : 'Export PDF Report'}
            onPress={generatePDFReport}
            style={[buttonStyles.primary, isGeneratingPDF && { backgroundColor: colors.textLight }]}
            textStyle={{ 
              color: colors.backgroundAlt, 
              fontWeight: '600',
              opacity: isGeneratingPDF ? 0.7 : 1
            }}
          />
          
          <Button
            text="New Patient Assessment"
            onPress={() => router.push('/patient-registration')}
            style={buttonStyles.secondary}
            textStyle={{ color: colors.primary, fontWeight: '600' }}
          />
          
          <Button
            text="Back to Dashboard"
            onPress={() => router.push('/dashboard')}
            style={buttonStyles.secondary}
            textStyle={{ color: colors.primary, fontWeight: '600' }}
          />
        </View>

        {/* Disclaimer */}
        <View style={[commonStyles.card, { backgroundColor: colors.background, marginTop: 24 }]}>
          <Text style={[commonStyles.textLight, { textAlign: 'center', fontSize: 12 }]}>
            ⚠️ This AI-generated diagnosis is for assistance only. Always consult with qualified medical professionals for final diagnosis and treatment decisions.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
