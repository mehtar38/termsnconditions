// Popup script for T&C Analyzer extension

const BACKEND_URL = "http://localhost:3000";

// DOM elements
const statusDiv = document.getElementById('status');
const analysisDiv = document.getElementById('analysis');
const errorDiv = document.getElementById('error');
const recommendationBadge = document.getElementById('recommendationBadge');
const recommendationText = document.getElementById('recommendationText');
const summaryText = document.getElementById('summaryText');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const errorText = document.getElementById('errorText');
const retryBtn = document.getElementById('retryBtn');
const openChatBtn = document.getElementById('openChatBtn');

function show(element) {
  if (element) {
    element.classList.remove('hidden');
  }
}

function hide(element) {
  if (element) {
    element.classList.add('hidden');
  }
}

/**
 * Set recommendation badge style
 */
function setRecommendation(recommendation) {
  recommendationBadge.textContent = recommendation;
  recommendationBadge.className = 'recommendation-badge';
  
  switch(recommendation) {
    case 'YES':
      recommendationBadge.classList.add('yes');
      recommendationText.textContent = 'Safe to Accept';
      break;
    case 'NO':
      recommendationBadge.classList.add('no');
      recommendationText.textContent = 'Do Not Accept';
      break;
    case 'CAUTION':
      recommendationBadge.classList.add('caution');
      recommendationText.textContent = 'Proceed with Caution';
      break;
    default:
      recommendationBadge.classList.add('review');
      recommendationText.textContent = 'Review Required';
  }
}

/**
 * Get current tab
 */
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

/**
 * Get stored T&C text for current page
 */
async function getStoredTerms() {
  try {
    const tab = await getCurrentTab();
    const key = `terms_${tab.url}`;
    const result = await chrome.storage.local.get(key);
    return result[key] || null;
  } catch (error) {
    console.error('Error getting stored terms:', error);
    return null;
  }
}

/**
 * Analyze T&C text using backend
 */
async function analyzeTerms(text, url) {
  try {
    show(statusDiv);
    hide(analysisDiv);
    hide(errorDiv);
    statusDiv.querySelector('p').textContent = 'Analyzing Terms & Conditions...';

    console.log("Extracted Text Legnth: ", text.length, text);

    const response = await fetch(`${BACKEND_URL}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: `Analyze these Terms & Conditions and provide ONLY:
1. One word: YES, NO, or CAUTION
2. One sentence summary (max 20 words)
3. Top 2 concerns (if any), each max 10 words

Be extremely concise. Format:
RECOMMENDATION: [YES/NO/CAUTION]
SUMMARY: [one sentence]
CONCERNS: [if any]

Text: ${text.substring(0, 2000)}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Store full analysis for chat
    const tab = await getCurrentTab();
    await chrome.storage.local.set({
      [`analysis_${tab.url}`]: {
        fullText: text,
        summary: data.text,
        url: url,
        timestamp: Date.now()
      }
    });
    
    // Extract recommendation from response
    const recommendation = extractRecommendation(data.text);
    const summary = formatSummary(data.text);

    // Display results
    setRecommendation(recommendation);
    summaryText.textContent = summary;
    
    hide(statusDiv);
    show(analysisDiv);
  } catch (error) {
    console.error('Error analyzing terms:', error);
    showError(error.message);
  }
}

/**
 * Extract recommendation from analysis text
 */
function extractRecommendation(text) {
  const lowerText = text.toLowerCase();
  
  if ((lowerText.includes('recommend accepting') || 
       lowerText.includes('safe to accept') ||
       (lowerText.includes('yes') && lowerText.includes('recommend'))) &&
      !lowerText.includes('not recommend')) {
    return 'YES';
  } else if (lowerText.includes('not recommend') ||
             lowerText.includes('do not accept') ||
             lowerText.includes('avoid accepting') ||
             lowerText.includes('high risk') ||
             (lowerText.includes('no') && lowerText.includes('recommend'))) {
    return 'NO';
  } else if (lowerText.includes('moderate risk') ||
             lowerText.includes('caution') ||
             lowerText.includes('proceed with caution')) {
    return 'CAUTION';
  }
  
  return 'REVIEW';
}

/**
 * Format summary text
 */
function formatSummary(text) {
  // Clean up the text and limit length
  let summary = text.trim();
  
  // Remove excessive whitespace
  summary = summary.replace(/\s+/g, ' ');
  
  // Limit to reasonable length for popup
  if (summary.length > 500) {
    summary = summary.substring(0, 500) + '...';
  }
  
  return summary;
}

/**
 * Show error message
 */
function showError(message) {
  errorText.textContent = `Error: ${message}`;
  hide(statusDiv);
  hide(analysisDiv);
  show(errorDiv);
}

/**
 * Initialize popup
 */
async function init() {
  // Check if backend is available
  try {
    const healthCheck = await fetch(`${BACKEND_URL}/health`);
    if (!healthCheck.ok) {
      throw new Error('Backend server is not responding');
    }
  } catch (error) {
    showError('Cannot connect to backend server. Make sure it\'s running on http://localhost:3000');
    return;
  }

  // Try to get stored terms for current page
  const storedTerms = await getStoredTerms();
  
  if (storedTerms && storedTerms.text) {
    // Analyze stored terms
    await analyzeTerms(storedTerms.text, storedTerms.url);
  } else {
    // No terms detected yet
    statusDiv.querySelector('p').textContent = 'No Terms & Conditions detected on this page yet.';
    show(statusDiv);
    hide(analysisDiv);
  }
}

/**
 * Request content script to analyze current page
 */
async function requestPageAnalysis() {
  try {
    const tab = await getCurrentTab();
    
    // Inject content script if needed and request analysis
    chrome.tabs.sendMessage(tab.id, { action: 'analyzePage' }, async (response) => {
      if (chrome.runtime.lastError) {
        // Content script might not be ready, try to get stored terms
        const storedTerms = await getStoredTerms();
        if (storedTerms && storedTerms.text) {
          await analyzeTerms(storedTerms.text, storedTerms.url);
        } else {
          showError('Could not detect Terms & Conditions on this page. Try navigating to a page with T&C prompts.');
        }
      } else if (response && response.text) {
        await analyzeTerms(response.text, tab.url);
      }
    });
  } catch (error) {
    showError(error.message);
  }
}

// Event listeners
analyzeBtn.addEventListener('click', requestPageAnalysis);
clearBtn.addEventListener('click', () => {
  hide(analysisDiv);
  hide(errorDiv);
  statusDiv.querySelector('p').textContent = 'Scanning page for Terms & Conditions...';
  show(statusDiv);
});
retryBtn.addEventListener('click', init);

openChatBtn.addEventListener('click', async () => {
  const tab = await getCurrentTab();
  const stored = await chrome.storage.local.get(`analysis_${tab.url}`);
  
  if (stored[`analysis_${tab.url}`]) {
    const data = stored[`analysis_${tab.url}`];
    const encodedUrl = encodeURIComponent(data.url);
    
    chrome.tabs.create({
      url: `http://localhost:5173?analyze=${encodedUrl}`
    });
  }
});

// Initialize on load
init();

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'termsDetected') {
    // Refresh analysis if terms are detected
    init();
  }
});




