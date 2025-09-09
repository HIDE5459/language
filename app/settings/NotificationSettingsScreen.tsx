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
import DateTimePicker from '@react-native-community/datetimepicker';
import { notificationManager, NotificationSettings } from '../../lib/notifications';

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    dailyTime: '20:00',
    frequency: 'daily',
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    soundEnabled: true,
    vibrationEnabled: true,
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const loadedSettings = await notificationManager.getSettings();
    setSettings(loadedSettings);
    
    // 時間をDateオブジェクトに変換
    const [hours, minutes] = loadedSettings.dailyTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    setSelectedTime(date);
  };

  const toggleNotifications = async (enabled: boolean) => {
    const newSettings = { ...settings, enabled };
    setSettings(newSettings);
    await notificationManager.updateSettings(newSettings);
    
    if (enabled) {
      const hasPermission = await notificationManager.checkPermissions();
      if (!hasPermission) {
        Alert.alert(
          '通知の権限が必要です',
          '設定アプリから通知を許可してください',
          [{ text: 'OK' }]
        );
        setSettings({ ...settings, enabled: false });
      }
    }
  };

  const updateFrequency = async (frequency: NotificationSettings['frequency']) => {
    const newSettings = { ...settings, frequency };
    setSettings(newSettings);
    await notificationManager.updateSettings(newSettings);
  };

  const toggleWeekday = async (weekday: number) => {
    const newWeekdays = settings.weekdays.includes(weekday)
      ? settings.weekdays.filter(d => d !== weekday)
      : [...settings.weekdays, weekday].sort();
    
    if (newWeekdays.length === 0) {
      Alert.alert('エラー', '少なくとも1つの曜日を選択してください');
      return;
    }
    
    const newSettings = { ...settings, weekdays: newWeekdays };
    setSettings(newSettings);
    await notificationManager.updateSettings(newSettings);
  };

  const toggleSound = async (soundEnabled: boolean) => {
    const newSettings = { ...settings, soundEnabled };
    setSettings(newSettings);
    await notificationManager.updateSettings(newSettings);
  };

  const toggleVibration = async (vibrationEnabled: boolean) => {
    const newSettings = { ...settings, vibrationEnabled };
    setSettings(newSettings);
    await notificationManager.updateSettings(newSettings);
  };

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    
    if (selectedDate && event.type !== 'dismissed') {
      setSelectedTime(selectedDate);
      
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const dailyTime = `${hours}:${minutes}`;
      
      const newSettings = { ...settings, dailyTime };
      setSettings(newSettings);
      await notificationManager.updateSettings(newSettings);
    }
  };

  const sendTestNotification = async () => {
    try {
      await notificationManager.sendTestNotification();
      Alert.alert('テスト通知', 'テスト通知を送信しました');
    } catch (error) {
      Alert.alert('エラー', '通知の送信に失敗しました。権限を確認してください。');
    }
  };

  const renderFrequencyOption = (
    value: NotificationSettings['frequency'],
    label: string
  ) => (
    <TouchableOpacity
      style={[
        styles.frequencyOption,
        settings.frequency === value && styles.frequencyOptionActive,
      ]}
      onPress={() => updateFrequency(value)}
    >
      <Text
        style={[
          styles.frequencyText,
          settings.frequency === value && styles.frequencyTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderWeekdaySelector = () => (
    <View style={styles.weekdayContainer}>
      {WEEKDAY_LABELS.map((label, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.weekdayButton,
            settings.weekdays.includes(index) && styles.weekdayButtonActive,
          ]}
          onPress={() => toggleWeekday(index)}
        >
          <Text
            style={[
              styles.weekdayText,
              settings.weekdays.includes(index) && styles.weekdayTextActive,
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>通知設定</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* メイン通知スイッチ */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <Text style={styles.sectionTitle}>通知を有効にする</Text>
            <Switch
              value={settings.enabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
              thumbColor={settings.enabled ? '#7CB342' : '#FAFAFA'}
            />
          </View>
          <Text style={styles.sectionDescription}>
            みさきから定期的にメッセージが届きます
          </Text>
        </View>
        
        {settings.enabled && (
          <>
            {/* 通知時刻 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>通知時刻</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.timeText}>{settings.dailyTime}</Text>
              </TouchableOpacity>
              
              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  is24Hour={true}
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </View>
            
            {/* 頻度設定 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>通知頻度</Text>
              <View style={styles.frequencyContainer}>
                {renderFrequencyOption('daily', '1日1回')}
                {renderFrequencyOption('twice', '1日2回')}
                {renderFrequencyOption('thrice', '1日3回')}
                {renderFrequencyOption('disabled', 'オフ')}
              </View>
            </View>
            
            {/* 曜日設定 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>曜日設定</Text>
              {renderWeekdaySelector()}
            </View>
            
            {/* サウンド設定 */}
            <View style={styles.section}>
              <View style={styles.switchRow}>
                <Text style={styles.optionLabel}>サウンド</Text>
                <Switch
                  value={settings.soundEnabled}
                  onValueChange={toggleSound}
                  trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
                  thumbColor={settings.soundEnabled ? '#7CB342' : '#FAFAFA'}
                />
              </View>
            </View>
            
            {/* バイブレーション設定 */}
            {Platform.OS === 'ios' && (
              <View style={styles.section}>
                <View style={styles.switchRow}>
                  <Text style={styles.optionLabel}>バイブレーション</Text>
                  <Switch
                    value={settings.vibrationEnabled}
                    onValueChange={toggleVibration}
                    trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
                    thumbColor={settings.vibrationEnabled ? '#7CB342' : '#FAFAFA'}
                  />
                </View>
              </View>
            )}
          </>
        )}
        
        {/* テスト通知 */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={sendTestNotification}
          >
            <Text style={styles.testButtonText}>テスト通知を送信</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            通知が届かない場合は、端末の設定から通知を許可してください。
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 16,
    color: '#333333',
  },
  timeButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  frequencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  frequencyOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    marginBottom: 8,
  },
  frequencyOptionActive: {
    backgroundColor: '#7CB342',
  },
  frequencyText: {
    fontSize: 14,
    color: '#666666',
  },
  frequencyTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  weekdayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  weekdayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekdayButtonActive: {
    backgroundColor: '#7CB342',
  },
  weekdayText: {
    fontSize: 14,
    color: '#666666',
  },
  weekdayTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#7CB342',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    margin: 16,
    padding: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#F57C00',
    textAlign: 'center',
  },
});