// Background service worker for T&C Analyzer extension

const BACKEND_URL = "http://localhost:3000";

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeTerms") {
    analyzeTermsAndConditions(request.text, request.url)
      .then((result) => {
        sendResponse({ success: true, data: result });
      })
      .catch((error) => {
        console.error("Error analyzing T&C:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }
});

/**
 * Analyze Terms & Conditions text using backend API
 */
async function analyzeTermsAndConditions(text, url) {
  try {
    // Send to backend for analysis
    const response = await fetch(`${BACKEND_URL}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `Please analyze the following Terms and Conditions text and provide:
1. A simplified summary (2-3 sentences)
2. Key risks or concerns
3. A clear YES/NO recommendation on whether to accept
4. Brief reasoning for the recommendation

Terms and Conditions text:
${text}

Source URL: ${url}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    return {
      summary: data.text,
      recommendation: extractRecommendation(data.text),
    };
  } catch (error) {
    console.error("Error calling backend:", error);
    throw error;
  }
}

/**
 * Extract YES/NO recommendation from analysis text
 */
function extractRecommendation(text) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes("recommend accepting") || 
      lowerText.includes("safe to accept") ||
      lowerText.includes("yes") && lowerText.includes("recommend")) {
    return "YES";
  } else if (lowerText.includes("not recommend") ||
             lowerText.includes("do not accept") ||
             lowerText.includes("avoid accepting") ||
             lowerText.includes("high risk")) {
    return "NO";
  } else if (lowerText.includes("moderate risk") ||
             lowerText.includes("caution")) {
    return "CAUTION";
  }
  
  return "REVIEW";
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("T&C Analyzer extension installed");
});




