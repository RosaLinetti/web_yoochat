const { encryptHill, decryptHill } = require("../Cryptography/Hill_Cipher");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/model");
const { pool } = require("../models/model"); 
const reactToPost = require("../models/model");



const hillKey = process.env.HILL_KEY;
if (!hillKey) throw new Error("HILL_KEY is not defined");

// -------------------- Registration --------------------
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: "Missing username, email, or password" });

    if (!userModel.isValidEmail(email))
      return res.status(400).json({ message: "Invalid email" });

    if (!userModel.isValidPassword(password))
      return res.status(400).json({ message: "Password must be at least 6 characters long and include uppercase, lowercase, and a digit" });

    const existingUsername = await userModel.findUserByUsername(username);
    if (existingUsername) return res.status(400).json({ message: "Username already taken" });

    const normalizedEmail = email.trim().toLowerCase();
    const existingEmail = await userModel.findUserByEmail(normalizedEmail);
    if (existingEmail) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const profileImagePath = req.file ? req.file.path : null;

    const user = await userModel.createUser(username, normalizedEmail, hashedPassword, profileImagePath);

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        profile_image: user.profile_image || null,
      },
    });
  } catch (err) {
    console.error("Register Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// -------------------- Login --------------------
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing email or password" });

    const normalizedEmail = email.trim().toLowerCase();
    const user = await userModel.findUserByEmail(normalizedEmail);
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ user_id: user.user_id }, process.env.secret_key, { expiresIn: "1h" });

    return res.json({
      message: "Login successful",
      token,
      userId: user.user_id,
      username: user.username,
      profileImage: user.profile_image,
      userEmail: user.email,
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// -------------------- Get User By Username --------------------
const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await userModel.findUserByUsername(username);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    console.error("GetUserByUsername Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// -------------------- Search Users --------------------
const searchUsers = async (req, res) => {
  try {
    const { q } = req.query; // Get search query from URL parameters
    
    // Validate search query
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        message: "Search query must be at least 2 characters long" 
      });
    }
    
    const searchTerm = q.trim();
    
    // Get current user ID if authenticated (optional - excludes current user from results)
    const currentUserId = req.user ? req.user.user_id : null;
    
    // Use the existing model function
    const users = await userModel.searchUsers(searchTerm, currentUserId);
    
    return res.status(200).json({
      success: true,
      message: users.length > 0 ? "Users found" : "No users found",
      users: users,
      count: users.length
    });
    
  } catch (err) {
    console.error("SearchUsers Controller Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    const sender_id = req.user.user_id;
    const { receiver_id } = req.body;
    if (!receiver_id) return res.status(400).json({ message: "Missing receiver_id" });
    if (sender_id === receiver_id) return res.status(400).json({ message: "Cannot send friend request to yourself" });

    const exists = await userModel.checkFriendshipExists(sender_id, receiver_id);
    if (exists) return res.status(400).json({ message: "Friendship already exists or pending" });

    // Model handles creating request AND notification
    await userModel.createFriendRequest(sender_id, receiver_id);

    return res.status(200).json({ message: "Friend request sent successfully" });
  } catch (err) {
    console.error("SendFriendRequest Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    const receiver_id = req.user.user_id;
    const { sender_id } = req.body;
    if (!sender_id) return res.status(400).json({ message: "Missing sender_id" });

    const pending = await userModel.checkPendingFriendRequest(sender_id, receiver_id);
    if (!pending) return res.status(400).json({ message: "No pending friend request found" });

    // Model handles accepting request AND notification
    await userModel.acceptFriendRequest(sender_id, receiver_id);

    return res.status(200).json({ message: "Friend request accepted" });
  } catch (err) {
    console.error("AcceptFriendRequest Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const declineFriendRequest = async (req, res) => {
  try {
    const receiver_id = req.user.user_id;
    const { sender_id } = req.body;
    if (!sender_id) return res.status(400).json({ message: "Missing sender_id" });

    const pending = await userModel.checkPendingFriendRequest(sender_id, receiver_id);
    if (!pending) return res.status(400).json({ message: "No pending friend request found to decline" });

    // Model handles declining request AND notification
    await userModel.declineFriendRequest(sender_id, receiver_id);

    return res.status(200).json({ message: "Friend request declined successfully" });
  } catch (err) {
    console.error("DeclineFriendRequest Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};


const cancelFriendRequest = async (req, res) => {
  try {
    const sender_id = req.user.user_id;
    const { receiver_id } = req.body;
    if (!receiver_id) return res.status(400).json({ message: "Missing receiver_id" });

    const pending = await userModel.checkPendingFriendRequest(sender_id, receiver_id);
    if (!pending) return res.status(400).json({ message: "No pending friend request found to cancel" });

    await userModel.cancelFriendRequest(sender_id, receiver_id);
    return res.status(200).json({ message: "Friend request cancelled successfully" });
  } catch (err) {
    console.error("CancelFriendRequest Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const unfriend = async (req, res) => {
  try {
    const user1_id = req.user.user_id;
    const { user2_id } = req.body;
    if (!user2_id) return res.status(400).json({ message: "Missing user2_id" });

    const exists = await userModel.checkFriendshipExists(user1_id, user2_id);
    if (!exists) return res.status(400).json({ message: "No friendship found to unfriend" });

    await userModel.unfriend(user1_id, user2_id);
    return res.status(200).json({ message: "Unfriended successfully" });
  } catch (err) {
    console.error("Unfriend Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const listFriends = async (req, res) => {
  try {
    const { username } = req.params;
    const user_id = await userModel.findUserIdByUsername(username);
    if (!user_id) return res.status(404).json({ message: "User not found" });

    const friends = await userModel.getFriendList(user_id);
    return res.status(200).json({ message: friends.length ? "Friends list fetched" : "No friends found", friends });
  } catch (err) {
    console.error("ListFriends Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const listPendingRequests = async (req, res) => {
  try {
    const receiver_id = req.user.user_id;
    const pending = await userModel.getPendingFriendRequests(receiver_id);
    return res.status(200).json({ pending_requests: pending });
  } catch (err) {
    console.error("ListPendingRequests Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const getSentRequests = async (req, res) => {
  try {
    const sender_id = req.user.user_id;
    const sent = await userModel.getSentFriendRequests(sender_id);
    return res.status(200).json({ sent_requests: sent });
  } catch (err) {
    console.error("GetSentRequests Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// -------------------- Messaging --------------------
const sendMessage = async (req, res) => {
  try {
    const sender_id = req.user.user_id;
    const { receiver_id, content, is_media = false } = req.body;
    if (!receiver_id || !content) return res.status(400).json({ message: "Missing receiver_id or content" });

    const friendship = await userModel.checkFriendshipExists(sender_id, receiver_id);
    if (!friendship) return res.status(403).json({ message: "You are not friends with this user" });

    const encryptedMessage = encryptHill(content, hillKey);
    await userModel.sendMessage(sender_id, receiver_id, encryptedMessage, is_media);

    return res.status(200).json({ message: "Message sent successfully" });
  } catch (err) {
    console.error("SendMessage Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const getConversation = async (req, res) => {
  try {
    const user1_id = req.user.user_id;
    const friend_id = parseInt(req.params.friend_id, 10);

    const friendship = await userModel.checkFriendshipExists(user1_id, friend_id);
    if (!friendship) return res.status(403).json({ message: "You are not friends with this user" });

    const conversation = await userModel.getConversation(user1_id, friend_id);
    const decryptedConversation = conversation.map((msg) => ({
      message_id: msg.message_id,
      sender_id: msg.sender_id,
      sender_name: msg.sender_name,
      receiver_id: msg.receiver_id,
      content: decryptHill(msg.content, hillKey),
      timestamp: msg.message_time,
    }));

    return res.status(200).json({ conversation: decryptedConversation });
  } catch (err) {
    console.error("GetConversation Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// -------------------- Block / Unblock --------------------
const blockUser = async (req, res) => {
  try {
    const blocker_id = req.user.user_id;
    const { blocked_id } = req.body;
    if (!blocked_id) return res.status(400).json({ message: "Missing blocked_id" });

    const blocked = await userModel.BlockedUser.block(blocker_id, blocked_id);
    return res.status(200).json({ message: "User blocked successfully", blocked });
  } catch (err) {
    if (err.message === "Cannot block yourself" || err.message === "User already blocked") {
      return res.status(400).json({ message: err.message });
    }
    console.error("blockUser Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const unblockUser = async (req, res) => {
  try {
    const blocker_id = req.user.user_id;
    const { blocked_id } = req.body;
    if (!blocked_id) return res.status(400).json({ message: "Missing blocked_id" });

    const unblocked = await userModel.BlockedUser.unblock(blocker_id, blocked_id);
    return res.status(200).json({ message: "User unblocked successfully", unblocked });
  } catch (err) {
    if (err.message === "Blocked user not found") {
      return res.status(404).json({ message: err.message });
    }
    console.error("unblockUser Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const listBlockedUsers = async (req, res) => {
  try {
    const blocker_id = req.user.user_id;
    const blockedUsers = await userModel.BlockedUser.listByUser(blocker_id);
    const count = blockedUsers.length;

    return res.status(200).json({ success: true, blockedUsers, count });
  } catch (err) {
    console.error("listBlockedUsers Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};



const updateUserProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id; // from JWT
    const { username } = req.body;
    const profileImagePath = req.file ? req.file.path : null;

    // Optional: validate username (example: 3-20 chars)
    if (username && (username.length < 3 || username.length > 20)) {
      return res.status(400).json({ message: "Username must be 3-20 characters long" });
    }

    const updatedUser = await userModel.updateUser(user_id, username, profileImagePath);

    return res.status(200).json({
      message: "Profile updated successfully!",
      user: updatedUser,
    });
  } catch (err) {
    console.error("UpdateUserProfile Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ---------------------- Get My Profile ----------------------
const getMyProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const user = await userModel.findUserById(user_id);
    
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      profileImage: user.profile_image || null,
    });
  } catch (err) {
    console.error("GetMyProfile Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};
// Create a post
const createPost = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { caption } = req.body;
    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({ message: "Please upload at least one image." });
    }

    // Insert post
    const postResult = await pool.query(
      "INSERT INTO posts (user_id, caption) VALUES ($1, $2) RETURNING *",
      [user_id, caption || ""]
    );
    const post = postResult.rows[0];

    // Insert images
    for (let file of files) {
      await pool.query(
        "INSERT INTO post_images (post_id, image_url) VALUES ($1, $2)",
        [post.post_id, file.path]
      );
    }

    return res.status(201).json({ message: "Post created successfully", post_id: post.post_id });
  } catch (err) {
    console.error("createPost Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const getFriendsPosts = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    // Get friend IDs
    const friendsResult = await pool.query(
      `SELECT CASE
          WHEN user1_id = $1 THEN user2_id
          ELSE user1_id
        END AS friend_id
       FROM friendship
       WHERE (user1_id = $1 OR user2_id = $1) AND status = 'accepted'`,
      [user_id]
    );
    const friendIds = friendsResult.rows.map(r => r.friend_id);

    if (friendIds.length === 0) return res.json({ posts: [] });

    // Get posts along with whether current user liked
    const postsResult = await pool.query(
      `SELECT p.post_id, p.user_id, p.caption, p.created_at, u.username, u.profile_image,
              EXISTS (
                SELECT 1 FROM post_reactions pr
                WHERE pr.post_id = p.post_id AND pr.user_id = $2
              ) AS "userLiked"
       FROM posts p
       JOIN users u ON p.user_id = u.user_id
       WHERE p.user_id = ANY($1::int[])
       ORDER BY p.created_at DESC`,
      [friendIds, user_id]
    );

    const posts = postsResult.rows;

    // Add images & reactions count
    for (let post of posts) {
      const imagesResult = await pool.query(
        "SELECT image_url FROM post_images WHERE post_id = $1",
        [post.post_id]
      );
      post.images = imagesResult.rows.map(r => r.image_url);

      const reactionsResult = await pool.query(
        "SELECT COUNT(*) AS count FROM post_reactions WHERE post_id = $1",
        [post.post_id]
      );
      post.reactions = reactionsResult.rows[0] ? Array(parseInt(reactionsResult.rows[0].count)).fill({}) : [];
    }

    return res.json({ posts });
  } catch (err) {
    console.error("getFriendsPosts Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


// Get a single post by ID
const getPostById = async (req, res) => {
  try {
    const { post_id } = req.params;

    const postResult = await pool.query(
      `SELECT p.post_id, p.user_id, p.caption, p.created_at, u.username, u.profile_image
       FROM posts p
       JOIN users u ON p.user_id = u.user_id
       WHERE p.post_id = $1`,
      [post_id]
    );

    if (postResult.rows.length === 0) return res.status(404).json({ message: "Post not found" });

    const post = postResult.rows[0];

    const imagesResult = await pool.query(
      "SELECT image_url FROM post_images WHERE post_id = $1",
      [post.post_id]
    );
    post.images = imagesResult.rows.map(r => r.image_url);

    const reactionsResult = await pool.query(
      "SELECT reaction_type, COUNT(*) AS count FROM post_reactions WHERE post_id = $1 GROUP BY reaction_type",
      [post.post_id]
    );
    post.reactions = reactionsResult.rows;

    return res.json({ post });
  } catch (err) {
    console.error("getPostById Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const getMyPosts = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const postsResult = await pool.query(
      `SELECT p.post_id, p.caption, p.created_at,
              EXISTS (
                SELECT 1 FROM post_reactions pr
                WHERE pr.post_id = p.post_id AND pr.user_id = $1
              ) AS "userLiked"
       FROM posts p
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [user_id]
    );

    const posts = postsResult.rows;

    for (let post of posts) {
      const imagesResult = await pool.query(
        "SELECT image_url FROM post_images WHERE post_id = $1",
        [post.post_id]
      );
      post.images = imagesResult.rows.map(r => r.image_url);

      const reactionsResult = await pool.query(
        "SELECT COUNT(*) AS count FROM post_reactions WHERE post_id = $1",
        [post.post_id]
      );
      post.reactions = reactionsResult.rows[0] ? Array(parseInt(reactionsResult.rows[0].count)).fill({}) : [];
    }

    return res.json({ posts });
  } catch (err) {
    console.error("getMyPosts Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};



const reactToPostController = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { post_id } = req.body;
    if (!post_id) return res.status(400).json({ message: "Missing post_id" });

    // Call model function
    const result = await userModel.reactToPost(user_id, post_id);

    // Get total likes
    const reactionsResult = await userModel.pool.query(
      "SELECT COUNT(*) AS count FROM post_reactions WHERE post_id = $1",
      [post_id]
    );

    return res.json({
      liked: result.liked,
      totalLikes: parseInt(reactionsResult.rows[0].count)
    });
  } catch (err) {
    console.error("reactToPostController Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};



const getNotifications = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const result = await pool.query(
      `SELECT n.notification_id,
              n.type,
              n.actor_id AS sender_id,
              u.username AS sender_username,
              u.profile_image AS sender_profile_image,
              n.post_id,
              n.message,
              n.created_at
       FROM notifications n
       JOIN users u ON n.actor_id = u.user_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC`,
      [userId]
    );

    res.json({ notifications: result.rows });
  } catch (err) {
    console.error("getNotifications Error:", err);
    res.status(500).json({ message: "Server error fetching notifications" });
  }
};




module.exports = {
  register,
  login,
  getUserByUsername,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  unfriend,
  listFriends,
  listPendingRequests,
  getSentRequests,
  sendMessage,
  getConversation,
  blockUser,
  unblockUser,
  listBlockedUsers,
  updateUserProfile,
  getMyProfile,
  createPost,
  getFriendsPosts,
  getPostById,
  getMyPosts,
  reactToPost,
  reactToPostController,
  getNotifications,
};
