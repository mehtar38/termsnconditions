const express = require("express");
const app = express();

const cors = require("cors");
app.use(cors());

const multer = require("multer");
const fs = require("fs").promises;
const path = require("path");
const pdf = require("pdf-parse");

const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const api_key = process.env.GEMINI_API_KEY;
// console.log("API key ", api_key);

if (!api_key) {
  console.error("API key not found");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(api_key);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "uploads/";
    fs.mkdir(uploadPath, { recursive: true })
      .then(() => cb(null, uploadPath))
      .catch((err) => cb(err));
  },
  filename: function (req, file, cb) {
    // Use the original file name, or generate a unique one if preferred
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

app.post("/file-upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const filePath = req.file.path;
  const originalFileName = req.file.originalname;
  const fileExtension = path.extname(originalFileName).toLowerCase();
  console.log(`File uploaded: ${filePath}`);

  let fileContent;

  try {
    if (fileExtension === ".pdf") {
      console.log("Processing PDF file...");
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      fileContent = data.text; // Extracted text from PDF
      console.log("PDF content extracted successfully.");
    } else if (fileExtension === ".txt") {
      console.log("Processing TXT file...");
      fileContent = await fs.readFile(filePath, "utf8");
      console.log("TXT content read successfully.");
    } else {
      // Handle other file types or reject them
      await fs.unlink(filePath); // Delete unsupported file
      return res
        .status(400)
        .send("Unsupported file type. Please upload a .txt or .pdf file.");
    }

    if (!fileContent || fileContent.trim().length === 0) {
      await fs.unlink(filePath);
      return res
        .status(400)
        .send("File content is empty or could not be read.");
    }

    const prompt =
      "Please analyze the attached document, which is a Terms and Conditions or Terms of Service agreement.  (E.g., clear privacy policy, easy opt-out, fair dispute resolution), Flagged Risky or Ambiguous Clauses: (Include short quotes or clause references), Overall Risk Rating: (Safe / Moderate Risk / High Risk), Summary of Key Takeaways: (Concise overview) Final Verdict: (Would you recommend signing or accepting this agreement? Why or why not?), Closing Note: (Any actions the user should take — e.g., ask the company for clarification, avoid accepting) ";
    const result = await model.generateContent(
      `${prompt}\n\n---Document Start ---\n${fileContent}\n---Document End ---`
    );
    const response = await result.response;
    const geminiText = response.text();
    console.log("Response received");

    await fs.unlink(filePath);
    console.log("Delete Temp file");

    res.json({
      role: "assistant",
      message: "File processed",
      geminiAnalysis: geminiText,
    });
  } catch (error) {
    console.log("Processing error");
    if (filePath) {
      try {
        await fs.unlink(filePath);
        console.error(`Deleted erroneous file: ${filePath}`);
      } catch (deleteError) {
        console.error(`Error deleting file ${filePath}:`, deleteError);
      }
    }
    res.status(500).send("Error processing your request.");
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("Listening on port 3000");
});
