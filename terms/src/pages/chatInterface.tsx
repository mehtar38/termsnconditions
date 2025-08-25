import React, { useState } from 'react';
import MessageList from '../components/MessageList';
import ChatInput from '../components/ChatInput';
import { sendFileMessage, sendTextMessage } from '../utils/apis/chatbotApi';
import type { Message } from '../types/message';
import Drawer from '../components/drawer';


export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);


  const addMessage = (role: 'user' | 'assistant', text: string) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, text }]);
  };


  const handleSendText = async (text: string) => {
    addMessage('user', text);
    try {
      const resp = await sendTextMessage(text);
      addMessage(resp.role, resp.text);
    } catch (e: any) {
      addMessage('assistant', 'Error: ' + e.message);
    }
  };


  const handleSendFile = async (file: File) => {
    addMessage('user', `Uploaded file: ${file.name}`);
    try {
      const resp = await sendFileMessage(file);
      addMessage(resp.role, resp.text);
    } catch (e: any) {
      addMessage('assistant', 'Error: ' + e.message);
    }
  };


  return (
  <div className="chat-page">
    <Drawer />
    <div className="chat-window">
      <MessageList messages={messages} />
      <ChatInput onSendText={handleSendText} onSendFile={handleSendFile} />
    </div>
  </div>
  );
}