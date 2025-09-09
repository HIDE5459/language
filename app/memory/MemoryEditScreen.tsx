import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { memoryManager, MemoryItem, MemoryCategory } from '../../lib/memory';

interface PreferenceItem {
  key: string;
  value: string;
}

interface AnniversaryItem {
  date: string;
  description: string;
  recurring: boolean;
}

export default function MemoryEditScreen() {
  const [nicknames, setNicknames] = useState({
    userToAI: '',
    aiToUser: '',
  });
  const [preferences, setPreferences] = useState<PreferenceItem[]>([]);
  const [anniversaries, setAnniversaries] = useState<AnniversaryItem[]>([]);
  const [traits, setTraits] = useState<PreferenceItem[]>([]);
  const [newPreference, setNewPreference] = useState({ key: '', value: '' });
  const [newAnniversary, setNewAnniversary] = useState({ date: '', description: '', recurring: false });
  const [newTrait, setNewTrait] = useState({ key: '', value: '' });
  const [activeTab, setActiveTab] = useState<'basic' | 'preferences' | 'anniversaries' | 'traits'>('basic');

  useEffect(() => {
    loadMemoryData();
  }, []);

  const loadMemoryData = async () => {
    const longTermMemory = memoryManager.getLongTermMemory();
    
    setNicknames(longTermMemory.nicknames);
    
    const prefsArray = Array.from(longTermMemory.preferences.entries()).map(([key, value]) => ({
      key,
      value: String(value),
    }));
    setPreferences(prefsArray);
    
    setAnniversaries(longTermMemory.anniversaries);
    
    const traitsArray = Array.from(longTermMemory.traits.entries()).map(([key, value]) => ({
      key,
      value: String(value),
    }));
    setTraits(traitsArray);
  };

  const saveNicknames = async () => {
    await memoryManager.setNicknames(nicknames.userToAI, nicknames.aiToUser);
    Alert.alert('保存完了', 'ニックネームを更新しました');
  };

  const addPreference = async () => {
    if (newPreference.key && newPreference.value) {
      await memoryManager.addPreference(newPreference.key, newPreference.value);
      setPreferences([...preferences, newPreference]);
      setNewPreference({ key: '', value: '' });
    }
  };

  const removePreference = async (index: number) => {
    const updatedPrefs = [...preferences];
    updatedPrefs.splice(index, 1);
    setPreferences(updatedPrefs);
    
    // 長期記憶を再構築
    const longTermMemory = memoryManager.getLongTermMemory();
    longTermMemory.preferences.clear();
    for (const pref of updatedPrefs) {
      await memoryManager.addPreference(pref.key, pref.value);
    }
  };

  const addAnniversary = async () => {
    if (newAnniversary.date && newAnniversary.description) {
      await memoryManager.addAnniversary(
        newAnniversary.date,
        newAnniversary.description,
        newAnniversary.recurring
      );
      setAnniversaries([...anniversaries, newAnniversary]);
      setNewAnniversary({ date: '', description: '', recurring: false });
    }
  };

  const removeAnniversary = async (index: number) => {
    const updatedAnniversaries = [...anniversaries];
    updatedAnniversaries.splice(index, 1);
    setAnniversaries(updatedAnniversaries);
    
    // 記念日リストを更新
    const longTermMemory = memoryManager.getLongTermMemory();
    longTermMemory.anniversaries = updatedAnniversaries;
    await memoryManager['saveLongTermMemory']();
  };

  const addTrait = async () => {
    if (newTrait.key && newTrait.value) {
      await memoryManager.addTrait(newTrait.key, newTrait.value);
      setTraits([...traits, newTrait]);
      setNewTrait({ key: '', value: '' });
    }
  };

  const removeTrait = async (index: number) => {
    const updatedTraits = [...traits];
    updatedTraits.splice(index, 1);
    setTraits(updatedTraits);
    
    // 特徴を再構築
    const longTermMemory = memoryManager.getLongTermMemory();
    longTermMemory.traits.clear();
    for (const trait of updatedTraits) {
      await memoryManager.addTrait(trait.key, trait.value);
    }
  };

  const clearAllMemories = () => {
    Alert.alert(
      '確認',
      'すべての記憶を削除してもよろしいですか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            await memoryManager.clearAllMemories();
            loadMemoryData();
            Alert.alert('完了', 'すべての記憶を削除しました');
          },
        },
      ]
    );
  };

  const renderTabButton = (tab: typeof activeTab, label: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTab]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{label}</Text>
    </TouchableOpacity>
  );

  const renderBasicTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>呼び名設定</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>AIの名前</Text>
        <TextInput
          style={styles.input}
          value={nicknames.userToAI}
          onChangeText={(text) => setNicknames({ ...nicknames, userToAI: text })}
          placeholder="例: みさき"
        />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>あなたの呼ばれ方</Text>
        <TextInput
          style={styles.input}
          value={nicknames.aiToUser}
          onChangeText={(text) => setNicknames({ ...nicknames, aiToUser: text })}
          placeholder="例: 〇〇さん"
        />
      </View>
      
      <TouchableOpacity style={styles.saveButton} onPress={saveNicknames}>
        <Text style={styles.saveButtonText}>保存</Text>
      </TouchableOpacity>
      
      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>危険な操作</Text>
        <TouchableOpacity style={styles.clearButton} onPress={clearAllMemories}>
          <Text style={styles.clearButtonText}>すべての記憶を削除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPreferencesTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>好みの管理</Text>
      
      <View style={styles.addForm}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          value={newPreference.key}
          onChangeText={(text) => setNewPreference({ ...newPreference, key: text })}
          placeholder="カテゴリ（例: アニメ）"
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          value={newPreference.value}
          onChangeText={(text) => setNewPreference({ ...newPreference, value: text })}
          placeholder="内容（例: 進撃の巨人）"
        />
        <TouchableOpacity style={styles.addButton} onPress={addPreference}>
          <Text style={styles.addButtonText}>追加</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.itemList}>
        {preferences.map((pref, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemKey}>{pref.key}</Text>
              <Text style={styles.listItemValue}>{pref.value}</Text>
            </View>
            <TouchableOpacity onPress={() => removePreference(index)}>
              <Text style={styles.deleteButton}>削除</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderAnniversariesTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>記念日の管理</Text>
      
      <View style={styles.addForm}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          value={newAnniversary.date}
          onChangeText={(text) => setNewAnniversary({ ...newAnniversary, date: text })}
          placeholder="日付（例: 12/25）"
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          value={newAnniversary.description}
          onChangeText={(text) => setNewAnniversary({ ...newAnniversary, description: text })}
          placeholder="説明（例: 初めて話した日）"
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>毎年繰り返し</Text>
          <Switch
            value={newAnniversary.recurring}
            onValueChange={(value) => setNewAnniversary({ ...newAnniversary, recurring: value })}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={addAnniversary}>
          <Text style={styles.addButtonText}>追加</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.itemList}>
        {anniversaries.map((anniversary, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemKey}>{anniversary.date}</Text>
              <Text style={styles.listItemValue}>
                {anniversary.description} {anniversary.recurring && '(毎年)'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => removeAnniversary(index)}>
              <Text style={styles.deleteButton}>削除</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderTraitsTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>特徴の管理</Text>
      
      <View style={styles.addForm}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          value={newTrait.key}
          onChangeText={(text) => setNewTrait({ ...newTrait, key: text })}
          placeholder="カテゴリ（例: 性格）"
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          value={newTrait.value}
          onChangeText={(text) => setNewTrait({ ...newTrait, value: text })}
          placeholder="内容（例: 優しい）"
        />
        <TouchableOpacity style={styles.addButton} onPress={addTrait}>
          <Text style={styles.addButtonText}>追加</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.itemList}>
        {traits.map((trait, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemKey}>{trait.key}</Text>
              <Text style={styles.listItemValue}>{trait.value}</Text>
            </View>
            <TouchableOpacity onPress={() => removeTrait(index)}>
              <Text style={styles.deleteButton}>削除</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>記憶の管理</Text>
      </View>
      
      <View style={styles.tabBar}>
        {renderTabButton('basic', '基本設定')}
        {renderTabButton('preferences', '好み')}
        {renderTabButton('anniversaries', '記念日')}
        {renderTabButton('traits', '特徴')}
      </View>
      
      <ScrollView style={styles.content}>
        {activeTab === 'basic' && renderBasicTab()}
        {activeTab === 'preferences' && renderPreferencesTab()}
        {activeTab === 'anniversaries' && renderAnniversariesTab()}
        {activeTab === 'traits' && renderTraitsTab()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  header: {
    backgroundColor: '#7CB342',
    paddingTop: Platform.OS === 'ios' ? 0 : 24,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#7CB342',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
  },
  activeTabText: {
    color: '#7CB342',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#7CB342',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addForm: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#7CB342',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  itemList: {
    maxHeight: 300,
  },
  listItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemContent: {
    flex: 1,
  },
  listItemKey: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  listItemValue: {
    fontSize: 14,
    color: '#333333',
  },
  deleteButton: {
    color: '#FF4444',
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  dangerZone: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 12,
  },
  clearButton: {
    backgroundColor: '#D32F2F',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});