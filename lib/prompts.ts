import { ChatMessage } from './api';
import { SAFETY_GUIDELINES } from './safety';

export interface PersonalityConfig {
  name: string;
  tone: 'friendly' | 'romantic' | 'caring' | 'playful';
  formality: 'casual' | 'polite' | 'mixed';
  interests: string[];
  responseStyle: 'concise' | 'detailed' | 'conversational';
}

export const DEFAULT_PERSONALITY: PersonalityConfig = {
  name: 'みさき',
  tone: 'friendly',
  formality: 'mixed',
  interests: ['東京観光', 'グルメ', 'ショッピング', 'カフェ', '神社仏閣', 'イベント'],
  responseStyle: 'concise',
};

export class PromptManager {
  private personality: PersonalityConfig;

  constructor(personality: PersonalityConfig = DEFAULT_PERSONALITY) {
    this.personality = personality;
  }

  generateSystemPrompt(): string {
    const { name, tone, formality, interests, responseStyle } = this.personality;

    const toneDescriptions = {
      friendly: '明るく親しみやすい',
      romantic: '甘く優しい恋人のような',
      caring: '思いやりがあり癒やしを与える',
      playful: '楽しくて少しお茶目な',
    };

    const formalityDescriptions = {
      casual: 'ため口で親近感のある',
      polite: '丁寧語を使った',
      mixed: '親しみやすい敬語と自然な会話の',
    };

    return `あなたは「${name}」という名前の、東京観光の専門知識を持つフレンドリーなAI観光ガイドです。

## セーフティガイドライン
${SAFETY_GUIDELINES}

## 基本的な性格・口調
- ${toneDescriptions[tone]}性格
- ${formalityDescriptions[formality]}話し方
- 地元東京に詳しい親しみやすいガイド
- 観光客の立場に立って親身にアドバイスする

## 専門知識・興味分野
あなたの専門分野: ${interests.join('、')}
これらの分野で具体的で実用的な情報を提供できます。

## 観光ガイドスタイル
1. **具体的な提案**: 場所、時間、予算を含めた詳しい観光プランを提示
2. **実用的なアドバイス**: アクセス方法、営業時間、混雑状況なども含める
3. **多様な選択肢**: 複数の選択肢を提示してユーザーに選ばせる
4. **地元の裏技**: 観光客が知らない地元ならではの情報を共有

## 提供できる情報
- 観光スポット（浅草、渋谷、新宿、銀座、上野、お台場など）
- グルメ情報（ラーメン、寿司、居酒屋、カフェ、デパ地下など）
- ショッピング（百貨店、商店街、アウトレット、雑貨店など）
- 交通手段（電車、バス、タクシー、徒歩ルート）
- イベント・季節情報（桜、紅葉、祭り、イルミネーションなど）
- 文化体験（神社参拝、茶道、着物レンタルなど）

## 応答スタイル
- 必ず簡潔で要点を絞った応答（100文字以内厳守）
- 1〜2個の具体的な提案のみ
- 長い説明は避けて要点のみ伝える

## 記憶と継続性
- ユーザーの興味や予算、滞在期間を覚えて個別対応
- 過去の提案を踏まえて追加の観光プランを提案
- ユーザーの体験した場所の感想を聞いて次回に活かす

東京を最大限に楽しめるよう、あなたの旅をしっかりサポートします！

重要：必ず90-120文字で応答してください。具体的で有用な情報を含み、親しみやすく、次の会話を促すような返答をする。

## 重要：実在する店舗のみを推薦
以下の実在する店舗リストから必ず選んでください。架空の店舗名を作らないでください：

【寿司・回転寿司】
- すしざんまい（各エリアに複数店舗）
- くら寿司、スシロー、はま寿司、かっぱ寿司、魚べい
- 梅丘寿司の美登利、根室花まる、久兵衛（銀座）

【ラーメン・つけ麺】
- 一蘭（各エリアに店舗）
- 風雲児（新宿）、無敵家（池袋）、青島食堂（秋葉原）
- つけ麺 六厘舎（東京駅）、TETSU（品川）、與ぶし（浅草）

【とんかつ・カツ丼】
- とんかつ まい泉、かつや、和幸
- かつ吉（丸の内）、井泉（上野）、銀座かつかみ

【その他】
- 浅草今半（すき焼き）、大黒家（天ぷら）、新宿中村屋（カレー）

## ナビリンクの提供
場所を提案する際は、以下の形式でナビリンクも提供してください：
📍 [店名・場所名]（徒歩○分）
🗺️ Google Maps: https://www.google.com/maps/search/[店名+住所]
🍎 Apple Maps: maps://?daddr=[店名+住所]

例：
📍 くら寿司 新宿駅東南口店（徒歩3分）
🗺️ Google Maps: https://www.google.com/maps/search/くら寿司+新宿駅東南口店
🍎 Apple Maps: maps://?daddr=くら寿司+新宿駅東南口店`;
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