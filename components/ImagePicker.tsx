import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Image,
  Modal,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AppleTheme from '../styles/AppleTheme';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

interface ImagePickerProps {
  onImageSelected: (imageUri: string, base64?: string) => void;
  disabled?: boolean;
}

export const ImagePickerComponent: React.FC<ImagePickerProps> = ({
  onImageSelected,
  disabled = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Button press animation
  const animatePress = () => {
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
  };

  const requestMediaLibraryPermission = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '権限が必要です',
          '写真ライブラリにアクセスするために設定から権限を許可してください。',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Media library permission error:', error);
      Alert.alert('エラー', '権限の取得でエラーが発生しました。');
      return false;
    }
  };

  const requestCameraPermission = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '権限が必要です',
          'カメラにアクセスするために設定から権限を許可してください。',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Camera permission error:', error);
      Alert.alert('エラー', '権限の取得でエラーが発生しました。');
      return false;
    }
  };

  const processImage = async (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      
      try {
        // 画像を適切なサイズにリサイズ（AIモデル用）
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          asset.uri,
          [
            {
              resize: {
                width: 1024,
                height: 1024,
              },
            },
          ],
          {
            compress: 0.8,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );

        onImageSelected(manipulatedImage.uri, manipulatedImage.base64);
      } catch (error) {
        console.error('画像処理エラー:', error);
        Alert.alert('エラー', '画像の処理中にエラーが発生しました。');
      }
    }
  };

  const pickImageFromLibrary = async () => {
    console.log('pickImageFromLibrary called');
    setShowModal(false);
    
    const hasPermission = await requestMediaLibraryPermission();
    console.log('Media library permission:', hasPermission);
    if (!hasPermission) return;

    try {
      console.log('Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1] as [number, number],
        quality: 0.8,
        base64: false,
      });

      console.log('Image picker result:', result);
      if (!result.canceled) {
        console.log('Processing selected image...');
        await processImage(result);
      } else {
        console.log('User canceled image selection');
      }
    } catch (error) {
      console.error('Image library error:', error);
      Alert.alert('エラー', '写真の選択でエラーが発生しました。詳細: ' + error);
    }
  };

  const takePhoto = async () => {
    setShowModal(false);
    
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        await processImage(result);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('エラー', 'カメラでエラーが発生しました。');
    }
  };

  const handlePress = () => {
    if (disabled) return;
    console.log('ImagePicker button pressed');
    animatePress();
    setShowModal(true);
  };

  return (
    <>
      <Animated.View 
        style={[
          styles.buttonContainer,
          {
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button,
            disabled && styles.buttonDisabled
          ]}
          onPress={handlePress}
          disabled={disabled}
        >
          <Ionicons
            name="camera-outline"
            size={20}
            color={disabled 
              ? AppleTheme.colors.quaternaryLabel 
              : AppleTheme.colors.systemBlue
            }
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Apple-style Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <BlurView intensity={30} style={styles.modalOverlay}>
          <Animated.View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>画像を選択</Text>
            
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={takePhoto}
              >
                <View style={styles.optionIconContainer}>
                  <Ionicons 
                    name="camera-outline" 
                    size={22} 
                    color={AppleTheme.colors.systemBlue} 
                  />
                </View>
                <Text style={styles.optionText}>カメラで撮影</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={pickImageFromLibrary}
              >
                <View style={styles.optionIconContainer}>
                  <Ionicons 
                    name="image-outline" 
                    size={22} 
                    color={AppleTheme.colors.systemBlue} 
                  />
                </View>
                <Text style={styles.optionText}>写真ライブラリから選択</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    marginHorizontal: AppleTheme.spacing.xs,
  } as ViewStyle,
  
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  } as ViewStyle,
  
  buttonDisabled: {
    opacity: 0.4,
  } as ViewStyle,
  
  // Apple-style Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  
  modalContainer: {
    backgroundColor: AppleTheme.colors.systemBackground,
    borderRadius: AppleTheme.radius.xl,
    padding: AppleTheme.spacing.xl,
    alignItems: 'center',
    marginHorizontal: AppleTheme.spacing.xl,
    minWidth: 280,
    ...AppleTheme.shadows.medium,
  } as ViewStyle,
  
  modalTitle: {
    ...AppleTheme.typography.headline,
    color: AppleTheme.colors.label,
    marginBottom: AppleTheme.spacing.xl,
    textAlign: 'center',
  } as TextStyle,
  
  optionsContainer: {
    width: '100%',
    marginBottom: AppleTheme.spacing.md,
  } as ViewStyle,
  
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: AppleTheme.spacing.md,
    paddingHorizontal: AppleTheme.spacing.lg,
    backgroundColor: AppleTheme.colors.secondarySystemGroupedBackground,
    borderRadius: AppleTheme.radius.md,
    marginBottom: AppleTheme.spacing.sm,
  } as ViewStyle,
  
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: AppleTheme.colors.tertiarySystemFill,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: AppleTheme.spacing.md,
  } as ViewStyle,
  
  optionText: {
    ...AppleTheme.typography.body,
    color: AppleTheme.colors.label,
    flex: 1,
  } as TextStyle,
  
  cancelButton: {
    marginTop: AppleTheme.spacing.md,
    paddingVertical: AppleTheme.spacing.md,
    paddingHorizontal: AppleTheme.spacing.xl,
    borderRadius: AppleTheme.radius.lg,
    backgroundColor: AppleTheme.colors.systemFill,
  } as ViewStyle,
  
  cancelButtonText: {
    ...AppleTheme.typography.body,
    color: AppleTheme.colors.systemRed,
    fontWeight: '600',
    textAlign: 'center',
  } as TextStyle,
});