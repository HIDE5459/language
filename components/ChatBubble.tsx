import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, Linking } from 'react-native';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: string;
  isTyping?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isUser,
  timestamp,
  isTyping = false,
}) => {
  // URLを検出してクリック可能にする
  const renderMessageWithLinks = (text: string) => {
    // URLパターンを検出
    const urlPattern = /(https?:\/\/[^\s]+|maps:\/\/[^\s]+)/g;
    const parts = text.split(urlPattern);
    
    return parts.map((part, index) => {
      if (part.match(urlPattern)) {
        return (
          <Text
            key={index}
            style={styles.link}
            onPress={() => handleLinkPress(part)}
          >
            {part.includes('maps.google.com') ? '🗺️ Google Maps' : 
             part.includes('maps://') ? '🍎 Apple Maps' : part}
          </Text>
        );
      }
      return part;
    });
  };

  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log('リンクを開けませんでした:', url);
      }
    } catch (error) {
      console.error('リンクエラー:', error);
    }
  };
  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {isTyping ? (
          <View style={styles.typingIndicator}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        ) : (
          <>
            <Text style={[styles.message, isUser ? styles.userMessage : styles.assistantMessage]}>
              {renderMessageWithLinks(message)}
            </Text>
            
          </>
        )}
      </View>
      <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
        {timestamp}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
  } as ViewStyle,
  userContainer: {
    alignItems: 'flex-end',
  } as ViewStyle,
  assistantContainer: {
    alignItems: 'flex-start',
  } as ViewStyle,
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  } as ViewStyle,
  userBubble: {
    backgroundColor: '#7CB342',
    borderBottomRightRadius: 4,
  } as ViewStyle,
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  } as ViewStyle,
  message: {
    fontSize: 16,
    lineHeight: 22,
  } as TextStyle,
  userMessage: {
    color: '#FFFFFF',
  } as TextStyle,
  assistantMessage: {
    color: '#212121',
  } as TextStyle,
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    color: '#757575',
  } as TextStyle,
  userTimestamp: {
    marginRight: 4,
  } as TextStyle,
  assistantTimestamp: {
    marginLeft: 4,
  } as TextStyle,
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  } as ViewStyle,
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#757575',
    marginHorizontal: 2,
  } as ViewStyle,
  dot1: {
    opacity: 0.4,
  } as ViewStyle,
  dot2: {
    opacity: 0.7,
  } as ViewStyle,
  dot3: {
    opacity: 1,
  } as ViewStyle,
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
    fontWeight: '500',
  } as TextStyle,
});