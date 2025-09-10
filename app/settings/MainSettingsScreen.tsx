import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { safetyFilter } from '../../lib/safety';
import { memoryManager } from '../../lib/memory';
import { notificationManager } from '../../lib/notifications';
import { useLanguage } from '../../lib/i18n';

interface AppSettings {
  strictMode: boolean;
  blockExplicitContent: boolean;
  blockRomanticContent: boolean;
  allowMildSuggestions: boolean;
  dataCollectionEnabled: boolean;
  analyticsEnabled: boolean;
}

export default function MainSettingsScreen() {
  const { t, currentLanguage, supportedLanguages } = useLanguage();
  
  const [settings, setSettings] = useState<AppSettings>({
    strictMode: true,
    blockExplicitContent: true,
    blockRomanticContent: false,
    allowMildSuggestions: true,
    dataCollectionEnabled: false,
    analyticsEnabled: false,
  });

  const [version] = useState('1.0.0 (MVP)');
  const [buildNumber] = useState('20250909');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    // 設定の読み込み（AsyncStorageから）
    // 実際の実装では永続化されたデータを読み込む
  };

  const updateSetting = async (key: keyof AppSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // セーフティフィルターの設定を更新
    safetyFilter.updateSettings({
      strictMode: newSettings.strictMode,
      blockExplicitContent: newSettings.blockExplicitContent,
      blockRomanticContent: newSettings.blockRomanticContent,
      allowMildSuggestions: newSettings.allowMildSuggestions,
    });
    
    // 設定を保存（AsyncStorage）
    // 実際の実装では設定を永続化する
  };

  const clearAllData = () => {
    Alert.alert(
      t('settings.clearAllData'),
      t('settings.clearAllConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await memoryManager.clearAllMemories();
            await notificationManager.cancelAllNotifications();
            Alert.alert(t('common.success'), t('settings.clearComplete'));
          },
        },
      ]
    );
  };

  const exportData = async () => {
    try {
      const memoryData = await memoryManager.exportMemoryData();
      // 実際の実装では、データを共有やクラウドにバックアップ
      Alert.alert(t('settings.exportData'), t('settings.exportInProgress'));
    } catch (error) {
      Alert.alert(t('common.error'), t('settings.exportError'));
    }
  };

  const showAbout = () => {
    Alert.alert(
      t('settings.about'),
      `${t('common.version')}: ${version}\n${t('settings.buildNumber')}: ${buildNumber}\n\n${t('settings.aboutDescription')}`,
      [{ text: t('common.ok') }]
    );
  };

  const navigateToLanguageSettings = () => {
    // 実際の実装では、react-navigationを使用してLanguageSettingsScreenに遷移
    Alert.alert(t('settings.language'), t('settings.languageNavigation'));
  };

  const renderSettingRow = (
    label: string,
    description: string,
    value: boolean,
    onToggle: () => void,
    warning?: boolean
  ) => (
    <View style={[styles.settingRow, warning && styles.warningRow]}>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, warning && styles.warningText]}>
          {label}
        </Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#E0E0E0', true: warning ? '#FFAB91' : '#A5D6A7' }}
        thumbColor={value ? (warning ? '#FF5722' : '#7CB342') : '#FAFAFA'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* 言語設定セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 {t('settings.language')}</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={navigateToLanguageSettings}>
            <Text style={styles.actionButtonText}>
              {t('settings.selectLanguage')} ({supportedLanguages.find(lang => lang.code === currentLanguage)?.nativeName})
            </Text>
          </TouchableOpacity>
        </View>

        {/* セーフティ設定セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ {t('settings.safetySettings')}</Text>
          
          {renderSettingRow(
            t('settings.strictMode'),
            t('settings.strictModeDescription'),
            settings.strictMode,
            () => updateSetting('strictMode', !settings.strictMode)
          )}
          
          {renderSettingRow(
            t('settings.blockExplicit'),
            t('settings.blockExplicitDescription'),
            settings.blockExplicitContent,
            () => updateSetting('blockExplicitContent', !settings.blockExplicitContent)
          )}
          
          {renderSettingRow(
            t('settings.blockRomantic'),
            t('settings.blockRomanticDescription'),
            settings.blockRomanticContent,
            () => updateSetting('blockRomanticContent', !settings.blockRomanticContent),
            true
          )}
          
          {renderSettingRow(
            t('settings.allowSuggestions'),
            t('settings.allowSuggestionsDescription'),
            settings.allowMildSuggestions,
            () => updateSetting('allowMildSuggestions', !settings.allowMildSuggestions)
          )}
        </View>
        
        {/* プライバシー設定セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 {t('settings.privacySettings')}</Text>
          
          {renderSettingRow(
            t('settings.dataCollection'),
            t('settings.dataCollectionDescription'),
            settings.dataCollectionEnabled,
            () => updateSetting('dataCollectionEnabled', !settings.dataCollectionEnabled)
          )}
          
          {renderSettingRow(
            t('settings.analytics'),
            t('settings.analyticsDescription'),
            settings.analyticsEnabled,
            () => updateSetting('analyticsEnabled', !settings.analyticsEnabled)
          )}
        </View>
        
        {/* データ管理セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 {t('settings.dataManagement')}</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={exportData}>
            <Text style={styles.actionButtonText}>{t('settings.exportData')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={clearAllData}
          >
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
              {t('settings.clearAllData')}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* その他セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ {t('settings.other')}</Text>
          
          <TouchableOpacity style={styles.infoRow} onPress={showAbout}>
            <Text style={styles.infoLabel}>{t('settings.about')}</Text>
            <Text style={styles.infoValue}>{version}</Text>
          </TouchableOpacity>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('settings.buildNumber')}</Text>
            <Text style={styles.infoValue}>{buildNumber}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('settings.targetAge')}</Text>
            <Text style={styles.infoValue}>{t('settings.allAges')}</Text>
          </View>
        </View>
        
        {/* 免責事項 */}
        <View style={styles.disclaimerSection}>
          <Text style={styles.disclaimerTitle}>⚠️ {t('safety.importantNotice')}</Text>
          <Text style={styles.disclaimerText}>
            {t('safety.disclaimerText')}
          </Text>
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
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  warningRow: {
    backgroundColor: '#FFF3E0',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  warningText: {
    color: '#E65100',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  actionButton: {
    backgroundColor: '#7CB342',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  dangerButton: {
    backgroundColor: '#D32F2F',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButtonText: {
    color: '#FFFFFF',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#333333',
  },
  infoValue: {
    fontSize: 16,
    color: '#666666',
  },
  disclaimerSection: {
    backgroundColor: '#FFEBEE',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
  },
});