const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    default: null
  },
  twoFAMethod: {
    type: [String], // puede ser ['qr', 'email']
    enum: ['qr', 'email'],
    default: ['qr', 'email']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
