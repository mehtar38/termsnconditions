# Backend Setup Guide

## Environment Variables

Create a `.env` file in the `backend/` directory with the following content:

```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
CHROMA_DB_PATH=./chroma_db
```

### Steps to Create .env File

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create the .env file:
```bash
touch .env
```

3. Add your OpenAI API key:
```bash
echo "OPENAI_API_KEY=your_actual_openai_key_here" >> .env
echo "PORT=3000" >> .env
echo "CHROMA_DB_PATH=./chroma_db" >> .env
```

Or manually edit the `.env` file and add:
- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `PORT` - Server port (optional, defaults to 3000)
- `CHROMA_DB_PATH` - Path for ChromaDB storage (optional, defaults to ./chroma_db)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

Or:
```bash
node server.js
```

The server will start on `http://localhost:3000` (or the port specified in .env)

## API Endpoints

- `POST /file-upload` - Upload T&C document for analysis
- `POST /message` - Send chat message with RAG context
- `POST /session/clear` - Clear conversation session
- `GET /health` - Health check

## Notes

- The old `uploadFile.js` file is kept for reference but `server.js` is the main server file
- ChromaDB will automatically create the database directory on first use
- Uploaded files are temporarily stored and deleted after processing




