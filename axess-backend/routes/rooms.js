const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const Room     = require('../models/Room');
const router   = express.Router();

// ── Multer storage: saves to /uploads/rooms/ ────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'rooms');
    fs.mkdirSync(dir, { recursive: true });   // create folder if it doesn't exist
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `room-dir-${Date.now()}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
             allowed.test(file.mimetype);
  ok ? cb(null, true) : cb(new Error('Only image files are allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB max

// ── GET all rooms ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── POST create room (with optional image) ──────────────────────────────────
router.post('/', upload.single('directionImage'), async (req, res) => {
  try {
    const roomData = { ...req.body };

    // Parse array & bool fields that arrive as strings from FormData
    if (typeof roomData.equipment === 'string') {
      try { roomData.equipment = JSON.parse(roomData.equipment); } catch { roomData.equipment = []; }
    }
    if (typeof roomData.isPrivate === 'string') {
      roomData.isPrivate = roomData.isPrivate === 'true';
    }
    if (roomData.capacity === '' || roomData.capacity === 'null') {
      roomData.capacity = null;
    }

    if (req.file) {
      roomData.directionImage = `/uploads/rooms/${req.file.filename}`;
    }

    const room = new Room(roomData);
    await room.save();
    res.status(201).json(room);
  } catch (err) {
    console.error('POST /rooms error:', err);
    res.status(500).json({ msg: err.message || 'Server error' });
  }
});

// ── PUT update room (with optional new image) ───────────────────────────────
router.put('/:id', upload.single('directionImage'), async (req, res) => {
  try {
    const roomData = { ...req.body };

    if (typeof roomData.equipment === 'string') {
      try { roomData.equipment = JSON.parse(roomData.equipment); } catch { roomData.equipment = []; }
    }
    if (typeof roomData.isPrivate === 'string') {
      roomData.isPrivate = roomData.isPrivate === 'true';
    }
    if (roomData.capacity === '' || roomData.capacity === 'null') {
      roomData.capacity = null;
    }

    // If a new image was uploaded, use it; otherwise keep whatever was already stored
    if (req.file) {
      roomData.directionImage = `/uploads/rooms/${req.file.filename}`;
    }

    const updated = await Room.findByIdAndUpdate(req.params.id, roomData, { new: true });
    if (!updated) return res.status(404).json({ msg: 'Room not found' });
    res.json(updated);
  } catch (err) {
    console.error('PUT /rooms/:id error:', err);
    res.status(500).json({ msg: err.message || 'Server error' });
  }
});

// ── DELETE room ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Room.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ msg: 'Room not found' });

    // Remove the direction image file if it exists
    if (deleted.directionImage) {
      const filePath = path.join(__dirname, '..', deleted.directionImage);
      fs.unlink(filePath, () => {}); // silent fail
    }

    res.json({ msg: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;