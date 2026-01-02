const OpenAI = require("openai");
require("dotenv").config();

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("OPENAI_API_KEY not found in environment variables");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: apiKey,
});

/**
 * Generate embeddings for text using OpenAI
 * @param {string} text - Text to generate embeddings for
 * @returns {Promise<number[]>} Embedding vector
 */
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    
    return response.data[0].embedding;
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
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
    });
    
    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw error;
  }
}

/**
 * Generate chat completion using OpenAI
 * @param {Array} messages - Array of message objects with role and content
 * @param {string} model - Model to use (default: gpt-3.5-turbo)
 * @returns {Promise<string>} Generated response text
 */
async function generateChatCompletion(messages, model = "gpt-3.5-turbo") {
  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: messages,
      temperature: 0.7,
    });
    
    return response.choices[0].message.content;
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




