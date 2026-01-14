// import React, { useEffect, useRef } from 'react';
// import type { Message } from "../types/message";

// interface Props {
//   messages: Message[];
// }

// /**
//  * Simple markdown-like formatter for bot messages
//  */
// function formatMessage(text: string): React.ReactNode {
//   // Split by markdown-style headers and lists
//   const lines = text.split('\n');
//   const elements: React.ReactNode[] = [];
//   let currentParagraph: string[] = [];
//   let inList = false;
//   let listItems: string[] = [];

//   const flushParagraph = () => {
//     if (currentParagraph.length > 0) {
//       elements.push(
//         <p key={`p-${elements.length}`} style={{ margin: '0.5rem 0' }}>
//           {currentParagraph.join(' ')}
//         </p>
//       );
//       currentParagraph = [];
//     }
//   };

//   const flushList = () => {
//     if (listItems.length > 0) {
//       elements.push(
//         <ul key={`ul-${elements.length}`} style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
//           {listItems.map((item, idx) => (
//             <li key={idx} style={{ margin: '0.25rem 0' }}>{item}</li>
//           ))}
//         </ul>
//       );
//       listItems = [];
//       inList = false;
//     }
//   };

//   lines.forEach((line, index) => {
//     const trimmed = line.trim();
    
//     // Headers
//     if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
//       flushList();
//       flushParagraph();
//       const headerText = trimmed.slice(2, -2);
//       if (headerText.match(/^\d+\./)) {
//         // Numbered header like "1. **Title**"
//         elements.push(
//           <h3 key={`h-${index}`} style={{ marginTop: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>
//             {headerText}
//           </h3>
//         );
//       } else {
//         elements.push(
//           <h3 key={`h-${index}`} style={{ marginTop: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>
//             {headerText}
//           </h3>
//         );
//       }
//       return;
//     }

//     // List items
//     if (trimmed.startsWith('- ') || trimmed.match(/^\d+\.\s/)) {
//       flushParagraph();
//       inList = true;
//       const itemText = trimmed.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '');
//       listItems.push(itemText);
//       return;
//     }

//     // Regular paragraph
//     if (trimmed.length > 0) {
//       flushList();
//       currentParagraph.push(trimmed);
//     } else {
//       flushList();
//       flushParagraph();
//     }
//   });

//   flushList();
//   flushParagraph();

//   // If no formatting was applied, return original text
//   if (elements.length === 0) {
//     return text;
//   }

//   return <div>{elements}</div>;
// }

// export default function MessageList({ messages }: Props) {
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     // Auto-scroll to bottom when new messages arrive
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   if (messages.length === 0) {
//     return (
//       <div className="message-list" style={{ 
//         display: 'flex', 
//         alignItems: 'center', 
//         justifyContent: 'center',
//         color: '#6b7280',
//         fontSize: '0.95rem'
//       }}>
//         <div style={{ textAlign: 'center' }}>
//           <p>No messages yet. Upload a document or start a conversation!</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="message-list">
//       {messages.map((msg) => (
//         <div
//           key={msg.id}
//           className={`message-row ${
//             msg.role === "user" ? "justify-end" : "justify-start"
//           }`}
//         >
//           <div
//             className={`message-bubble ${
//               msg.role === "user" ? "user-bubble" : "bot-bubble"
//             }`}
//           >
//             {msg.role === "assistant" ? formatMessage(msg.text) : msg.text}
//           </div>
//         </div>
//       ))}
//       <div ref={messagesEndRef} />
//     </div>
//   );
// }


import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from "../types/message";

interface Props {
  messages: Message[];
}

export default function MessageList({ messages }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Define custom styles for markdown elements to match your UI
  const MarkdownComponents = {
    h3: ({ ...props }) => <h3 style={{ marginTop: '1.25rem', marginBottom: '0.5rem', fontWeight: 600, color: '#111827' }} {...props} />,
    p: ({ ...props }) => <p style={{ margin: '0.75rem 0', lineHeight: '1.6' }} {...props} />,
    ul: ({ ...props }) => <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', listStyleType: 'disc' }} {...props} />,
    li: ({ ...props }) => <li style={{ margin: '0.25rem 0' }} {...props} />,
    hr: () => <hr style={{ border: '0', borderTop: '1px solid #e5e7eb', margin: '1.5rem 0' }} />,
    strong: ({ ...props }) => <strong style={{ fontWeight: 700, color: '#1f2937' }} {...props} />
  };

  if (messages.length === 0) {
    return (
      <div className="message-list flex items-center justify-center text-gray-500 text-sm h-full">
        <p>No messages yet. Upload a document or start a conversation!</p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`message-row ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`message-bubble ${msg.role === "user" ? "user-bubble" : "bot-bubble"}`}
            style={{ maxWidth: '85%', padding: '12px 16px' }}
          >
            {msg.role === "assistant" ? (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]} 
                components={MarkdownComponents}
              >
                {msg.text}
              </ReactMarkdown>
            ) : (
              // Users usually don't send markdown, just render plain text
              <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{msg.text}</p>
            )}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}