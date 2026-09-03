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
  target?: "official" | "self_hosted";
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

// Master official userhash requested by owner: all uploads route to this account by default
export const DEFAULT_OFFICIAL_USERHASH = "7e283b658c3bbfb4bd46e510e";

export function resolveUserhash(provided?: string): string {
  if (provided && typeof provided === "string" && provided.trim().length > 0) {
    return provided.trim();
  }
  return DEFAULT_OFFICIAL_USERHASH;
}

interface UploadToCatboxResult {
  success: boolean;
  url?: string;
  error?: string;
  isAuthRequired?: boolean;
}

// Upload buffer directly to official Litterbox (https://litterbox.catbox.moe/resources/internals/api.php)
async function uploadToLitterboxOfficial(
  buffer: Buffer,
  filename: string,
  time: string = "24h"
): Promise<UploadToCatboxResult> {
  try {
    const formData = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append("time", time || "24h");
    const blob = new Blob([buffer]);
    formData.append("fileToUpload", blob, filename);

    const response = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
      method: "POST",
      body: formData,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const text = (await response.text()).trim();
    if (response.ok && text.startsWith("http")) {
      return { success: true, url: text };
    }
    return { success: false, error: text || `Litterbox error status ${response.status}` };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to connect to litterbox.catbox.moe" };
  }
}

// Upload buffer directly to official Catbox (https://catbox.moe/user/api.php)
async function uploadToCatboxOfficial(
  buffer: Buffer,
  filename: string,
  userhash?: string
): Promise<UploadToCatboxResult> {
  try {
    const formData = new FormData();
    formData.append("reqtype", "fileupload");
    if (userhash) {
      formData.append("userhash", userhash);
    }
    const blob = new Blob([buffer]);
    formData.append("fileToUpload", blob, filename);

    const response = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: formData,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const text = (await response.text()).trim();
    if (response.ok && text.startsWith("http")) {
      return { success: true, url: text };
    }

    if (text === "Invalid uploader" || text.includes("storage issues") || text === "Not signed in!") {
      return {
        success: false,
        error:
          text === "Not signed in!"
            ? "Catbox rejected this userhash. Please check your User Hash from catbox.moe/user/manage.php."
            : "Catbox.moe requires an official userhash for permanent uploads (anonymous uploads are currently paused by Catbox). Please enter your Catbox User Hash in settings, or use Litterbox mode for instant anonymous uploads!",
        isAuthRequired: true,
      };
    }

    return { success: false, error: text || `Catbox error status ${response.status}` };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to connect to catbox.moe" };
  }
}

// Create album on official Catbox
async function createAlbumOnCatboxOfficial(
  title: string,
  desc: string,
  files: string[],
  userhash?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append("reqtype", "createalbum");
    formData.append("title", title || "Untitled Album");
    formData.append("desc", desc || "");
    formData.append("files", files.map((f) => path.basename(f)).join(" "));
    if (userhash) {
      formData.append("userhash", userhash);
    }

    const response = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: formData,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const text = (await response.text()).trim();
    if (response.ok && text.startsWith("http")) {
      return { success: true, url: text };
    }
    return { success: false, error: text || `Catbox error status ${response.status}` };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to connect to catbox.moe" };
  }
}

