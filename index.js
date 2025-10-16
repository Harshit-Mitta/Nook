require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const path = require("path");

const PORT = process.env.PORT || 5000;

const app = express();

// Connect to MongoDB
connectDB();

// ---------------- MIDDLEWARE ----------------
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public"))); // for CSS, images, JS

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret_key",
    resave: false,
    saveUninitialized: true,
  })
);

// Make `user` available in all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ---------------- ROUTES ----------------
const postRoutes = require("./routes/post.routes");      // login, signup, posts
const commentRoutes = require("./routes/comments.routes");  // optional comments
const profileRoutes = require("./routes/profile.routes"); // user profile
const searchRoutes = require("./routes/search.routes"); // searching different users

// Mount routers
app.use("/", postRoutes);       // handles /login, /signup, /home, /posts, etc.
app.use("/", commentRoutes);    // if you have comments routes
app.use("/", profileRoutes);    // handles /profile page
app.use("/",searchRoutes);    // handles /search page

// Default route (optional)
app.get("/", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.redirect("/home"); // redirect to main home page
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
