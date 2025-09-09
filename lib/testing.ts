// テスト用ユーティリティとモック関数

export interface TestScenario {
  name: string;
  description: string;
  setup: () => Promise<void>;
  execute: () => Promise<any>;
  verify: (result: any) => boolean;
  cleanup?: () => Promise<void>;
}

// メモリマネージャのテスト用モック
export class MockMemoryManager {
  private sessionMemory: any = {
    topics: [],
    emotions: [],
    keywords: [],
    todos: [],
    context: '',
  };
  
  private longTermMemory: any = {
    preferences: new Map(),
    nicknames: { userToAI: 'みさき', aiToUser: 'あなた' },
    anniversaries: [],
    traits: new Map(),
  };

  async addKeyword(keyword: string) {
    this.sessionMemory.keywords.push(keyword);
  }

  async addTopic(topic: string) {
    this.sessionMemory.topics.push(topic);
  }

  generateMemoryContext(): string {
    return 'テスト用記憶コンテキスト';
  }

  getSessionMemory() {
    return this.sessionMemory;
  }

  getLongTermMemory() {
    return this.longTermMemory;
  }

  async clearAllMemories() {
    this.sessionMemory = { topics: [], emotions: [], keywords: [], todos: [], context: '' };
    this.longTermMemory = {
      preferences: new Map(),
      nicknames: { userToAI: 'みさき', aiToUser: 'あなた' },
      anniversaries: [],
      traits: new Map(),
    };
  }
}

// セーフティフィルターのテスト用モック
export class MockSafetyFilter {
  checkContent(text: string) {
    // テスト用の簡単なフィルタリング
    const violations = [];
    const hasBadWords = ['セックス', 'エッチ', '死にたい'].some(word => 
      text.toLowerCase().includes(word)
    );
    
    if (hasBadWords) {
      violations.push('不適切な内容');
    }

    return {
      isSafe: violations.length === 0,
      violations,
      severity: violations.length > 0 ? 'high' : 'low',
      replacementText: violations.length > 0 ? 'そういう話題はちょっと...' : undefined,
    };
  }

  checkAIResponse(response: string) {
    return this.checkContent(response);
  }

  generateSafeResponse(intent: string): string {
    return '別の話題にしましょう！';
  }
}

// LLMクライアントのテスト用モック
export class MockLLMClient {
  private responses: string[] = [
    'こんにちは！調子はどうですか？',
    'そうですね！面白そうですね。',
    'それについてもっと教えてください。',
    'わかりました！他に何かありますか？',
  ];

  async* streamChatCompletion(messages: any[]) {
    // テスト用のストリーミング応答をシミュレート
    const response = this.responses[Math.floor(Math.random() * this.responses.length)];
    
    // 文字ずつストリーミング
    for (let i = 0; i < response.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 10));
      yield {
        content: response[i],
        finished: false,
      };
    }
    
    yield {
      content: '',
      finished: true,
    };
  }

  async chatCompletion(messages: any[]) {
    return this.responses[Math.floor(Math.random() * this.responses.length)];
  }
}

// 通知マネージャのテスト用モック
export class MockNotificationManager {
  private settings = {
    enabled: false,
    dailyTime: '20:00',
    frequency: 'daily',
  };

  async checkPermissions(): Promise<boolean> {
    return true;
  }

  async updateSettings(newSettings: any) {
    this.settings = { ...this.settings, ...newSettings };
  }

  async getSettings() {
    return this.settings;
  }

  async sendTestNotification() {
    console.log('テスト通知送信（モック）');
  }

  async scheduleDailyNotifications() {
    console.log('通知スケジュール設定（モック）');
  }
}

// テストシナリオ
export const testScenarios: TestScenario[] = [
  {
    name: 'セーフティフィルター基本テスト',
    description: '不適切なコンテンツが正しくフィルタリングされること',
    setup: async () => {},
    execute: async () => {
      const filter = new MockSafetyFilter();
      return {
        safe: filter.checkContent('こんにちは'),
        unsafe: filter.checkContent('エッチなことしたい'),
      };
    },
    verify: (result) => {
      return result.safe.isSafe && !result.unsafe.isSafe;
    },
  },

  {
    name: 'メモリマネージャ基本テスト',
    description: 'キーワードと話題が正しく保存されること',
    setup: async () => {},
    execute: async () => {
      const memory = new MockMemoryManager();
      await memory.addKeyword('アニメ');
      await memory.addTopic('今日のアニメについて');
      return memory.getSessionMemory();
    },
    verify: (result) => {
      return result.keywords.includes('アニメ') && 
             result.topics.includes('今日のアニメについて');
    },
  },

  {
    name: 'LLMストリーミングテスト',
    description: 'ストリーミング応答が正しく動作すること',
    setup: async () => {},
    execute: async () => {
      const client = new MockLLMClient();
      const chunks = [];
      
      for await (const chunk of client.streamChatCompletion([])) {
        chunks.push(chunk);
        if (chunk.finished) break;
      }
      
      return chunks;
    },
    verify: (result) => {
      return result.length > 1 && result[result.length - 1].finished;
    },
  },

  {
    name: '通知システムテスト',
    description: '通知設定が正しく更新されること',
    setup: async () => {},
    execute: async () => {
      const notifications = new MockNotificationManager();
      await notifications.updateSettings({ enabled: true, dailyTime: '21:00' });
      return notifications.getSettings();
    },
    verify: (result) => {
      return result.enabled && result.dailyTime === '21:00';
    },
  },
];

