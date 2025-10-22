// profile.routes.js
const express = require("express");
const bcrypt = require("bcrypt"); // For hashing passwords (optional)
const PostModel = require("../Models/post.model");
const User = require("../Models/user.model");
const validate = require("../middlewares/validate");
const { createPostSchema } = require("../validators/post");
const upload = require("../middlewares/upload");

const router = express.Router();
// Search routes
router.get("/search", async (req, res) => {
  try {
    const userId = req.session.user._id;
    if (!userId) return res.redirect("/login");

    const user = await User.findById(userId);
    res.render("search", { user, results: [] });
}
    catch (error) {
    console.error(error);
    res.render("error", { error });
  }
});

router.post("/search", async (req, res) => {
  try {
    const userId = req.session.user?._id;
    if (!userId) return res.redirect("/login");

    const searchQuery = req.body.search?.trim();

    // Find users whose usernames partially match the query (case-insensitive)
    const results = await User.find({
      username: { $regex: searchQuery, $options: "i" },
      _id: { $ne: userId }, // Exclude self
    });

    res.render("search", { user: req.session.user, results });
  } catch (error) {
    console.error(error);
    res.render("error", { error });
  }
});

module.exports = router;