// Approximate token counting: ~4 characters per token for English text
const CHARS_PER_TOKEN = 4;

/**
 * Estimate token count from character count
 * @param {string} text - Text to estimate tokens for
 * @returns {number} Estimated token count
 */
function estimateTokens(text) {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Split text into chunks with overlap
 * Uses character-based chunking with token estimation
 * @param {string} text - Text to chunk
 * @param {number} chunkSize - Target chunk size in tokens (default: 800)
 * @param {number} overlap - Overlap size in tokens (default: 100)
 * @returns {Array<{text: string, startIndex: number, endIndex: number, tokenCount: number}>}
 */
function chunkText(text, chunkSize = 800, overlap = 100) {
  const chunks = [];
  const chunkSizeChars = chunkSize * CHARS_PER_TOKEN;
  const overlapChars = overlap * CHARS_PER_TOKEN;
  
  let startIndex = 0;
  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSizeChars, text.length);
    const chunkText = text.substring(startIndex, endIndex);
    
    // Try to break at sentence boundaries if possible
    let actualEndIndex = endIndex;
    if (endIndex < text.length) {
      // Look for sentence endings within the last 20% of the chunk
      const searchStart = Math.max(startIndex, endIndex - chunkSizeChars * 0.2);
      const lastPeriod = text.lastIndexOf('.', endIndex);
      const lastNewline = text.lastIndexOf('\n', endIndex);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > searchStart) {
        actualEndIndex = breakPoint + 1;
      }
    }
    
    const finalChunkText = text.substring(startIndex, actualEndIndex);
    const estimatedTokens = estimateTokens(finalChunkText);
    
    chunks.push({
      text: finalChunkText,
      startIndex: startIndex,
      endIndex: actualEndIndex,
      tokenCount: estimatedTokens
    });
    
    // Move forward by chunkSize - overlap
    startIndex = Math.max(startIndex + 1, actualEndIndex - overlapChars);
    
    // If we're at the end, break
    if (actualEndIndex >= text.length) break;
  }
  
  return chunks;
}

/**
 * Count tokens in text (estimated)
 * @param {string} text - Text to count tokens for
 * @returns {number} Estimated token count
 */
function countTokens(text) {
  return estimateTokens(text);
}

module.exports = {
  chunkText,
  countTokens
};

