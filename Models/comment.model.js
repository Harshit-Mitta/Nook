const mongoose = require('mongoose');

// comment.model.js
const commentSchema = new mongoose.Schema({
  content: String,
  author: String, // username
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', commentSchema);
