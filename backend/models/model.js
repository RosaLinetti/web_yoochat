const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.db_user,
  password: process.env.db_password,
  host: process.env.db_host,
  port: process.env.db_port,
  database: process.env.db_name,
});

// -------------------- Validations --------------------
const isValidEmail = (email) => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|io|net|org|edu)$/;
  return emailRegex.test(email);
};

const isValidPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  return passwordRegex.test(password);
};

// -------------------- User Functions --------------------
const findUserByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE LOWER(email) = LOWER($1)",
    [email.trim()]
  );
  return result.rows[0];
};

const findUserByUsername = async (username) => {
  const result = await pool.query(
    "SELECT user_id, username, email, profile_image, password FROM users WHERE username = $1",
    [username]
  );
  return result.rows[0];
};

const findUserIdByUsername = async (username) => {
  const result = await pool.query(
    "SELECT user_id FROM users WHERE username = $1",
    [username]
  );
  return result.rows[0]?.user_id;
};

// Get user by ID
const findUserById = async (user_id) => {
  const result = await pool.query(
    "SELECT user_id, username, email, profile_image FROM users WHERE user_id = $1",
    [user_id]
  );
  return result.rows[0];
};

const createUser = async (username, email, password, profileImagePath = null) => {
  const result = await pool.query(
    "INSERT INTO users (username, email, password, profile_image) VALUES ($1, $2, $3, $4) RETURNING user_id, username, email, profile_image",
    [username, email, password, profileImagePath]
  );
  return result.rows[0];
};

// -------------------- Friendship --------------------
const checkFriendshipExists = async (user1_id, user2_id) => {
  const result = await pool.query(
    `SELECT * FROM friendship 
     WHERE ((user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)) 
       AND status = 'accepted'`,
    [user1_id, user2_id]
  );
  return result.rows.length > 0;
};

const createFriendRequest = async (user1_id, user2_id) => {
  await pool.query(
    "INSERT INTO friendship (user1_id, user2_id, status) VALUES ($1, $2, 'pending')",
    [user1_id, user2_id]
  );
};

const checkPendingFriendRequest = async (sender_id, receiver_id) => {
  const result = await pool.query(
    "SELECT * FROM friendship WHERE user1_id = $1 AND user2_id = $2 AND status = 'pending'",
    [sender_id, receiver_id]
  );
  return result.rows.length > 0;
};

const acceptFriendRequest = async (sender_id, receiver_id) => {
  await pool.query(
    "UPDATE friendship SET status = 'accepted' WHERE user1_id = $1 AND user2_id = $2 AND status = 'pending'",
    [sender_id, receiver_id]
  );
};

const cancelFriendRequest = async (sender_id, receiver_id) => {
  await pool.query(
    "DELETE FROM friendship WHERE user1_id = $1 AND user2_id = $2 AND status = 'pending'",
    [sender_id, receiver_id]
  );
};

const declineFriendRequest = async (sender_id, receiver_id) => {
  await pool.query(
    "DELETE FROM friendship WHERE user1_id = $1 AND user2_id = $2 AND status = 'pending'",
    [sender_id, receiver_id]
  );
};

const unfriend = async (user1_id, user2_id) => {
  await pool.query(
    `DELETE FROM friendship 
     WHERE ((user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)) 
       AND status = 'accepted'`,
    [user1_id, user2_id]
  );
};

const getFriendList = async (user_id) => {
  const result = await pool.query(
    `SELECT u.user_id, u.username, u.email, u.profile_image
     FROM users u
     JOIN friendship f 
       ON (f.user1_id = u.user_id AND f.user2_id = $1 AND f.status = 'accepted')
       OR (f.user2_id = u.user_id AND f.user1_id = $1 AND f.status = 'accepted')`,
    [user_id]
  );
  return result.rows;
};

