// post.routes.js
const express = require("express");
const bcrypt = require("bcrypt"); // For hashing passwords (optional)
const PostModel = require("../Models/post.model");
const User = require("../Models/user.model");
const validate = require("../middlewares/validate");
const { createPostSchema } = require("../validators/post");

const router = express.Router();

/* ---------------- AUTH ROUTES ---------------- */

// Signup page
router.get("/signup", (req, res) => {
  res.render("signup");
});

// Handle signup
router.post("/signup", async (req, res) => {
  const { username, uuidPassword } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.send("User already exists");

    // Optional: hash password
    // const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, uuidPassword});
    await newUser.save();

    // Save user session
    req.session.user = newUser;
    res.redirect("/home");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Login page
router.get("/login", (req, res) => {
  res.render("login");
});

// Handle login
router.post("/login", async (req, res) => {
  const { username, uuidPassword } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) return res.send("User not found");
    if (user.uuidPassword !== uuidPassword) return res.send("Invalid Credentials");

    // Save user session
    req.session.user = user;
    res.redirect("/home");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect("/login");
  });
});

/* ---------------- POST ROUTES ---------------- */

// Create post page
router.get("/posts/new", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("posts/add", {user: req.session.user});
});

// Handle post creation
router.post("/posts", validate(createPostSchema), async (req, res) => {
  try {
    const { title, author, image, content } = req.body;
    await PostModel.create({ title, author, image, content });
    res.redirect("/posts/new");
  } catch (error) {
    res.render("error", { error });
  }
});

// Show all posts (home page)
router.get("/home", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  try {
    const posts = await PostModel.find().sort({ createdAt: -1 });
    res.render("home", { posts, user: req.session.user });
  } catch (error) {
    console.error(error);
    res.render("error", { error });
  }
});

// Show single post
router.get("/posts/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await PostModel.findById(postId).populate("comments");
    // res.render("posts/show", { post });
     res.render("posts/show", {
      post,
      user: req.session.user
    });
  } catch (error) {
    console.error(error);
    res.render("error", { error });
  }
});

// Edit post page
router.get("/posts/:id/edit", async (req, res) => {
  const postId = req.params.id;
  const post = await PostModel.findById(postId);
  res.render("posts/edit", { post , user: req.session.user});
});

// Update post
router.put("/posts/:id", async (req, res) => {
  const postId = req.params.id;
  const { title, author, image, content } = req.body;
try{
  const post = await PostModel.findById(postId);
  if (author) post.author = author;
  if (title) post.title = title;
  if (image) post.image = image;
  if (content) post.content = content;

  await post.save();
   // After update, fetch all posts again and render home
    const posts = await PostModel.find().sort({ createdAt: -1 });
    res.render("home", { posts, user: req.session.user });
  } catch (error) {
    console.error(error);
    res.render("error", { error });
  }
});

// Delete post
router.delete("/posts/:id", async (req, res) => {
  const postId = req.params.id;
  await PostModel.findByIdAndDelete(postId);
  res.redirect("/posts");
});

module.exports = router;
