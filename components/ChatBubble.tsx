import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Linking,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppleTheme from '../styles/AppleTheme';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp: string;
  isTyping?: boolean;
  enableTTS?: boolean;
}

// Modern typing indicator component
const ModernTypingIndicator = () => {
  const dot1Anim = useRef(new Animated.Value(0.4)).current;
  const dot2Anim = useRef(new Animated.Value(0.4)).current;
  const dot3Anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const createAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0.4,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      );
    };

    const animation1 = createAnimation(dot1Anim, 0);
    const animation2 = createAnimation(dot2Anim, 200);
    const animation3 = createAnimation(dot3Anim, 400);

    animation1.start();
    setTimeout(() => animation2.start(), 200);
    setTimeout(() => animation3.start(), 400);

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, []);

  return (
    <View style={styles.typingContainer}>
      <Animated.View style={[styles.typingDot, { opacity: dot1Anim }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot2Anim }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot3Anim }]} />
    </View>
  );
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isUser,
  timestamp,
  isTyping = false,
  enableTTS = true,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isUser ? 30 : -30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: AppleTheme.animations.normal,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // URLを検出してクリック可能にする
  const renderMessageWithLinks = (text: string) => {
    const urlPattern = /(https?:\/\/[^\s]+|maps:\/\/[^\s]+)/g;
    const parts = text.split(urlPattern);
    
    return parts.map((part, index) => {
      if (part.match(urlPattern)) {
        return (
          <Text
            key={index}
            style={[styles.link, isUser ? styles.userLink : styles.aiLink]}
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
      }
    } catch (error) {
      console.error('Link error:', error);
    }
  };

  if (isTyping) {
    return (
      <Animated.View 
        style={[
          styles.container, 
          styles.aiContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateX: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
          <ModernTypingIndicator />
        </View>
      </Animated.View>
    );
  }

  const BubbleContent = () => {
    if (isUser) {
      return (
        <LinearGradient
          colors={[AppleTheme.colors.systemBlue, '#0051D5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.userBubble]}
        >
          <Text style={[styles.message, styles.userText]}>
            {renderMessageWithLinks(message)}
          </Text>
          <Text style={[styles.timestamp, styles.userTimestamp]}>{timestamp}</Text>
        </LinearGradient>
      );
    }
    
    return (
      <View style={[styles.bubble, styles.aiBubble]}>
        <Text style={[styles.message, styles.aiText]}>
          {renderMessageWithLinks(message)}
        </Text>
        <Text style={[styles.timestamp, styles.aiTimestamp]}>{timestamp}</Text>
      </View>
    );
  };
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        isUser ? styles.userContainer : styles.aiContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim }
          ]
        }
      ]}
    >
      <BubbleContent />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: AppleTheme.spacing.sm,
    paddingHorizontal: 0,
    flexDirection: 'row',
  } as ViewStyle,
  
  userContainer: {
    justifyContent: 'flex-end',
    paddingRight: AppleTheme.spacing.lg,
    paddingLeft: AppleTheme.spacing.xxxxl,
  } as ViewStyle,
  
  aiContainer: {
    justifyContent: 'flex-start',
    paddingLeft: AppleTheme.spacing.lg,
    paddingRight: AppleTheme.spacing.xxxxl,
  } as ViewStyle,
  
  bubble: {
    maxWidth: '100%',
    borderRadius: AppleTheme.radius.xl,
    paddingVertical: AppleTheme.spacing.md + 2,
    paddingHorizontal: AppleTheme.spacing.lg,
    ...AppleTheme.shadows.small,
  } as ViewStyle,
  
  userBubble: {
    borderBottomRightRadius: AppleTheme.radius.md,
  } as ViewStyle,
  
  aiBubble: {
    backgroundColor: AppleTheme.colors.secondarySystemGroupedBackground,
    borderBottomLeftRadius: AppleTheme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppleTheme.colors.separator,
  } as ViewStyle,
  
  typingBubble: {
    paddingVertical: AppleTheme.spacing.lg,
    minHeight: 48,
    justifyContent: 'center',
  } as ViewStyle,
  
  message: {
    ...AppleTheme.typography.body,
    lineHeight: 22,
  } as TextStyle,
  
  userText: {
    color: AppleTheme.colors.systemBackground,
    fontWeight: '500',
  } as TextStyle,
  
  aiText: {
    color: AppleTheme.colors.label,
  } as TextStyle,
  
  timestamp: {
    ...AppleTheme.typography.caption2,
    marginTop: AppleTheme.spacing.sm,
  } as TextStyle,
  
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  } as TextStyle,
  
  aiTimestamp: {
    color: AppleTheme.colors.tertiaryLabel,
    textAlign: 'left',
  } as TextStyle,
  
  link: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  } as TextStyle,
  
  userLink: {
    color: 'rgba(255, 255, 255, 0.9)',
  } as TextStyle,
  
  aiLink: {
    color: AppleTheme.colors.systemBlue,
  } as TextStyle,
  
  // Modern typing indicator
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: AppleTheme.spacing.sm,
  } as ViewStyle,
  
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AppleTheme.colors.tertiaryLabel,
    marginHorizontal: 3,
  } as ViewStyle,
});