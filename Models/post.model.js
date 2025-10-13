const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Types.ObjectId, ref: "User" }], // Track users who liked
  image: { type: String, default: "" }, // Keep for backward compatibility
  media: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    isVideo: { type: Boolean, default: false }
  }], // New media array for multiple files
  comments:[{
    type: mongoose.Types.ObjectId,
    ref: "Comment"
  }],
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);
