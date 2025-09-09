import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface AudioRecordingStatus {
  isRecording: boolean;
  canRecord: boolean;
  durationMillis: number;
}

export interface AudioPlaybackStatus {
  isPlaying: boolean;
  positionMillis: number;
  durationMillis?: number;
  isLoaded: boolean;
}

export interface RecordingResult {
  uri: string;
  duration: number;
  size: number;
}

export class AudioManager {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private isSetup: boolean = false;

  // 音声録音の初期化
  async setupAudio(): Promise<void> {
    if (this.isSetup) return;

    try {
      // マイクの権限をリクエスト
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('音声録音の権限が必要です');
      }

      // オーディオモードの設定
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        shouldDuckAndroid: true,
      });

      this.isSetup = true;
    } catch (error) {
      console.error('Audio setup failed:', error);
      throw error;
    }
  }

  // 録音開始
  async startRecording(): Promise<void> {
    try {
      await this.setupAudio();

      // 既存の録音があれば停止
      if (this.recording) {
        await this.stopRecording();
      }

      // 録音設定
      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(recordingOptions);
      await this.recording.startAsync();

      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  // 録音停止
  async stopRecording(): Promise<RecordingResult | null> {
    if (!this.recording) {
      return null;
    }

    try {
      const status = await this.recording.getStatusAsync();
      if (status.isRecording) {
        await this.recording.stopAndUnloadAsync();
      }

      const uri = this.recording.getURI();
      if (!uri) {
        throw new Error('録音ファイルのURIを取得できませんでした');
      }

      // ファイル情報を取得
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const duration = status.durationMillis || 0;

      const result: RecordingResult = {
        uri,
        duration,
        size: fileInfo.exists ? fileInfo.size || 0 : 0,
      };

      this.recording = null;
      console.log('Recording stopped:', result);

      return result;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.recording = null;
      throw error;
    }
  }

  // 録音状態の取得
  async getRecordingStatus(): Promise<AudioRecordingStatus | null> {
    if (!this.recording) {
      return null;
    }

    try {
      const status = await this.recording.getStatusAsync();
      return {
        isRecording: status.isRecording || false,
        canRecord: status.canRecord || false,
        durationMillis: status.durationMillis || 0,
      };
    } catch (error) {
      console.error('Failed to get recording status:', error);
      return null;
    }
  }

  // 音声再生
  async playAudio(uri: string): Promise<void> {
    try {
      // 既存の音声があれば停止
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: true,
          isLooping: false,
          isMuted: false,
          volume: 1.0,
        }
      );

      this.sound = sound;

      // 再生完了時のコールバック
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish && !status.isLooping) {
          console.log('Audio playback finished');
        }
      });

      console.log('Audio playback started');
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  // TTS音声の再生（URL指定）
  async playTTSAudio(audioUrl: string): Promise<void> {
    try {
      // キャッシュディレクトリにダウンロード
      const fileName = `tts_${Date.now()}.mp3`;
      const localUri = `${FileSystem.cacheDirectory}${fileName}`;

      const downloadResult = await FileSystem.downloadAsync(audioUrl, localUri);
      if (downloadResult.status !== 200) {
        throw new Error('TTS音声のダウンロードに失敗しました');
      }

      await this.playAudio(downloadResult.uri);
    } catch (error) {
      console.error('Failed to play TTS audio:', error);
      throw error;
    }
  }

  // 音声停止
  async stopAudio(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
        console.log('Audio stopped');
      } catch (error) {
        console.error('Failed to stop audio:', error);
      }
    }
  }

  // 再生状態の取得
  async getPlaybackStatus(): Promise<AudioPlaybackStatus | null> {
    if (!this.sound) {
      return null;
    }

    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        return {
          isPlaying: status.isPlaying || false,
          positionMillis: status.positionMillis || 0,
          durationMillis: status.durationMillis,
          isLoaded: true,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get playback status:', error);
      return null;
    }
  }

  // リソースのクリーンアップ
  async cleanup(): Promise<void> {
    try {
      if (this.recording) {
        const status = await this.recording.getStatusAsync();
        if (status.isRecording) {
          await this.recording.stopAndUnloadAsync();
        }
        this.recording = null;
      }

      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  // ファイルサイズのフォーマット
  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }

  // 録音時間のフォーマット
  formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}