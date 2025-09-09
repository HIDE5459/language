import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// 記憶の種類
export type MemoryCategory = 'preference' | 'nickname' | 'anniversary' | 'summary' | 'trait';

// 記憶アイテムのインターフェース
export interface MemoryItem {
  id: string;
  category: MemoryCategory;
  key: string;
  value: any;
  weight: number; // 重要度（0-1）
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date; // 有効期限（オプション）
}

// 短期記憶（セッション）
export interface SessionMemory {
  topics: string[]; // 話題のリスト
  emotions: string[]; // 感情の流れ
  keywords: string[]; // 重要キーワード
  todos: string[]; // 約束事項
  context: string; // 会話の文脈要約
  lastMessageAt: Date;
}

// 長期記憶
export interface LongTermMemory {
  preferences: Map<string, any>; // 好み（作品、食べ物など）
  nicknames: {
    userToAI: string; // ユーザーがAIを呼ぶ名前
    aiToUser: string; // AIがユーザーを呼ぶ名前
  };
  anniversaries: Array<{
    date: string;
    description: string;
    recurring: boolean;
  }>;
  traits: Map<string, string>; // ユーザーの特徴
  relationships: Map<string, string>; // 人間関係
}

// メモリマネージャークラス
export class MemoryManager {
  private static instance: MemoryManager;
  private sessionMemory: SessionMemory;
  private longTermMemory: LongTermMemory;
  private memoryItems: Map<string, MemoryItem>;
  private readonly STORAGE_KEYS = {
    SESSION: '@ai_chat_session_memory',
    LONG_TERM: '@ai_chat_long_term_memory',
    ITEMS: '@ai_chat_memory_items',
    USER_ID: 'user_id_secure',
  };

