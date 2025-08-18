const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // In a real app, hash this!
  role: { type: String, enum: ['teacher', 'student'], required: true },
  status: { type: String, enum: ['pending', 'active', 'rejected'], default: 'active' }
});

module.exports = mongoose.model('User', userSchema);
