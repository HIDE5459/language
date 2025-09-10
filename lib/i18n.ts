// 国際化(i18n)システム
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SupportedLanguage = 'ja' | 'en';

// 翻訳テキスト定義
export const translations = {
  ja: {
    // 共通
    common: {
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      edit: '編集',
      add: '追加',
      ok: 'OK',
      yes: 'はい',
      no: 'いいえ',
      loading: '読み込み中...',
      error: 'エラー',
      success: '成功',
      settings: '設定',
      back: '戻る',
      next: '次へ',
      done: '完了',
      version: 'バージョン',
    },
    
    // チャット画面
    chat: {
      title: 'タケシ',
      subtitle: 'パーソナルトレーナー',
      inputPlaceholder: 'メッセージを入力...',
      voiceButton: '音声入力',
      locationButton: '現在地',
      sendButton: '送信',
      typing: '入力中...',
      greeting: 'お疲れ様です！パーソナルトレーナーのタケシです。あなたの「結果にコミット」を全力でサポートいたします！\n\n今日のお食事はいかがでしたか？写真を送っていただければ、糖質量やカロリーを分析して、目標達成に向けた具体的なアドバイスをさせていただきます。まずは現在の目標を教えてください！',
      errorMessage: '申し訳ございません、エラーが発生いたしました。もう一度お試しください。',
      unsafeContentWarning: '失礼いたします、そのような話題は控えさせていただきます。体作りについてお話ししませんか？',
    },
    
    // 音声機能
    voice: {
      recording: '録音中...',
      processing: '処理中...',
      playButton: '再生',
      stopButton: '停止',
      recordButton: '録音開始',
      stopRecordButton: '録音停止',
      permissionDenied: '音声の権限が必要です',
      recordingError: '録音エラーが発生しました',
      playbackError: '再生エラーが発生しました',
    },
    
    // 記憶管理
    memory: {
      title: '記憶の管理',
      basicSettings: '基本設定',
      preferences: '好み',
      anniversaries: '記念日',
      traits: '特徴',
      nicknames: '呼び名設定',
      aiName: 'AIの名前',
      userName: 'あなたの呼ばれ方',
      aiNamePlaceholder: '例: みさき',
      userNamePlaceholder: '例: 〇〇さん',
      addPreference: '好みを追加',
      addAnniversary: '記念日を追加',
      addTrait: '特徴を追加',
      categoryPlaceholder: 'カテゴリ（例: アニメ）',
      contentPlaceholder: '内容（例: 進撃の巨人）',
      datePlaceholder: '日付（例: 12/25）',
      descriptionPlaceholder: '説明（例: 初めて話した日）',
      recurring: '毎年繰り返し',
      clearAllData: 'すべての記憶を削除',
      clearConfirm: 'すべての記憶を削除してもよろしいですか？この操作は取り消せません。',
      clearComplete: 'すべての記憶を削除しました',
    },
    
    // 通知設定
    notifications: {
      title: '通知設定',
      enable: '通知を有効にする',
      description: 'みさきから定期的にメッセージが届きます',
      time: '通知時刻',
      frequency: '通知頻度',
      weekdays: '曜日設定',
      sound: 'サウンド',
      vibration: 'バイブレーション',
      testNotification: 'テスト通知を送信',
      frequencyDaily: '1日1回',
      frequencyTwice: '1日2回',
      frequencyThrice: '1日3回',
      frequencyOff: 'オフ',
      weekdayLabels: ['日', '月', '火', '水', '木', '金', '土'],
      permissionRequired: '通知の権限が必要です',
      permissionMessage: '設定アプリから通知を許可してください',
      testSent: 'テスト通知を送信しました',
      testError: '通知の送信に失敗しました。権限を確認してください。',
      info: '通知が届かない場合は、端末の設定から通知を許可してください。',
    },
    
    // メイン設定
    settings: {
      title: '設定',
      language: '言語設定',
      safetySettings: 'セーフティ設定',
      privacySettings: 'プライバシー設定',
      dataManagement: 'データ管理',
      other: 'その他',
      strictMode: '厳格モード',
      strictModeDescription: '全年齢向けの最も安全な設定にします',
      blockExplicit: '露骨なコンテンツをブロック',
      blockExplicitDescription: '成人向けの内容を自動的にブロックします',
      blockRomantic: 'ロマンチックコンテンツを制限',
      blockRomanticDescription: '恋愛的な会話を制限します（ときメモ要素も含む）',
      allowSuggestions: '軽微な提案を許可',
      allowSuggestionsDescription: 'デートの提案など軽度な内容を許可します',
      dataCollection: 'データ収集',
      dataCollectionDescription: '改善のための匿名データ収集を許可します',
      analytics: '分析データ送信',
      analyticsDescription: 'アプリの使用状況分析のためのデータ送信',
      exportData: 'データをエクスポート',
      clearAllData: '全データを削除',
      clearAllConfirm: 'すべての会話履歴、記憶、設定が削除されます。この操作は取り消せません。本当に削除しますか？',
      clearComplete: 'すべてのデータが削除されました',
      exportInProgress: 'データのエクスポート機能は開発中です',
      exportError: 'データのエクスポートに失敗しました',
      about: 'アプリについて',
      buildNumber: 'ビルド番号',
      targetAge: '対象年齢',
      allAges: '全年齢',
      selectLanguage: '言語を選択',
      languageDescription: 'アプリで使用する言語を選択してください。設定は即座に反映されます。',
      languageChanged: '言語が変更されました',
      languageChangeError: '言語の変更に失敗しました',
      languageInfo: '言語について',
      languageInfoDescription: 'アプリの表示言語を変更できます。チャット内容やAIの応答言語も自動的に切り替わります。',
      multilingualFeatures: '多言語対応機能',
      feature1: 'すべてのUI要素が選択した言語で表示',
      feature2: 'AIの応答も選択した言語で生成',
      feature3: '通知メッセージも多言語対応',
      feature4: '設定は自動的に保存され、次回起動時に適用',
      aboutDescription: '日本のオタク層向けの健全な対話型AIアプリです。ときめきメモリアル風の優しい会話を楽しめます。全年齢向けで安全な設計になっています。',
      languageNavigation: '言語設定画面への遷移機能は実装中です',
    },
    
    // セーフティメッセージ
    safety: {
      dangerousOperation: '危険な操作',
      importantNotice: '重要な注意事項',
      disclaimerText: `• このアプリは全年齢向けの健全な会話を目的としています\n• 不適切な利用は禁止されています\n• AI応答は参考程度に留め、重要な判断には使用しないでください\n• メンタルヘルスの問題がある場合は専門機関にご相談ください\n• 個人情報は適切に保護されます`,
      mentalHealthSupport: [
        '心配になったよ。辛いときは一人で抱え込まないで、信頼できる人や専門機関に相談してみてね。',
        'そんなふうに思っちゃうこともあるよね。でも、一人じゃないからね。話を聞いてくれる人がきっといるよ。',
        '大丈夫？無理しないで。辛いときは専門の相談窓口もあるから、頼ってもいいんだよ。',
      ],
      safeAlternatives: [
        'もっと他のことについて話そうよ！最近何か面白いことあった？',
        'そういう話題はちょっと...別のことを話さない？',
        'うーん、別の話題にしよう！今日は何してたの？',
        'ちょっと恥ずかしいな...他に話したいことはある？',
      ],
    },
    
    // 通知メッセージ
    notificationMessages: {
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
    },
  },
  
  en: {
    // Common
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      ok: 'OK',
      yes: 'Yes',
      no: 'No',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      settings: 'Settings',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      version: 'Version',
    },
    
    // Chat screen
    chat: {
      title: 'AI Girlfriend Chat',
      subtitle: 'Online',
      inputPlaceholder: 'Type a message...',
      voiceButton: 'Voice input',
      locationButton: 'Location',
      sendButton: 'Send',
      typing: 'Typing...',
      greeting: "Hello! I'm Misaki. Feel free to ask me anything!",
      errorMessage: "Sorry, I'm having some trouble... Could you try again?",
      unsafeContentWarning: "Let's talk about something else!",
    },
    
    // Voice features
    voice: {
      recording: 'Recording...',
      processing: 'Processing...',
      playButton: 'Play',
      stopButton: 'Stop',
      recordButton: 'Start Recording',
      stopRecordButton: 'Stop Recording',
      permissionDenied: 'Audio permission required',
      recordingError: 'Recording error occurred',
      playbackError: 'Playback error occurred',
    },
    
    // Memory management
    memory: {
      title: 'Memory Management',
      basicSettings: 'Basic Settings',
      preferences: 'Preferences',
      anniversaries: 'Anniversaries',
      traits: 'Traits',
      nicknames: 'Nickname Settings',
      aiName: "AI's Name",
      userName: 'Your Name',
      aiNamePlaceholder: 'e.g., Misaki',
      userNamePlaceholder: 'e.g., John',
      addPreference: 'Add Preference',
      addAnniversary: 'Add Anniversary',
      addTrait: 'Add Trait',
      categoryPlaceholder: 'Category (e.g., Anime)',
      contentPlaceholder: 'Content (e.g., Attack on Titan)',
      datePlaceholder: 'Date (e.g., 12/25)',
      descriptionPlaceholder: 'Description (e.g., First conversation)',
      recurring: 'Repeat annually',
      clearAllData: 'Clear All Memories',
      clearConfirm: 'Are you sure you want to delete all memories? This action cannot be undone.',
      clearComplete: 'All memories have been deleted',
    },
    
    // Notification settings
    notifications: {
      title: 'Notification Settings',
      enable: 'Enable Notifications',
      description: 'Receive regular messages from Misaki',
      time: 'Notification Time',
      frequency: 'Frequency',
      weekdays: 'Weekdays',
      sound: 'Sound',
      vibration: 'Vibration',
      testNotification: 'Send Test Notification',
      frequencyDaily: 'Once a day',
      frequencyTwice: 'Twice a day',
      frequencyThrice: 'Three times a day',
      frequencyOff: 'Off',
      weekdayLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      permissionRequired: 'Notification permission required',
      permissionMessage: 'Please allow notifications in Settings app',
      testSent: 'Test notification sent',
      testError: 'Failed to send notification. Please check permissions.',
      info: 'If notifications are not received, please enable them in device settings.',
    },
    
    // Main settings
    settings: {
      title: 'Settings',
      language: 'Language Settings',
      safetySettings: 'Safety Settings',
      privacySettings: 'Privacy Settings',
      dataManagement: 'Data Management',
      other: 'Other',
      strictMode: 'Strict Mode',
      strictModeDescription: 'Enable the safest all-ages settings',
      blockExplicit: 'Block Explicit Content',
      blockExplicitDescription: 'Automatically block adult content',
      blockRomantic: 'Restrict Romantic Content',
      blockRomanticDescription: 'Limit romantic conversations (including dating game elements)',
      allowSuggestions: 'Allow Mild Suggestions',
      allowSuggestionsDescription: 'Allow light suggestions like date proposals',
      dataCollection: 'Data Collection',
      dataCollectionDescription: 'Allow anonymous data collection for improvement',
      analytics: 'Send Analytics Data',
      analyticsDescription: 'Send usage analytics data',
      exportData: 'Export Data',
      clearAllData: 'Delete All Data',
      clearAllConfirm: 'All conversation history, memories, and settings will be deleted. This action cannot be undone. Are you sure?',
      clearComplete: 'All data has been deleted',
      exportInProgress: 'Data export feature is under development',
      exportError: 'Failed to export data',
      about: 'About',
      buildNumber: 'Build Number',
      targetAge: 'Target Age',
      allAges: 'All Ages',
      selectLanguage: 'Select Language',
      languageDescription: 'Choose the language for the app. Settings will be applied immediately.',
      languageChanged: 'Language has been changed',
      languageChangeError: 'Failed to change language',
      languageInfo: 'About Language',
      languageInfoDescription: 'You can change the app display language. Chat content and AI responses will automatically switch to the selected language.',
      multilingualFeatures: 'Multilingual Features',
      feature1: 'All UI elements display in the selected language',
      feature2: 'AI responses are generated in the selected language',
      feature3: 'Notification messages are multilingual',
      feature4: 'Settings are automatically saved and applied on next startup',
      aboutDescription: 'A healthy conversational AI app for Japanese otaku culture enthusiasts. Enjoy gentle conversations in the style of dating simulation games. Designed safely for all ages.',
      languageNavigation: 'Language settings screen navigation is under development',
    },
    
    // Safety messages
    safety: {
      dangerousOperation: 'Dangerous Operation',
      importantNotice: 'Important Notice',
      disclaimerText: `• This app is designed for healthy conversations suitable for all ages\n• Inappropriate use is prohibited\n• AI responses are for reference only and should not be used for important decisions\n• If you have mental health concerns, please consult professional services\n• Personal information is properly protected`,
      mentalHealthSupport: [
        "I'm worried about you. When things are tough, don't keep it to yourself. Try talking to someone you trust or a professional service.",
        "It's natural to feel that way sometimes. But you're not alone. There are people who will listen to you.",
        "Are you okay? Don't push yourself too hard. When things are difficult, there are support services you can turn to.",
      ],
      safeAlternatives: [
        "Let's talk about something else! Anything interesting happen recently?",
        "That topic is a bit... shall we talk about something different?",
        "Um, let's change the subject! What did you do today?",
        "That's a bit embarrassing... is there anything else you'd like to talk about?",
      ],
    },
    
    // Notification messages
    notificationMessages: {
      morning: [
        'Good morning! Hope you have a wonderful day! ✨',
        'Morning! Did you sleep well?',
        "Let's do our best today! I'm cheering for you!",
        'Good morning! Did you have breakfast?',
      ],
      afternoon: [
        "It's lunchtime! Are you taking proper breaks?",
        'Good afternoon! How are you doing today?',
        "Let's chat a bit! How have you been lately?",
        'Good work! How about taking a little break?',
      ],
      evening: [
        'Good work today! Want to chat a bit?',
        'Good evening! How was your day?',
        "It's evening now. Are you relaxing?",
        "Good work today. If you want to talk about anything, I'm here to listen.",
      ],
      night: [
        'Time to sleep soon? Good night! 🌙',
        'Good work today. Rest well.',
        "It's getting late. Let's do our best tomorrow too!",
        'Good night! Sweet dreams!',
      ],
    },
  },
};

