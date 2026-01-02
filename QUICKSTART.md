# Quick Start Guide

Get your T&C Analyzer up and running in 5 minutes!

## Step 1: Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```bash
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
echo "PORT=3000" >> .env
echo "CHROMA_DB_PATH=./chroma_db" >> .env
```

**Important**: Replace `your_openai_api_key_here` with your actual OpenAI API key!

Start the server:
```bash
npm start
```

You should see: `Server listening on port 3000`

## Step 2: Frontend Setup

Open a new terminal:

```bash
cd terms
npm install
npm run dev
```

The web app will open at `http://localhost:5173` (or similar)

## Step 3: Test the Web App

1. Open `http://localhost:5173` in your browser
2. Click the file upload button
3. Upload a PDF or TXT file with Terms & Conditions
4. Wait for the analysis (this may take 10-30 seconds)
5. Ask questions about the document in the chat

## Step 4: Chrome Extension (Optional)

1. Create extension icons (see `extension/create-icons.md`)
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `extension` folder
6. Click the extension icon when on a website with T&C prompts

## Troubleshooting

**Backend won't start:**
- Check that port 3000 is available
- Verify `.env` file exists and has `OPENAI_API_KEY`

**Frontend can't connect:**
- Make sure backend is running on port 3000
- Check browser console for errors

**Extension not working:**
- Ensure backend is running
- Check that icons are in `extension/icons/` directory
- Look at extension popup for error messages

## Next Steps

- Read the full `README.md` for detailed documentation
- Check `backend/SETUP.md` for backend configuration
- See `extension/README.md` for extension setup

## Need Help?

- Check browser/terminal console for error messages
- Verify all environment variables are set correctly
- Ensure all npm packages are installed




