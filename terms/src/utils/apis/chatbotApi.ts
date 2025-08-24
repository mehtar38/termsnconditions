export interface ChatResponse {
role: 'user' | 'assistant';
text: string;
}


export async function sendFileMessage(file: File): Promise<ChatResponse> {
const formData = new FormData();
formData.append('file', file);


const res = await fetch('http://localhost:3000/file-upload', {
method: 'POST',
body: formData,
});


if (!res.ok) {
throw new Error('Failed to upload file');
}


return res.json(); // expects { role: 'assistant', text: '...' }
}


export async function sendTextMessage(text: string): Promise<ChatResponse> {
const res = await fetch('http://localhost:3001/message', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ text }),
});

    
if (!res.ok) {
throw new Error('Failed to send message');
}


return res.json();
}