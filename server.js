const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

const app = express();

const BOT_TOKEN = '8036942285:AAFGexludKBVRza-DiNEKHJwlhem3LHpIRw';
const CHAT_ID = '6196419535';
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(express.static(path.join(__dirname, 'pages')));
app.use(express.urlencoded({ extended: true }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Fallback if names aren't provided
    const name = req.body.name || 'NEW';
    const fathername = req.body.father_name || 'USER';
    const grandfathername = req.body.gfather_name || 'IMAGE';

    const filenameBase = `${name}_${fathername}_${grandfathername}`;
    const ext = path.extname(file.originalname);
    const newFilename = `${filenameBase}_${file.fieldname}${ext}`;
    cb(null, newFilename);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }
});

app.post('/register',
  upload.fields([
    { name: 'id_image', maxCount: 1 },
    { name: 'photo_image', maxCount: 1 },
    { name: 'receipt_image', maxCount: 1 }
  ]),
  async (req, res) => {
    const name = req.body.name || 'NEW';
    const fathername = req.body.fathername || 'USER';
    const grandfathername = req.body.grandfathername || 'IMAGE';

    const filenameBase = `${name}_${fathername}_${grandfathername}`;
    const uploadedFiles = [];
    const fileTypes = ['id_image', 'photo_image', 'receipt_image'];

    for (const type of fileTypes) {
      if (req.files[type]) {
        const file = req.files[type][0];
        const filePath = file.path;
        const filename = path.basename(filePath);

        const form = new FormData();
        form.append('chat_id', CHAT_ID);
        form.append('document', fs.createReadStream(filePath), filename);

        try {
          await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, form, {
            headers: form.getHeaders()
          });

          fs.unlink(filePath, err => {
            if (err) console.error(`Failed to delete ${filename}:`, err.message);
          });

          uploadedFiles.push({
            field: type,
            filename: filename,
            status: "sent and deleted"
          });
        } catch (err) {
          console.error(`Error sending ${filename} to Telegram:`, err.message);
          uploadedFiles.push({
            field: type,
            filename: filename,
            status: "failed"
          });
        }
      }
    }

    res.json({
      message: "Files processed and sent to Telegram",
      namePattern: filenameBase,
      files: uploadedFiles
    });
  }
);



app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "index.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "pages", "about.html"));
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}).on("error", (err) => {
  console.error("Failed to start server:", err);
});