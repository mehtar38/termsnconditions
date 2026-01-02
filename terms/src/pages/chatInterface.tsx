import React, { useState, useEffect } from 'react';
import MessageList from '../components/MessageList';
import ChatInput from '../components/ChatInput';
import { sendFileMessage, sendTextMessage, clearSessionContext, getSessionId } from '../utils/apis/chatbotApi';
import type { Message } from '../types/message';
import Drawer from '../components/drawer';
import { Button, Typography, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';


export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasDocument, setHasDocument] = useState(false);


  useEffect(() => {
    // Check for existing session on mount
    const currentSession = getSessionId();
    if (currentSession) {
      setSessionId(currentSession);
    }
  }, []);


  const addMessage = (role: 'user' | 'assistant', text: string) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, text }]);
  };


  const handleSendText = async (text: string) => {
    addMessage('user', text);
    try {
      const resp = await sendTextMessage(text);
      addMessage(resp.role, resp.text);
      if (resp.sessionId) {
        setSessionId(resp.sessionId);
      }
    } catch (e: any) {
      addMessage('assistant', 'Error: ' + e.message);
    }
  };


  const handleSendFile = async (file: File) => {
    addMessage('user', `Uploaded file: ${file.name}`);
    try {
      const resp = await sendFileMessage(file);
      addMessage(resp.role, resp.text);
      if (resp.sessionId) {
        setSessionId(resp.sessionId);
        setHasDocument(true);
      }
    } catch (e: any) {
      addMessage('assistant', 'Error: ' + e.message);
    }
  };


  const handleClearSession = async () => {
    if (sessionId) {
      try {
        await clearSessionContext(sessionId);
        setMessages([]);
        setSessionId(null);
        setHasDocument(false);
      } catch (e: any) {
        console.error('Failed to clear session:', e);
      }
    } else {
      // Just clear local messages if no session
      setMessages([]);
      setHasDocument(false);
    }
  };


  return (
  <div className="chat-page">
    <Drawer />
    <div className="chat-window">
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: 2, 
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, color: hasDocument ? '#10b981' : '#6b7280' }}>
            {hasDocument ? '✓ Document loaded - RAG enabled' : '○ No document loaded'}
          </Typography>
          {sessionId && (
            <Typography variant="caption" sx={{ color: '#9ca3af', fontSize: '0.75rem' }}>
              Session: {sessionId.substring(0, 8)}...
            </Typography>
          )}
        </Box>
        {(messages.length > 0 || sessionId) && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteIcon />}
            onClick={handleClearSession}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#fee2e2'
              }
            }}
          >
            Clear Session
          </Button>
        )}
      </Box>
      <MessageList messages={messages} />
      <ChatInput onSendText={handleSendText} onSendFile={handleSendFile} />
    </div>
  </div>
  );
}