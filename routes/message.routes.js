const express = require("express");
const Message = require("../Models/message.model");
const validate = require("../middlewares/validate");
const { messageSchema } = require("../validators/message");

const router = express.Router();

// 📥 View all messages
router.get("/messages", async (req, res) => {
  try {
    console.log("Message import check:", Message);

    const messages = await Message.find()
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ createdAt: -1 });

    res.render("messages", { messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).render("error", { 
      message: "Failed to load messages. Please try again later.", 
      error 
    });
  }
});


// 📨 Message form
router.get("messages/send/:receiverId", (req, res) => {
  res.render("sendMessage", { receiverId: req.params.receiverId });
});

// 📝 Send message (validated)
router.post("messages/send/:receiverId", validate(messageSchema), async (req, res) => {
  const { body } = req.body;

  // You might replace sender/receiver with actual logged-in user later
  const newMessage = new Message({
    sender: req.session.user._id, // For now, use ?senderId=USER_ID in URL (or replace this when you have sessions)
    receiver: req.params.receiverId,
    body
  });

  await newMessage.save();
  res.redirect("/messages");
});

module.exports = router;