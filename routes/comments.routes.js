
const PostModel = require("../Models/post.model");
const CommentModel = require("../Models/comment.model");
const validate = require("../middlewares/validate");
const { createCommentSchema } = require("../validators/comment");

const router = require("express").Router();

router.post("/posts/:postId/comments", validate(createCommentSchema), async (req, res) => {
try {
    // begin transaction
    const postId = req.params.postId;
    const { content } = req.body;

    const author=req.session.user.username;
  
    const comment = await CommentModel.create({ author, content });
    const post = await PostModel.findById(postId);
    post.comments.push(comment._id);
    await post.save();
  
    // commit transaction
  
    res.redirect(`/posts/${postId}`);
} catch (error) {
  // rollback transaction
    console.error(error);
    res.render("error", { error });
}
});

router.delete("/posts/:postId/comments/:commentId", async (req, res) => {
  try {
    if (!req.session.user) return res.redirect("/login");

    const { postId, commentId } = req.params;
    const comment = await CommentModel.findById(commentId);

    // Only comment author can delete their comment
    if (!comment || comment.author !== req.session.user.username) {
      return res.status(403).send("Unauthorized to delete this comment");
    }

    // Remove comment from post's comment array
    await PostModel.findByIdAndUpdate(postId, { $pull: { comments: commentId } });

    // Delete comment document
    await CommentModel.findByIdAndDelete(commentId);

    res.redirect(`/posts/${postId}`);
  } catch (error) {
    console.error(error);
    res.render("error", { error });
  }
});

module.exports = router;