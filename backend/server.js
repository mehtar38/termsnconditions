const express = require("express");
const app = express();

const cors = require("cors");
app.use(cors());
app.use(express.json());

const multer = require("multer");
const fs = require("fs").promises;
const path = require("path");
const pdf = require("pdf-parse");
const { v4: uuidv4 } = require("uuid");

const { generateChatCompletion } = require("./services/openaiService");
const { storeDocument, searchRelevantChunks, deleteDocument } = require("./services/ragService");
const { addMessage, getFormattedMessages, clearConversation } = require("./services/conversationService");

// Store document IDs per session (to track which document is being discussed)
const sessionDocuments = new Map();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "uploads/";
    fs.mkdir(uploadPath, { recursive: true })
      .then(() => cb(null, uploadPath))
      .catch((err) => cb(err));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

/**
 * Extract text from uploaded file
 */
async function extractFileContent(filePath, fileExtension) {
  let fileContent;

  if (fileExtension === ".pdf") {
    console.log("Processing PDF file...");
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    fileContent = data.text;
    console.log("PDF content extracted successfully.");
  } else if (fileExtension === ".txt") {
    console.log("Processing TXT file...");
    fileContent = await fs.readFile(filePath, "utf8");
    console.log("TXT content read successfully.");
  } else {
    throw new Error("Unsupported file type. Please upload a .txt or .pdf file.");
  }

  if (!fileContent || fileContent.trim().length === 0) {
    throw new Error("File content is empty or could not be read.");
  }

  return fileContent;
}

/**
 * Generate initial analysis of T&C document
 */
async function generateInitialAnalysis(fileContent) {
  const analysisPrompt = `You are an expert legal analyst specializing in Terms and Conditions and Terms of Service agreements. Analyze the following document and provide a comprehensive analysis.

Please structure your response with the following sections:
1. **Positive Aspects**: Highlight any good practices (e.g., clear privacy policy, easy opt-out, fair dispute resolution)
2. **Flagged Risky or Ambiguous Clauses**: Include short quotes or clause references for any concerning sections
3. **Overall Risk Rating**: Rate as Safe / Moderate Risk / High Risk
4. **Summary of Key Takeaways**: Provide a concise overview of the most important points
5. **Final Verdict**: Would you recommend signing or accepting this agreement? Why or why not?
6. **Closing Note**: Any actions the user should take (e.g., ask the company for clarification, avoid accepting)

Document:
${fileContent}`;

  const messages = [
    {
      role: "system",
      content: "You are a helpful legal assistant that analyzes Terms and Conditions documents in a clear, user-friendly manner."
    },
    {
      role: "user",
      content: analysisPrompt
    }
  ];

  return await generateChatCompletion(messages);
}

// POST /file-upload - Enhanced with RAG
app.post("/file-upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const filePath = req.file.path;
  const originalFileName = req.file.originalname;
  const fileExtension = path.extname(originalFileName).toLowerCase();
  const sessionId = req.headers["x-session-id"] || uuidv4();
  
  console.log(`File uploaded: ${filePath} for session: ${sessionId}`);

  let fileContent;
  let documentId = null;

  try {
    // Extract file content
    fileContent = await extractFileContent(filePath, fileExtension);

    // Generate unique document ID
    documentId = `doc_${Date.now()}_${uuidv4()}`;

    // Store document in ChromaDB with RAG
    await storeDocument(fileContent, documentId, {
      filename: originalFileName,
      uploadDate: new Date().toISOString(),
      fileExtension: fileExtension
    });

    // Store document ID for this session
    sessionDocuments.set(sessionId, documentId);

    // Generate initial analysis
    const analysis = await generateInitialAnalysis(fileContent);

    // Add to conversation history
    addMessage(sessionId, "user", `Uploaded file: ${originalFileName}`);
    addMessage(sessionId, "assistant", analysis);

    // Clean up uploaded file
    await fs.unlink(filePath);
    console.log("Deleted temp file");

    res.json({
      role: "assistant",
      text: analysis,
      sessionId: sessionId,
      documentId: documentId
    });
  } catch (error) {
    console.error("Processing error:", error);
    
    // Clean up file if it exists
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (deleteError) {
        console.error(`Error deleting file ${filePath}:`, deleteError);
      }
    }

    // Clean up document from ChromaDB if it was stored
    if (documentId) {
      try {
        await deleteDocument(documentId);
      } catch (deleteError) {
        console.error(`Error deleting document ${documentId}:`, deleteError);
      }
    }

    res.status(500).json({ error: error.message || "Error processing your request." });
  }
});

// POST /message - Text chat with RAG context
app.post("/message", async (req, res) => {
  try {
    const { text, sessionId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }

    const currentSessionId = sessionId || uuidv4();
    const documentId = sessionDocuments.get(currentSessionId);

    // If there's a document in this session, use RAG to find relevant context
    let contextChunks = [];
    if (documentId) {
      try {
        contextChunks = await searchRelevantChunks(text, 5, documentId);
        console.log(`Found ${contextChunks.length} relevant chunks for query`);
      } catch (ragError) {
        console.error("RAG search error:", ragError);
        // Continue without RAG context if search fails
      }
    }

    // Get conversation history (before adding current message)
    const conversationHistory = getFormattedMessages(currentSessionId);

    // Build messages for OpenAI
    const messages = [
      {
        role: "system",
        content: "You are a helpful legal assistant that analyzes Terms and Conditions documents. Use the provided context from the document to answer questions accurately. If the context doesn't contain relevant information, say so."
      }
    ];

    // Add conversation history (excluding system messages)
    if (conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // Build the current user message with RAG context if available
    let userMessageContent = text;
    if (contextChunks.length > 0) {
      const contextText = contextChunks
        .map((chunk, index) => `[Context ${index + 1}]\n${chunk.text}`)
        .join("\n\n");
      
      userMessageContent = `Context from the Terms and Conditions document:\n\n${contextText}\n\nUser question: ${text}`;
    } else if (documentId) {
      // Document exists but no relevant chunks found
      userMessageContent = `The user has uploaded a Terms and Conditions document, but no specific relevant context was found for this question. Please answer based on general knowledge about T&C documents.\n\nUser question: ${text}`;
    }

    // Add current user message
    messages.push({
      role: "user",
      content: userMessageContent
    });

    // Add user message to conversation history (for future context)
    addMessage(currentSessionId, "user", text);

    // Generate response
    const response = await generateChatCompletion(messages);

    // Add assistant response to conversation
    addMessage(currentSessionId, "assistant", response);

    res.json({
      role: "assistant",
      text: response,
      sessionId: currentSessionId
    });
  } catch (error) {
    console.error("Error processing message:", error);
    res.status(500).json({ error: error.message || "Error processing your message." });
  }
});

// POST /session/clear - Clear conversation context
app.post("/session/clear", async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    clearConversation(sessionId);
    sessionDocuments.delete(sessionId);

    res.json({ success: true, message: "Session cleared" });
  } catch (error) {
    console.error("Error clearing session:", error);
    res.status(500).json({ error: error.message || "Error clearing session." });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

