// Content script to detect Terms & Conditions prompts on web pages

(function() {
  'use strict';

  // Patterns to detect T&C related elements
  const TERMS_PATTERNS = [
    /terms?\s*(and|&)?\s*conditions?/i,
    /terms?\s*of\s*service/i,
    /privacy\s*policy/i,
    /user\s*agreement/i,
    /service\s*agreement/i,
    /accept\s*terms/i,
    /agree\s*to\s*terms/i,
    /i\s*agree/i,
  ];

  // Selectors for common T&C elements
  const TERMS_SELECTORS = [
    '[class*="terms"]',
    '[class*="condition"]',
    '[id*="terms"]',
    '[id*="condition"]',
    '[class*="agreement"]',
    '[id*="agreement"]',
    '[class*="policy"]',
    '[id*="policy"]',
    'button[class*="accept"]',
    'button[class*="agree"]',
    'a[href*="terms"]',
    'a[href*="condition"]',
    'a[href*="policy"]',
  ];

  let detectedTerms = null;
  let observer = null;

  /**
   * Check if text matches T&C patterns
   */
  function isTermsRelated(text) {
    if (!text || text.length < 10) return false;
    return TERMS_PATTERNS.some(pattern => pattern.test(text));
  }

  /**
   * Extract T&C text from element
   */
  // function extractTermsText(element) {
  //   // Try to find modal, overlay, or dialog
  //   const modal = element.closest('[class*="modal"]') || 
  //                 element.closest('[class*="overlay"]') ||
  //                 element.closest('[class*="dialog"]') ||
  //                 element.closest('[role="dialog"]');
    
  //   if (modal) {
  //     return modal.innerText || modal.textContent || '';
  //   }

  //   // Try to find parent container with substantial text
  //   let container = element.parentElement;
  //   for (let i = 0; i < 5 && container; i++) {
  //     const text = container.innerText || container.textContent || '';
  //     if (text.length > 200 && isTermsRelated(text)) {
  //       return text;
  //     }
  //     container = container.parentElement;
  //   }

  //   return element.innerText || element.textContent || '';
  // }

  /**
   * Detect T&C elements on the page
   */

  function extractTermsText(element) {
  // Strategy 1: Look for the main content container first
  // Most T&C pages have substantial text in main/article tags
  const mainSelectors = [
    'main',
    '[role="main"]',
    'article',
    '.main-content',
    '#main-content',
    '.legal-content',
    '.terms-content',
    '.article-content'
  ];

  for (const selector of mainSelectors) {
    const main = document.querySelector(selector);
    if (main) {
      const text = main.innerText || main.textContent || '';
      // Actual T&C should be at least 2000 characters
      if (text.length > 2000) {
        console.log(`Found main content via ${selector}: ${text.length} chars`);
        return text;
      }
    }
  }

  // Strategy 2: Find the largest text block on the page
  const allDivs = document.querySelectorAll('div, section, article');
  let largestText = '';
  let largestLength = 0;

  allDivs.forEach(div => {
    const text = div.innerText || div.textContent || '';
    // Only consider this div if it has substantial unique text
    // (not just containing all its children's text)
    const childTexts = Array.from(div.children).map(c => c.innerText || '').join('');
    const uniqueText = text.length - childTexts.length;
    
    if (uniqueText > largestLength && uniqueText > 1000) {
      largestLength = uniqueText;
      largestText = text;
    }
  });

  if (largestLength > 2000) {
    console.log(`Found largest content block: ${largestLength} chars`);
    return largestText;
  }

  // Strategy 3: Original modal/dialog logic (for popups)
  const modal = element.closest('[class*="modal"]') || 
                element.closest('[class*="overlay"]') ||
                element.closest('[class*="dialog"]') ||
                element.closest('[role="dialog"]');
  
  if (modal) {
    const text = modal.innerText || modal.textContent || '';
    if (text.length > 500) {
      return text;
    }
  }

  // Strategy 4: Fallback - just return what we found
  return element.innerText || element.textContent || '';
}

  function detectTermsElements() {
    const candidates = [];

    // FIRST: Check if we're on an actual T&C page by looking at the URL
  const url = window.location.href.toLowerCase();
  const isLikelyTCPage = url.includes('terms') || 
                         url.includes('conditions') || 
                         url.includes('agreement') ||
                         url.includes('policy');

  if (isLikelyTCPage) {
    // We're probably on a T&C page, grab the main content
    const mainContent = extractTermsText(document.body);
    if (mainContent.length > 2000) {
      console.log('Detected T&C page via URL, extracted main content');
      return {
        element: document.body,
        text: mainContent,
        score: mainContent.length
      };
    }
  }


    // Check all matching selectors
    TERMS_SELECTORS.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.innerText || el.textContent || '';
          if (isTermsRelated(text) && text.length > 50) {
            candidates.push({
              element: el,
              text: extractTermsText(el),
              score: text.length
            });
          }
        });
      } catch (e) {
        // Ignore invalid selectors
      }
    });

    // Also check all buttons and links
    document.querySelectorAll('button, a, [role="button"]').forEach(el => {
      const text = el.innerText || el.textContent || '';
      if (isTermsRelated(text)) {
        candidates.push({
          element: el,
          text: extractTermsText(el),
          score: text.length
        });
      }
    });

    // Return the candidate with the most text (likely the full T&C)
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);

        const substantialCandidates = candidates.filter(c => c.text.length > 2000);
    if (substantialCandidates.length > 0) {
      return substantialCandidates[0];
    }
      return candidates[0];
    }

    return null;
  }

  /**
   * Show notification badge when T&C detected
   */
  function showNotification() {
    chrome.runtime.sendMessage({
      action: "termsDetected",
      url: window.location.href
    }).catch(() => {
      // Ignore errors if popup is not open
    });
  }

  /**
   * Initialize T&C detection
   */
  function initDetection() {
    // Initial scan
    detectedTerms = detectTermsElements();
    
    if (detectedTerms) {
      console.log("T&C detected on page:", window.location.href);
      showNotification();
      
      // Store detected terms
      chrome.storage.local.set({
        [`terms_${window.location.href}`]: {
          text: detectedTerms.text,
          url: window.location.href,
          timestamp: Date.now()
        }
      });
    }

    // Watch for dynamically added content
    if (!observer) {
      observer = new MutationObserver(() => {
        if (!detectedTerms) {
          detectedTerms = detectTermsElements();
          if (detectedTerms) {
            showNotification();
            chrome.storage.local.set({
              [`terms_${window.location.href}`]: {
                text: detectedTerms.text,
                url: window.location.href,
                timestamp: Date.now()
              }
            });
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }

  // Start detection when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDetection);
  } else {
    initDetection();
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzePage') {
      if (detectedTerms) {
        sendResponse({ 
          success: true, 
          text: detectedTerms.text,
          url: window.location.href
        });
      } else {
        // Try to detect again
        detectedTerms = detectTermsElements();
        if (detectedTerms) {
          sendResponse({ 
            success: true, 
            text: detectedTerms.text,
            url: window.location.href
          });
        } else {
          sendResponse({ 
            success: false, 
            error: 'No T&C detected on this page'
          });
        }
      }
      return true; // Keep channel open
    }
  });

  // Re-scan on navigation (for SPAs)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      detectedTerms = null;
      setTimeout(initDetection, 1000);
    }
  }).observe(document, { subtree: true, childList: true });

})();

