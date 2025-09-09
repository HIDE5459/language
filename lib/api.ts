export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface StreamingChatResponse {
  content: string;
  finished: boolean;
  error?: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  stream: boolean;
  temperature?: number;
  maxTokens?: number;
}

// APIキー管理（本番環境では環境変数を使用）
const API_CONFIG = {
  // OpenAI API (fallback)
  openai: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-3.5-turbo',
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || 'demo-key-for-testing', // Expo用環境変数
  },
  // Anthropic Claude API
  anthropic: {
    endpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-haiku-20240307',
    apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
  },
  // Google Gemini API
  gemini: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    streamEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent',
    model: 'gemini-1.5-flash',
    apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
  },
  // ローカル開発用のモックAPI
  mock: {
    endpoint: 'http://localhost:3001/api/chat',
    model: 'mock-model',
    apiKey: 'mock-key',
  },
};

export class LLMClient {
  private currentProvider: 'openai' | 'anthropic' | 'gemini' | 'mock' = 'mock';

  constructor(provider: 'openai' | 'anthropic' | 'gemini' | 'mock' = 'mock') {
    this.currentProvider = provider;
  }

  async* streamChatCompletion(
    messages: ChatMessage[],
    options: Partial<ChatCompletionOptions> = {}
  ): AsyncGenerator<StreamingChatResponse> {
    const config = API_CONFIG[this.currentProvider];
    
    try {
      if (this.currentProvider === 'mock') {
        yield* this.mockStreamResponse(messages);
        return;
      }

      // React Native環境では通常のAPIコールを使用（OpenAIも含む）
      if (this.currentProvider === 'gemini' || this.currentProvider === 'openai') {
        try {
          const response = await this.chatCompletion(messages, options);
          // レスポンスを一文字ずつストリーミング風に表示
          for (let i = 0; i < response.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 20)); // 20ms遅延
            yield {
              content: response[i],
              finished: false,
            };
          }
          yield { content: '', finished: true };
          return;
        } catch (error) {
          console.error('Chat completion failed, using mock:', error);
          yield* this.mockStreamResponse(messages);
          return;
        }
      }

      const response = await this.makeAPIRequest(messages, {
        stream: true,
        temperature: 0.7,
        maxTokens: 500, // 90-120文字に最適化
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      // React Native環境でresponse.bodyがnullになる問題の対処
      if (!response.body) {
        // モックレスポンスにフォールバック
        console.warn('Response body is null, falling back to mock response');
        yield* this.mockStreamResponse(messages);
        return;
      }
      
      const reader = response.body.getReader();
      if (!reader) {
        console.warn('No response body reader available, falling back to mock response');
        yield* this.mockStreamResponse(messages);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              yield { content: '', finished: true };
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = this.extractContentFromResponse(parsed);
              if (content) {
                yield { content, finished: false };
              }
            } catch (e) {
              console.warn('Failed to parse streaming response:', data);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming chat completion error:', error);
      yield {
        content: '',
        finished: true,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async chatCompletion(
    messages: ChatMessage[],
    options: Partial<ChatCompletionOptions> = {}
  ): Promise<string> {
    const config = API_CONFIG[this.currentProvider];

    try {
      if (this.currentProvider === 'mock') {
        return await this.mockChatResponse(messages);
      }

      // APIキーが無効な場合はモックにフォールバック
      if (!config.apiKey || config.apiKey === 'demo-key-for-testing') {
        console.warn('No valid API key found, falling back to mock response');
        return await this.mockChatResponse(messages);
      }

      const response = await this.makeAPIRequest(messages, {
        stream: false,
        temperature: 0.7,
        maxTokens: 500, // 90-120文字に最適化
        ...options,
      });

      if (!response.ok) {
        console.warn(`API request failed: ${response.status}, falling back to mock`);
        return await this.mockChatResponse(messages);
      }

      const data = await response.json();
      return this.extractContentFromResponse(data) || 'すみません、応答を生成できませんでした。';

    } catch (error) {
      console.error('Chat completion error, falling back to mock:', error);
      return await this.mockChatResponse(messages);
    }
  }

  private async makeAPIRequest(
    messages: ChatMessage[],
    options: ChatCompletionOptions
  ): Promise<Response> {
    const config = API_CONFIG[this.currentProvider];
    
    let requestBody: any;
    let endpoint = config.endpoint;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.currentProvider === 'openai') {
      requestBody = this.buildOpenAIRequest(messages, options);
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    } else if (this.currentProvider === 'anthropic') {
      requestBody = this.buildAnthropicRequest(messages, options);
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      headers['anthropic-version'] = '2023-06-01';
    } else if (this.currentProvider === 'gemini') {
      requestBody = this.buildGeminiRequest(messages, options);
      endpoint = options.stream ? config.streamEndpoint : config.endpoint;
      endpoint += `?key=${config.apiKey}`;
    }

    return fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });
  }

  private buildOpenAIRequest(messages: ChatMessage[], options: ChatCompletionOptions) {
    return {
      model: API_CONFIG.openai.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: options.stream,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 500,
    };
  }

  private buildAnthropicRequest(messages: ChatMessage[], options: ChatCompletionOptions) {
    const systemMessage = messages.find(msg => msg.role === 'system');
    const conversationMessages = messages.filter(msg => msg.role !== 'system');

    return {
      model: API_CONFIG.anthropic.model,
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.7,
      system: systemMessage?.content || '',
      messages: conversationMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: options.stream,
    };
  }

  private buildGeminiRequest(messages: ChatMessage[], options: ChatCompletionOptions) {
    // Geminiは system メッセージを直接サポートしないので、最初のユーザーメッセージに組み込む
    const systemMessage = messages.find(msg => msg.role === 'system');
    const conversationMessages = messages.filter(msg => msg.role !== 'system');
    
    const geminiMessages = conversationMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // システムメッセージがある場合、最初のユーザーメッセージにプレフィックスとして追加
    if (systemMessage && geminiMessages.length > 0 && geminiMessages[0].role === 'user') {
      geminiMessages[0].parts[0].text = `${systemMessage.content}\n\n${geminiMessages[0].parts[0].text}`;
    }

    return {
      contents: geminiMessages,
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 500, // 90-120文字に最適化
      },
    };
  }

