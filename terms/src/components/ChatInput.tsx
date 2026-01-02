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
            <IconButton 
                onClick={() => fileInputRef.current?.click()}
                sx={{ 
                    color: '#6b7280',
                    '&:hover': { 
                        backgroundColor: '#f3f4f6',
                        color: '#4b5563'
                    }
                }}
            >
                <FileUploadIcon />
            </IconButton>
            <input
                ref={fileInputRef}
                type="file"
                hidden
                accept=".pdf,.txt"
                onChange={handleFileSelect}
            />
            <TextField
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                sx={{ 
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '24px',
                        backgroundColor: '#f9fafb',
                        '&:hover': {
                            backgroundColor: '#f3f4f6',
                        },
                        '&.Mui-focused': {
                            backgroundColor: 'white',
                        }
                    }
                }}
                placeholder="Type your message here... (Press Enter to send)"
                variant="outlined"
                multiline
                maxRows={4}
            />
            <IconButton 
                onClick={handleSend}
                disabled={!text.trim()}
                sx={{ 
                    color: text.trim() ? '#667eea' : '#d1d5db',
                    '&:hover': { 
                        backgroundColor: text.trim() ? '#f3f4f6' : 'transparent',
                    },
                    '&.Mui-disabled': {
                        color: '#d1d5db'
                    }
                }}
            >
                <SendIcon />
            </IconButton>
        </div>
    );
}