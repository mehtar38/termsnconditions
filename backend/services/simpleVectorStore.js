// Simple in-memory vector store as fallback when ChromaDB is not available
// Uses cosine similarity for search

/**
 * Simple in-memory vector store
 */
class SimpleVectorStore {
  constructor() {
    this.documents = new Map(); // documentId -> chunks
    this.vectors = new Map(); // chunkId -> embedding vector
    this.metadata = new Map(); // chunkId -> metadata
  }

  /**
   * Add documents with embeddings
   */
  add(ids, embeddings, documents, metadatas) {
    for (let i = 0; i < ids.length; i++) {
      const chunkId = ids[i];
      this.vectors.set(chunkId, embeddings[i]);
      this.metadata.set(chunkId, {
        ...metadatas[i],
        text: documents[i]
      });

      // Track by document ID
      const docId = metadatas[i].documentId;
      if (!this.documents.has(docId)) {
        this.documents.set(docId, []);
      }
      this.documents.get(docId).push(chunkId);
    }
  }

  /**
   * Search for similar vectors using cosine similarity
   */
  query(queryEmbedding, nResults = 5, where = null) {
    const results = {
      ids: [[]],
      distances: [[]],
      documents: [[]],
      metadatas: [[]]
    };

    // Calculate cosine similarity for all vectors
    const similarities = [];
    
    for (const [chunkId, vector] of this.vectors.entries()) {
      const metadata = this.metadata.get(chunkId);
      
      // Apply filter if provided
      if (where) {
        let matches = true;
        for (const [key, value] of Object.entries(where)) {
          if (metadata[key] !== value) {
            matches = false;
            break;
          }
        }
        if (!matches) continue;
      }

      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(queryEmbedding, vector);
      similarities.push({
        chunkId,
        similarity,
        metadata,
        text: metadata.text
      });
    }

    // Sort by similarity (descending) and take top nResults
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topResults = similarities.slice(0, nResults);

    // Format results
    results.ids[0] = topResults.map(r => r.chunkId);
    results.distances[0] = topResults.map(r => 1 - r.similarity); // Convert similarity to distance
    results.documents[0] = topResults.map(r => r.text);
    results.metadatas[0] = topResults.map(r => r.metadata);

    return results;
  }

  /**
   * Get documents by filter
   */
  get(where = null) {
    const ids = [];
    const documents = [];
    const metadatas = [];

    for (const [chunkId, metadata] of this.metadata.entries()) {
      if (where) {
        let matches = true;
        for (const [key, value] of Object.entries(where)) {
          if (metadata[key] !== value) {
            matches = false;
            break;
          }
        }
        if (!matches) continue;
      }

      ids.push(chunkId);
      documents.push(metadata.text);
      metadatas.push(metadata);
    }

    return { ids, documents, metadatas };
  }

  /**
   * Delete by IDs
   */
  delete(ids) {
    for (const id of ids) {
      this.vectors.delete(id);
      const metadata = this.metadata.get(id);
      if (metadata) {
        const docId = metadata.documentId;
        if (this.documents.has(docId)) {
          const chunks = this.documents.get(docId);
          const index = chunks.indexOf(id);
          if (index > -1) {
            chunks.splice(index, 1);
          }
          if (chunks.length === 0) {
            this.documents.delete(docId);
          }
        }
      }
      this.metadata.delete(id);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error("Vectors must have the same length");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  }
}

module.exports = SimpleVectorStore;




