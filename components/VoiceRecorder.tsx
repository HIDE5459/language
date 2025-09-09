import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AudioManager, AudioRecordingStatus, RecordingResult } from '../lib/audio';

interface VoiceRecorderProps {
  onRecordingComplete: (result: RecordingResult) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  maxDuration?: number; // 秒
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onError,
  disabled = false,
  maxDuration = 60,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState<AudioRecordingStatus | null>(null);
  
  const audioManager = useRef(new AudioManager());
  const durationTimer = useRef<NodeJS.Timeout>();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => {
      // クリーンアップ
      if (durationTimer.current) {
        clearInterval(durationTimer.current);
      }
      audioManager.current.cleanup();
    };
  }, []);

  // 録音中のアニメーション
  useEffect(() => {
    if (isRecording) {
      // パルスアニメーション
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setDuration(0);
      
      // スケールアニメーション
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        useNativeDriver: true,
      }).start();

      await audioManager.current.startRecording();

      // 時間カウンター開始
      durationTimer.current = setInterval(async () => {
        const recordingStatus = await audioManager.current.getRecordingStatus();
        if (recordingStatus) {
          setStatus(recordingStatus);
          const currentDuration = Math.floor(recordingStatus.durationMillis / 1000);
          setDuration(currentDuration);

          // 最大録音時間に達したら自動停止
          if (currentDuration >= maxDuration) {
            await stopRecording();
          }
        }
      }, 100);

    } catch (error) {
      setIsRecording(false);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
      
      const errorMessage = error instanceof Error ? error.message : '録音の開始に失敗しました';
      onError?.(errorMessage);
    }
  };

  const stopRecording = async () => {
    try {
      if (durationTimer.current) {
        clearInterval(durationTimer.current);
      }

      setIsRecording(false);
      
      // スケールアニメーション
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();

      const result = await audioManager.current.stopRecording();
      if (result) {
        onRecordingComplete(result);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '録音の停止に失敗しました';
      onError?.(errorMessage);
    }
  };

  const handlePress = () => {
    if (disabled) return;

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getButtonColor = (): string => {
    if (disabled) return '#BDBDBD';
    if (isRecording) return '#F44336';
    return '#757575';
  };

  const getButtonIcon = (): keyof typeof Ionicons.glyphMap => {
    if (isRecording) return 'stop';
    return 'mic';
  };

  return (
    <View style={styles.container}>
      {isRecording && (
        <View style={styles.durationContainer}>
          <View style={styles.recordingIndicator} />
          <Text style={styles.durationText}>
            {formatDuration(duration)}
          </Text>
          <Text style={styles.maxDurationText}>
            / {formatDuration(maxDuration)}
          </Text>
        </View>
      )}
      
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            transform: [
              { scale: scaleAnim },
              { scale: isRecording ? pulseAnim : 1 },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.recordButton,
            {
              backgroundColor: getButtonColor(),
              opacity: disabled ? 0.5 : 1,
            },
          ]}
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <Ionicons
            name={getButtonIcon()}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </Animated.View>
      
      {!isRecording && (
        <Text style={styles.hintText}>
          長押しで録音
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  } as ViewStyle,
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#F44336',
    borderRadius: 12,
  } as ViewStyle,
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  } as ViewStyle,
  durationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  } as TextStyle,
  maxDurationText: {
    color: '#FFCDD2',
    fontSize: 12,
    marginLeft: 4,
  } as TextStyle,
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  recordButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  } as ViewStyle,
  hintText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  } as TextStyle,
});