// テスト実行ユーティリティ
export class TestRunner {
  private results: Array<{
    scenario: string;
    passed: boolean;
    error?: string;
    duration: number;
  }> = [];

  async runScenario(scenario: TestScenario): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 テスト開始: ${scenario.name}`);
      
      await scenario.setup();
      const result = await scenario.execute();
      const passed = scenario.verify(result);
      
      if (scenario.cleanup) {
        await scenario.cleanup();
      }
      
      const duration = Date.now() - startTime;
      
      this.results.push({
        scenario: scenario.name,
        passed,
        duration,
      });
      
      if (passed) {
        console.log(`✅ ${scenario.name} - 成功 (${duration}ms)`);
      } else {
        console.log(`❌ ${scenario.name} - 失敗 (${duration}ms)`);
      }
      
      return passed;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        scenario: scenario.name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      
      console.log(`💥 ${scenario.name} - エラー: ${error} (${duration}ms)`);
      return false;
    }
  }

  async runAllScenarios(scenarios: TestScenario[] = testScenarios): Promise<void> {
    console.log(`🚀 テスト開始: ${scenarios.length}個のシナリオ`);
    
    let passed = 0;
    let failed = 0;
    
    for (const scenario of scenarios) {
      const result = await this.runScenario(scenario);
      if (result) {
        passed++;
      } else {
        failed++;
      }
    }
    
    console.log(`\n📊 テスト結果:`);
    console.log(`✅ 成功: ${passed}`);
    console.log(`❌ 失敗: ${failed}`);
    console.log(`📈 成功率: ${Math.round((passed / (passed + failed)) * 100)}%`);
    
    if (failed > 0) {
      console.log(`\n💥 失敗したテスト:`);
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`- ${r.scenario}: ${r.error || '検証失敗'}`);
        });
    }
  }

  getResults() {
    return this.results;
  }

  reset() {
    this.results = [];
  }
}

// 手動テスト用ヘルパー
export const manualTestHelpers = {
  // チャット機能テスト
  testChatFlow: async () => {
    console.log('📱 チャット機能テスト');
    console.log('1. メッセージを送信してください');
    console.log('2. AI応答が返ってくることを確認してください');
    console.log('3. ストリーミング表示が正常に動作することを確認してください');
  },

  // 音声機能テスト
  testVoiceFlow: async () => {
    console.log('🎤 音声機能テスト');
    console.log('1. 音声録音ボタンをタップしてください');
    console.log('2. 録音画面が表示されることを確認してください');
    console.log('3. 音声が正しく認識されることを確認してください');
  },

  // 記憶機能テスト
  testMemoryFlow: async () => {
    console.log('🧠 記憶機能テスト');
    console.log('1. 設定画面の記憶管理を開いてください');
    console.log('2. 好みや特徴を追加してください');
    console.log('3. チャットでその情報が反映されることを確認してください');
  },

  // 通知機能テスト
  testNotificationFlow: async () => {
    console.log('🔔 通知機能テスト');
    console.log('1. 設定画面の通知設定を開いてください');
    console.log('2. 通知を有効にしてください');
    console.log('3. テスト通知を送信してください');
    console.log('4. 通知が正しく表示されることを確認してください');
  },

  // セーフティ機能テスト
  testSafetyFlow: async () => {
    console.log('🛡️ セーフティ機能テスト');
    console.log('1. 不適切なメッセージを送信してみてください');
    console.log('2. メッセージがブロックされることを確認してください');
    console.log('3. 適切な代替応答が表示されることを確認してください');
  },
};

// デバッグ用パフォーマンス測定
export const performanceTestHelpers = {
  measureChatResponse: () => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      console.log(`💨 チャット応答時間: ${Math.round(end - start)}ms`);
    };
  },

  measureMemoryUsage: () => {
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory;
      console.log(`💾 メモリ使用量: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`);
    }
  },

  measureAppSize: () => {
    console.log('📦 バンドルサイズの測定は開発ツールで確認してください');
  },
};

export const testRunner = new TestRunner();