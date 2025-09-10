import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
  Modal,
  Text,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AppleTheme from '../styles/AppleTheme';
import { ImagePickerComponent } from './ImagePicker';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onImageSelected?: (imageUri: string, base64?: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onImageSelected,
  placeholder = 'メッセージを入力...',
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  
  // Apple-style animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const sendButtonScale = useRef(new Animated.Value(message.trim() ? 1 : 0.8)).current;
  
  // Animate send button when message changes
  useEffect(() => {
    Animated.spring(sendButtonScale, {
      toValue: message.trim() ? 1 : 0.8,
      tension: 150,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [message]);
  
  // Button press animation
  const animatePress = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    callback();
  };

  const handleSend = () => {
    if (message.trim() && !disabled) {
      animatePress(() => {
        onSendMessage(message.trim());
        setMessage('');
      });
    }
  };

  return (
    <>
      <BlurView intensity={95} style={styles.container}>
        <Animated.View 
          style={[
            styles.inputContainer,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
        <ImagePickerComponent
          onImageSelected={onImageSelected || (() => {})}
          disabled={disabled}
        />
        
        <View style={styles.textInputContainer}>
          <TextInput
            style={[
              styles.textInput,
              disabled && styles.textInputDisabled
            ]}
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={handleSend}
            placeholder={placeholder}
            placeholderTextColor={AppleTheme.colors.tertiaryLabel}
            multiline={false}
            maxLength={500}
            editable={!disabled}
            returnKeyType="send"
            blurOnSubmit={false}
            autoCorrect={true}
            autoCompleteType="off"
          />
        </View>
        
        <Animated.View 
          style={[
            styles.sendButtonContainer,
            {
              transform: [{ scale: sendButtonScale }]
            }
          ]}
        >
          <TouchableOpacity
            style={[
              styles.sendButton,
              message.trim() && !disabled 
                ? styles.sendButtonActive 
                : styles.sendButtonInactive,
            ]}
            onPress={handleSend}
            disabled={!message.trim() || disabled}
          >
            <Ionicons
              name="arrow-up"
              size={18}
              color={AppleTheme.colors.systemBackground}
              style={{ marginTop: 1 }}
            />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
      </BlurView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: AppleTheme.colors.separator,
    paddingHorizontal: AppleTheme.spacing.lg,
    paddingTop: AppleTheme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? AppleTheme.spacing.xl : AppleTheme.spacing.md,
  } as ViewStyle,
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: AppleTheme.colors.secondarySystemGroupedBackground,
    borderRadius: AppleTheme.radius.xl,
    paddingHorizontal: AppleTheme.spacing.xs,
    paddingVertical: AppleTheme.spacing.xs,
    minHeight: 44,
    ...AppleTheme.shadows.small,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: AppleTheme.colors.separator,
  } as ViewStyle,
  
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: AppleTheme.spacing.xs,
    backgroundColor: 'transparent',
  } as ViewStyle,
  
  iconButtonDisabled: {
    opacity: 0.4,
  } as ViewStyle,
  
  textInputContainer: {
    flex: 1,
    marginHorizontal: AppleTheme.spacing.sm,
  } as ViewStyle,
  
  textInput: {
    ...AppleTheme.typography.body,
    color: AppleTheme.colors.label,
    paddingVertical: AppleTheme.spacing.md,
    paddingHorizontal: 0,
    maxHeight: 100,
    minHeight: 20,
  } as TextStyle,
  
  textInputDisabled: {
    opacity: 0.5,
  } as TextStyle,
  
  sendButtonContainer: {
    marginHorizontal: AppleTheme.spacing.xs,
  } as ViewStyle,
  
  sendButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  
  sendButtonActive: {
    backgroundColor: AppleTheme.colors.systemBlue,
  } as ViewStyle,
  
  sendButtonInactive: {
    backgroundColor: AppleTheme.colors.quaternaryLabel,
  } as ViewStyle,
});