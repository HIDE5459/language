import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useLanguage, SupportedLanguage } from '../../lib/i18n';

export default function LanguageSettingsScreen() {
  const { currentLanguage, changeLanguage, t, supportedLanguages } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(currentLanguage);

  const handleLanguageChange = async (language: SupportedLanguage) => {
    try {
      await changeLanguage(language);
      setSelectedLanguage(language);
      
      Alert.alert(
        t('common.success'),
        t('settings.languageChanged'),
        [{ text: t('common.ok') }]
      );
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('settings.languageChangeError'),
        [{ text: t('common.ok') }]
      );
    }
  };

  const renderLanguageOption = (
    code: SupportedLanguage,
    name: string,
    nativeName: string
  ) => (
    <TouchableOpacity
      key={code}
      style={[
        styles.languageOption,
        selectedLanguage === code && styles.selectedLanguageOption,
      ]}
      onPress={() => handleLanguageChange(code)}
    >
      <View style={styles.languageInfo}>
        <Text
          style={[
            styles.languageName,
            selectedLanguage === code && styles.selectedLanguageText,
          ]}
        >
          {nativeName}
        </Text>
        <Text
          style={[
            styles.languageSubtitle,
            selectedLanguage === code && styles.selectedLanguageText,
          ]}
        >
          {name}
        </Text>
      </View>
      {selectedLanguage === code && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings.language')}</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.selectLanguage')}</Text>
          <Text style={styles.sectionDescription}>
            {t('settings.languageDescription')}
          </Text>
          
          <View style={styles.languageList}>
            {supportedLanguages.map((lang) =>
              renderLanguageOption(lang.code, lang.name, lang.nativeName)
            )}
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>{t('settings.languageInfo')}</Text>
          <Text style={styles.infoText}>
            {t('settings.languageInfoDescription')}
          </Text>
        </View>

        <View style={styles.featureSection}>
          <Text style={styles.featureTitle}>{t('settings.multilingualFeatures')}</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• {t('settings.feature1')}</Text>
            <Text style={styles.featureItem}>• {t('settings.feature2')}</Text>
            <Text style={styles.featureItem}>• {t('settings.feature3')}</Text>
            <Text style={styles.featureItem}>• {t('settings.feature4')}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  header: {
    backgroundColor: '#7CB342',
    paddingTop: Platform.OS === 'ios' ? 0 : 24,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  languageList: {
    marginTop: 8,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedLanguageOption: {
    backgroundColor: '#E8F5E9',
    borderColor: '#7CB342',
    borderWidth: 2,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  languageSubtitle: {
    fontSize: 12,
    color: '#666666',
  },
  selectedLanguageText: {
    color: '#7CB342',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7CB342',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#E3F2FD',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#1976D2',
    lineHeight: 18,
  },
  featureSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  featureList: {
    marginLeft: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 20,
  },
});