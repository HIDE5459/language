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
import { AudioManager, AudioPlaybackStatus } from '../lib/audio';

interface VoicePlayerProps {
  audioUrl?: string;
  isPlaying?: boolean;
  onPlayPress?: () => void;
  onPausePress?: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({
  audioUrl,
  isPlaying = false,
  onPlayPress,
  onPausePress,
  disabled = false,
  size = 'medium',
}) => {
  const [playbackStatus, setPlaybackStatus] = useState<AudioPlaybackStatus | null>(null);
  const [isInternalPlaying, setIsInternalPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioManager = useRef(new AudioManager());
  const waveAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const actualIsPlaying = isPlaying || isInternalPlaying;

  useEffect(() => {
    return () => {
      audioManager.current.cleanup();
    };
  }, []);

  // 再生中のアニメーション
  useEffect(() => {
    if (actualIsPlaying) {
      // ウェーブアニメーション
      const waveAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      waveAnimation.start();

      return () => waveAnimation.stop();
    } else {
      waveAnim.setValue(0);
    }
  }, [actualIsPlaying, waveAnim]);

  const handlePlayPause = async () => {
    if (disabled || !audioUrl) return;

    setError(null);

    try {
      if (actualIsPlaying) {
        await audioManager.current.stopAudio();
        setIsInternalPlaying(false);
        onPausePress?.();
      } else {
        // スケールアニメーション
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 0.9,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();

        setIsInternalPlaying(true);
        
        if (audioUrl.startsWith('http')) {
          await audioManager.current.playTTSAudio(audioUrl);
        } else {
          await audioManager.current.playAudio(audioUrl);
        }
        
        onPlayPress?.();

        // 再生終了の監視
        const checkPlaybackStatus = setInterval(async () => {
          const status = await audioManager.current.getPlaybackStatus();
          if (status) {
            setPlaybackStatus(status);
            if (!status.isPlaying && status.positionMillis === 0) {
              // 再生終了
              setIsInternalPlaying(false);
              clearInterval(checkPlaybackStatus);
            }
          }
        }, 500);
      }
    } catch (error) {
      console.error('Playback error:', error);
      setError('音声の再生に失敗しました');
      setIsInternalPlaying(false);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return 32;
      case 'large':
        return 48;
      default:
        return 40;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  const getButtonColor = (): string => {
    if (disabled || !audioUrl) return '#BDBDBD';
    if (error) return '#F44336';
    return '#7CB342';
  };

  const renderWaveform = () => {
    if (!actualIsPlaying) return null;

    const bars = [0, 1, 2, 3, 4].map(index => {
      const animatedHeight = waveAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [4, 12 + Math.sin(index) * 4],
        extrapolate: 'clamp',
      });

      return (
        <Animated.View
          key={index}
          style={[
            styles.waveBar,
            {
              height: animatedHeight,
              marginHorizontal: 1,
              backgroundColor: '#7CB342',
              opacity: 0.7 + (index * 0.1),
            },
          ]}
        />
      );
    });

    return <View style={styles.waveform}>{bars}</View>;
  };

  if (!audioUrl && !onPlayPress) {
    return null;
  }

  return (
    <View style={styles.container}>
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
      
      <View style={styles.playerContainer}>
        <Animated.View
          style={[
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.playButton,
              {
                width: getButtonSize(),
                height: getButtonSize(),
                borderRadius: getButtonSize() / 2,
                backgroundColor: getButtonColor(),
                opacity: disabled ? 0.5 : 1,
              },
            ]}
            onPress={handlePlayPause}
            disabled={disabled || (!audioUrl && !onPlayPress)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={actualIsPlaying ? 'pause' : 'play'}
              size={getIconSize()}
              color="#FFFFFF"
              style={actualIsPlaying ? {} : { marginLeft: 2 }} // playアイコンの位置調整
            />
          </TouchableOpacity>
        </Animated.View>

        {renderWaveform()}
        
        {playbackStatus && playbackStatus.durationMillis && (
          <Text style={styles.durationText}>
            {formatDuration(playbackStatus.positionMillis)} / {formatDuration(playbackStatus.durationMillis)}
          </Text>
        )}
      </View>
    </View>
  );
};

const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  } as ViewStyle,
  playerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  } as ViewStyle,
  playButton: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  } as ViewStyle,
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    height: 20,
  } as ViewStyle,
  waveBar: {
    width: 3,
    backgroundColor: '#7CB342',
    borderRadius: 1.5,
  } as ViewStyle,
  durationText: {
    fontSize: 10,
    color: '#757575',
    marginLeft: 8,
  } as TextStyle,
  errorText: {
    fontSize: 10,
    color: '#F44336',
    marginBottom: 4,
  } as TextStyle,
});