// Delete files on official Catbox
async function deleteFilesFromCatboxOfficial(
  filenames: string[],
  userhash: string
): Promise<{ success: boolean; message: string }> {
  try {
    const formData = new FormData();
    formData.append("reqtype", "deletefiles");
    formData.append("userhash", userhash);
    formData.append("files", filenames.map((f) => path.basename(f)).join(" "));

    const response = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: formData,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const text = (await response.text()).trim();
    return { success: response.ok, message: text };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to connect to catbox.moe" };
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
        const target = (req.body.target || req.query.target || "official") as string;
        const baseUrl = getBaseUrl(req);

        if (reqtype === "fileupload") {
          const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
          const uploadedFile = files?.fileToUpload?.[0] || files?.file?.[0];

          if (!uploadedFile) {
            return res.status(400).send("No file uploaded.");
          }

          // Always use official Catbox with master/custom hash
          const effectiveHash = resolveUserhash(userhash);
          const buffer = fs.readFileSync(uploadedFile.path);
          const uploadRes = await uploadToCatboxOfficial(buffer, uploadedFile.originalname, effectiveHash);

          if (uploadRes.success && uploadRes.url) {
            try {
              fs.unlinkSync(uploadedFile.path);
            } catch {}

            const record: FileRecord = {
              id: generateSlug(8),
              originalName: uploadedFile.originalname,
              filename: path.basename(new URL(uploadRes.url).pathname),
              url: uploadRes.url,
              size: uploadedFile.size,
              mimetype: uploadedFile.mimetype,
              createdAt: Date.now(),
              expiresAt: null,
              mode: "catbox",
              target: "official",
              userhash: effectiveHash,
            };

            filesDB.unshift(record);
            saveData();

            res.setHeader("Content-Type", "text/plain");
            return res.send(uploadRes.url);
          }

          // If Catbox returned an error
          if (uploadRes.error) {
            res.setHeader("Content-Type", "text/plain");
            return res.status(400).send(uploadRes.error);
          }

          return res.status(500).send("Upload to Catbox failed.");
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

          const baseName = path.basename(parsedUrl.pathname) || `url_file${ext}`;
          const effectiveHash = resolveUserhash(userhash);

          const uploadRes = await uploadToCatboxOfficial(buffer, baseName, effectiveHash);
          if (uploadRes.success && uploadRes.url) {
            const record: FileRecord = {
              id: generateSlug(8),
              originalName: baseName,
              filename: path.basename(new URL(uploadRes.url).pathname),
              url: uploadRes.url,
              size: buffer.length,
              mimetype: response.headers.get("content-type") || "application/octet-stream",
              createdAt: Date.now(),
              expiresAt: null,
              mode: "catbox",
              target: "official",
              userhash: effectiveHash,
            };

            filesDB.unshift(record);
            saveData();

            res.setHeader("Content-Type", "text/plain");
            return res.send(uploadRes.url);
          }

          if (uploadRes.error) {
            res.setHeader("Content-Type", "text/plain");
            return res.status(400).send(uploadRes.error);
          }

          return res.status(500).send("URL Upload failed.");
        }

        if (reqtype === "createalbum") {
          const title = req.body.title || "Untitled Album";
          const desc = req.body.desc || "";
          const rawFiles = req.body.files || "";
          const fileList = rawFiles
            .split(/[\s\n,]+/)
            .map((s: string) => s.trim())
            .filter(Boolean);

          const effectiveHash = resolveUserhash(userhash);
          const officialAlbum = await createAlbumOnCatboxOfficial(title, desc, fileList, effectiveHash);
          if (officialAlbum.success && officialAlbum.url) {
            const albumId = path.basename(new URL(officialAlbum.url).pathname);
            const album: AlbumRecord = {
              id: albumId,
              title,
              description: desc,
              files: fileList,
              createdAt: Date.now(),
              userhash: effectiveHash,
            };
            albumsDB.unshift(album);
            saveData();

            res.setHeader("Content-Type", "text/plain");
            return res.send(officialAlbum.url);
          }

          res.setHeader("Content-Type", "text/plain");
          return res.status(400).send(officialAlbum.error || "Failed to create album on Catbox.");
        }

        if (reqtype === "deletefiles") {
          const rawFiles = req.body.files || "";
          const targets = rawFiles
            .split(/[\s\n,]+/)
            .map((s: string) => path.basename(s.trim()))
            .filter(Boolean);

          if (userhash) {
            await deleteFilesFromCatboxOfficial(targets, userhash);
          }

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
    async (req, res) => {
      try {
        const reqtype = req.body.reqtype;
        const time = req.body.time || "24h";
        const target = (req.body.target || req.query.target || "official") as string;
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

        if (target !== "local" && target !== "self_hosted") {
          const buffer = fs.readFileSync(uploadedFile.path);
          const uploadRes = await uploadToLitterboxOfficial(buffer, uploadedFile.originalname, time);

          if (uploadRes.success && uploadRes.url) {
            try {
              fs.unlinkSync(uploadedFile.path);
            } catch {}

            const record: FileRecord = {
              id: generateSlug(8),
              originalName: uploadedFile.originalname,
              filename: path.basename(new URL(uploadRes.url).pathname),
              url: uploadRes.url,
              size: uploadedFile.size,
              mimetype: uploadedFile.mimetype,
              createdAt: Date.now(),
              expiresAt: Date.now() + duration,
              mode: "litterbox",
              target: "official",
            };

            filesDB.unshift(record);
            saveData();

            res.setHeader("Content-Type", "text/plain");
            return res.send(uploadRes.url);
          }
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
          target: "self_hosted",
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
  app.post("/api/upload", upload.array("files", 20), async (req, res) => {
    try {
      const mode = (req.body.mode || "catbox") as "catbox" | "litterbox";
      const target = (req.body.target || "official") as "official" | "self_hosted";
      const time = req.body.time || "24h";
      const userhash = req.body.userhash || undefined;
      const autoFallback = req.body.autoFallback === "true" || req.body.autoFallback === true;
      const baseUrl = getBaseUrl(req);

      const files = (req.files as Express.Multer.File[]) || [];
      if (!files.length) {
        return res.status(400).json({ error: "No files provided." });
      }

      let duration: number | null = null;
      if (mode === "litterbox") {
        duration = parseDuration(time) || 24 * 60 * 60 * 1000;
      }

      const results: FileRecord[] = [];

      for (const f of files) {
        const fileBuffer = fs.readFileSync(f.path);
        let officialUrl: string | undefined;
        let activeMode: "catbox" | "litterbox" = mode;
        let fileExpiresAt: number | null = duration ? Date.now() + duration : null;
        const effectiveHash = resolveUserhash(userhash);

        if (mode === "litterbox") {
          const uploadRes = await uploadToLitterboxOfficial(fileBuffer, f.originalname, time);
          if (!uploadRes.success || !uploadRes.url) {
            return res.status(502).json({
              error: uploadRes.error || "Failed to upload to official Litterbox (litterbox.catbox.moe).",
            });
          }
          officialUrl = uploadRes.url;
        } else {
          // mode === "catbox" (Permanent) -> upload to official Catbox with effective userhash
          const uploadRes = await uploadToCatboxOfficial(fileBuffer, f.originalname, effectiveHash);
          if (uploadRes.success && uploadRes.url) {
            officialUrl = uploadRes.url;
            activeMode = "catbox";
            fileExpiresAt = null;
          } else {
            // If Catbox fails, fallback to Litterbox (72h)
            if (autoFallback) {
              const litterFallback = await uploadToLitterboxOfficial(fileBuffer, f.originalname, "72h");
              if (litterFallback.success && litterFallback.url) {
                officialUrl = litterFallback.url;
                activeMode = "litterbox";
                fileExpiresAt = Date.now() + 72 * 60 * 60 * 1000;
              } else {
                return res.status(400).json({
                  error: uploadRes.error || "Upload failed on official Catbox.",
                  isAuthRequired: uploadRes.isAuthRequired,
                });
              }
            } else {
              return res.status(400).json({
                error: uploadRes.error || "Upload failed on official Catbox.",
                isAuthRequired: uploadRes.isAuthRequired,
              });
            }
          }
        }

        // Clean up temp file on local disk
        try {
          fs.unlinkSync(f.path);
        } catch {}

        const record: FileRecord = {
          id: generateSlug(8),
          originalName: f.originalname,
          filename: path.basename(new URL(officialUrl).pathname),
          url: officialUrl,
          size: f.size,
          mimetype: f.mimetype,
          createdAt: Date.now(),
          expiresAt: fileExpiresAt,
          mode: activeMode,
          target: "official",
          userhash: effectiveHash,
        };

        filesDB.unshift(record);
        results.push(record);
      }

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
      const {
        url,
        mode = "catbox",
        time = "24h",
        userhash,
        autoFallback = true,
      } = req.body;

      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "Please provide a valid URL." });
      }

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

      const baseName = path.basename(parsedUrl.pathname) || `url_file${ext}`;
      let duration: number | null = null;
      if (mode === "litterbox") {
        duration = parseDuration(time) || 24 * 60 * 60 * 1000;
      }

      let officialUrl: string | undefined;
      let activeMode: "catbox" | "litterbox" = mode;
      let fileExpiresAt: number | null = duration ? Date.now() + duration : null;
      const effectiveHash = resolveUserhash(userhash);

      if (mode === "litterbox") {
        const uploadRes = await uploadToLitterboxOfficial(buffer, baseName, time);
        if (!uploadRes.success || !uploadRes.url) {
          return res
            .status(502)
            .json({ error: uploadRes.error || "Failed to upload to official Litterbox." });
        }
        officialUrl = uploadRes.url;
      } else {
        const uploadRes = await uploadToCatboxOfficial(buffer, baseName, effectiveHash);
        if (uploadRes.success && uploadRes.url) {
          officialUrl = uploadRes.url;
        } else if (autoFallback) {
          const fallbackRes = await uploadToLitterboxOfficial(buffer, baseName, "72h");
          if (fallbackRes.success && fallbackRes.url) {
            officialUrl = fallbackRes.url;
            activeMode = "litterbox";
            fileExpiresAt = Date.now() + 72 * 60 * 60 * 1000;
          } else {
            return res
              .status(400)
              .json({ error: uploadRes.error, isAuthRequired: uploadRes.isAuthRequired });
          }
        } else {
          return res
            .status(400)
            .json({ error: uploadRes.error, isAuthRequired: uploadRes.isAuthRequired });
        }
      }

      const record: FileRecord = {
        id: generateSlug(8),
        originalName: baseName,
        filename: path.basename(new URL(officialUrl).pathname),
        url: officialUrl,
        size: buffer.length,
        mimetype: response.headers.get("content-type") || "application/octet-stream",
        createdAt: Date.now(),
        expiresAt: fileExpiresAt,
        mode: activeMode,
        target: "official",
        userhash: effectiveHash,
      };

      filesDB.unshift(record);
      saveData();
      return res.json({ success: true, file: record });
    } catch (err: any) {
      console.error("URL upload error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Delete file endpoint (POST) for frontend convenience
  app.post("/api/files/delete", async (req, res) => {
    try {
      const { filename, userhash } = req.body;
      if (!filename) return res.status(400).json({ error: "Filename is required" });

      const fn = path.basename(filename);

      // If userhash provided and file was on Catbox, attempt deleting from official Catbox
      if (userhash) {
        await deleteFilesFromCatboxOfficial([fn], userhash);
      }

      filesDB = filesDB.filter((f) => f.filename !== fn && f.url !== filename);
      saveData();

      try {
        const fp = path.join(UPLOAD_DIR, fn);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      } catch (e) {
        console.error("Error removing local file:", e);
      }

      return res.json({ success: true });
    } catch (err: any) {
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

  // Config API - supplies the master default userhash
  app.get("/api/config", (_req, res) => {
    return res.json({
      defaultUserhash: DEFAULT_OFFICIAL_USERHASH,
      defaultUserhashMasked: `${DEFAULT_OFFICIAL_USERHASH.slice(0, 8)}...${DEFAULT_OFFICIAL_USERHASH.slice(-4)}`,
      masterAccountReady: true,
    });
  });

  // Albums API
  app.post("/api/albums", async (req, res) => {
    try {
      const { title, description, files, userhash } = req.body;
      if (!title || !files || !Array.isArray(files)) {
        return res.status(400).json({ error: "Title and files list are required." });
      }

      const effectiveHash = resolveUserhash(userhash);

      const officialRes = await createAlbumOnCatboxOfficial(
        title,
        description || "",
        files,
        effectiveHash
      );
      if (officialRes.success && officialRes.url) {
        const albumId = path.basename(new URL(officialRes.url).pathname);
        const album: AlbumRecord = {
          id: albumId,
          title,
          description: description || "",
          files,
          createdAt: Date.now(),
          userhash: effectiveHash,
        };
        albumsDB.unshift(album);
        saveData();

        return res.json({
          success: true,
          album,
          url: officialRes.url,
          isOfficial: true,
        });
      }

      return res.status(400).json({
        error: officialRes.error || "Failed to create album on official Catbox.",
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
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
