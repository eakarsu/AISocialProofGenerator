const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads/videos');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Only video files are allowed'));
  }
});

// POST /api/video-testimonials/upload - upload video file
router.post('/upload', authMiddleware, requireRole('admin', 'editor'), upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No video file uploaded' });

    const { customer_name, company, role, original_transcript, tags, rating } = req.body;
    const videoUrl = `/uploads/videos/${req.file.filename}`;

    const result = await pool.query(
      `INSERT INTO video_testimonials (customer_name, company, role, video_url, original_transcript, tags, rating, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        customer_name || 'Unknown',
        company || '',
        role || '',
        videoUrl,
        original_transcript || '',
        tags || null,
        rating || 5,
        'draft'
      ]
    );

    res.status(201).json({
      message: 'Video uploaded successfully',
      video_testimonial: result.rows[0],
      file: {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: videoUrl
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/video-testimonials/stream/:filename - stream video
router.get('/stream/:filename', authMiddleware, (req, res) => {
  const filePath = path.join(UPLOADS_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Video not found' });

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

module.exports = router;