  private extractContentFromResponse(response: any): string {
    if (this.currentProvider === 'openai') {
      return response.choices?.[0]?.delta?.content || 
             response.choices?.[0]?.message?.content || '';
    } else if (this.currentProvider === 'anthropic') {
      return response.delta?.text ||
             response.content?.[0]?.text || '';
    } else if (this.currentProvider === 'gemini') {
      // ストリーミング用とレギュラー用の両方に対応
      return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    return '';
  }

  // モック用のレスポンス生成
  private async* mockStreamResponse(messages: ChatMessage[]): AsyncGenerator<StreamingChatResponse> {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    
    // ユーザーメッセージに応じたより自然な応答パターン
    const mockResponses = this.generateContextualResponse(lastUserMessage);
    const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    
    // 文字を一文字ずつストリーミング
    for (let i = 0; i < response.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50)); // 50ms遅延
      yield {
        content: response[i],
        finished: false,
      };
    }

    yield { content: '', finished: true };
  }

  private async mockChatResponse(messages: ChatMessage[]): Promise<string> {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    const responses = this.generateContextualResponse(lastUserMessage);

    // 1-2秒の遅延をシミュレート
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // ユーザーメッセージに応じた観光ガイド的な応答を生成
  private generateContextualResponse(userMessage: string): string[] {
    const message = userMessage.toLowerCase();
    
    // 挨拶への応答
    if (message.includes('こんにちは') || message.includes('はじめまして') || message.includes('おはよう')) {
      return [
        'こんにちは！東京観光ガイドのみさきです。東京は初めて？',
        'はじめまして〜！今日はどちらに行きたいですか？',
        'おはようございます！いい天気ですね、観光日和です♪',
        'あ、こんにちは！どこから来られたんですか？',
        'こんにちは！東京の街並みはいかがですか？',
      ];
    }

    // 観光地への質問
    if (message.includes('浅草') || message.includes('スカイツリー') || message.includes('雷門')) {
      return [
        '浅草いいですね〜！雷門の大提灯は迫力ありますよ',
        'スカイツリーからの景色、最高ですよね！',
        '人形焼き食べました？仲見世通りのお店がおすすめです',
        '浅草は着物レンタルも人気ですよ〜写真映えします！',
        '雷門から浅草寺まで、お店見ながらゆっくり歩くのが楽しいです',
      ];
    }

    // グルメに関する質問
    if (message.includes('食べ物') || message.includes('グルメ') || message.includes('ラーメン') || message.includes('寿司')) {
      return [
        'おお、グルメですね！何系がお好みですか？',
        'ラーメン好きなんですか？一蘭は定番ですが、地元の店も美味しいですよ',
        '築地の海鮮丼、絶対食べてほしいです！',
        'お寿司なら銀座ですが、回転寿司でも十分美味しいところありますよ',
        '東京のB級グルメもおすすめ！もんじゃ焼きとか',
      ];
    }

    // 交通・アクセスに関する質問
    if (message.includes('電車') || message.includes('行き方') || message.includes('アクセス')) {
      return [
        '電車、最初は複雑に見えますよね〜慣れれば大丈夫です！',
        'Google マップの乗換案内が便利ですよ',
        '山手線覚えちゃえば、主要スポットはほぼ行けます',
        'どこに行きたいんですか？ルート教えますよ〜',
        '1日券買っておくとお得です！',
      ];
    }

    // ショッピングに関する質問
    if (message.includes('ショッピング') || message.includes('買い物') || message.includes('原宿') || message.includes('渋谷')) {
      return [
        'お買い物好きなんですね！原宿の竹下通りは見てるだけでも楽しいです',
        '渋谷のスクランブル交差点、渡りました？あそこは一度は体験してほしい',
        '表参道ヒルズもおしゃれですよ〜',
        '何を買いたいか教えてくれれば、ピッタリの場所案内します！',
        '銀座は高級だけど、ウィンドウショッピングだけでも楽しいです',
      ];
    }

    // 質問や相談への応答
    if (message.includes('？') || message.includes('おすすめ') || message.includes('どこ')) {
      return [
        'んー、どんなのがお好みですか？',
        '何日くらい東京にいるんですか？',
        'ちょっと詳しく教えてもらえます？',
        'いいですね〜！具体的にはどんな感じで？',
        'それなら、こんなのはどうでしょう？',
      ];
    }

    // 一般的な応答（感情・反応のバリエーション）
    const reactions = [
      'そうですね〜',
      'なるほど！',
      'いいですね！',
      'へー、そうなんですね',
      'あ、それなら',
      'わかります！',
      'そうそう！',
    ];

    // デフォルトの応答パターン
    const defaultResponses = [
      'どんなところに興味ありますか？',
      '何か気になることあれば聞いてください！',
      '滞在期間はどのくらいですか？',
      '観光重視？グルメ重視？',
      'せっかくだから楽しみましょう！',
      '他に何か質問ありますか？',
      '東京、気に入ってもらえそうですか？',
    ];

    // 反応 + 応答の組み合わせ
    const reaction = reactions[Math.floor(Math.random() * reactions.length)];
    const response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    
    return [
      reaction + ' ' + response,
      response,
      reaction,
    ];
  }
}