const getPendingFriendRequests = async (receiver_id) => {
  const result = await pool.query(
    `SELECT f.user1_id AS sender_id, u.username, u.email, u.profile_image
     FROM friendship f
     JOIN users u ON u.user_id = f.user1_id
     WHERE f.user2_id = $1 AND f.status = 'pending'`,
    [receiver_id]
  );
  return result.rows;
};

const getSentFriendRequests = async (sender_id) => {
  const result = await pool.query(
    `SELECT f.user2_id AS receiver_id, u.username, u.profile_image
     FROM friendship f
     JOIN users u ON u.user_id = f.user2_id
     WHERE f.user1_id = $1 AND f.status = 'pending'`,
    [sender_id]
  );
  return result.rows;
};

// -------------------- Messaging --------------------
const sendMessage = async (sender_id, receiver_id, content, is_media = false) => {
  const result = await pool.query(
    "INSERT INTO message (sender_id, receiver_id, content, is_media) VALUES ($1, $2, $3, $4) RETURNING message_id, message_time",
    [sender_id, receiver_id, content, is_media]
  );
  return result.rows[0];
};

const getConversation = async (user1_id, user2_id) => {
  const result = await pool.query(
    `SELECT m.message_id, m.sender_id, m.receiver_id, m.content, m.message_time, COALESCE(u.username, 'Unknown') AS sender_name
     FROM message m
     LEFT JOIN users u ON m.sender_id = u.user_id
     WHERE (m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1)
     ORDER BY m.message_time ASC`,
    [user1_id, user2_id]
  );
  return result.rows;
};

// -------------------- Search Users --------------------
const searchUsers = async (searchText, currentUserId = null) => {
  try {
   
    
    if (!searchText || searchText.trim() === "") return [];

    let values = ["%" + searchText.toLowerCase() + "%"];
    
    let query = `
      SELECT user_id, username, profile_image
      FROM users
      WHERE LOWER(username) ILIKE $1
    `;

    if (currentUserId) {
      query += " AND user_id != $2";
      values.push(currentUserId);
    }

    query += " ORDER BY username ASC LIMIT 20";

    const result = await pool.query(query, values);
    
    return result.rows;
  } catch (err) {
    console.error("searchUsers Model Error:", err);
    return [];
  }
};

// -------------------- Blocked Users --------------------
const BlockedUser = {
  async block(blocker_id, blocked_id) {
    const result = await pool.query(
      "INSERT INTO blockeduser (blocker_id, blocked_id) VALUES ($1, $2) RETURNING *",
      [blocker_id, blocked_id]
    );
    return result.rows[0];
  },

  async unblock(blocker_id, blocked_id) {
    const result = await pool.query(
      "DELETE FROM blockeduser WHERE blocker_id = $1 AND blocked_id = $2 RETURNING *",
      [blocker_id, blocked_id]
    );
    return result.rows[0];
  },

  async listByUser(blocker_id) {
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.profile_image
       FROM blockeduser b
       JOIN users u ON b.blocked_id = u.user_id
       WHERE b.blocker_id = $1`,
      [blocker_id]
    );
    return result.rows;
  },
};

// Update user info
const updateUser = async (user_id, newUsername, newProfileImagePath) => {
  const result = await pool.query(
    `UPDATE users
     SET username = COALESCE($2, username),
         profile_image = COALESCE($3, profile_image)
     WHERE user_id = $1
     RETURNING user_id, username, email, profile_image`,
    [user_id, newUsername, newProfileImagePath]
  );
  return result.rows[0];
};

module.exports = {
  isValidEmail,
  isValidPassword,
  findUserByEmail,
  findUserByUsername,
  findUserIdByUsername,
  findUserById,
  createUser,
  checkFriendshipExists,
  createFriendRequest,
  checkPendingFriendRequest,
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  unfriend,
  getFriendList,
  getPendingFriendRequests,
  getSentFriendRequests,
  sendMessage,
  getConversation,
  searchUsers,
  BlockedUser,
  updateUser
};