import React, { useRef } from 'react';
import { TextField, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import FileUploadIcon from '@mui/icons-material/FileUpload';


interface Props {
    onSendText: (text: string) => void;
    onSendFile: (file: File) => void;
}


export default function ChatInput({ onSendText, onSendFile }: Props) {
    const [text, setText] = React.useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);


    const handleSend = () => {
        if (text.trim()) {
            onSendText(text);
            setText('');
        }
    };


    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onSendFile(e.target.files[0]);
        }
    };


    return (
        <div className="input-area">
            <IconButton onClick={() => fileInputRef.current?.click()}>
                <FileUploadIcon sx={{ backgroundColor: 'white'}} />
            </IconButton>
            <input
                ref={fileInputRef}
                type="file"
                hidden
                onChange={handleFileSelect}
            />
            <TextField
                value={text}
                onChange={(e) => setText(e.target.value)}
                sx={{ backgroundColor: 'white', width: '500px' }}
                placeholder="Type your message here!"
            />
            <IconButton onClick={handleSend}>
                <SendIcon sx={{ backgroundColor: 'white'}} />
            </IconButton>
        </div>
    );
}