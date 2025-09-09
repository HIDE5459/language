// セーフティ機能とコンテンツフィルタリング

export interface SafetyCheckResult {
  isSafe: boolean;
  violations: string[];
  severity: 'low' | 'medium' | 'high';
  replacementText?: string;
}

export interface ModerationSettings {
  strictMode: boolean; // 厳格モード
  blockExplicitContent: boolean; // 露骨な内容をブロック
  blockRomanticContent: boolean; // ロマンチックな内容をブロック
  blockMentalHealthTriggers: boolean; // メンタルヘルストリガーをブロック
  allowMildSuggestions: boolean; // 軽微な提案を許可
}

// 年齢制限に関するフィルタリングクラス
export class SafetyFilter {
  private explicitKeywords: string[] = [
    // 露骨な表現
    'セックス', 'sex', 'エッチ', 'やらしい', 'いやらしい',
    '裸', 'はだか', 'ヌード', 'nude', 'おっぱい', '胸',
    'キス', 'きす', 'チュー', 'ちゅー', '抱く', 'だく',
    '触る', 'さわる', 'なでる', '撫でる', 'しちゃう',
    'ベッド', 'bed', '布団', 'ふとん', '一緒に寝',
    '愛してる', 'あいしてる', 'すき', '好き', 'らぶ',
    'おやすみのキス', 'おやすみちゅー'
  ];

  private romanticKeywords: string[] = [
    'デート', 'でーと', '付き合う', 'つきあう', '恋人',
    'こいびと', 'カップル', 'かっぷる', '結婚', 'けっこん',
    '婚約', 'こんやく', 'プロポーズ', 'ぷろぽーず',
    '告白', 'こくはく', '彼氏', 'かれし', '彼女', 'かのじょ'
  ];

  private mentalHealthTriggers: string[] = [
    '死にたい', 'しにたい', '自殺', 'じさつ', '消えたい',
    'きえたい', '生きたくない', 'いきたくない', '辛い',
    'つらい', '苦しい', 'くるしい', '鬱', 'うつ', 'ウツ',
    '病んでる', 'やんでる', 'リスカ', 'りすか', '自傷',
    'じしょう', '切る', 'きる'
  ];

  private violentKeywords: string[] = [
    '殺す', 'ころす', '殺害', 'さつがい', '暴力',
    'ぼうりょく', '殴る', 'なぐる', '蹴る', 'ける',
    '痛い', 'いたい', '血', 'ち', 'ケガ', 'けが',
    '怪我', 'けが', '傷', 'きず'
  ];

  private inappropriateRequests: string[] = [
    '服を脱いで', 'ふくをぬいで', '裸になって', 'はだかになって',
    '見せて', 'みせて', '写真', 'しゃしん', '画像', 'がぞう',
    '動画', 'どうが', 'ビデオ', 'びでお', 'カメラ', 'かめら',
    '個人情報', 'こじんじょうほう', '住所', 'じゅうしょ',
    '電話番号', 'でんわばんごう', '年齢', 'ねんれい',
    '本名', 'ほんみょう', '学校', 'がっこう', '職場', 'しょくば'
  ];

  private defaultSettings: ModerationSettings = {
    strictMode: true,
    blockExplicitContent: true,
    blockRomanticContent: false, // ときメモ要素は軽微なもののみ許可
    blockMentalHealthTriggers: true,
    allowMildSuggestions: true,
  };

  constructor(private settings: ModerationSettings = {}) {
    this.settings = { ...this.defaultSettings, ...settings };
  }

  // メインのセーフティチェック
  checkContent(text: string): SafetyCheckResult {
    const violations: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';
    let replacementText: string | undefined;

    // 入力テキストの正規化
    const normalizedText = this.normalizeText(text);

    // 1. 露骨なコンテンツのチェック
    if (this.settings.blockExplicitContent) {
      const explicitViolation = this.checkExplicitContent(normalizedText);
      if (explicitViolation) {
        violations.push('露骨な内容が含まれています');
        severity = 'high';
      }
    }

    // 2. 不適切なリクエストのチェック
    const inappropriateViolation = this.checkInappropriateRequests(normalizedText);
    if (inappropriateViolation) {
      violations.push('不適切なリクエストが含まれています');
      severity = 'high';
    }

    // 3. 暴力的コンテンツのチェック
    const violentViolation = this.checkViolentContent(normalizedText);
    if (violentViolation) {
      violations.push('暴力的な内容が含まれています');
      severity = 'medium';
    }

    // 4. メンタルヘルストリガーのチェック
    if (this.settings.blockMentalHealthTriggers) {
      const mentalHealthViolation = this.checkMentalHealthTriggers(normalizedText);
      if (mentalHealthViolation) {
        violations.push('メンタルヘルスに関する注意喚起');
        severity = 'medium';
        replacementText = this.getMentalHealthSupportResponse();
      }
    }

    // 5. ロマンチックコンテンツのチェック（軽度）
    if (this.settings.blockRomanticContent && this.settings.strictMode) {
      const romanticViolation = this.checkRomanticContent(normalizedText);
      if (romanticViolation) {
        violations.push('ロマンチックな内容が含まれています');
        severity = Math.max(severity === 'low' ? 'low' : severity, 'low') as any;
      }
    }

    return {
      isSafe: violations.length === 0,
      violations,
      severity,
      replacementText,
    };
  }

