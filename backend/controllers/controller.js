const { encryptHill, decryptHill } = require("../Cryptography/Hill_Cipher");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/model");



const hillKey = process.env.HILL_KEY;
if (!hillKey) throw new Error("HILL_KEY is not defined in environment variables");

// ---------------------- Registration ----------------------
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: "Missing username, email, or password" });

    if (!userModel.isValidEmail(email))
      return res.status(400).json({ message: "Invalid email address" });

    if (!userModel.isValidPassword(password))
      return res.status(400).json({
        message:
          "Password must be at least 6 characters long and include uppercase, lowercase, and a digit",
      });

    const existingUsername = await userModel.findUserByUsername(username);
    if (existingUsername) return res.status(400).json({ message: "Username already taken" });

    const normalizedEmail = email.trim().toLowerCase();
    const existingEmail = await userModel.findUserByEmail(normalizedEmail);
    if (existingEmail) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const profileImagePath = req.file ? req.file.path : null;

    const user = await userModel.createUser(
      username,
      normalizedEmail,
      hashedPassword,
      profileImagePath
    );

    
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


// ---------------------- Login ----------------------
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

// ---------------------- Get User ----------------------
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

// ---------------------- Friend Requests ----------------------
const sendFriendRequest = async (req, res) => {
  try {
    const sender_id = req.user.user_id;
    const { receiver_id } = req.body;
    if (!receiver_id)
      return res.status(400).json({ message: "Missing receiver_id" });
    if (sender_id === receiver_id)
      return res.status(400).json({ message: "Cannot send friend request to yourself" });

    const existing = await userModel.checkFriendshipExists(sender_id, receiver_id);
    if (existing)
      return res.status(400).json({ message: "Friendship already exists or pending" });

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

    await userModel.declineFriendRequest(sender_id, receiver_id);
    return res.status(200).json({ message: "Friend request declined successfully" });
  } catch (err) {
    console.error("DeclineFriendRequest Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ---------------------- Cancel & Unfriend ----------------------
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

    const existing = await userModel.checkFriendshipExists(user1_id, user2_id);
    if (!existing) return res.status(400).json({ message: "No friendship found to unfriend" });

    await userModel.unfriend(user1_id, user2_id);
    return res.status(200).json({ message: "Unfriended successfully" });
  } catch (err) {
    console.error("Unfriend Error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ---------------------- List Friends / Requests ----------------------
const listFriends = async (req, res) => {
  try {
    const { username } = req.params;
    const user_id = await userModel.findUserIdByUsername(username);
    if (!user_id) return res.status(404).json({ message: "User not found" });

    const friends = await userModel.getFriendList(user_id);
    return res.status(200).json({
      message: friends.length ? "Friends list fetched" : "No friends found",
      friends,
    });
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

// ---------------------- Messaging ----------------------
const sendMessage = async (req, res) => {
  try {
    const sender_id = req.user.user_id;
    const { receiver_id, content, is_media = false } = req.body;
    if (!receiver_id || !content)
      return res.status(400).json({ message: "Missing receiver_id or content" });

    const friendship = await userModel.checkFriendshipExists(sender_id, receiver_id);
    if (!friendship)
      return res.status(403).json({ message: "You are not friends with this user" });

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
    if (!friendship)
      return res.status(403).json({ message: "You are not friends with this user" });

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
const searchUsers = async (req, res) => {
  try {
    const searchText = req.query.search || "";
    if (!searchText.trim()) return res.json({ users: [] });

    const users = await userModel.searchUsers(searchText, req.user.user_id);
    res.json({ users });
  } catch (err) {
    console.error("SearchUsers Controller Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// ---------------------- Block / Unblock Users ----------------------
const blockUser = async (req, res) => {
  try {
    const blocker_id = req.user.user_id;
    const { blocked_id } = req.body;

    if (!blocked_id)
      return res.status(400).json({ message: "Missing blocked_id" });

    if (blocker_id === blocked_id)
      return res.status(400).json({ message: "You cannot block yourself" });

    const blocked = await userModel.BlockedUser.block(blocker_id, blocked_id);
    return res.status(200).json({ message: "User blocked successfully", blocked });
  } catch (err) {
    console.error("blockUser error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const unblockUser = async (req, res) => {
  try {
    const blocker_id = req.user.user_id;
    const { blocked_id } = req.body;

    if (!blocked_id)
      return res.status(400).json({ message: "Missing blocked_id" });

    const unblocked = await userModel.BlockedUser.unblock(blocker_id, blocked_id);
    return res.status(200).json({ message: "User unblocked successfully", unblocked });
  } catch (err) {
    console.error("unblockUser error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

const listBlockedUsers = async (req, res) => {
  try {
    const blocker_id = req.user.user_id; // from token

    
    const blockedUsers = await userModel.BlockedUser.listByUser(blocker_id);

    res.status(200).json(blockedUsers);
  } catch (error) {
    console.error("Error listing blocked users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};










module.exports = {
  register,
  login,
  getUserByUsername,
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
  searchUsers,
  blockUser,
  unblockUser,
  listBlockedUsers,
};
