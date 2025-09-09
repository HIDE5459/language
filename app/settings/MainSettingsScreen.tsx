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

interface AppSettings {
  strictMode: boolean;
  blockExplicitContent: boolean;
  blockRomanticContent: boolean;
  allowMildSuggestions: boolean;
  dataCollectionEnabled: boolean;
  analyticsEnabled: boolean;
}

export default function MainSettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({
    strictMode: true,
    blockExplicitContent: true,
    blockRomanticContent: false,
    allowMildSuggestions: true,
    dataCollectionEnabled: false,
    analyticsEnabled: false,
  });

  const [version] = useState('1.0.0 (MVP)');
  const [buildNumber] = useState('20250908');

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
      '全データ削除',
      'すべての会話履歴、記憶、設定が削除されます。この操作は取り消せません。本当に削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            await memoryManager.clearAllMemories();
            await notificationManager.cancelAllNotifications();
            Alert.alert('完了', 'すべてのデータが削除されました');
          },
        },
      ]
    );
  };

  const exportData = async () => {
    try {
      const memoryData = await memoryManager.exportMemoryData();
      // 実際の実装では、データを共有やクラウドにバックアップ
      Alert.alert('エクスポート', 'データのエクスポート機能は開発中です');
    } catch (error) {
      Alert.alert('エラー', 'データのエクスポートに失敗しました');
    }
  };

  const showAbout = () => {
    Alert.alert(
      'AI恋人チャットアプリについて',
      `バージョン: ${version}\nビルド: ${buildNumber}\n\n日本のオタク層向けの健全な対話型AIアプリです。ときめきメモリアル風の優しい会話を楽しめます。\n\n全年齢向けで安全な設計になっています。`,
      [{ text: 'OK' }]
    );
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
        <Text style={styles.headerTitle}>設定</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* セーフティ設定セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ セーフティ設定</Text>
          
          {renderSettingRow(
            '厳格モード',
            '全年齢向けの最も安全な設定にします',
            settings.strictMode,
            () => updateSetting('strictMode', !settings.strictMode)
          )}
          
          {renderSettingRow(
            '露骨なコンテンツをブロック',
            '成人向けの内容を自動的にブロックします',
            settings.blockExplicitContent,
            () => updateSetting('blockExplicitContent', !settings.blockExplicitContent)
          )}
          
          {renderSettingRow(
            'ロマンチックコンテンツを制限',
            '恋愛的な会話を制限します（ときメモ要素も含む）',
            settings.blockRomanticContent,
            () => updateSetting('blockRomanticContent', !settings.blockRomanticContent),
            true
          )}
          
          {renderSettingRow(
            '軽微な提案を許可',
            'デートの提案など軽度な内容を許可します',
            settings.allowMildSuggestions,
            () => updateSetting('allowMildSuggestions', !settings.allowMildSuggestions)
          )}
        </View>
        
        {/* プライバシー設定セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 プライバシー設定</Text>
          
          {renderSettingRow(
            'データ収集',
            '改善のための匿名データ収集を許可します',
            settings.dataCollectionEnabled,
            () => updateSetting('dataCollectionEnabled', !settings.dataCollectionEnabled)
          )}
          
          {renderSettingRow(
            '分析データ送信',
            'アプリの使用状況分析のためのデータ送信',
            settings.analyticsEnabled,
            () => updateSetting('analyticsEnabled', !settings.analyticsEnabled)
          )}
        </View>
        
        {/* データ管理セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 データ管理</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={exportData}>
            <Text style={styles.actionButtonText}>データをエクスポート</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={clearAllData}
          >
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
              全データを削除
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* その他セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ その他</Text>
          
          <TouchableOpacity style={styles.infoRow} onPress={showAbout}>
            <Text style={styles.infoLabel}>アプリについて</Text>
            <Text style={styles.infoValue}>{version}</Text>
          </TouchableOpacity>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ビルド番号</Text>
            <Text style={styles.infoValue}>{buildNumber}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>対象年齢</Text>
            <Text style={styles.infoValue}>全年齢</Text>
          </View>
        </View>
        
        {/* 免責事項 */}
        <View style={styles.disclaimerSection}>
          <Text style={styles.disclaimerTitle}>⚠️ 重要な注意事項</Text>
          <Text style={styles.disclaimerText}>
            • このアプリは全年齢向けの健全な会話を目的としています{'\n'}
            • 不適切な利用は禁止されています{'\n'}
            • AI応答は参考程度に留め、重要な判断には使用しないでください{'\n'}
            • メンタルヘルスの問題がある場合は専門機関にご相談ください{'\n'}
            • 個人情報は適切に保護されます
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