import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  FlatList,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  Text,
} from 'react-native';
import { ChatBubble } from '../../components/ChatBubble';
import { ChatInput } from '../../components/ChatInput';
import { LLMClient, ChatMessage } from '../../lib/api';
import { PromptManager, DEFAULT_PERSONALITY } from '../../lib/prompts';
import { useStreamingChat, StreamingHelpers } from '../../lib/streaming';
import { LocationData } from '../../lib/location';
import { getRestaurantsWithinWalkTime, getRandomRestaurant } from '../../lib/restaurants-data';
import { memoryManager } from '../../lib/memory';
import { safetyFilter } from '../../lib/safety';
import { usePerformanceMeasure, cacheManager } from '../../lib/performance';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

export default function ChatScreen() {
  const { measureAsyncOperation } = usePerformanceMeasure('ChatScreen');
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'こんにちは！私は東京観光ガイドのみさきです。東京観光のことなら何でも聞いてくださいね！どちらから来られましたか？',
      isUser: false,
      timestamp: '12:00',
    },
  ]);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // LLMクライアントとプロンプトマネージャーの初期化
  // 'mock' → 'gemini' に変更してGemini AIを有効化
  const llmClient = useMemo(() => new LLMClient('openai'), []);
  const promptManager = useMemo(() => new PromptManager(DEFAULT_PERSONALITY), []);
  
  // ストリーミングチャットのフック
  const { streamingState, sendStreamingMessage, cancelStream } = useStreamingChat(llmClient);

  const formatTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  };

  const buildChatHistory = (): ChatMessage[] => {
    const systemMessages = promptManager.generateConversationContext();
    
    // 記憶コンテキストを追加
    const memoryContext = memoryManager.generateMemoryContext();
    if (memoryContext) {
      systemMessages.push({
        role: 'system',
        content: `ユーザーについての記憶:\n${memoryContext}`,
      });
    }
    
    // 位置情報がある場合は追加
    if (currentLocation?.area) {
      // 実在する店舗データを取得
      const nearbyRestaurants = getRestaurantsWithinWalkTime(currentLocation.area, 10);
      const restaurantList = nearbyRestaurants.slice(0, 5).map(r => 
        `- ${r.name}（${r.category}、徒歩${r.walkTime}分、${r.priceRange}）`
      ).join('\n');
      
      systemMessages.push({
        role: 'system',
        content: `現在位置: ${currentLocation.area}（${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}）\n\n利用可能な実在店舗リスト：\n${restaurantList}\n\nこれらの実在する店舗から選んで推薦してください。架空の店舗は作らないでください。`,
      });
    }
    
    const conversationMessages: ChatMessage[] = messages.map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text,
      timestamp: msg.timestamp,
    }));
    
    return [...systemMessages, ...conversationMessages];
  };

  const handleSendMessage = async (text: string) => {
    // セーフティチェック
    const safetyCheck = safetyFilter.checkContent(text);
    if (!safetyCheck.isSafe) {
      // 安全でない場合は警告メッセージを表示
      const warningMessage: Message = {
        id: Date.now().toString(),
        text: safetyCheck.replacementText || 
              'そういう話題はちょっと...別のことを話そうよ！',
        isUser: false,
        timestamp: formatTime(),
      };
      setMessages((prev) => [...prev, warningMessage]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: formatTime(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // メッセージから話題やキーワードを抽出して記憶に保存
    const extractMemoryFromMessage = async (message: string) => {
      // 簡単なキーワード抽出（実際はNLP処理が望ましい）
      const keywords = message.match(/[ぁ-んァ-ヶー一-龠０-９ａ-ｚＡ-Ｚ]+/g) || [];
      const importantKeywords = keywords.filter(k => k.length > 2).slice(0, 3);
      
      for (const keyword of importantKeywords) {
        await memoryManager.addKeyword(keyword);
      }
      
      // 話題として全体を保存
      if (message.length > 10) {
        await memoryManager.addTopic(message.substring(0, 50));
      }
    };
    
    await extractMemoryFromMessage(text);

    // チャット履歴を構築してAPIに送信
    const chatHistory = buildChatHistory();
    chatHistory.push({
      role: 'user',
      content: text,
      timestamp: formatTime(),
    });

    try {
      const stopTiming = measureAsyncOperation('sendMessage');
      await sendStreamingMessage(chatHistory);
      stopTiming();
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // エラー時のフォールバック応答
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'すみません、少し調子が悪いみたい...もう一度試してもらえる？',
        isUser: false,
        timestamp: formatTime(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleVoicePress = () => {
    console.log('Voice input pressed');
    // 音声入力機能は後で実装
  };

  const handleLocationPress = (location: LocationData) => {
    setCurrentLocation(location);
    
    // 位置情報取得メッセージを追加
    const locationMessage: Message = {
      id: Date.now().toString(),
      text: `現在地: ${location.area || '取得完了'}`,
      isUser: true,
      timestamp: formatTime(),
    };
    
    setMessages((prev) => [...prev, locationMessage]);
    
    // 実在する店舗データを取得してAIに伝える
    const nearbyRestaurants = getRestaurantsWithinWalkTime(location.area || '東京23区内', 10);
    const randomRestaurant = getRandomRestaurant(location.area || '東京23区内');
    
    const contextMessage = `現在地は${location.area}です。ここから徒歩10分以内で行けるおすすめスポットを具体的な店名と歩行時間付きで教えてください。例：${randomRestaurant?.name || 'くら寿司'}（徒歩${randomRestaurant?.walkTime || 5}分）`;
    setTimeout(() => {
      handleSendMessage(contextMessage);
    }, 100);
  };

  // ストリーミング状態が変化した時の処理
  useEffect(() => {
    if (StreamingHelpers.isStreamComplete(streamingState) && streamingState.currentContent.trim()) {
      // ストリーミング完了時にメッセージを追加（重複チェック）
      setMessages((prev) => {
        // 最後のメッセージが同じ内容の場合は追加しない
        const lastMessage = prev[prev.length - 1];
        if (!lastMessage?.isUser && lastMessage?.text === streamingState.currentContent.trim()) {
          return prev;
        }
        
        const aiMessage: Message = {
          id: (Date.now() + Math.random()).toString(),
          text: streamingState.currentContent.trim(),
          isUser: false,
          timestamp: formatTime(),
        };
        return [...prev, aiMessage];
      });
      
      // ストリーミング状態をリセット
      setTimeout(() => {
        cancelStream();
      }, 100);
    }
  }, [streamingState.finished, streamingState.currentContent, cancelStream]);

  useEffect(() => {
    // 新しいメッセージが追加されたりストリーミング中にスクロール
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, streamingState.currentContent]);

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatBubble
      message={item.text}
      isUser={item.isUser}
      timestamp={item.timestamp}
      enableTTS={false} // TTS無効化
    />
  );

  const renderStreamingMessage = () => {
    // エラーの場合
    if (streamingState.error) {
      return (
        <ChatBubble
          message={StreamingHelpers.translateError(streamingState.error)}
          isUser={false}
          timestamp={formatTime()}
        />
      );
    }

    // ストリーミング中でまだコンテンツがない場合（タイピング表示）
    if (streamingState.isStreaming && !streamingState.currentContent) {
      return (
        <ChatBubble
          message=""
          isUser={false}
          timestamp=""
          isTyping={true}
        />
      );
    }

    // ストリーミング中でコンテンツがある場合
    if (streamingState.isStreaming && streamingState.currentContent) {
      return (
        <ChatBubble
          message={streamingState.currentContent}
          isUser={false}
          timestamp={formatTime()}
        />
      );
    }

    // それ以外は何も表示しない
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>東京観光ガイド みさき</Text>
        <Text style={styles.headerSubtitle}>オンライン</Text>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        ListFooterComponent={renderStreamingMessage()}
      />
      
      <ChatInput
        onSendMessage={handleSendMessage}
        onVoicePress={handleVoicePress}
        onLocationPress={handleLocationPress}
        disabled={streamingState.isStreaming}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  } as ViewStyle,
  header: {
    backgroundColor: '#7CB342',
    paddingTop: Platform.OS === 'ios' ? 0 : 24,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#689F38',
  } as ViewStyle,
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#E8F5E9',
    marginTop: 2,
  },
  messagesList: {
    paddingVertical: 16,
  } as ViewStyle,
});