  private constructor() {
    this.sessionMemory = this.initializeSessionMemory();
    this.longTermMemory = this.initializeLongTermMemory();
    this.memoryItems = new Map();
    this.loadMemories();
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  // 初期化メソッド
  private initializeSessionMemory(): SessionMemory {
    return {
      topics: [],
      emotions: [],
      keywords: [],
      todos: [],
      context: '',
      lastMessageAt: new Date(),
    };
  }

  private initializeLongTermMemory(): LongTermMemory {
    return {
      preferences: new Map(),
      nicknames: {
        userToAI: 'みさき',
        aiToUser: 'あなた',
      },
      anniversaries: [],
      traits: new Map(),
      relationships: new Map(),
    };
  }

  // セッション記憶の更新
  async updateSessionMemory(updates: Partial<SessionMemory>): Promise<void> {
    this.sessionMemory = {
      ...this.sessionMemory,
      ...updates,
      lastMessageAt: new Date(),
    };
    await this.saveSessionMemory();
  }

  // セッションに話題を追加
  async addTopic(topic: string): Promise<void> {
    if (!this.sessionMemory.topics.includes(topic)) {
      this.sessionMemory.topics.push(topic);
      // 最大10個の話題を保持
      if (this.sessionMemory.topics.length > 10) {
        this.sessionMemory.topics.shift();
      }
      await this.saveSessionMemory();
    }
  }

  // セッションに感情を追加
  async addEmotion(emotion: string): Promise<void> {
    this.sessionMemory.emotions.push(emotion);
    // 最大20個の感情を保持
    if (this.sessionMemory.emotions.length > 20) {
      this.sessionMemory.emotions.shift();
    }
    await this.saveSessionMemory();
  }

  // キーワードを追加
  async addKeyword(keyword: string): Promise<void> {
    if (!this.sessionMemory.keywords.includes(keyword)) {
      this.sessionMemory.keywords.push(keyword);
      // 最大30個のキーワードを保持
      if (this.sessionMemory.keywords.length > 30) {
        this.sessionMemory.keywords.shift();
      }
      await this.saveSessionMemory();
    }
  }

  // TODOを追加
  async addTodo(todo: string): Promise<void> {
    this.sessionMemory.todos.push(todo);
    await this.saveSessionMemory();
  }

  // セッションコンテキストを更新
  async updateContext(context: string): Promise<void> {
    this.sessionMemory.context = context;
    await this.saveSessionMemory();
  }

  // 長期記憶に好みを追加
  async addPreference(key: string, value: any): Promise<void> {
    this.longTermMemory.preferences.set(key, value);
    await this.saveLongTermMemory();
    
    // メモリアイテムとしても保存
    const item: MemoryItem = {
      id: `pref_${Date.now()}`,
      category: 'preference',
      key,
      value,
      weight: 0.8,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.addMemoryItem(item);
  }

  // ニックネームを設定
  async setNicknames(userToAI?: string, aiToUser?: string): Promise<void> {
    if (userToAI) {
      this.longTermMemory.nicknames.userToAI = userToAI;
    }
    if (aiToUser) {
      this.longTermMemory.nicknames.aiToUser = aiToUser;
    }
    await this.saveLongTermMemory();
  }

  // 記念日を追加
  async addAnniversary(date: string, description: string, recurring: boolean = false): Promise<void> {
    this.longTermMemory.anniversaries.push({ date, description, recurring });
    await this.saveLongTermMemory();
  }

  // ユーザーの特徴を追加
  async addTrait(key: string, value: string): Promise<void> {
    this.longTermMemory.traits.set(key, value);
    await this.saveLongTermMemory();
  }

  // メモリアイテムを追加
  async addMemoryItem(item: MemoryItem): Promise<void> {
    this.memoryItems.set(item.id, item);
    await this.saveMemoryItems();
  }

  // メモリアイテムを削除
  async removeMemoryItem(id: string): Promise<void> {
    this.memoryItems.delete(id);
    await this.saveMemoryItems();
  }

  // カテゴリごとにメモリアイテムを取得
  getMemoryItemsByCategory(category: MemoryCategory): MemoryItem[] {
    return Array.from(this.memoryItems.values())
      .filter(item => item.category === category)
      .sort((a, b) => b.weight - a.weight);
  }

  // 重要度の高いメモリアイテムを取得
  getTopMemoryItems(limit: number = 10): MemoryItem[] {
    return Array.from(this.memoryItems.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);
  }

  // 会話コンテキスト用のメモリサマリーを生成
  generateMemoryContext(): string {
    const preferences = Array.from(this.longTermMemory.preferences.entries())
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    
    const traits = Array.from(this.longTermMemory.traits.entries())
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    const recentTopics = this.sessionMemory.topics.slice(-5).join(', ');
    const recentEmotions = this.sessionMemory.emotions.slice(-3).join(' → ');

    let context = '';
    
    if (this.longTermMemory.nicknames.aiToUser !== 'あなた') {
      context += `ユーザーの呼び名: ${this.longTermMemory.nicknames.aiToUser}\n`;
    }
    
    if (preferences) {
      context += `好み: ${preferences}\n`;
    }
    
    if (traits) {
      context += `特徴: ${traits}\n`;
    }
    
    if (recentTopics) {
      context += `最近の話題: ${recentTopics}\n`;
    }
    
    if (recentEmotions) {
      context += `感情の流れ: ${recentEmotions}\n`;
    }
    
    if (this.sessionMemory.todos.length > 0) {
      context += `約束事項: ${this.sessionMemory.todos.join(', ')}\n`;
    }

    return context;
  }

  // セッションをリセット
  async resetSession(): Promise<void> {
    this.sessionMemory = this.initializeSessionMemory();
    await this.saveSessionMemory();
  }

  // 全メモリをクリア（危険な操作）
  async clearAllMemories(): Promise<void> {
    this.sessionMemory = this.initializeSessionMemory();
    this.longTermMemory = this.initializeLongTermMemory();
    this.memoryItems.clear();
    
    await AsyncStorage.multiRemove([
      this.STORAGE_KEYS.SESSION,
      this.STORAGE_KEYS.LONG_TERM,
      this.STORAGE_KEYS.ITEMS,
    ]);
  }

  // ストレージへの保存
  private async saveSessionMemory(): Promise<void> {
    try {
      const jsonValue = JSON.stringify(this.sessionMemory);
      await AsyncStorage.setItem(this.STORAGE_KEYS.SESSION, jsonValue);
    } catch (e) {
      console.error('Failed to save session memory:', e);
    }
  }

  private async saveLongTermMemory(): Promise<void> {
    try {
      // MapをObjectに変換
      const data = {
        ...this.longTermMemory,
        preferences: Object.fromEntries(this.longTermMemory.preferences),
        traits: Object.fromEntries(this.longTermMemory.traits),
        relationships: Object.fromEntries(this.longTermMemory.relationships),
      };
      const jsonValue = JSON.stringify(data);
      await AsyncStorage.setItem(this.STORAGE_KEYS.LONG_TERM, jsonValue);
    } catch (e) {
      console.error('Failed to save long-term memory:', e);
    }
  }

  private async saveMemoryItems(): Promise<void> {
    try {
      const items = Array.from(this.memoryItems.entries());
      const jsonValue = JSON.stringify(items);
      await AsyncStorage.setItem(this.STORAGE_KEYS.ITEMS, jsonValue);
    } catch (e) {
      console.error('Failed to save memory items:', e);
    }
  }

  // ストレージからの読み込み
  private async loadMemories(): Promise<void> {
    await this.loadSessionMemory();
    await this.loadLongTermMemory();
    await this.loadMemoryItems();
  }

  private async loadSessionMemory(): Promise<void> {
    try {
      const jsonValue = await AsyncStorage.getItem(this.STORAGE_KEYS.SESSION);
      if (jsonValue != null) {
        const data = JSON.parse(jsonValue);
        this.sessionMemory = {
          ...data,
          lastMessageAt: new Date(data.lastMessageAt),
        };
      }
    } catch (e) {
      console.error('Failed to load session memory:', e);
    }
  }

  private async loadLongTermMemory(): Promise<void> {
    try {
      const jsonValue = await AsyncStorage.getItem(this.STORAGE_KEYS.LONG_TERM);
      if (jsonValue != null) {
        const data = JSON.parse(jsonValue);
        this.longTermMemory = {
          ...data,
          preferences: new Map(Object.entries(data.preferences || {})),
          traits: new Map(Object.entries(data.traits || {})),
          relationships: new Map(Object.entries(data.relationships || {})),
        };
      }
    } catch (e) {
      console.error('Failed to load long-term memory:', e);
    }
  }

  private async loadMemoryItems(): Promise<void> {
    try {
      const jsonValue = await AsyncStorage.getItem(this.STORAGE_KEYS.ITEMS);
      if (jsonValue != null) {
        const items = JSON.parse(jsonValue);
        this.memoryItems = new Map(items.map((item: any[]) => [
          item[0],
          {
            ...item[1],
            createdAt: new Date(item[1].createdAt),
            updatedAt: new Date(item[1].updatedAt),
            expiresAt: item[1].expiresAt ? new Date(item[1].expiresAt) : undefined,
          },
        ]));
      }
    } catch (e) {
      console.error('Failed to load memory items:', e);
    }
  }

  // ゲッター
  getSessionMemory(): SessionMemory {
    return this.sessionMemory;
  }

  getLongTermMemory(): LongTermMemory {
    return this.longTermMemory;
  }

  getAllMemoryItems(): MemoryItem[] {
    return Array.from(this.memoryItems.values());
  }

  // デバッグ用
  async exportMemoryData(): Promise<string> {
    const data = {
      session: this.sessionMemory,
      longTerm: {
        ...this.longTermMemory,
        preferences: Object.fromEntries(this.longTermMemory.preferences),
        traits: Object.fromEntries(this.longTermMemory.traits),
        relationships: Object.fromEntries(this.longTermMemory.relationships),
      },
      items: Array.from(this.memoryItems.entries()),
    };
    return JSON.stringify(data, null, 2);
  }

  async importMemoryData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.session) {
        this.sessionMemory = {
          ...data.session,
          lastMessageAt: new Date(data.session.lastMessageAt),
        };
      }
      
      if (data.longTerm) {
        this.longTermMemory = {
          ...data.longTerm,
          preferences: new Map(Object.entries(data.longTerm.preferences || {})),
          traits: new Map(Object.entries(data.longTerm.traits || {})),
          relationships: new Map(Object.entries(data.longTerm.relationships || {})),
        };
      }
      
      if (data.items) {
        this.memoryItems = new Map(data.items);
      }
      
      await this.saveSessionMemory();
      await this.saveLongTermMemory();
      await this.saveMemoryItems();
    } catch (e) {
      console.error('Failed to import memory data:', e);
      throw e;
    }
  }
}

// シングルトンインスタンスのエクスポート
export const memoryManager = MemoryManager.getInstance();