import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  TextStyle,
  Modal,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VoiceRecorder } from './VoiceRecorder';
import { ASRClient } from '../lib/speech';
import { RecordingResult } from '../lib/audio';
import { LocationService, LocationData } from '../lib/location';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onVoicePress?: () => void;
  onLocationPress?: (location: LocationData) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onVoicePress,
  onLocationPress,
  placeholder = 'メッセージを入力...',
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [lastCompositionEnd, setLastCompositionEnd] = useState(0);
  
  const asrClient = new ASRClient('', 'mock');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (event: any) => {
    // 日本語入力の変換中（IME使用中）はEnterキーでの送信を無効化
    const now = Date.now();
    const isRecentCompositionEnd = now - lastCompositionEnd < 200; // 200msに延長
    
    if (event.nativeEvent.key === 'Enter' && !event.nativeEvent.shiftKey) {
      console.log('Enter pressed:', {
        isComposing: event.nativeEvent.isComposing,
        stateIsComposing: isComposing,
        isRecentCompositionEnd,
        message: message
      });
      
      // event.nativeEvent.isComposingがtrueの場合は変換中
      if (event.nativeEvent.isComposing || isComposing || isRecentCompositionEnd) {
        console.log('Blocking send - IME is active');
        return; // 送信しない
      }
      event.preventDefault();
      console.log('Sending message');
      handleSend();
    }
  };

  const handleVoicePress = () => {
    if (onVoicePress) {
      onVoicePress();
    } else {
      setShowVoiceRecorder(true);
    }
  };

  const handleRecordingComplete = async (recording: RecordingResult) => {
    setShowVoiceRecorder(false);
    setIsProcessingVoice(true);

    try {
      const asrResponse = await asrClient.transcribe(recording);
      if (asrResponse.text.trim()) {
        setMessage(asrResponse.text);
        // 自動送信しない場合は、ユーザーが確認して送信できるようにする
        // onSendMessage(asrResponse.text);
      }
    } catch (error) {
      console.error('Voice transcription failed:', error);
      // エラー時の処理（例：エラーメッセージ表示）
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleRecordingError = (error: string) => {
    setShowVoiceRecorder(false);
    console.error('Recording error:', error);
    // エラー時の処理
  };

  const handleLocationPress = async () => {
    console.log('位置情報ボタンが押されました');
    
    if (!onLocationPress) {
      console.log('onLocationPress が設定されていません');
      return;
    }
    
    setIsGettingLocation(true);
    try {
      console.log('LocationService.getCurrentLocation() を呼び出し中...');
      const result = await LocationService.getCurrentLocation();
      
      if ('code' in result) {
        // エラーの場合 - ユーザーに手動で場所を聞く
        console.error('Location error:', result.message);
        const errorMessage = result.code === 1 
          ? 'どちらの駅の近くにいらっしゃいますか？（位置情報の使用が拒否されました）'
          : '位置情報が取得できませんでした。最寄り駅を教えてください。';
        onSendMessage(errorMessage);
        return;
      }
      
      // 成功の場合
      console.log('位置情報取得成功:', result);
      const area = LocationService.getTokyoArea(result.latitude, result.longitude);
      console.log('エリア判定結果:', area);
      
      const locationWithArea: LocationData = {
        ...result,
        area
      };
      
      onLocationPress(locationWithArea);
    } catch (error) {
      console.error('Location error:', error);
      onSendMessage('位置情報の取得でエラーが発生しました。最寄り駅を教えてください。');
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleLocationPress}
            disabled={disabled || isGettingLocation}
          >
            <Ionicons
              name={isGettingLocation ? "hourglass" : "location"}
              size={20}
              color={disabled || isGettingLocation ? '#BDBDBD' : '#7CB342'}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleVoicePress}
            disabled={disabled || isProcessingVoice}
          >
            <Ionicons
              name={isProcessingVoice ? "hourglass" : "mic"}
              size={24}
              color={disabled || isProcessingVoice ? '#BDBDBD' : '#757575'}
            />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder={placeholder}
            placeholderTextColor="#9E9E9E"
            multiline={false}
            maxLength={500}
            editable={!disabled}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => {
              setIsComposing(false);
              setLastCompositionEnd(Date.now());
            }}
            onSubmitEditing={(event) => {
              const now = Date.now();
              const isRecentCompositionEnd = now - lastCompositionEnd < 200;
              // event.nativeEvent.isComposingをチェック
              if (!event.nativeEvent?.isComposing && !isComposing && !isRecentCompositionEnd) {
                handleSend();
              }
            }}
            onKeyPress={handleKeyPress}
            returnKeyType="send"
            blurOnSubmit={true}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!message.trim() || disabled) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!message.trim() || disabled}
          >
            <Ionicons
              name="send"
              size={20}
              color={message.trim() && !disabled ? '#7CB342' : '#BDBDBD'}
            />
          </TouchableOpacity>
        </View>

        {/* 音声録音モーダル */}
        <Modal
          visible={showVoiceRecorder}
          transparent
          animationType="slide"
          onRequestClose={() => setShowVoiceRecorder(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>音声メッセージを録音</Text>
              
              <VoiceRecorder
                onRecordingComplete={handleRecordingComplete}
                onError={handleRecordingError}
                maxDuration={60}
              />
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowVoiceRecorder(false)}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  } as ViewStyle,
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 4,
    minHeight: 44,
  } as ViewStyle,
  iconButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: '#212121',
    paddingVertical: 10,
    paddingHorizontal: 8,
    maxHeight: 100,
  } as TextStyle,
  sendButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  sendButtonDisabled: {
    opacity: 0.5,
  } as ViewStyle,
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 20,
    maxWidth: 300,
  } as ViewStyle,
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: '#212121',
  } as TextStyle,
  cancelButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  } as ViewStyle,
  cancelButtonText: {
    color: '#757575',
    fontSize: 16,
    fontWeight: '500',
  } as TextStyle,
});