require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const methodOverride = require('method-override');
const ejsMate = require("ejs-mate");
const PORT = process.env.PORT;

const app = express();
app.engine("ejs", ejsMate);

connectDB();

app.use(express.urlencoded());
app.use(methodOverride('_method'));

// app.get("/", (req, res) => {
//   res.render("home.ejs");   //this is for home page
// });

const postRoutes = require("./routes/post.routes");      // all the paths related to posts
const commentRoutes = require("./routes/comments.routes");  // all the paths related to comments

app.use(postRoutes);
app.use(commentRoutes);

app.listen(PORT, () => {
  console.log("server is up at port", PORT);
});