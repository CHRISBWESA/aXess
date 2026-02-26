const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  code:         { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['available', 'occupied', 'requested', 'maintenance'],
    default: 'available',
    required: true
  },
  floorLabel:      String,
  direction:       String,                          // text description of the location
  directionImage:  { type: String, default: '' },   // ← stored filename of the route image
  coordinator:     { type: String, default: '' },
  capacity:        { type: Number, default: null },
  equipment:       { type: [String], default: [] },
  isPrivate:       { type: Boolean, default: false },
  createdAt:       { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);