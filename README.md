# T&C Analyzer - AI-Powered Terms & Conditions Analyzer

An AI-powered web application and browser extension that helps users automatically detect, understand, and analyze Terms & Conditions (T&C) in real time.

## Features

### Web Application
- **Upload T&C Documents**: Upload PDF or TXT files containing Terms & Conditions
- **RAG-Powered Chat**: Interact with uploaded documents using Retrieval-Augmented Generation
- **Context-Aware Responses**: The chatbot maintains conversation context and uses relevant document chunks
- **Session Management**: Track conversations per session with clear session indicators

### Chrome Extension
- **Automatic Detection**: Detects T&C prompts on websites automatically
- **Real-Time Analysis**: Analyzes T&C text using AI and provides instant recommendations
- **Clear Recommendations**: Provides YES/NO/CAUTION recommendations with reasoning
- **Simplified Summaries**: Breaks down complex legal text into easy-to-understand summaries

## Tech Stack

- **Backend**: Node.js, Express, OpenAI API, ChromaDB (vector database)
- **Frontend**: React, TypeScript, Material-UI
- **Extension**: Chrome Manifest V3, Vanilla JavaScript
- **AI**: OpenAI GPT-3.5-turbo with RAG (Retrieval-Augmented Generation)

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key
- Chrome browser (for extension)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
CHROMA_DB_PATH=./chroma_db
```

5. Start the backend server:
```bash
node server.js
```

The server will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the terms directory:
```bash
cd terms
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The web app will be available at `http://localhost:5173` (or the port shown in terminal)

### Chrome Extension Setup

1. Navigate to the extension directory:
```bash
cd extension
```

2. Create extension icons:
   - Create three PNG files in the `icons/` directory:
     - `icon16.png` (16x16 pixels)
     - `icon48.png` (48x48 pixels)
     - `icon128.png` (128x128 pixels)
   - You can use any image editor or online tool
   - Suggested design: Document/contract icon with a checkmark or magnifying glass

3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `extension` folder

4. Make sure the backend server is running (required for extension to work)

## Usage

### Web Application

1. Open the web application in your browser
2. Upload a T&C document (PDF or TXT) using the file upload button
3. Wait for the initial analysis
4. Ask questions about the document in the chat interface
5. The chatbot will use RAG to find relevant sections and provide context-aware answers
6. Use "Clear Session" to start a new conversation

### Chrome Extension

1. Navigate to any website that shows Terms & Conditions prompts
2. The extension automatically detects T&C elements on the page
3. Click the extension icon in the Chrome toolbar
4. Click "Analyze Current Page" to analyze detected T&C text
5. Review the recommendation (YES/NO/CAUTION) and summary
6. Make informed decisions about accepting T&C agreements

## Project Structure

```
termsnconditions/
├── backend/
│   ├── server.js              # Main Express server
│   ├── services/
│   │   ├── openaiService.js   # OpenAI API wrapper
│   │   ├── ragService.js      # RAG implementation with ChromaDB
│   │   └── conversationService.js  # Session management
│   ├── utils/
│   │   └── textProcessor.js   # Text chunking utilities
│   ├── package.json
│   └── .env                   # Environment variables
├── extension/
│   ├── manifest.json          # Chrome extension manifest
│   ├── background.js          # Service worker
│   ├── content.js             # Content script for T&C detection
│   ├── popup.html             # Extension popup UI
│   ├── popup.js               # Popup logic
│   ├── styles.css             # Extension styling
│   └── icons/                 # Extension icons
└── terms/
    └── src/                   # React frontend application
        ├── components/
        ├── pages/
        └── utils/apis/
```

## API Endpoints

### Backend API

- `POST /file-upload` - Upload and analyze a T&C document
  - Body: FormData with `file` field
  - Returns: Analysis text and session ID

- `POST /message` - Send a chat message with context
  - Body: `{ text: string, sessionId?: string }`
  - Returns: AI response with context from uploaded document

- `POST /session/clear` - Clear conversation context
  - Body: `{ sessionId: string }`
  - Returns: Success confirmation

- `GET /health` - Health check endpoint

## How RAG Works

1. **Document Upload**: When a T&C document is uploaded, it's split into chunks (800 tokens each with 100 token overlap)
2. **Embedding Generation**: Each chunk is converted to an embedding vector using OpenAI's `text-embedding-3-small` model
3. **Vector Storage**: Embeddings are stored in ChromaDB with metadata
4. **Query Processing**: When a user asks a question:
   - The question is converted to an embedding
   - Similar document chunks are retrieved from ChromaDB
   - Relevant context is passed to the LLM along with the question
   - The LLM generates a response using both the question and document context

## Environment Variables

### Backend (.env)
- `OPENAI_API_KEY` (required) - Your OpenAI API key
- `PORT` (optional) - Server port, defaults to 3000
- `CHROMA_DB_PATH` (optional) - ChromaDB storage path, defaults to `./chroma_db`

## Troubleshooting

### Backend Issues
- Ensure OpenAI API key is set correctly in `.env`
- Check that port 3000 is not already in use
- Verify all npm packages are installed

### Frontend Issues
- Ensure backend server is running
- Check browser console for CORS errors
- Verify API endpoint URLs match backend configuration

### Extension Issues
- Ensure backend server is running on `http://localhost:3000`
- Check browser console for error messages
- Verify extension icons are present in `icons/` directory
- Make sure extension has necessary permissions

## Development

### Running in Development Mode

Backend:
```bash
cd backend
node server.js
```

Frontend:
```bash
cd terms
npm run dev
```

### Building for Production

Frontend:
```bash
cd terms
npm run build
```

## License

This project is open source and available for educational purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.




