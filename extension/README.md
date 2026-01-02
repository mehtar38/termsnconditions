# T&C Analyzer Chrome Extension

## Setup Instructions

1. **Create Extension Icons**
   - Create three icon files in the `icons/` directory:
     - `icon16.png` (16x16 pixels)
     - `icon48.png` (48x48 pixels)
     - `icon128.png` (128x128 pixels)
   - You can use any image editor or online tool to create these icons
   - Suggested: Use a document/contract icon with a checkmark or magnifying glass

2. **Load Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `extension` folder

3. **Start Backend Server**
   - Make sure the backend server is running on `http://localhost:3000`
   - The extension requires the backend to be running to analyze T&C documents

## Usage

1. Navigate to any website that shows Terms & Conditions prompts
2. The extension will automatically detect T&C elements on the page
3. Click the extension icon in the toolbar to see the analysis
4. Click "Analyze Current Page" to analyze detected T&C text
5. Review the recommendation (YES/NO/CAUTION) and summary

## Features

- Automatic detection of T&C prompts on web pages
- Real-time analysis using AI (OpenAI + RAG)
- Clear YES/NO recommendations
- Simplified summaries of complex legal text
- Works with modals, overlays, and embedded T&C content

## Troubleshooting

- If analysis fails, ensure the backend server is running
- Check browser console for error messages
- Make sure you have set `OPENAI_API_KEY` in the backend `.env` file




