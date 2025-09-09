import { StatusBar } from 'expo-status-bar';
import ChatScreen from './app/chat/ChatScreen';

export default function App() {
  return (
    <>
      <ChatScreen />
      <StatusBar style="auto" />
    </>
  );
}
