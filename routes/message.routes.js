const express = require("express");
const Message = require("../Models/message.model");
const User = require("../Models/user.model"); // assuming you have a user model
const router = express.Router();

// 📥 All messages page (acts like "inbox" + search)
router.get("/messages", async (req, res) => {
  try {
    const currentUserId = req.session?.user?._id;

    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }]
    })
      .populate("sender", "username")
      .populate("receiver", "username")
      .sort({ createdAt: -1 });

    const chatUsersMap = new Map();

    messages.forEach(msg => {
      const chatUser =
        msg.sender._id.toString() === currentUserId.toString()
          ? msg.receiver
          : msg.sender;

      if (!chatUsersMap.has(chatUser._id.toString())) {
        chatUsersMap.set(chatUser._id.toString(), {
          user: chatUser,
          lastMessage: msg.body || "", // ✅ fixed
        });
      }
    });

    const chatList = Array.from(chatUsersMap.values());

    res.render("messages", { 
      messages, 
      chatList, 
      chatUser: null, 
      chatMessages: [], 
      searchResults: [] 
    });

  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).render("error", { message: "Failed to load messages.", error });
  }
});



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

    // 📨 Fetch all messages between both users
    const chatMessages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: receiverId },
        { sender: receiverId, receiver: currentUserId }
      ]
    })
      .populate("sender", "username")
      .populate("receiver", "username")
      .sort({ createdAt: 1 });

    // 🧑‍🤝‍🧑 Get the chat partner
    const chatUser = await User.findById(receiverId).select("username");

    // 🧾 Build sidebar chat list again
    const allMessages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }]
    })
      .populate("sender", "username")
      .populate("receiver", "username")
      .sort({ createdAt: -1 });

    const chatUsersMap = new Map();

    allMessages.forEach(msg => {
      const chatUserObj =
        msg.sender._id.toString() === currentUserId.toString()
          ? msg.receiver
          : msg.sender;

      if (!chatUsersMap.has(chatUserObj._id.toString())) {
        chatUsersMap.set(chatUserObj._id.toString(), {
          user: chatUserObj,
          lastMessage: msg.body || "",
        });
      }
    });

    const chatList = Array.from(chatUsersMap.values());

    // ✅ Pass chatList to EJS now
    res.render("messages", { 
      messages: [], 
      chatList, 
      chatUser, 
      chatMessages, 
      searchResults: [] 
    });

  } catch (error) {
    console.error("Error loading chat:", error);
    res.status(500).render("error", { 
      message: "Failed to load chat.", 
      error 
    });
  }
});


// ---------------- SEND MESSAGE ----------------
router.post("/messages/send/:receiverId", async (req, res) => {
  try {
    const senderId = req.session?.user?._id;
    const { receiverId } = req.params;
    const { body } = req.body;

    if (!senderId) {
      return res.status(401).send("You must be logged in to send messages.");
    }

    if (!body || !receiverId) {
      return res.status(400).send("Missing message content or receiver ID.");
    }

    // Save the message
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      body,
      createdAt: new Date()
    });

    await newMessage.save();

    // Redirect back to the chat with that user
   res.redirect(`/messages/chat/${receiverId}`);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).render("error", { message: "Failed to send message.", error });
  }
});

module.exports = router;