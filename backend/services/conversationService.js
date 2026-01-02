// In-memory conversation storage (per session)
// In production, this could be replaced with Redis or a database
const conversations = new Map();

/**
 * Get or create a conversation session
 * @param {string} sessionId - Session identifier
 * @returns {Array} Conversation history
 */
function getConversation(sessionId) {
  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, []);
  }
  return conversations.get(sessionId);
}

/**
 * Add a message to conversation history
 * @param {string} sessionId - Session identifier
 * @param {string} role - Message role ('user' or 'assistant')
 * @param {string} content - Message content
 */
function addMessage(sessionId, role, content) {
  const conversation = getConversation(sessionId);
  conversation.push({
    role: role,
    content: content,
    timestamp: new Date().toISOString()
  });
}

/**
 * Clear conversation history for a session
 * @param {string} sessionId - Session identifier
 */
function clearConversation(sessionId) {
  conversations.delete(sessionId);
}

/**
 * Get conversation history formatted for OpenAI API
 * @param {string} sessionId - Session identifier
 * @returns {Array} Formatted messages for OpenAI
 */
function getFormattedMessages(sessionId) {
  const conversation = getConversation(sessionId);
  return conversation.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}

/**
 * Clean up old conversations (optional - for memory management)
 * @param {number} maxAgeMs - Maximum age in milliseconds
 */
function cleanupOldConversations(maxAgeMs = 24 * 60 * 60 * 1000) {
  const now = Date.now();
  for (const [sessionId, conversation] of conversations.entries()) {
    if (conversation.length > 0) {
      const lastMessage = conversation[conversation.length - 1];
      const lastMessageTime = new Date(lastMessage.timestamp).getTime();
      if (now - lastMessageTime > maxAgeMs) {
        conversations.delete(sessionId);
      }
    }
  }
}

// Clean up old conversations every hour
setInterval(() => {
  cleanupOldConversations();
}, 60 * 60 * 1000);

module.exports = {
  getConversation,
  addMessage,
  clearConversation,
  getFormattedMessages,
};




