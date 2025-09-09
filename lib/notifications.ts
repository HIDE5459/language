import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { memoryManager } from './memory';

// 通知設定のインターフェース
export interface NotificationSettings {
  enabled: boolean;
  dailyTime: string; // HH:mm format
  frequency: 'daily' | 'twice' | 'thrice' | 'disabled';
  weekdays: number[]; // 0-6 (Sunday-Saturday)
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

// 通知メッセージのテンプレート
const NOTIFICATION_MESSAGES = {
  morning: [
    'おはよう！今日も素敵な一日になりますように✨',
    'おはよう〜！よく眠れた？',
    '今日も頑張ろうね！応援してる！',
    'おはよう！朝ごはんは食べた？',
  ],
  afternoon: [
    'お昼の時間だね！ちゃんと休憩してる？',
    'こんにちは！今日の調子はどう？',
    '少し話そうよ！最近どう過ごしてる？',
    'お疲れさま！ちょっと一息つこう？',
  ],
  evening: [
    '今日もお疲れさま！少し話でもしない？',
    'こんばんは！今日はどんな一日だった？',
    '夜になったね。ゆっくり過ごせてる？',
    '今日も一日お疲れさま。話したいことがあったら聞くよ？',
  ],
  night: [
    'そろそろ寝る時間かな？おやすみなさい🌙',
    '今日も一日お疲れさま。ゆっくり休んでね',
    'もう遅い時間だね。明日も頑張ろう！',
    'おやすみ〜！いい夢見てね',
  ],
};

// 通知マネージャークラス
export class NotificationManager {
  private static instance: NotificationManager;
  private settings: NotificationSettings;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private readonly STORAGE_KEY = '@ai_chat_notification_settings';

  private constructor() {
    this.settings = this.getDefaultSettings();
    this.initializeNotifications();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: false,
      dailyTime: '20:00',
      frequency: 'daily',
      weekdays: [0, 1, 2, 3, 4, 5, 6], // All days
      soundEnabled: true,
      vibrationEnabled: true,
    };
  }

  private async initializeNotifications() {
    // 通知の設定
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: this.settings.soundEnabled,
        shouldSetBadge: false,
      }),
    });

    // 設定をロード
    await this.loadSettings();

    // リスナーの設定
    this.setupListeners();

    // 権限のチェック
    await this.checkPermissions();
  }

  private setupListeners() {
    // 通知を受け取った時のリスナー
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // 通知をタップした時のリスナー
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      // ここでチャット画面に遷移するなどの処理を追加
    });
  }

  async checkPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    return true;
  }

  async scheduleProactiveMessage(time?: string) {
    const hasPermission = await this.checkPermissions();
    if (!hasPermission || !this.settings.enabled) {
      return;
    }

    const scheduledTime = time || this.settings.dailyTime;
    const [hours, minutes] = scheduledTime.split(':').map(Number);

    // メッセージを選択
    const message = this.selectMessageByTime(hours);
    
    // ユーザーの名前を取得
    const longTermMemory = memoryManager.getLongTermMemory();
    const userName = longTermMemory.nicknames.aiToUser;
    const personalizedMessage = userName !== 'あなた' 
      ? message.replace('！', `、${userName}！`)
      : message;

    // 次の通知時間を計算
    const trigger = new Date();
    trigger.setHours(hours);
    trigger.setMinutes(minutes);
    trigger.setSeconds(0);

    // 既に過ぎていたら翌日に設定
    if (trigger.getTime() <= Date.now()) {
      trigger.setDate(trigger.getDate() + 1);
    }

    // 通知をスケジュール
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'みさきからメッセージ',
        body: personalizedMessage,
        sound: this.settings.soundEnabled,
        vibrate: this.settings.vibrationEnabled ? [0, 250, 250, 250] : undefined,
      },
      trigger,
    });
  }

  private selectMessageByTime(hour: number): string {
    let messages: string[];
    
    if (hour >= 5 && hour < 10) {
      messages = NOTIFICATION_MESSAGES.morning;
    } else if (hour >= 10 && hour < 17) {
      messages = NOTIFICATION_MESSAGES.afternoon;
    } else if (hour >= 17 && hour < 21) {
      messages = NOTIFICATION_MESSAGES.evening;
    } else {
      messages = NOTIFICATION_MESSAGES.night;
    }

    return messages[Math.floor(Math.random() * messages.length)];
  }

  async scheduleDailyNotifications() {
    // 既存の通知をキャンセル
    await this.cancelAllNotifications();

    if (!this.settings.enabled) {
      return;
    }

    const frequency = this.settings.frequency;
    const baseTime = this.settings.dailyTime;
    const [baseHours, baseMinutes] = baseTime.split(':').map(Number);

    let times: string[] = [];
    
    switch (frequency) {
      case 'daily':
        times = [baseTime];
        break;
      case 'twice':
        times = [baseTime, `${(baseHours + 12) % 24}:${baseMinutes.toString().padStart(2, '0')}`];
        break;
      case 'thrice':
        times = [
          baseTime,
          `${(baseHours + 8) % 24}:${baseMinutes.toString().padStart(2, '0')}`,
          `${(baseHours + 16) % 24}:${baseMinutes.toString().padStart(2, '0')}`,
        ];
        break;
      case 'disabled':
        return;
    }

    // 各時間に通知をスケジュール
    for (const time of times) {
      for (const weekday of this.settings.weekdays) {
        await this.scheduleWeeklyNotification(time, weekday);
      }
    }
  }

  private async scheduleWeeklyNotification(time: string, weekday: number) {
    const [hours, minutes] = time.split(':').map(Number);
    const message = this.selectMessageByTime(hours);
    
    const longTermMemory = memoryManager.getLongTermMemory();
    const userName = longTermMemory.nicknames.aiToUser;
    const personalizedMessage = userName !== 'あなた' 
      ? message.replace('！', `、${userName}！`)
      : message;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'みさきからメッセージ',
        body: personalizedMessage,
        sound: this.settings.soundEnabled,
      },
      trigger: {
        weekday: weekday + 1, // expo-notifications uses 1-7 for Sunday-Saturday
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  }

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async updateSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
    
    // 通知を再スケジュール
    if (this.settings.enabled) {
      await this.scheduleDailyNotifications();
    } else {
      await this.cancelAllNotifications();
    }
  }

  async getSettings(): Promise<NotificationSettings> {
    return this.settings;
  }

  private async saveSettings() {
    try {
      const jsonValue = JSON.stringify(this.settings);
      await AsyncStorage.setItem(this.STORAGE_KEY, jsonValue);
    } catch (e) {
      console.error('Failed to save notification settings:', e);
    }
  }

  private async loadSettings() {
    try {
      const jsonValue = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (jsonValue != null) {
        this.settings = JSON.parse(jsonValue);
      }
    } catch (e) {
      console.error('Failed to load notification settings:', e);
    }
  }

  // 今すぐテスト通知を送信
  async sendTestNotification() {
    const hasPermission = await this.checkPermissions();
    if (!hasPermission) {
      throw new Error('通知の権限がありません');
    }

    const longTermMemory = memoryManager.getLongTermMemory();
    const userName = longTermMemory.nicknames.aiToUser;
    const message = userName !== 'あなた' 
      ? `テスト通知だよ、${userName}！`
      : 'テスト通知だよ！';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'みさきからメッセージ',
        body: message + ' ちゃんと届いてるかな？',
        sound: this.settings.soundEnabled,
      },
      trigger: {
        seconds: 1,
      },
    });
  }

  // クリーンアップ
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

// シングルトンインスタンスのエクスポート
export const notificationManager = NotificationManager.getInstance();