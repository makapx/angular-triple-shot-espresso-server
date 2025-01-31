const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { marked } = require("marked");
const app = express();
const port = 3000;
const pagesDirectory = path.join(__dirname, "pages");

app.use(cors());

// Get all posts
app.get("/", (req, res) => {
  fs.readdir(pagesDirectory, (err, files) => {
    if (err) {
      return res
        .status(500)
        .send("Errore nel leggere la cartella delle pagine.");
    }

    const markdownFiles = files.filter((file) => path.extname(file) === ".md");

    const pageList = markdownFiles.map((file) => ({
      name: path.basename(file, ".md"),
      url: `/post/${path.basename(file, ".md")}`,
    }));

    res.json(pageList);
  });
});

// Route for post
app.get("/post/:id", (req, res) => {
  const pageName = req.params.id;
  const filePath = path.join(pagesDirectory, `${pageName}.md`);

  if (fs.existsSync(filePath)) {
    res.send(markdownToJson(filePath));
  } else {
    res.status(404).send("Pagina non trovata.");
  }
});

// Server start
app.listen(port, () => {
  console.log(`Server in ascolto sulla porta ${port}`);
});

/**
 * Convert markdown to json
 * 
 * @param {*} filePath 
 * @returns {*}
 */
function markdownToJson(filePath) {
  const markdownContent = fs.readFileSync(filePath, "utf-8");

  const htmlContent = marked(markdownContent);

  const jsonOutput = {
    content: htmlContent,
    metadata: extractMetadata(markdownContent),
  };

  return jsonOutput;
}

/**
 * Extract metadata from file
 * 
 * @param {*} markdownContent 
 * @returns {*}
 */
function extractMetadata(markdownContent) {
  const metadata = {};

  const regex = /^---\s*([\s\S]+?)\s*---/;
  const match = markdownContent.match(regex);
  if (match) {
    const yamlContent = match[1];
    const lines = yamlContent.split("\n");

    lines.forEach((line) => {
      const [key, value] = line.split(":").map((s) => s.trim());
      if (key && value) {
        metadata[key] = value;
      }
    });
  }

  return metadata;
}