// 言語管理クラス
export class LanguageManager {
  private static instance: LanguageManager;
  private currentLanguage: SupportedLanguage = 'ja';
  private readonly STORAGE_KEY = '@ai_chat_language';

  private constructor() {
    this.loadLanguage();
  }

  static getInstance(): LanguageManager {
    if (!LanguageManager.instance) {
      LanguageManager.instance = new LanguageManager();
    }
    return LanguageManager.instance;
  }

  // 現在の言語を取得
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  // 言語を設定
  async setLanguage(language: SupportedLanguage): Promise<void> {
    this.currentLanguage = language;
    await this.saveLanguage();
  }

  // 翻訳テキストを取得
  t(key: string): string {
    const keys = key.split('.');
    let current: any = translations[this.currentLanguage];
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // フォールバック: 日本語で取得を試行
        current = translations.ja;
        for (const fallbackKey of keys) {
          if (current && typeof current === 'object' && fallbackKey in current) {
            current = current[fallbackKey];
          } else {
            console.warn(`Translation key not found: ${key}`);
            return key; // キーをそのまま返す
          }
        }
        break;
      }
    }
    
    if (typeof current === 'string') {
      return current;
    }
    
    console.warn(`Translation key not found or not a string: ${key}`);
    return key;
  }

  // 配列形式の翻訳テキストを取得
  tArray(key: string): string[] {
    const keys = key.split('.');
    let current: any = translations[this.currentLanguage];
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // フォールバック: 日本語で取得を試行
        current = translations.ja;
        for (const fallbackKey of keys) {
          if (current && typeof current === 'object' && fallbackKey in current) {
            current = current[fallbackKey];
          } else {
            console.warn(`Translation key not found: ${key}`);
            return [key];
          }
        }
        break;
      }
    }
    
    if (Array.isArray(current) && current.every(item => typeof item === 'string')) {
      return current;
    }
    
    console.warn(`Translation key not found or not a string array: ${key}`);
    return [key];
  }

  // ランダムな翻訳テキストを取得（配列から）
  tRandom(key: string): string {
    const array = this.tArray(key);
    return array[Math.floor(Math.random() * array.length)];
  }

  // 言語の保存
  private async saveLanguage(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, this.currentLanguage);
    } catch (e) {
      console.error('Failed to save language:', e);
    }
  }

  // 言語の読み込み
  private async loadLanguage(): Promise<void> {
    try {
      const savedLanguage = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (savedLanguage && (savedLanguage === 'ja' || savedLanguage === 'en')) {
        this.currentLanguage = savedLanguage;
      }
    } catch (e) {
      console.error('Failed to load language:', e);
    }
  }

  // サポートされている言語のリスト
  getSupportedLanguages(): Array<{ code: SupportedLanguage; name: string; nativeName: string }> {
    return [
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'en', name: 'English', nativeName: 'English' },
    ];
  }
}

// シングルトンインスタンスのエクスポート
export const languageManager = LanguageManager.getInstance();

// React Hook for language management
import { useState, useEffect } from 'react';

export function useLanguage() {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    languageManager.getCurrentLanguage()
  );

  const changeLanguage = async (language: SupportedLanguage) => {
    await languageManager.setLanguage(language);
    setCurrentLanguage(language);
  };

  const t = (key: string): string => {
    return languageManager.t(key);
  };

  const tArray = (key: string): string[] => {
    return languageManager.tArray(key);
  };

  const tRandom = (key: string): string => {
    return languageManager.tRandom(key);
  };

  useEffect(() => {
    // 言語が変更された場合の再レンダリング用
    setCurrentLanguage(languageManager.getCurrentLanguage());
  }, []);

  return {
    currentLanguage,
    changeLanguage,
    t,
    tArray,
    tRandom,
    supportedLanguages: languageManager.getSupportedLanguages(),
  };
}