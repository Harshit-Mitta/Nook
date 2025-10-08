const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  likes: { type: Number, default: 0 },
  image: { type: String, default: "" },
  comments:[{
    type: mongoose.Types.ObjectId,
    ref: "Comment"
  }],// New image field
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);
