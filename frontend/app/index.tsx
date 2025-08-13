
import { Text, View, Image } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import Button from '../components/Button';
import { commonStyles, buttonStyles, colors } from '../styles/commonStyles';

export default function MainScreen() {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Auto-redirect to auth screen after a brief delay
    const timer = setTimeout(() => {
      router.replace('/auth');
    }, 2000);

    // Check for install capability
    setCanInstall(false);
    const intervalId = setInterval(() => {
      if (typeof window !== 'undefined' && window.canInstall) {
        setCanInstall(true);
        clearInterval(intervalId);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      clearInterval(intervalId);
    };
  }, []);

  const handleGetStarted = () => {
    router.replace('/auth');
  };

  const handleInstall = () => {
    if (typeof window !== 'undefined' && window.handleInstallClick) {
      window.handleInstallClick();
      setCanInstall(false);
    }
  };

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.content}>
        <View style={commonStyles.centerContent}>
          <Image
            source={require('../assets/images/final_quest_240x240.png')}
            style={{ width: 120, height: 120, tintColor: colors.primary }}
            resizeMode="contain"
          />
          <Text style={[commonStyles.title, { color: colors.primary, marginTop: 24 }]}>
            MedDiagnosis AI
          </Text>
          <Text style={[commonStyles.text, { textAlign: 'center', marginBottom: 32 }]}>
            AI-powered respiratory disease diagnosis and personalized treatment system for healthcare professionals
          </Text>
          
          <View style={[commonStyles.buttonContainer, { width: '100%', maxWidth: 300 }]}>
            <Button
              text="Get Started"
              onPress={handleGetStarted}
              style={buttonStyles.primary}
              textStyle={{ color: colors.backgroundAlt, fontWeight: '600' }}
            />
            
            {canInstall && (
              <Button
                text="Install App"
                onPress={handleInstall}
                style={buttonStyles.secondary}
                textStyle={{ color: colors.primary, fontWeight: '600' }}
              />
            )}
          </View>
          
          <Text style={[commonStyles.textLight, { textAlign: 'center', marginTop: 24, fontSize: 12 }]}>
            For authorized healthcare personnel only
          </Text>
        </View>
      </View>
    </View>
  );
}
