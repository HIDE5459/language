import { useState, useCallback, useRef, useEffect } from 'react';
import { LLMClient, ChatMessage, StreamingChatResponse } from './api';
import { safetyFilter, SafetyCheckResult } from './safety';

export interface StreamingState {
  isStreaming: boolean;
  currentContent: string;
  error?: string;
  finished: boolean;
}

export interface UseStreamingChatReturn {
  streamingState: StreamingState;
  sendStreamingMessage: (messages: ChatMessage[]) => Promise<void>;
  cancelStream: () => void;
  resetStream: () => void;
}

export function useStreamingChat(client: LLMClient): UseStreamingChatReturn {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentContent: '',
    finished: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const streamGeneratorRef = useRef<AsyncGenerator<StreamingChatResponse> | null>(null);

  const resetStream = useCallback(() => {
    setStreamingState({
      isStreaming: false,
      currentContent: '',
      finished: false,
      error: undefined,
    });
    abortControllerRef.current = null;
    streamGeneratorRef.current = null;
  }, []);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (streamGeneratorRef.current) {
      streamGeneratorRef.current.return?.(undefined);
    }
    resetStream();
  }, [resetStream]);

  const sendStreamingMessage = useCallback(async (messages: ChatMessage[]) => {
    try {
      // 前回のストリームをキャンセル
      if (streamingState.isStreaming) {
        cancelStream();
      }

      // 新しいストリーム開始
      setStreamingState({
        isStreaming: true,
        currentContent: '',
        finished: false,
        error: undefined,
      });

      abortControllerRef.current = new AbortController();
      streamGeneratorRef.current = client.streamChatCompletion(messages);

      let accumulatedContent = '';

      for await (const chunk of streamGeneratorRef.current) {
        // キャンセルされた場合は中断
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        if (chunk.error) {
          setStreamingState(prev => ({
            ...prev,
            isStreaming: false,
            error: chunk.error,
            finished: true,
          }));
          break;
        }

        if (chunk.finished) {
          setStreamingState(prev => ({
            ...prev,
            isStreaming: false,
            finished: true,
          }));
          break;
        }

        // コンテンツを追加
        accumulatedContent += chunk.content;
        
        // セーフティチェック（完了時のみ）
        if (chunk.finished && accumulatedContent.trim()) {
          const safetyCheck = safetyFilter.checkAIResponse(accumulatedContent);
          if (!safetyCheck.isSafe) {
            // 安全でない場合は代替応答を使用
            const safeResponse = safetyCheck.replacementText || 
                               safetyFilter.generateSafeResponse('');
            accumulatedContent = safeResponse;
            console.warn('Unsafe AI response filtered:', safetyCheck.violations);
          }
        }
        
        setStreamingState(prev => ({
          ...prev,
          currentContent: accumulatedContent,
        }));
      }

    } catch (error) {
      console.error('Streaming error:', error);
      setStreamingState(prev => ({
        ...prev,
        isStreaming: false,
        error: error instanceof Error ? error.message : 'ストリーミング中にエラーが発生しました',
        finished: true,
      }));
    }
  }, [client, streamingState.isStreaming, cancelStream]);

  return {
    streamingState,
    sendStreamingMessage,
    cancelStream,
    resetStream,
  };
}

// ストリーミング表示用のコンポーネントフック
export function useStreamingDisplay(content: string, isStreaming: boolean) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [showCursor, setShowCursor] = useState(false);
  
  useEffect(() => {
    if (isStreaming) {
      setDisplayedContent(content);
      setShowCursor(true);
      
      // カーソル点滅アニメーション
      const cursorInterval = setInterval(() => {
        setShowCursor(prev => !prev);
      }, 500);
      
      return () => clearInterval(cursorInterval);
    } else {
      setDisplayedContent(content);
      setShowCursor(false);
    }
  }, [content, isStreaming]);
  
  return {
    displayedContent,
    showCursor,
  };
}

// メッセージ分割ユーティリティ（長いメッセージの処理用）
export function chunkMessage(content: string, maxChunkSize: number = 100): string[] {
  if (content.length <= maxChunkSize) {
    return [content];
  }

  const chunks: string[] = [];
  let currentChunk = '';
  
  // 文節単位で分割を試行
  const sentences = content.split(/([。！？\n])/);
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length <= maxChunkSize) {
      currentChunk += sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

// ストリーミング速度制御
export class StreamingController {
  private delay: number;
  
  constructor(delay: number = 30) {
    this.delay = delay;
  }
  
  async *controlledStream(content: string): AsyncGenerator<string> {
    for (let i = 0; i < content.length; i++) {
      yield content.charAt(i);
      if (this.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }
  }
  
  setDelay(delay: number) {
    this.delay = delay;
  }
}

// ストリーミング状態管理のヘルパー
export const StreamingHelpers = {
  // エラーメッセージの日本語化
  translateError(error: string): string {
    const errorMap: Record<string, string> = {
      'Network request failed': 'ネットワーク接続に失敗しました',
      'API request failed': 'APIリクエストに失敗しました',
      'Streaming interrupted': 'ストリーミングが中断されました',
      'Rate limit exceeded': 'リクエスト制限に達しました。しばらく待ってから再試行してください',
      'Invalid API key': 'APIキーが無効です',
      'Service unavailable': 'サービスが一時的に利用できません',
    };
    
    return errorMap[error] || 'エラーが発生しました。もう一度お試しください。';
  },
  
  // ストリーミング完了の判定
  isStreamComplete(state: StreamingState): boolean {
    return state.finished && !state.isStreaming && !state.error;
  },
  
  // エラー状態の判定
  hasError(state: StreamingState): boolean {
    return !!state.error;
  },
  
  // ストリーミング可能状態の判定
  canStartNewStream(state: StreamingState): boolean {
    return !state.isStreaming;
  },
};