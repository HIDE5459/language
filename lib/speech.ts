import * as FileSystem from 'expo-file-system';
import { RecordingResult } from './audio';

export interface ASRResponse {
  text: string;
  confidence: number;
  language?: string;
  duration?: number;
}

export interface TTSRequest {
  text: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number;
  format?: 'mp3' | 'opus' | 'aac' | 'flac';
}

export interface TTSResponse {
  audioUrl: string;
  duration?: number;
}

// ASR (音声認識) クライアント
export class ASRClient {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string = '', provider: 'openai' | 'google' | 'mock' = 'mock') {
    this.apiKey = apiKey;
    
    switch (provider) {
      case 'openai':
        this.endpoint = 'https://api.openai.com/v1/audio/transcriptions';
        break;
      case 'google':
        this.endpoint = 'https://speech.googleapis.com/v1/speech:recognize';
        break;
      default:
        this.endpoint = 'mock';
    }
  }

  async transcribe(recording: RecordingResult): Promise<ASRResponse> {
    if (this.endpoint === 'mock') {
      return this.mockTranscribe(recording);
    }

    try {
      // ファイルをBase64エンコード
      const audioData = await FileSystem.readAsStringAsync(recording.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (this.endpoint.includes('openai')) {
        return this.transcribeOpenAI(audioData, recording);
      } else if (this.endpoint.includes('google')) {
        return this.transcribeGoogle(audioData, recording);
      }

      throw new Error('Unsupported ASR provider');
    } catch (error) {
      console.error('ASR transcription failed:', error);
      throw new Error('音声認識に失敗しました');
    }
  }

  private async transcribeOpenAI(audioData: string, recording: RecordingResult): Promise<ASRResponse> {
    const formData = new FormData();
    formData.append('file', {
      uri: recording.uri,
      type: 'audio/m4a',
      name: 'audio.m4a',
    } as any);
    formData.append('model', 'whisper-1');
    formData.append('language', 'ja');
    formData.append('response_format', 'json');

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OpenAI ASR failed: ${response.status}`);
    }

    const result = await response.json();
    return {
      text: result.text || '',
      confidence: 0.9, // OpenAIは信頼度を返さないため固定値
      language: 'ja',
      duration: recording.duration,
    };
  }

  private async transcribeGoogle(audioData: string, recording: RecordingResult): Promise<ASRResponse> {
    const requestBody = {
      config: {
        encoding: 'MP3',
        sampleRateHertz: 16000,
        languageCode: 'ja-JP',
        alternativeLanguageCodes: ['en-US'],
      },
      audio: {
        content: audioData,
      },
    };

    const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Google ASR failed: ${response.status}`);
    }

    const result = await response.json();
    const alternative = result.results?.[0]?.alternatives?.[0];

    if (!alternative) {
      throw new Error('音声を認識できませんでした');
    }

    return {
      text: alternative.transcript || '',
      confidence: alternative.confidence || 0.0,
      language: 'ja',
      duration: recording.duration,
    };
  }

  private async mockTranscribe(recording: RecordingResult): Promise<ASRResponse> {
    // モック応答（開発用）
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockResponses = [
      'こんにちは、今日はいい天気ですね',
      'お疲れさまでした',
      'ありがとうございます',
      '今度一緒にお出かけしませんか',
      'とても楽しかったです',
      '明日も頑張りましょう',
    ];

    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];

    return {
      text: randomResponse,
      confidence: 0.85 + Math.random() * 0.15, // 0.85-1.0の間
      language: 'ja',
      duration: recording.duration,
    };
  }
}

// TTS (音声合成) クライアント
export class TTSClient {
  private apiKey: string;
  private endpoint: string;
  private provider: string;

  constructor(apiKey: string = '', provider: 'openai' | 'elevenlabs' | 'google' | 'mock' = 'mock') {
    this.apiKey = apiKey;
    this.provider = provider;
    
    switch (provider) {
      case 'openai':
        this.endpoint = 'https://api.openai.com/v1/audio/speech';
        break;
      case 'elevenlabs':
        this.endpoint = 'https://api.elevenlabs.io/v1/text-to-speech';
        break;
      case 'google':
        this.endpoint = 'https://texttospeech.googleapis.com/v1/text:synthesize';
        break;
      default:
        this.endpoint = 'mock';
    }
  }

  async synthesize(request: TTSRequest): Promise<TTSResponse> {
    if (this.endpoint === 'mock') {
      return this.mockSynthesize(request);
    }

    try {
      if (this.provider === 'openai') {
        return this.synthesizeOpenAI(request);
      } else if (this.provider === 'elevenlabs') {
        return this.synthesizeElevenLabs(request);
      } else if (this.provider === 'google') {
        return this.synthesizeGoogle(request);
      }

      throw new Error('Unsupported TTS provider');
    } catch (error) {
      console.error('TTS synthesis failed:', error);
      throw new Error('音声合成に失敗しました');
    }
  }

  private async synthesizeOpenAI(request: TTSRequest): Promise<TTSResponse> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: request.text,
        voice: request.voice || 'alloy',
        speed: request.speed || 1.0,
        response_format: request.format || 'mp3',
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI TTS failed: ${response.status}`);
    }

    // 音声データをファイルとして保存
    const audioBlob = await response.blob();
    const fileName = `tts_${Date.now()}.mp3`;
    const localUri = `${FileSystem.cacheDirectory}${fileName}`;
    
    // Blobをbase64に変換してファイルに保存
    const base64 = await this.blobToBase64(audioBlob);
    await FileSystem.writeAsStringAsync(localUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return {
      audioUrl: localUri,
      duration: undefined, // OpenAIは時間を返さない
    };
  }

  private async synthesizeElevenLabs(request: TTSRequest): Promise<TTSResponse> {
    const voiceId = '21m00Tcm4TlvDq8ikWAM'; // デフォルトの音声ID
    
    const response = await fetch(`${this.endpoint}/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
      },
      body: JSON.stringify({
        text: request.text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs TTS failed: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const fileName = `tts_${Date.now()}.mp3`;
    const localUri = `${FileSystem.cacheDirectory}${fileName}`;
    
    const base64 = await this.blobToBase64(audioBlob);
    await FileSystem.writeAsStringAsync(localUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return {
      audioUrl: localUri,
    };
  }

  private async synthesizeGoogle(request: TTSRequest): Promise<TTSResponse> {
    const requestBody = {
      input: { text: request.text },
      voice: {
        languageCode: 'ja-JP',
        ssmlGender: 'FEMALE',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: request.speed || 1.0,
      },
    };

    const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Google TTS failed: ${response.status}`);
    }

    const result = await response.json();
    const fileName = `tts_${Date.now()}.mp3`;
    const localUri = `${FileSystem.cacheDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(localUri, result.audioContent, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return {
      audioUrl: localUri,
    };
  }

  private async mockSynthesize(request: TTSRequest): Promise<TTSResponse> {
    // モック応答（開発用）
    await new Promise(resolve => setTimeout(resolve, 1500));

    // ダミーのオーディオファイルパスを返す
    const fileName = `mock_tts_${Date.now()}.mp3`;
    const localUri = `${FileSystem.cacheDirectory}${fileName}`;

    // 実際のアプリでは、事前に用意したサンプル音声を使用可能
    return {
      audioUrl: localUri,
      duration: request.text.length * 100, // 概算時間（ミリ秒）
    };
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}