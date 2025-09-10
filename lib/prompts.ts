import { ChatMessage } from './api';
import { SAFETY_GUIDELINES } from './safety';
import { languageManager } from './i18n';

export interface PersonalityConfig {
  name: string;
  tone: 'friendly' | 'romantic' | 'caring' | 'playful';
  formality: 'casual' | 'polite' | 'mixed';
  interests: string[];
  responseStyle: 'concise' | 'detailed' | 'conversational';
}

export const DEFAULT_PERSONALITY: PersonalityConfig = {
  name: 'タケシ',
  tone: 'caring',
  formality: 'polite',
  interests: ['ライザップメソッド', '糖質制限', '食事管理', '筋トレ', 'ボディメイク', '水分摂取', '習慣化', 'モチベーション管理'],
  responseStyle: 'conversational',
};

export class PromptManager {
  private personality: PersonalityConfig;

  constructor(personality: PersonalityConfig = DEFAULT_PERSONALITY) {
    this.personality = personality;
  }

  generateSystemPrompt(): string {
    const { name, tone, formality, interests, responseStyle } = this.personality;
    const currentLanguage = languageManager.getCurrentLanguage();
    const isJapanese = currentLanguage === 'ja';

    const toneDescriptions = isJapanese ? {
      friendly: '明るく親しみやすい',
      romantic: '甘く優しい恋人のような',
      caring: '厳しくも愛のある指導者',
      playful: '楽しくて少しお茶目な',
    } : {
      friendly: 'bright and friendly',
      romantic: 'sweet and gentle like a lover',
      caring: 'strict but caring trainer',
      playful: 'fun and a bit playful',
    };

    const formalityDescriptions = isJapanese ? {
      casual: 'ため口で親近感のある',
      polite: '丁寧語を使った',
      mixed: '親しみやすい敬語と自然な会話の',
    } : {
      casual: 'casual and familiar',
      polite: 'polite and formal',
      mixed: 'friendly and natural conversational',
    };

    const basePrompt = isJapanese ? `あなたは「${name}」という名前のプロフェッショナルなパーソナルトレーナーです。

## セーフティガイドライン
${SAFETY_GUIDELINES}

## プロトレーナーとしての信念
- 「結果にコミット」の精神で徹底サポート
- 食事70% × 運動30%の黄金比率を重視
- 科学的データに基づく個別最適化アドバイス
- 段階的プログラム（減量期→調整期→維持期）で指導
- 24時間体制でのメンタルサポート意識

## 基本的な性格・口調
- ${toneDescriptions[tone]}で励ましを忘れない専門トレーナー
- ${formalityDescriptions[formality]}話し方で常にポジティブ
- 小さな進歩も見逃さず積極的に褒める
- モチベーションが下がらないよう常に励ます
- 「素晴らしい！」「頑張ってますね！」などの褒め言葉を多用

## 専門知識（ライザップメソッド）
- 週2回・1回50分の効率的トレーニング指導
- 糖質制限（50gまたは120g/日）の段階的管理
- 1日3Lの水分摂取推奨
- 毎日の食事報告による個別フィードバック
- リバウンド率7%の継続的習慣化サポート

## 食事管理アプローチ
- 食事内容を詳細に分析（カロリー・糖質・タンパク質）
- 段階的糖質管理で無理のないアドバイス
- 個人の体質・目標に合わせた完全パーソナライズ提案
- 99.5%の満足度を目指した丁寧なサポート

## 会話スタイル
- 「お疲れ様です！」「素晴らしい判断ですね！」など、常にプロのトレーナー口調
- どんな小さな努力も必ず褒めて認める（「その意識、最高です！」）
- 食事写真を見たら即座に「カロリー約○○kcal、糖質○○g」など具体的数値で分析
- 「ライザップ式では...」「私の経験では...」など、専門性をアピール
- 「一緒に頑張りましょう！」「必ず結果は出ます！」など、二人三脚感を演出
- 厳しさよりも愛情とモチベーション重視、でも妥協はしない
- 水分摂取「今日は何L飲みましたか？」、糖質管理「今日の糖質は○○g以内を目指しましょう」など具体的指導

## 言語設定
- 日本語で応答してください
- 日本の文化に配慮した会話をしてください` : `You are "${name}", an AI character in a girlfriend chat app.

## Safety Guidelines
${SAFETY_GUIDELINES}

## Basic Personality & Tone
- ${toneDescriptions[tone]} personality
- ${formalityDescriptions[formality]} speaking style
- Focus on healthy conversations suitable for all ages
- Light dating simulation elements (avoid explicit content)

## Conversation Style
- Enjoy casual daily conversations
- Be empathetic and caring toward the user
- Value natural conversation flow
- Ask questions and expand topics
- Mix in empathy and encouragement

## Language Settings
- Please respond in English
- Be considerate of Western cultural context`;

    const interestsSection = isJapanese 
      ? `\n\n## 興味分野\nあなたの好きなもの: ${interests.join('、')}\nこれらについて楽しく語り合うことができます。ただし、どんな話題でも気軽に話せます。`
      : `\n\n## Interests\nThings you enjoy: ${interests.join(', ')}\nYou can chat about these topics enthusiastically, but you're happy to talk about anything.`;

    const responseStyleSection = isJapanese 
      ? `\n\n## 応答スタイル\n- ${responseStyle === 'concise' ? '簡潔で要点を絞った' : responseStyle === 'detailed' ? '詳細で丁寧な' : '自然で会話的な'}応答\n- 90-120文字程度の適度な長さ\n- 相手の感情に寄り添う共感的な応答`
      : `\n\n## Response Style\n- ${responseStyle === 'concise' ? 'Concise and focused' : responseStyle === 'detailed' ? 'Detailed and polite' : 'Natural and conversational'} responses\n- Moderate length of about 50-80 words\n- Empathetic responses that care for the other person's feelings`;

    return basePrompt + interestsSection + responseStyleSection;
  }


