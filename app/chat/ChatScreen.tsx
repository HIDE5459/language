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
  StatusBar,
  Animated,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AppleTheme from '../../styles/AppleTheme';
import { ChatBubble } from '../../components/ChatBubble';
import { ChatInput } from '../../components/ChatInput';
import { ImageMessage } from '../../components/ImageMessage';
import { LLMClient, ChatMessage } from '../../lib/api';
import { PromptManager, DEFAULT_PERSONALITY } from '../../lib/prompts';
import { useStreamingChat, StreamingHelpers } from '../../lib/streaming';
import { getRestaurantsWithinWalkTime, getRandomRestaurant } from '../../lib/restaurants-data';
import { memoryManager } from '../../lib/memory';
import { safetyFilter } from '../../lib/safety';
import { usePerformanceMeasure, cacheManager } from '../../lib/performance';
import { useLanguage } from '../../lib/i18n';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  imageUri?: string;
  imageBase64?: string;
}

export default function ChatScreen() {
  const { measureAsyncOperation } = usePerformanceMeasure('ChatScreen');
  const { t } = useLanguage();
  
  // Apple-style animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  useEffect(() => {
    // Smooth entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: AppleTheme.animations.normal,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t('chat.greeting'),
      isUser: false,
      timestamp: '12:00',
    },
  ]);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // LLMクライアントとプロンプトマネージャーの初期化
  // Gemini Pro Vision を有効化して画像分析機能を使用
  const llmClient = useMemo(() => new LLMClient('gemini'), []);
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
    
    // 雑談モードでは位置情報コンテキストは使用しない
    
    const conversationMessages: ChatMessage[] = messages.map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text,
      timestamp: msg.timestamp,
    }));
    
    return [...systemMessages, ...conversationMessages];
  };

  const handleSendMessage = async (text: string) => {
    // セーフティチェックを一時的に無効化
    // const safetyCheck = safetyFilter.checkContent(text);
    // if (!safetyCheck.isSafe) {
    //   const warningMessage: Message = {
    //     id: Date.now().toString(),
    //     text: safetyCheck.replacementText || 
    //           t('chat.unsafeContentWarning'),
    //     isUser: false,
    //     timestamp: formatTime(),
    //   };
    //   setMessages((prev) => [...prev, warningMessage]);
    //   return;
    // }

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
        text: t('chat.errorMessage'),
        isUser: false,
        timestamp: formatTime(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };


  const handleImageSelected = async (imageUri: string, base64?: string) => {
    // 画像メッセージを追加
    const imageMessage: Message = {
      id: Date.now().toString(),
      text: '', // 画像のみの場合はテキストは空
      isUser: true,
      timestamp: formatTime(),
      imageUri,
      imageBase64: base64,
    };

    setMessages((prev) => [...prev, imageMessage]);

    // AIに画像を分析してもらう
    try {
      const analysisResult = await llmClient.analyzeImage(base64 || '', '写真について教えて');
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: analysisResult,
        isUser: false,
        timestamp: formatTime(),
      };
      
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error('Failed to analyze image:', error);
      
      // エラー時のフォールバック応答
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'ごめんね、画像の分析でエラーが発生しちゃった。でも素敵な写真だと思う！',
        isUser: false,
        timestamp: formatTime(),
      };
      
      setMessages((prev) => [...prev, errorResponse]);
    }
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

  const renderMessage = ({ item }: { item: Message }) => {
    // 画像メッセージの場合
    if (item.imageUri) {
      return (
        <ImageMessage
          imageUri={item.imageUri}
          timestamp={item.timestamp}
          isUser={item.isUser}
          caption={item.text || undefined}
        />
      );
    }
    
    // テキストメッセージの場合
    return (
      <ChatBubble
        message={item.text}
        isUser={item.isUser}
        timestamp={item.timestamp}
        enableTTS={false} // TTS無効化
      />
    );
  };

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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Apple-style Header with Blur Effect */}
      <BlurView intensity={95} style={styles.headerBlur}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <View style={styles.avatarInner}>
                    <View style={styles.avatarHead} />
                    <View style={styles.avatarBody} />
                  </View>
                </View>
                <View style={styles.onlineIndicator} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>{t('chat.title')}</Text>
                <Text style={styles.headerSubtitle}>{t('chat.subtitle')}</Text>
              </View>
            </View>
          </View>
        </View>
      </BlurView>
      
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            ListFooterComponent={renderStreamingMessage()}
            showsVerticalScrollIndicator={false}
            style={styles.messagesFlatList}
          />
          
          <ChatInput
            onSendMessage={handleSendMessage}
            onImageSelected={handleImageSelected}
            disabled={streamingState.isStreaming}
          />
        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppleTheme.colors.systemGroupedBackground,
  } as ViewStyle,
  
  headerBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
  } as ViewStyle,
  
  header: {
    paddingHorizontal: AppleTheme.spacing.lg,
    paddingVertical: AppleTheme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AppleTheme.colors.separator,
  } as ViewStyle,
  
  headerContent: {
    alignItems: 'center',
  } as ViewStyle,
  
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  
  avatarContainer: {
    position: 'relative',
    marginRight: AppleTheme.spacing.md,
  } as ViewStyle,
  
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppleTheme.colors.tertiarySystemGroupedBackground,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppleTheme.colors.separator,
  } as ViewStyle,
  
  avatarInner: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  
  avatarHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppleTheme.colors.tertiaryLabel,
    marginBottom: 2,
  } as ViewStyle,
  
  avatarBody: {
    width: 16,
    height: 10,
    borderRadius: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: AppleTheme.colors.tertiaryLabel,
  } as ViewStyle,
  
  
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppleTheme.colors.systemGreen,
    borderWidth: 2,
    borderColor: AppleTheme.colors.systemBackground,
  } as ViewStyle,
  
  headerTextContainer: {
    alignItems: 'flex-start',
  } as ViewStyle,
  
  headerTitle: {
    ...AppleTheme.typography.headline,
    color: AppleTheme.colors.label,
    fontWeight: '700',
  },
  
  headerSubtitle: {
    ...AppleTheme.typography.caption1,
    color: AppleTheme.colors.systemGreen,
    marginTop: 2,
  },
  
  contentContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
  } as ViewStyle,
  
  keyboardAvoidingView: {
    flex: 1,
  } as ViewStyle,
  
  messagesFlatList: {
    flex: 1,
    backgroundColor: 'transparent',
  } as ViewStyle,
  
  messagesList: {
    paddingVertical: AppleTheme.spacing.lg,
    paddingHorizontal: AppleTheme.spacing.lg,
  } as ViewStyle,
});