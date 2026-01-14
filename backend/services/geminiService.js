const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY not found in environment variables");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Generate embeddings for text using Gemini
 * @param {string} text - Text to generate embeddings for
 * @returns {Promise<number[]>} Embedding vector
 */
async function generateEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts
 * @param {string[]} texts - Array of texts to generate embeddings for
 * @returns {Promise<number[][]>} Array of embedding vectors
 */
async function generateEmbeddings(texts) {
  try {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    
    // Gemini requires batch embedding calls
    const embeddings = await Promise.all(
      texts.map(async (text) => {
        const result = await model.embedContent(text);
        return result.embedding.values;
      })
    );
    
    return embeddings;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw error;
  }
}

/**
 * Generate chat completion using Gemini
 * @param {Array} messages - Array of message objects with role and content
 * @param {string} model - Model to use (default: gemini-1.5-flash)
 * @returns {Promise<string>} Generated response text
 */
async function generateChatCompletion(messages, modelName = "gemini-2.5-flash-lite") {
  try {
    const model = genAI.getGenerativeModel({ model: modelName, apiVersion: "v1beta" });
    
    // Convert OpenAI-style messages to Gemini format
    // Gemini uses 'user' and 'model' roles instead of 'user' and 'assistant'
    const geminiMessages = messages
      .filter(msg => msg.role !== 'system') // Remove system messages for now
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
    
    // Get system message if exists
    const systemMessage = messages.find(msg => msg.role === 'system');
    const systemInstruction = systemMessage ? systemMessage.content : undefined;
    
    // Start chat with history
    const chat = model.startChat({
      history: geminiMessages.slice(0, -1), // All messages except the last one
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
      systemInstruction: systemInstruction
    });
    
    // Send the last message
    const lastMessage = geminiMessages[geminiMessages.length - 1];
    const result = await chat.sendMessage(lastMessage.parts[0].text);
    
    return result.response.text();
  } catch (error) {
    console.error("Error generating chat completion:", error);
    throw error;
  }
}

module.exports = {
  generateEmbedding,
  generateEmbeddings,
  generateChatCompletion,
};