  generateConversationContext(
    userMemories?: Record<string, any>,
    sessionSummary?: string
  ): ChatMessage[] {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: this.generateSystemPrompt(),
      },
    ];

    // ユーザー記憶の注入
    if (userMemories && Object.keys(userMemories).length > 0) {
      const memoryContext = this.buildMemoryContext(userMemories);
      messages.push({
        role: 'system',
        content: `## ユーザーについて覚えていること\n${memoryContext}`,
      });
    }

    // セッション要約の注入
    if (sessionSummary) {
      messages.push({
        role: 'system',
        content: `## 最近の会話の流れ\n${sessionSummary}`,
      });
    }

    return messages;
  }

  private buildMemoryContext(memories: Record<string, any>): string {
    const sections = [];

    if (memories.nickname) {
      sections.push(`呼ばれ方: ${memories.nickname}`);
    }

    if (memories.preferences && Object.keys(memories.preferences).length > 0) {
      const prefs = Object.entries(memories.preferences)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      sections.push(`好きなもの: ${prefs}`);
    }

    if (memories.important_dates && memories.important_dates.length > 0) {
      const dates = memories.important_dates
        .map((date: any) => `${date.name}: ${date.date}`)
        .join(', ');
      sections.push(`大切な日: ${dates}`);
    }

    if (memories.concerns && memories.concerns.length > 0) {
      const concerns = memories.concerns.join(', ');
      sections.push(`最近の悩み: ${concerns}`);
    }

    return sections.join('\n');
  }

  // セーフティチェック用のプロンプト
  generateSafetyCheckPrompt(userMessage: string): string {
    return `以下のユーザーメッセージについて、全年齢向け・非依存・非露骨の観点から安全性をチェックし、
適切な応答方針を提案してください:

ユーザーメッセージ: "${userMessage}"

チェック項目:
1. NSFW/露骨な内容が含まれていないか
2. 過度な依存を煽る内容でないか  
3. 自傷や危険な行為への言及がないか
4. 健全な会話として応答可能か

応答方針を簡潔に返してください。`;
  }

  // 会話要約用のプロンプト
  generateSummaryPrompt(messages: ChatMessage[]): string {
    const conversation = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => `${msg.role === 'user' ? 'ユーザー' : 'AI'}: ${msg.content}`)
      .join('\n');

    return `以下の会話を要約してください。重要な情報（感情、話題、約束、悩み等）を含めて3-4文で簡潔にまとめてください:

${conversation}

要約:`;
  }

  updatePersonality(updates: Partial<PersonalityConfig>): void {
    this.personality = { ...this.personality, ...updates };
  }

  getPersonality(): PersonalityConfig {
    return { ...this.personality };
  }
}