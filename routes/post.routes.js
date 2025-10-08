const express = require("express")
const PostModel = require("../Models/post.model");
const validate = require("../middlewares/validate");
const { createPostSchema } = require("../validators/post");

const router = express.Router();

router.get("/", async (req, res) => {
    try{
  const posts = await PostModel.find();
  res.render("home.ejs", { posts });
    }
    catch(error){
        res.render("error",{error:error});
    }

});

router.get("/posts/new", (req, res) => {
  res.render("posts/add.ejs");
});

router.post("/posts", validate(createPostSchema), async (req, res) => {
    try{
  const { title, author, image, content } = req.body;
  await PostModel.create({ title, author , image, content });
  res.redirect("/posts/new");
    }
    catch(error){
        res.render("error",{error:error});
    }

});

// get product
router.get("/posts/:id", async (req, res) => {
    try{
  const postId = req.params.id;
  // const product = await ProductModel.findById(productId);
  const post = await PostModel.findById(postId).populate("comments");
  // findOne({_id: productId})
  res.render("posts/show.ejs", { post });
    }
    catch (error){
        console.log(error);
        res.render("error",{error:error});
    }

});

router.get("/posts/:id/edit", async (req, res) => {
  const postId = req.params.id;
  const post = await PostModel.findById(postId);
  res.render("posts/edit.ejs", { post });
});

router.put("/posts/:id", async (req, res) => {
  const postId = req.params.id;
  const { title, author, image, content } = req.body;

  const post = await PostModel.findById(postId);
  if(author) post.author = author;
  if(title) post.title = title;
//   if(likes) post.likes = likes;
  if(image) post.image = image;
  if(content) post.content = content;

  await post.save();
  res.redirect("/posts");  
});

router.delete("/posts/:id", async (req, res) => {
  const postId = req.params.id;
  await PostModel.findByIdAndDelete(postId);
  res.redirect("/posts");
})

module.exports = router;