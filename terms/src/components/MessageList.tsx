import type { Message } from "../types/message";

interface Props {
  messages: Message[];
}

export default function MessageList({ messages }: Props) {
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
            {msg.text}
          </div>
        </div>
      ))}
    </div>
  );
}