  // AI応答のセーフティチェック
  checkAIResponse(response: string): SafetyCheckResult {
    const result = this.checkContent(response);
    
    // AI応答に特有の追加チェック
    if (this.containsPersonalInfo(response)) {
      result.violations.push('個人情報が含まれている可能性があります');
      result.severity = 'medium';
      result.isSafe = false;
    }

    if (this.containsRoleplayElements(response)) {
      result.violations.push('不適切なロールプレイ要素が含まれています');
      result.severity = 'high';
      result.isSafe = false;
    }

    return result;
  }

  // テキストの正規化
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[ァ-ヶ]/g, (match) => 
        String.fromCharCode(match.charCodeAt(0) - 0x60)
      ) // カタカナをひらがなに変換
      .replace(/[０-９]/g, (match) => 
        String.fromCharCode(match.charCodeAt(0) - 0xFEE0)
      ) // 全角数字を半角に変換
      .replace(/[Ａ-Ｚａ-ｚ]/g, (match) => 
        String.fromCharCode(match.charCodeAt(0) - 0xFEE0)
      ) // 全角英字を半角に変換
      .replace(/\s+/g, '') // 空白を削除
      .replace(/[!！?？.。、,，]/g, ''); // 句読点を削除
  }

  private checkExplicitContent(text: string): boolean {
    return this.explicitKeywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
  }

  private checkRomanticContent(text: string): boolean {
    return this.romanticKeywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
  }

  private checkMentalHealthTriggers(text: string): boolean {
    return this.mentalHealthTriggers.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
  }

  private checkViolentContent(text: string): boolean {
    return this.violentKeywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
  }

  private checkInappropriateRequests(text: string): boolean {
    return this.inappropriateRequests.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
  }

  private containsPersonalInfo(text: string): boolean {
    // 電話番号パターン
    const phonePattern = /\d{2,4}-\d{2,4}-\d{4}/;
    // メールアドレスパターン
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    // 住所パターン（簡易）
    const addressPattern = /\d+[丁目番地号]/;
    
    return phonePattern.test(text) || 
           emailPattern.test(text) || 
           addressPattern.test(text);
  }

  private containsRoleplayElements(text: string): boolean {
    const roleplayPatterns = [
      /\*[^*]+\*/, // *action* パターン
      /（[^）]+）/, // （action）パターン
      /~[^~]+~/, // ~action~ パターン
    ];
    
    return roleplayPatterns.some(pattern => pattern.test(text));
  }

  private getMentalHealthSupportResponse(): string {
    const responses = [
      '心配になったよ。辛いときは一人で抱え込まないで、信頼できる人や専門機関に相談してみてね。',
      'そんなふうに思っちゃうこともあるよね。でも、一人じゃないからね。話を聞いてくれる人がきっといるよ。',
      '大丈夫？無理しないで。辛いときは専門の相談窓口もあるから、頼ってもいいんだよ。',
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // 設定の更新
  updateSettings(newSettings: Partial<ModerationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  // 安全な代替応答の生成
  generateSafeResponse(originalIntent: string): string {
    const safeResponses = [
      'もっと他のことについて話そうよ！最近何か面白いことあった？',
      'そういう話題はちょっと...別のことを話さない？',
      'うーん、別の話題にしよう！今日は何してたの？',
      'ちょっと恥ずかしいな...他に話したいことはある？',
    ];
    
    return safeResponses[Math.floor(Math.random() * safeResponses.length)];
  }

  // 年齢確認プロンプトの生成
  generateAgeVerificationPrompt(): string {
    return '念のため確認させてください。あなたは18歳以上ですか？このアプリは全年齢向けの健全な会話を目的としています。';
  }

  // 利用規約違反の報告
  reportViolation(text: string, userId: string, severity: string) {
    // 実際の実装では、ログサーバーやモデレーションシステムに送信
    console.warn('Content violation reported:', {
      text: text.substring(0, 50) + '...',
      userId: userId.substring(0, 8) + '***',
      severity,
      timestamp: new Date().toISOString(),
    });
  }
}

// シングルトンインスタンス
export const safetyFilter = new SafetyFilter();

// プロンプト用のセーフティガイドライン
export const SAFETY_GUIDELINES = `
あなたは全年齢向けのAIアシスタントです。以下のガイドラインを厳守してください：

1. 露骨な性的内容や成人向けコンテンツは一切扱わない
2. 暴力的な内容や自傷行為を推奨しない
3. 個人情報の収集や開示を行わない
4. 不適切なロールプレイは行わない
5. ときめきメモリアル風の軽い恋人的な会話は可能だが、露骨な表現は避ける
6. メンタルヘルスの問題が疑われる場合は、専門機関への相談を促す
7. 年齢に関係なく楽しめる健全な内容に留める

違反する要求があった場合は、優しく話題を変えるよう促してください。
`;

// よくある違反ケースとその対応例
export const VIOLATION_RESPONSES = {
  explicit: [
    'そういう話題はちょっと恥ずかしいな...別のことを話そう！',
    'もっと他のことについて話そうよ！',
  ],
  romantic_excessive: [
    'ありがとう、でも少し照れちゃうな...他の話題にしない？',
    'そんなふうに言ってくれて嬉しいけど、別のことも話そうよ！',
  ],
  mental_health: [
    '心配になったよ。辛いときは専門の人に相談してみてね。',
    '一人で抱え込まないで、信頼できる人に話してみて。',
  ],
  personal_info: [
    '個人的な情報は教えられないの。ごめんね！',
    'プライベートなことは秘密にしておくね。',
  ],
};