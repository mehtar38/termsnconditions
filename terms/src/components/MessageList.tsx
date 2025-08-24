
// types/message.ts
export interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
}

interface Props {
    messages: Message[];
}


export default function MessageList({ messages }: Props) {
    return (
        <div className="messages">
            {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.role}`}>
                    <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.text}
                </div>
            ))}
        </div>
    );
}