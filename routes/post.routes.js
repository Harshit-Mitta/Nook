// post.routes.js
const express = require("express");
const bcrypt = require("bcrypt"); // For hashing passwords (optional)
const PostModel = require("../Models/post.model");
const User = require("../Models/user.model");
const validate = require("../middlewares/validate");
const { createPostSchema } = require("../validators/post");
const upload = require("../middlewares/upload");

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

// Handle post creation with media upload
router.post("/posts", (req, res, next) => {
  upload.array('media', 10)(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.render("error", { error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    // Manual validation since multer needs to run first
    const { title, author, content, image } = req.body;
    
    if (!title || !author || !content) {
      return res.render("error", { error: "Title, author, and content are required" });
    }
    
    // Process uploaded files
    const mediaFiles = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        mediaFiles.push({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: `/uploads/${file.filename}`,
          isVideo: file.mimetype.startsWith('video/')
        });
      });
    }
    
    // Keep backward compatibility for single image
    const singleImage = image || (mediaFiles.length > 0 ? mediaFiles[0].path : "");
    
    await PostModel.create({ 
      title, 
      author, 
      image: singleImage,
      media: mediaFiles,
      content 
    });
    res.redirect("/home");
  } catch (error) {
    console.error(error);
    res.render("error", { error });
  }
});

// Show all posts (home page)
router.get("/home", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  try {
    const posts = await PostModel.find().sort({ createdAt: -1 });
    
    // Add user like status to each post
    const postsWithLikeStatus = posts.map(post => {
      const postObj = post.toObject();
      postObj.userLiked = post.likedBy.includes(req.session.user._id);
      return postObj;
    });
    
    res.render("home", { posts: postsWithLikeStatus, user: req.session.user });
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
    
    // Add user like status
    const postObj = post.toObject();
    postObj.userLiked = req.session.user ? post.likedBy.includes(req.session.user._id) : false;
    
    res.render("posts/show", {
      post: postObj,
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
  try {
    const postId = req.params.id;
    const { title, author, image, content } = req.body;
    
    const post = await PostModel.findById(postId);
    if (author) post.author = author;
    if (title) post.title = title;
    if (image) post.image = image;
    if (content) post.content = content;

    await post.save();
    
    // After update, fetch all posts again and render home
    const posts = await PostModel.find().sort({ createdAt: -1 });
    
    // Add user like status to each post
    const postsWithLikeStatus = posts.map(post => {
      const postObj = post.toObject();
      postObj.userLiked = post.likedBy.includes(req.session.user._id);
      return postObj;
    });
    
    res.render("home", { posts: postsWithLikeStatus, user: req.session.user });
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

// Like/Unlike post with user tracking
router.post("/posts/:id/like", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const postId = req.params.id;
    const userId = req.session.user._id;
    const post = await PostModel.findById(postId);
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    // Check if user already liked the post
    const userLiked = post.likedBy.includes(userId);
    
    if (userLiked) {
      // Unlike: remove user from likedBy array
      post.likedBy = post.likedBy.filter(id => id.toString() !== userId.toString());
      post.likes = Math.max(0, post.likes - 1);
    } else {
      // Like: add user to likedBy array
      post.likedBy.push(userId);
      post.likes = (post.likes || 0) + 1;
    }
    
    await post.save();
    
    res.json({ 
      liked: !userLiked,
      likeCount: post.likes 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
