import express from "npm:express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";



const app = express();
app.use(express.static("pages"));

const __filename = fileURLToPath(import.meta.url);
const __dirname =dirname(__filename);

app.get("/", (req, res) => {
    res.sendFile(join(__dirname, "pages", "index.html"));
});

app.get("/about", (req, res) => {
    res.sendFile(join(__dirname, "pages", "about.html"));
});

app.listen(8000, () => {
    console.log("Server running on http://localhost:8000");
  }).on("error", (err) => {
    console.error("Failed to start server:", err);
});