const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  uuidPassword: { type: String, required: true },
  profilePicture: { 
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String
  },
  followers: [{ type: mongoose.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Types.ObjectId, ref: "User" }],
  bio: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
