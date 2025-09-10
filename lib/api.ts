export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  imageData?: string; // base64画像データ
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
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
    streamEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:streamGenerateContent',
    model: 'gemini-1.5-pro',
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

  // 画像分析メソッド
  async analyzeImage(base64Image: string, userMessage?: string): Promise<string> {
    try {
      if (this.currentProvider === 'mock') {
        return await this.mockImageAnalysis(userMessage);
      }

      // Gemini Pro Visionで実際の画像分析
      if (this.currentProvider === 'gemini') {
        return await this.geminiImageAnalysis(base64Image);
      }

      // 他のプロバイダーは将来実装
      console.log('Image analysis not supported for this provider, falling back to mock');
      return await this.mockImageAnalysis(userMessage);
    } catch (error) {
      console.error('Image analysis error:', error);
      return 'すみません、画像の分析でエラーが発生しました。もう一度お試しください。';
    }
  }

  // モック食事画像分析
  private async mockImageAnalysis(userMessage?: string): Promise<string> {
    // 食べ物のサンプルデータベース
    const foodDatabase = [
      {
        name: 'チキンサラダ',
        calories: 180,
        carbs: 8,
        protein: 25,
        advice: '素晴らしいお食事ですね！高タンパク・低糖質で筋トレに最適です。この調子で続けていきましょう！'
      },
      {
        name: 'ハンバーガー',
        calories: 540,
        carbs: 45,
        protein: 22,
        advice: '糖質と脂質が少し高めですね。今日は筋トレを長めにして、消費カロリーを増やしましょう！'
      },
      {
        name: '白米とから揚げ',
        calories: 650,
        carbs: 78,
        protein: 28,
        advice: '糖質量がかなり多いですね。タンパク質は素晴らしいので、白米を玄米に変えてみてはいかがでしょうか？'
      },
      {
        name: 'プロテインスムージー',
        calories: 220,
        carbs: 12,
        protein: 35,
        advice: '素晴らしい選択です！筋トレ後の理想的な食事ですね。お体作りをよく理解されています！'
      },
      {
        name: 'ラーメン',
        calories: 750,
        carbs: 85,
        protein: 18,
        advice: '糖質と脂質が特に高いメニューですね。今後は量を減らして、筋トレでカロリー消費を心がけましょう！'
      },
      {
        name: 'グリルチキンとブロッコリー',
        calories: 280,
        carbs: 15,
        protein: 40,
        advice: '本当に素晴らしいメニューです！ボディメイクの王道ですね。この食事を継続していけば結果は必ずついてきます！'
      },
      {
        name: 'ケーキ',
        calories: 380,
        carbs: 55,
        protein: 4,
        advice: '糖質が非常に多く、カロリーも高めですね。お体作りのためには控えめにした方がよろしいかと思います。'
      },
      {
        name: '卵焼きとサラダ',
        calories: 240,
        carbs: 8,
        protein: 18,
        advice: 'バランスの良いお食事ですね。さらにタンパク質を増やすと、より効果的になりますよ。卵をあと2個追加してみてください。'
      }
    ];

    // ランダムに食べ物を選択
    const selectedFood = foodDatabase[Math.floor(Math.random() * foodDatabase.length)];

    // 分析結果をフォーマット
    const analysisResult = `
📊 **${selectedFood.name}**

🔥 カロリー: ${selectedFood.calories}kcal
🍚 糖質: ${selectedFood.carbs}g
💪 タンパク質: ${selectedFood.protein}g

${selectedFood.advice}
    `.trim();

    // 1-2秒の遅延をシミュレート
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    return analysisResult;
  }

  // Gemini Pro Vision画像分析
  private async geminiImageAnalysis(base64Image: string): Promise<string> {
    const config = API_CONFIG.gemini;
    
    if (!config.apiKey) {
      console.log('Gemini API key not found, falling back to mock');
      return await this.mockImageAnalysis();
    }

    const prompt = `この画像を分析して、以下の情報を提供してください：

【画像に食べ物が写っている場合】
1. 食べ物の名前を特定してください
2. おおよそのカロリー（kcal）
3. 糖質量（g）
4. タンパク質量（g）
5. パーソナルトレーナーとして、この食事に対する専門的なアドバイス

【食べ物以外の場合】
「申し訳ございませんが、こちらは食べ物ではないようですね。お食事の写真をお送りいただけますでしょうか？体作りのために栄養分析をさせていただきます。」

回答は以下の形式でお願いします：

📊 **[食べ物名]**

🔥 カロリー: [数値]kcal
🍚 糖質: [数値]g  
💪 タンパク質: [数値]g

[パーソナルトレーナーとしての丁寧なアドバイス]`;

    try {
      const endpoint = `${config.endpoint}?key=${config.apiKey}`;
      
      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const analysisResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (analysisResult.trim()) {
        return analysisResult;
      } else {
        throw new Error('Empty response from Gemini');
      }
    } catch (error) {
      console.error('Gemini image analysis error:', error);
      console.log('Falling back to mock analysis');
      return await this.mockImageAnalysis();
    }
  }

  // ユーザーメッセージに応じた雑談的な応答を生成
  private generateContextualResponse(userMessage: string): string[] {
    const message = userMessage.toLowerCase();
    
    // 挨拶への応答
    if (message.includes('こんにちは') || message.includes('はじめまして') || message.includes('おはよう')) {
      return [
        'こんにちは！今日も体作り頑張りましょう！',
        'はじめまして！パーソナルトレーナーのタケシです。',
        'おはようございます！朝からやる気で素晴らしいですね！',
        'こんにちは！今日は何をお食べになる予定でしょうか？',
        'こんにちは！体調はいかがですか？',
      ];
    }

    // 筋トレ・フィットネスへの反応
    if (message.includes('筋トレ') || message.includes('ジム') || message.includes('運動')) {
      return [
        '素晴らしいですね！筋トレは体作りの基本です。どのようなトレーニングをされていますか？',
        'ジムに通っていらっしゃるのですね！素晴らしいことです。',
        '運動は健康的な体作りの基本ですね。続けていきましょう！',
        'どのようなトレーニングメニューをされているのでしょうか？よろしければアドバイスさせていただきます。',
        '筋トレ仲間ですね！一緒に頑張っていきましょう！',
      ];
    }

    // 食べ物・栄養の話題
    if (message.includes('食べ物') || message.includes('食事') || message.includes('ラーメン') || message.includes('美味しい')) {
      return [
        '何をお食べになったでしょうか？よろしければ写真で拝見させていただけますか？',
        '食事は体作りの70%を占めるといわれています。栄養バランスに気をつけていらっしゃいますか？',
        'ラーメンは糖質が多めのメニューですので、筋トレ後であればエネルギー補給には良いでしょうね。',
        '美味しいお食事を楽しみつつ、栄養バランスも考えていただけると素晴らしいですね。',
        'プロテインの摂取はいかがでしょうか？筋肉の成長にはタンパク質が不可欠です。',
      ];
    }

    // 疲労・体調の話題
    if (message.includes('疲れた') || message.includes('お疲れ') || message.includes('大変')) {
      return [
        'お疲れさまでした。ただ、軽いストレッチやウォーキングなどで血流を促進すると回復が早くなりますよ。',
        '疲労は筋肉が成長している証拠ですので、タンパク質をしっかり摂って回復を促進しましょう。',
        'お疲れさまでした。今日のお食事はいかがでしたか？',
        '疲れている時こそ、栄養の摂取が大切です。プロテインドリンクでもいかがでしょうか？',
        '大変な日こそ、体のケアを大事にしてくださいね。',
      ];
    }

    // 気持ち・モチベーションの話題
    if (message.includes('嬉しい') || message.includes('やる気') || message.includes('頑張る')) {
      return [
        '素晴らしいモチベーションですね！そのやる気で筋トレも頑張っていきましょう。',
        '嬉しい気持ちの時こそ、体作りに集中できるチャンスですね。続けていきましょう。',
        'やる気に満ちているのですね！今日は筋トレを少し多めにしてみましょうか。',
        '頑張る気持ちが一番大切です。結果は必ずついてきますので、一緒に頑張っていきましょう。',
        'その調子です！私も心から応援していますよ。',
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
      '今日は筋トレをされましたか？',
      '最近のお食事はいかがでしょうか？よろしければ写真で拝見させてください。',
      'プロテインの摂取は十分でしょうか？',
      '体重の管理はいかがですか？数値を教えていただけるとアドバイスできますよ。',
      '目標に向かって順調に進んでいらっしゃいますか？',
      '体作りで何かお悩みや相談ございますか？',
      '一緒に理想のお体を目指して頑張りましょう！',
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