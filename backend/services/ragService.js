const { ChromaClient } = require("chromadb");
const path = require("path");
const fs = require("fs");
const { chunkText } = require("../utils/textProcessor");
const { generateEmbeddings } = require("./openaiService");
const SimpleVectorStore = require("./simpleVectorStore");
require("dotenv").config();

// Try to use ChromaDB, fallback to simple in-memory store
let useChromaDB = true;
let client = null;
let simpleStore = null;

// Get absolute path for ChromaDB persistent storage
const dbPath = process.env.CHROMA_DB_PATH || "./chroma_db";
const absoluteDbPath = path.isAbsolute(dbPath) 
  ? dbPath 
  : path.resolve(process.cwd(), dbPath);

// Ensure the directory exists
if (!fs.existsSync(absoluteDbPath)) {
  fs.mkdirSync(absoluteDbPath, { recursive: true });
  console.log(`Created ChromaDB directory: ${absoluteDbPath}`);
}

// Try to initialize ChromaDB
try {
  client = new ChromaClient({
    path: absoluteDbPath
  });
  console.log(`ChromaDB initialized with persistent storage at: ${absoluteDbPath}`);
} catch (error) {
  console.warn("ChromaDB initialization failed, using in-memory fallback:", error.message);
  useChromaDB = false;
  simpleStore = new SimpleVectorStore();
  console.log("Using simple in-memory vector store (data will be lost on restart)");
}

// Collection name for storing T&C documents
const COLLECTION_NAME = "terms_and_conditions";

let collection = null;

/**
 * Initialize or get the ChromaDB collection
 * @returns {Promise<Collection>}
 */
async function getCollection() {
  if (!useChromaDB) {
    return simpleStore; // Return simple store if ChromaDB is not available
  }

  if (collection) {
    return collection;
  }
  
  try {
    // Try to get existing collection
    collection = await client.getCollection({ name: COLLECTION_NAME });
    console.log("Using existing ChromaDB collection");
  } catch (error) {
    // If collection doesn't exist, create it
    if (error.message && (error.message.includes("does not exist") || error.message.includes("not found"))) {
      try {
        collection = await client.createCollection({
          name: COLLECTION_NAME,
          metadata: { description: "Terms and Conditions documents" }
        });
        console.log("Created new ChromaDB collection");
      } catch (createError) {
        console.error("Error creating ChromaDB collection:", createError);
        // Fallback to simple store
        console.warn("Falling back to in-memory vector store");
        useChromaDB = false;
        simpleStore = new SimpleVectorStore();
        return simpleStore;
      }
    } else {
      console.error("Error getting ChromaDB collection:", error);
      // Fallback to simple store
      console.warn("ChromaDB connection error, falling back to in-memory vector store");
      useChromaDB = false;
      simpleStore = new SimpleVectorStore();
      return simpleStore;
    }
  }
  
  return collection;
}

/**
 * Process and store a document in ChromaDB
 * @param {string} documentText - Full document text
 * @param {string} documentId - Unique identifier for the document
 * @param {Object} metadata - Additional metadata (e.g., filename, upload date)
 * @returns {Promise<void>}
 */
async function storeDocument(documentText, documentId, metadata = {}) {
  try {
    const coll = await getCollection();
    
    // Chunk the document
    const chunks = chunkText(documentText, 800, 100);
    console.log(`Chunked document into ${chunks.length} chunks`);
    
    // Generate embeddings for all chunks
    const chunkTexts = chunks.map(chunk => chunk.text);
    const embeddings = await generateEmbeddings(chunkTexts);
    console.log(`Generated ${embeddings.length} embeddings`);
    
    // Prepare data for ChromaDB
    const ids = chunks.map((_, index) => `${documentId}_chunk_${index}`);
    const metadatas = chunks.map((chunk, index) => ({
      ...metadata,
      chunkIndex: index,
      startIndex: chunk.startIndex,
      endIndex: chunk.endIndex,
      tokenCount: chunk.tokenCount,
      documentId: documentId
    }));
    
    // Store in vector store (ChromaDB or simple store)
    if (useChromaDB) {
      await coll.add({
        ids: ids,
        embeddings: embeddings,
        documents: chunkTexts,
        metadatas: metadatas
      });
    } else {
      // Use simple store
      coll.add(ids, embeddings, chunkTexts, metadatas);
    }
    
    console.log(`Stored document ${documentId} with ${chunks.length} chunks`);
  } catch (error) {
    console.error("Error storing document in ChromaDB:", error);
    throw error;
  }
}

/**
 * Search for relevant document chunks using RAG
 * @param {string} query - User query
 * @param {number} nResults - Number of results to return (default: 5)
 * @param {string} documentId - Optional: filter by specific document ID
 * @returns {Promise<Array>} Array of relevant chunks with metadata
 */
async function searchRelevantChunks(query, nResults = 5, documentId = null) {
  try {
    const coll = await getCollection();
    
    // Generate embedding for the query
    const { generateEmbedding } = require("./openaiService");
    const queryEmbedding = await generateEmbedding(query);
    
    // Build query options
    const queryOptions = {
      queryEmbeddings: [queryEmbedding],
      nResults: nResults,
    };
    
    // Add document filter if specified
    if (documentId) {
      queryOptions.where = { documentId: documentId };
    }
    
    // Search vector store
    let results;
    if (useChromaDB) {
      results = await coll.query(queryOptions);
    } else {
      // Use simple store
      results = coll.query(queryEmbedding, nResults, documentId ? { documentId } : null);
    }
    
    if (!results.documents || results.documents.length === 0 || !results.documents[0]) {
      return [];
    }
    
    // Format results
    const chunks = results.documents[0].map((doc, index) => ({
      text: doc,
      metadata: results.metadatas[0][index] || {},
      distance: results.distances[0] ? results.distances[0][index] : null
    }));
    
    return chunks;
  } catch (error) {
    console.error("Error searching ChromaDB:", error);
    throw error;
  }
}

/**
 * Delete a document and all its chunks from ChromaDB
 * @param {string} documentId - Document ID to delete
 * @returns {Promise<void>}
 */
async function deleteDocument(documentId) {
  try {
    const coll = await getCollection();
    
    // Get all chunks for this document
    let results;
    if (useChromaDB) {
      results = await coll.get({
        where: { documentId: documentId }
      });
    } else {
      results = coll.get({ documentId: documentId });
    }
    
    if (results.ids && results.ids.length > 0) {
      if (useChromaDB) {
        await coll.delete({ ids: results.ids });
      } else {
        coll.delete(results.ids);
      }
      console.log(`Deleted document ${documentId} with ${results.ids.length} chunks`);
    }
  } catch (error) {
    console.error("Error deleting document from ChromaDB:", error);
    throw error;
  }
}

module.exports = {
  storeDocument,
  searchRelevantChunks,
  deleteDocument,
  getCollection,
};

