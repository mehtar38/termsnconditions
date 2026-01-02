import React, { useEffect, useRef } from 'react';
import type { Message } from "../types/message";

interface Props {
  messages: Message[];
}

/**
 * Simple markdown-like formatter for bot messages
 */
function formatMessage(text: string): React.ReactNode {
  // Split by markdown-style headers and lists
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];
  let inList = false;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      elements.push(
        <p key={`p-${elements.length}`} style={{ margin: '0.5rem 0' }}>
          {currentParagraph.join(' ')}
        </p>
      );
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ margin: '0.25rem 0' }}>{item}</li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Headers
    if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
      flushList();
      flushParagraph();
      const headerText = trimmed.slice(2, -2);
      if (headerText.match(/^\d+\./)) {
        // Numbered header like "1. **Title**"
        elements.push(
          <h3 key={`h-${index}`} style={{ marginTop: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>
            {headerText}
          </h3>
        );
      } else {
        elements.push(
          <h3 key={`h-${index}`} style={{ marginTop: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>
            {headerText}
          </h3>
        );
      }
      return;
    }

    // List items
    if (trimmed.startsWith('- ') || trimmed.match(/^\d+\.\s/)) {
      flushParagraph();
      inList = true;
      const itemText = trimmed.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '');
      listItems.push(itemText);
      return;
    }

    // Regular paragraph
    if (trimmed.length > 0) {
      flushList();
      currentParagraph.push(trimmed);
    } else {
      flushList();
      flushParagraph();
    }
  });

  flushList();
  flushParagraph();

  // If no formatting was applied, return original text
  if (elements.length === 0) {
    return text;
  }

  return <div>{elements}</div>;
}

export default function MessageList({ messages }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="message-list" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#6b7280',
        fontSize: '0.95rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p>No messages yet. Upload a document or start a conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`message-row ${
            msg.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`message-bubble ${
              msg.role === "user" ? "user-bubble" : "bot-bubble"
            }`}
          >
            {msg.role === "assistant" ? formatMessage(msg.text) : msg.text}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
