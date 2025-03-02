const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { marked } = require("marked");
const app = express();
const port = 3000;
const pagesDirectory = path.join(__dirname, "pages");

const offensiveWords = [
  "parolaccia1",
  "parolaccia2",
  "parolaccia3",
  "parolaccia4",
  "parolaccia5"
];

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

// Get all posts
app.get("/posts", (req, res) => {
  const pages = [];
  const files = fs.readdirSync(pagesDirectory);

  files.forEach((file) => {
    if (file.endsWith(".md")) {
      const filePath = path.join(pagesDirectory, file);

      if (fs.existsSync(filePath)) {
        pages.push(markdownToJson(filePath));
      }
    }
  });

  res.send(pages.reverse());
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

// Retrive a list of forbidden words
app.get('/bad-words', (req, res) => {
  res.json({
    status: 'success',
    badWords: offensiveWords
  });
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
  const jsonOutput = {
    content: marked(extractContent(markdownContent)),
    metadata: extractMetadata(markdownContent),
  };

  return jsonOutput;
}

/**
 * Extract content
 *
 * @param {*} markdownContent
 * @returns {*}
 */
function extractContent(markdownContent) {
  const regex = /---[\s\S]*?---\s*/;
  return markdownContent.replace(regex, "").trim();
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
        if (value.startsWith("[") && value.endsWith("]")) {
          const arrayValue = value.slice(1, -1);
          metadata[key] = arrayValue
            .split(",")
            .map((item) => item.trim().replace(/['"]/g, ""));
        } else {
          metadata[key] = value.replace(/['"]/g, "");
        }
      }
    });
  }

  return metadata;
}
