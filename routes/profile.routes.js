// profile.routes.js
const express = require("express");
const bcrypt = require("bcrypt"); // For hashing passwords (optional)
const PostModel = require("../Models/post.model");
const User = require("../Models/user.model");
const validate = require("../middlewares/validate");
const { createPostSchema } = require("../validators/post");
const upload = require("../middlewares/upload");

const router = express.Router();


// Profile routes
router.get("/profile/", async (req, res) => {
  try {
    const userId = req.session.user._id;
    if (!userId) return res.redirect("/login");

    const user = await User.findById(userId);
    const posts = await PostModel.find({ author: user.username }).sort({ createdAt: -1 });

    res.render("profile", { user, posts });
  } catch (error) {
    console.error(error);
    res.render("error", { error });
  }
});

// View another user's profile by ID
router.get("/profile/:id", async (req, res) => {
  try {
    const profileuserId = req.params.id;
    const user=req.session.user;
    const profileuser = await User.findById(profileuserId);
    if (!profileuser) return res.status(404).render("error", { error: "User not found" });

    const isFollowing = user.following?.includes(profileuser._id.toString());

    const posts = await PostModel.find({ author: profileuser.username }).sort({ createdAt: -1 });

    res.render("searchedprofile", { profileuser, posts, user , isFollowing});
  } catch (error) {
    console.error(error);
    res.render("error", { error });
  }
});

// router.post("/profile/follow/:id", async(req,res)=>{
//    try {
//     const profileuserId = req.params.id;
//     const userId = req.session.user._id;

//     const user = await User.findById(userId);
//     const profileuser = await User.findById(profileuserId);
//   //  const isFollowing= user.following?.includes(profileuser._id.toString());
//    // Fix: compare ObjectIds as strings
//     const isFollowing = user.following.some(
//       (id) => id.toString() === profileuserId.toString()
//     );

//     if (isFollowing) {
//       // --- UNFOLLOW ---
//       user.following = user.following.filter(
//         (id) => id.toString() !== profileuserId
//       );
//       profileuser.followers = profileuser.followers.filter(
//         (id) => id.toString() !== user._id
//       );
//     } else {
//       // --- FOLLOW ---
//       user.following.push(profileuserId);
//       profileuser.followers.push(userId);
//     }
//     await user.save();
//     await profileuser.save();

//     res.json({ success: true,
//       isFollowing: !isFollowing,
//       followersCount: profileuser.followers.length
//     });
//   } catch (error) {
//     console.error(error);
//     res.render("error", { error });
//   }
// });
router.post("/profile/follow/:id", async (req, res) => {
  try {
    const profileuserId = req.params.id;
    const userId = req.session.user._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }

    const user = await User.findById(userId);
    const profileuser = await User.findById(profileuserId);

    if (!user || !profileuser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Convert both sides to string to ensure match
    const isFollowing = user.following.map(id => id.toString()).includes(profileuserId.toString());

    if (isFollowing) {
      // ✅ UNFOLLOW LOGIC
      user.following = user.following.filter(
        (id) => id.toString() !== profileuserId.toString()
      );
      profileuser.followers = profileuser.followers.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // ✅ FOLLOW LOGIC
      if (!user.following.includes(profileuserId)) {
        user.following.push(profileuserId);
      }
      if (!profileuser.followers.includes(userId)) {
        profileuser.followers.push(userId);
      }
    }

    // Save both users
    await Promise.all([user.save(), profileuser.save()]);

    // Debugging — print actual counts to verify
    // console.log({
    //   profileUsername: profileuser.username,
    //   followers: profileuser.followers.length,
    //   following: user.following.length,
    // });

    // ✅ Return only correct followersCount for profileuser
    return res.json({
      success: true,
      isFollowing: !isFollowing,
      followersCount: profileuser.followers.length,
    });

  } catch (error) {
    console.error("Follow/Unfollow Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


// Upload profile picture
router.post("/profile/picture", upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const userId = req.session.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (req.file) {
      // Update profile picture
      user.profilePicture = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`
      };
    } else {
      // Remove profile picture
      user.profilePicture = undefined;
    }

    await user.save();

    res.json({ 
      success: true, 
      profilePicture: user.profilePicture?.path || null 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// // Follow/Unfollow user
// router.post("/follow/:userId", async (req, res) => {
//   try {
//     if (!req.session.user) {
//       return res.status(401).json({ error: "User not authenticated" });
//     }

//     const currentUserId = req.session.user._id;
//     const targetUserId = req.params.userId;

//     if (currentUserId === targetUserId) {
//       return res.status(400).json({ error: "Cannot follow yourself" });
//     }

//     const currentUser = await User.findById(currentUserId);
//     const targetUser = await User.findById(targetUserId);

//     if (!currentUser || !targetUser) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     const isFollowing = currentUser.following.includes(targetUserId);

//     if (isFollowing) {
//       // Unfollow
//       currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
//       targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);
//     } else {
//       // Follow
//       currentUser.following.push(targetUserId);
//       targetUser.followers.push(currentUserId);
//     }

//     await currentUser.save();
//     await targetUser.save();

//     res.json({ 
//       success: true, 
//       isFollowing: !isFollowing,
//       followersCount: targetUser.followers.length 
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// Update bio
router.post("/update-bio", async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).send("User not authenticated");
    }

    const userId = req.session.user._id;
    const { bio } = req.body;

    if (!bio) {
      return res.status(400).send("Bio cannot be empty");
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    user.bio = bio;
    await user.save();

    // Redirect back to profile page after update
    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});





module.exports = router;