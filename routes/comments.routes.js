
const PostModel = require("../Models/post.model");
const CommentModel = require("../Models/comment.model");
const validate = require("../middlewares/validate");
const { createCommentSchema } = require("../validators/comment");

const router = require("express").Router();

router.post("/posts/:postId/comments", validate(createCommentSchema), async (req, res) => {
try {
    // begin transaction
    const postId = req.params.postId;
    const { author, text } = req.body;
  
    const comment = await CommentModel.create({ author, text });
    const post = await PostModel.findById(postId);
    post.comments.push(comment._id);
    await post.save();
  
    // commit transaction
  
    res.redirect(`/posts/${postId}`);
} catch (error) {
  // rollback transaction
}
});

module.exports = router;