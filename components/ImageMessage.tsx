import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AppleTheme from '../styles/AppleTheme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImageMessageProps {
  imageUri: string;
  timestamp: string;
  isUser: boolean;
  caption?: string;
}

export const ImageMessage: React.FC<ImageMessageProps> = ({
  imageUri,
  timestamp,
  isUser,
  caption,
}) => {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Apple-style animations
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

  const handleImagePress = () => {
    setShowFullScreen(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (imageError) {
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
        <View style={[
          styles.bubble,
          styles.errorBubble
        ]}>
          <View style={styles.errorContent}>
            <View style={styles.errorIconContainer}>
              <Ionicons 
                name="image-outline" 
                size={32} 
                color={AppleTheme.colors.tertiaryLabel} 
              />
            </View>
            <Text style={styles.errorText}>画像を読み込めませんでした</Text>
          </View>
          <Text style={[styles.timestamp, styles.errorTimestamp]}>{timestamp}</Text>
        </View>
      </Animated.View>
    );
  }

  const BubbleContent = () => {
    if (isUser) {
      return (
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={handleImagePress}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            onError={handleImageError}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.imageOverlay}
          >
            {caption && (
              <Text style={[styles.caption, styles.userText]}>
                {caption}
              </Text>
            )}
            <Text style={[styles.timestamp, styles.userTimestamp]}>{timestamp}</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity 
        style={[
          styles.bubble,
          styles.aiBubble
        ]}
        onPress={handleImagePress}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            onError={handleImageError}
            resizeMode="cover"
          />
        </View>
        {caption && (
          <View style={styles.captionContainer}>
            <Text style={[styles.caption, styles.aiText]}>
              {caption}
            </Text>
          </View>
        )}
        <Text style={[styles.timestamp, styles.aiTimestamp]}>{timestamp}</Text>
      </TouchableOpacity>
    );
  };
  
  return (
    <>
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

      {/* Apple-style フルスクリーンモーダル */}
      <Modal
        visible={showFullScreen}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFullScreen(false)}
      >
        <BlurView intensity={95} style={styles.fullScreenContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowFullScreen(false)}
          >
            <BlurView intensity={50} style={styles.closeButtonBlur}>
              <Ionicons name="close" size={24} color={AppleTheme.colors.label} />
            </BlurView>
          </TouchableOpacity>
          
          <Image
            source={{ uri: imageUri }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
          
          {caption && (
            <BlurView intensity={80} style={styles.fullScreenCaptionContainer}>
              <Text style={styles.fullScreenCaption}>{caption}</Text>
            </BlurView>
          )}
        </BlurView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: AppleTheme.spacing.sm,
    paddingHorizontal: 0,
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
    maxWidth: screenWidth * 0.7,
    borderRadius: AppleTheme.radius.xl,
    overflow: 'hidden',
    backgroundColor: AppleTheme.colors.secondarySystemGroupedBackground,
    ...AppleTheme.shadows.small,
  } as ViewStyle,
  
  aiBubble: {
    borderBottomLeftRadius: AppleTheme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppleTheme.colors.separator,
  } as ViewStyle,
  
  imageContainer: {
    position: 'relative',
    borderRadius: AppleTheme.radius.xl,
    overflow: 'hidden',
  } as ViewStyle,
  
  image: {
    width: '100%',
    height: 200,
    aspectRatio: 1.4,
  } as ImageStyle,
  
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: AppleTheme.spacing.lg,
    paddingVertical: AppleTheme.spacing.md,
    justifyContent: 'flex-end',
  } as ViewStyle,
  
  captionContainer: {
    paddingHorizontal: AppleTheme.spacing.lg,
    paddingTop: AppleTheme.spacing.md,
  } as ViewStyle,
  
  caption: {
    ...AppleTheme.typography.body,
    lineHeight: 20,
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
    paddingHorizontal: AppleTheme.spacing.lg,
    paddingBottom: AppleTheme.spacing.md,
  } as TextStyle,
  
  // Error states
  errorBubble: {
    backgroundColor: AppleTheme.colors.secondarySystemFill,
    borderRadius: AppleTheme.radius.xl,
    padding: AppleTheme.spacing.lg,
    maxWidth: screenWidth * 0.7,
    ...AppleTheme.shadows.small,
  } as ViewStyle,
  
  errorContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: AppleTheme.spacing.xl,
  } as ViewStyle,
  
  errorIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: AppleTheme.colors.systemFill,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: AppleTheme.spacing.md,
  } as ViewStyle,
  
  errorText: {
    ...AppleTheme.typography.footnote,
    color: AppleTheme.colors.secondaryLabel,
    textAlign: 'center',
    marginTop: AppleTheme.spacing.sm,
  } as TextStyle,
  
  errorTimestamp: {
    color: AppleTheme.colors.tertiaryLabel,
    textAlign: 'center',
    marginTop: AppleTheme.spacing.md,
  } as TextStyle,
  
  // Full screen modal
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: AppleTheme.spacing.xl,
    zIndex: 1000,
  } as ViewStyle,
  
  closeButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  } as ViewStyle,
  
  fullScreenImage: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.7,
    borderRadius: AppleTheme.radius.xl,
  } as ImageStyle,
  
  fullScreenCaptionContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: AppleTheme.spacing.xl,
    right: AppleTheme.spacing.xl,
    borderRadius: AppleTheme.radius.lg,
    padding: AppleTheme.spacing.lg,
    overflow: 'hidden',
  } as ViewStyle,
  
  fullScreenCaption: {
    ...AppleTheme.typography.body,
    color: AppleTheme.colors.label,
    textAlign: 'center',
    lineHeight: 22,
  } as TextStyle,
});