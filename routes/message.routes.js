const express = require("express");
const Message = require("../Models/message.model");
const User = require("../Models/user.model"); // assuming you have a user model
const router = express.Router();

// 📥 All messages page (acts like "inbox" + search)
router.get("/messages", async (req, res) => {
  try {
    const currentUserId = req.session?.user?._id; // use your login session
    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }]
    })
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ createdAt: -1 });

    res.render("messages", { messages, chatUser: null, chatMessages: [], searchResults: [] });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).render("error", { 
      message: "Failed to load messages.", 
      error 
    });
  }
});


// 🔍 Search users to start chat
// 🔍 Search users to start chat
router.get("/messages/search", async (req, res) => {
  try {
    const query = req.query.q;
    console.log("Search query received:", query);

    if (!query) return res.redirect("/messages");
    const users = await User.find({
      username: { $regex: query, $options: "i" }
    }).select("username _id");

    console.log("Found users:", users);

    res.render("messages", { 
      messages: [], 
      chatUser: null, 
      chatMessages: [], 
      searchResults: users, 
      query 
    });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).render("error", { 
      message: "Search failed.", 
      error 
    });
  }
});


// 💬 Open chat with a specific user
router.get("/messages/chat/:receiverId", async (req, res) => {
  try {
    const currentUserId = req.session?.user?._id; 
    const receiverId = req.params.receiverId;

    const chatMessages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: receiverId },
        { sender: receiverId, receiver: currentUserId }
      ]
    })
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ createdAt: 1 });

    const chatUser = await User.findById(receiverId).select("name email");

    res.render("messages", { messages: [], chatUser, chatMessages, searchResults: [] });
  } catch (error) {
    console.error("Error loading chat:", error);
    res.status(500).render("error", { 
      message: "Failed to load chat.", 
      error 
    });
  }
});

// 📝 Send a message to a user
router.post("/messages/send/:receiverId", async (req, res) => {
  try {
    const senderId = req.session?.user?._id; 
    const receiverId = req.params.receiverId;
    const { body } = req.body;

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      body
    });

    await newMessage.save();
    res.redirect(`/messages/chat/${receiverId}`);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).render("error", { message: "Failed to send message.", error });
  }
});

module.exports = router;
