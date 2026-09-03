import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { createServer as createViteServer } from "vite";

interface FileRecord {
  id: string;
  originalName: string;
  filename: string;
  url: string;
  size: number;
  mimetype: string;
  createdAt: number;
  expiresAt: number | null; // null for permanent Catbox, timestamp for Litterbox
  mode: "catbox" | "litterbox";
  userhash?: string;
}

interface AlbumRecord {
  id: string;
  title: string;
  description: string;
  files: string[]; // filenames or urls
  createdAt: number;
  userhash?: string;
}

const PORT = 3000;
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const DATA_FILE = path.join(process.cwd(), "uploads_meta.json");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Load metadata
let filesDB: FileRecord[] = [];
let albumsDB: AlbumRecord[] = [];

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      filesDB = data.files || [];
      albumsDB = data.albums || [];
    }
  } catch (err) {
    console.error("Error loading uploads_meta.json:", err);
    filesDB = [];
    albumsDB = [];
  }
}

function saveData() {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ files: filesDB, albums: albumsDB }, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.error("Error saving uploads_meta.json:", err);
  }
}

loadData();

// Cleanup expired Litterbox files periodically
function cleanupExpiredFiles() {
  const now = Date.now();
  let changed = false;
  filesDB = filesDB.filter((file) => {
    if (file.expiresAt && file.expiresAt <= now) {
      try {
        const filePath = path.join(UPLOAD_DIR, file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error("Failed to delete expired file:", file.filename, err);
      }
      changed = true;
      return false;
    }
    return true;
  });

  if (changed) {
    saveData();
  }
}

setInterval(cleanupExpiredFiles, 30000);

// Generate random short ID like catbox (6 characters)
function generateSlug(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".bin";
    const slug = generateSlug(6);
    cb(null, `${slug}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB max (Litterbox limit)
  },
});

// Helper for baseUrl
function getBaseUrl(req: express.Request): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  const host = req.get("x-forwarded-host") || req.get("host") || `localhost:${PORT}`;
  const proto = req.get("x-forwarded-proto") || req.protocol || "http";
  return `${proto}://${host}`;
}

// Duration string to milliseconds helper
function parseDuration(timeStr?: string): number | null {
  if (!timeStr) return null;
  switch (timeStr.toLowerCase()) {
    case "1h":
      return 1 * 60 * 60 * 1000;
    case "12h":
      return 12 * 60 * 60 * 1000;
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "72h":
      return 72 * 60 * 60 * 1000;
    default:
      return null;
  }
}

async function startServer() {
  const app = express();

  // Basic CORS headers so uploads and files can be shared anywhere
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // File serving endpoint: /files/:filename
  app.get("/files/:filename", (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send("File not found or has expired.");
    }

    // Check expiry
    const record = filesDB.find((f) => f.filename === filename);
    if (record && record.expiresAt && record.expiresAt <= Date.now()) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // ignore
      }
      return res.status(404).send("File has expired.");
    }

    // Inline content-disposition for previewing
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.sendFile(filePath);
  });

  // Short album share redirect: /c/:albumId
  app.get("/c/:albumId", (req, res, next) => {
    // If not API request, let SPA render it or handle redirect
    if (req.accepts("html")) {
      next();
    } else {
      const album = albumsDB.find((a) => a.id === req.params.albumId);
      if (!album) return res.status(404).json({ error: "Album not found" });
      res.json(album);
    }
  });

  // ----------------------------------------------------
  // Catbox Compatibility API: /user/api.php
  // Accepts:
  // - reqtype=fileupload, fileToUpload, userhash
  // - reqtype=urlupload, url, userhash
  // - reqtype=createalbum, title, desc, files
  // - reqtype=deletefiles, files, userhash
  // ----------------------------------------------------
  app.post(
    "/user/api.php",
    upload.fields([
      { name: "fileToUpload", maxCount: 1 },
      { name: "file", maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        const reqtype = req.body.reqtype;
        const userhash = req.body.userhash || "";
        const baseUrl = getBaseUrl(req);

        if (reqtype === "fileupload") {
          const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
          const uploadedFile = files?.fileToUpload?.[0] || files?.file?.[0];

          if (!uploadedFile) {
            return res.status(400).send("No file uploaded.");
          }

          const fileUrl = `${baseUrl}/files/${uploadedFile.filename}`;
          const record: FileRecord = {
            id: generateSlug(8),
            originalName: uploadedFile.originalname,
            filename: uploadedFile.filename,
            url: fileUrl,
            size: uploadedFile.size,
            mimetype: uploadedFile.mimetype,
            createdAt: Date.now(),
            expiresAt: null,
            mode: "catbox",
            userhash: userhash || undefined,
          };

          filesDB.unshift(record);
          saveData();

          // Catbox API returns the plain-text URL
          res.setHeader("Content-Type", "text/plain");
          return res.send(fileUrl);
        }

        if (reqtype === "urlupload") {
          const rawUrl = req.body.url;
          if (!rawUrl || typeof rawUrl !== "string") {
            return res.status(400).send("Missing or invalid URL.");
          }

          const response = await fetch(rawUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Catbox/1.0",
            },
          });

          if (!response.ok) {
            return res.status(400).send(`Failed to fetch URL: ${response.statusText}`);
          }

          const buffer = Buffer.from(await response.arrayBuffer());
          const parsedUrl = new URL(rawUrl);
          let ext = path.extname(parsedUrl.pathname).toLowerCase();
          if (!ext) {
            const contentType = response.headers.get("content-type") || "";
            if (contentType.includes("png")) ext = ".png";
            else if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = ".jpg";
            else if (contentType.includes("gif")) ext = ".gif";
            else if (contentType.includes("webp")) ext = ".webp";
            else if (contentType.includes("mp4")) ext = ".mp4";
            else if (contentType.includes("mp3")) ext = ".mp3";
            else ext = ".bin";
          }

          const slug = generateSlug(6);
          const filename = `${slug}${ext}`;
          const filePath = path.join(UPLOAD_DIR, filename);

          fs.writeFileSync(filePath, buffer);

          const fileUrl = `${baseUrl}/files/${filename}`;
          const record: FileRecord = {
            id: generateSlug(8),
            originalName: path.basename(parsedUrl.pathname) || filename,
            filename,
            url: fileUrl,
            size: buffer.length,
            mimetype: response.headers.get("content-type") || "application/octet-stream",
            createdAt: Date.now(),
            expiresAt: null,
            mode: "catbox",
            userhash: userhash || undefined,
          };

          filesDB.unshift(record);
          saveData();

          res.setHeader("Content-Type", "text/plain");
          return res.send(fileUrl);
        }

        if (reqtype === "createalbum") {
          const title = req.body.title || "Untitled Album";
          const desc = req.body.desc || "";
          const rawFiles = req.body.files || "";
          const fileList = rawFiles
            .split(/[\s\n,]+/)
            .map((s: string) => s.trim())
            .filter(Boolean);

          const albumId = generateSlug(6);
          const albumUrl = `${baseUrl}/c/${albumId}`;

          const album: AlbumRecord = {
            id: albumId,
            title,
            description: desc,
            files: fileList,
            createdAt: Date.now(),
            userhash: userhash || undefined,
          };

          albumsDB.unshift(album);
          saveData();

          res.setHeader("Content-Type", "text/plain");
          return res.send(albumUrl);
        }

        if (reqtype === "deletefiles") {
          const rawFiles = req.body.files || "";
          const targets = rawFiles
            .split(/[\s\n,]+/)
            .map((s: string) => path.basename(s.trim()))
            .filter(Boolean);

          filesDB = filesDB.filter((f) => {
            if (targets.includes(f.filename)) {
              try {
                const fp = path.join(UPLOAD_DIR, f.filename);
                if (fs.existsSync(fp)) fs.unlinkSync(fp);
              } catch (e) {
                console.error(e);
              }
              return false;
            }
            return true;
          });
          saveData();

          res.setHeader("Content-Type", "text/plain");
          return res.send("Files successfully deleted.");
        }

        return res.status(400).send("Invalid reqtype specified.");
      } catch (err: any) {
        console.error("Error in /user/api.php:", err);
        return res.status(500).send(`Server error: ${err.message}`);
      }
    }
  );

  // ----------------------------------------------------
  // Litterbox Compatibility API: /resources/internals/api.php
  // Accepts: reqtype=fileupload, time (1h, 12h, 24h, 72h), fileToUpload
  // ----------------------------------------------------
  app.post(
    "/resources/internals/api.php",
    upload.fields([
      { name: "fileToUpload", maxCount: 1 },
      { name: "file", maxCount: 1 },
    ]),
    (req, res) => {
      try {
        const reqtype = req.body.reqtype;
        const time = req.body.time || "24h";
        const duration = parseDuration(time) || 24 * 60 * 60 * 1000;
        const baseUrl = getBaseUrl(req);

        if (reqtype !== "fileupload") {
          return res.status(400).send("Invalid reqtype.");
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const uploadedFile = files?.fileToUpload?.[0] || files?.file?.[0];

        if (!uploadedFile) {
          return res.status(400).send("No file uploaded.");
        }

        const expiresAt = Date.now() + duration;
        const fileUrl = `${baseUrl}/files/${uploadedFile.filename}`;

        const record: FileRecord = {
          id: generateSlug(8),
          originalName: uploadedFile.originalname,
          filename: uploadedFile.filename,
          url: fileUrl,
          size: uploadedFile.size,
          mimetype: uploadedFile.mimetype,
          createdAt: Date.now(),
          expiresAt,
          mode: "litterbox",
        };

        filesDB.unshift(record);
        saveData();

        res.setHeader("Content-Type", "text/plain");
        return res.send(fileUrl);
      } catch (err: any) {
        console.error("Error in Litterbox api:", err);
        return res.status(500).send(`Server error: ${err.message}`);
      }
    }
  );

  // ----------------------------------------------------
  // Rich Web App API routes for UI
  // ----------------------------------------------------

  // Multi-file upload for Web UI
  app.post("/api/upload", upload.array("files", 20), (req, res) => {
    try {
      const mode = (req.body.mode || "catbox") as "catbox" | "litterbox";
      const time = req.body.time || "24h";
      const userhash = req.body.userhash || undefined;
      const baseUrl = getBaseUrl(req);

      const files = (req.files as Express.Multer.File[]) || [];
      if (!files.length) {
        return res.status(400).json({ error: "No files provided." });
      }

      let duration: number | null = null;
      if (mode === "litterbox") {
        duration = parseDuration(time) || 24 * 60 * 60 * 1000;
      }

      const results: FileRecord[] = files.map((f) => {
        const fileUrl = `${baseUrl}/files/${f.filename}`;
        const record: FileRecord = {
          id: generateSlug(8),
          originalName: f.originalname,
          filename: f.filename,
          url: fileUrl,
          size: f.size,
          mimetype: f.mimetype,
          createdAt: Date.now(),
          expiresAt: duration ? Date.now() + duration : null,
          mode,
          userhash,
        };
        filesDB.unshift(record);
        return record;
      });

      saveData();
      return res.json({ success: true, files: results });
    } catch (err: any) {
      console.error("Upload error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // URL upload for Web UI
  app.post("/api/url-upload", async (req, res) => {
    try {
      const { url, mode = "catbox", time = "24h", userhash } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "Please provide a valid URL." });
      }

      const baseUrl = getBaseUrl(req);
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Catbox/1.0",
        },
      });

      if (!response.ok) {
        return res.status(400).json({ error: `Failed to fetch URL: ${response.statusText}` });
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const parsedUrl = new URL(url);
      let ext = path.extname(parsedUrl.pathname).toLowerCase();
      if (!ext) {
        const ct = response.headers.get("content-type") || "";
        if (ct.includes("png")) ext = ".png";
        else if (ct.includes("jpeg") || ct.includes("jpg")) ext = ".jpg";
        else if (ct.includes("gif")) ext = ".gif";
        else if (ct.includes("webp")) ext = ".webp";
        else if (ct.includes("mp4")) ext = ".mp4";
        else if (ct.includes("mp3")) ext = ".mp3";
        else ext = ".bin";
      }

      const slug = generateSlug(6);
      const filename = `${slug}${ext}`;
      const filePath = path.join(UPLOAD_DIR, filename);

      fs.writeFileSync(filePath, buffer);

      let duration: number | null = null;
      if (mode === "litterbox") {
        duration = parseDuration(time) || 24 * 60 * 60 * 1000;
      }

      const fileUrl = `${baseUrl}/files/${filename}`;
      const record: FileRecord = {
        id: generateSlug(8),
        originalName: path.basename(parsedUrl.pathname) || filename,
        filename,
        url: fileUrl,
        size: buffer.length,
        mimetype: response.headers.get("content-type") || "application/octet-stream",
        createdAt: Date.now(),
        expiresAt: duration ? Date.now() + duration : null,
        mode,
        userhash,
      };

      filesDB.unshift(record);
      saveData();

      return res.json({ success: true, file: record });
    } catch (err: any) {
      console.error("URL upload error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Get recent files or files for userhash
  app.get("/api/files", (req, res) => {
    const userhash = req.query.userhash as string | undefined;
    if (userhash) {
      return res.json(filesDB.filter((f) => f.userhash === userhash));
    }
    // Return most recent 50
    return res.json(filesDB.slice(0, 50));
  });

  // Delete file
  app.delete("/api/files/:filename", (req, res) => {
    const filename = path.basename(req.params.filename);
    const index = filesDB.findIndex((f) => f.filename === filename);
    if (index !== -1) {
      filesDB.splice(index, 1);
      saveData();
    }
    try {
      const fp = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    } catch (e) {
      console.error(e);
    }
    return res.json({ success: true });
  });

  // Albums API
  app.post("/api/albums", (req, res) => {
    const { title, description, files, userhash } = req.body;
    if (!title || !files || !Array.isArray(files)) {
      return res.status(400).json({ error: "Title and files list are required." });
    }

    const baseUrl = getBaseUrl(req);
    const albumId = generateSlug(6);
    const album: AlbumRecord = {
      id: albumId,
      title,
      description: description || "",
      files,
      createdAt: Date.now(),
      userhash,
    };

    albumsDB.unshift(album);
    saveData();

    return res.json({
      success: true,
      album,
      url: `${baseUrl}/c/${albumId}`,
    });
  });

  app.get("/api/albums/:id", (req, res) => {
    const album = albumsDB.find((a) => a.id === req.params.id);
    if (!album) return res.status(404).json({ error: "Album not found" });

    // Attach file records
    const albumFiles = album.files
      .map((item) => {
        const fn = path.basename(item);
        return filesDB.find((f) => f.filename === fn || f.url === item);
      })
      .filter(Boolean);

    return res.json({ ...album, fileRecords: albumFiles });
  });

  // Stats / server info
  app.get("/api/stats", (req, res) => {
    const totalFiles = filesDB.length;
    const catboxFiles = filesDB.filter((f) => f.mode === "catbox").length;
    const litterboxFiles = filesDB.filter((f) => f.mode === "litterbox").length;
    const totalBytes = filesDB.reduce((acc, curr) => acc + (curr.size || 0), 0);

    return res.json({
      totalFiles,
      catboxFiles,
      litterboxFiles,
      totalBytes,
      albumsCount: albumsDB.length,
      baseUrl: getBaseUrl(req),
    });
  });

  // ShareX custom uploader configuration generator (.sxcu)
  app.get("/api/sharex", (req, res) => {
    const baseUrl = getBaseUrl(req);
    const userhash = (req.query.userhash as string) || "";
    const sxcuConfig = {
      Version: "15.0.0",
      Name: "Catbox (Self-Hosted Clone)",
      DestinationType: "ImageUploader, TextUploader, FileUploader",
      RequestMethod: "POST",
      RequestURL: `${baseUrl}/user/api.php`,
      Body: "MultipartFormData",
      Arguments: {
        reqtype: "fileupload",
        userhash: userhash,
      },
      FileFormName: "fileToUpload",
      URL: "$response$",
    };

    res.setHeader("Content-Disposition", 'attachment; filename="Catbox.sxcu"');
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(sxcuConfig, null, 2));
  });

  // ----------------------------------------------------
  // Vite middleware for development / Static in production
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Catbox server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
