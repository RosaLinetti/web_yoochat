const express = require("express");
const router = express.Router();
const multer = require("multer");
const controller = require("../controllers/controller");
const verifyToken = require("../verifytoken");

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// =================== AUTH ===================
router.post("/register", upload.single("profileImage"), controller.register);
router.post("/login", controller.login);

// =================== USERS ===================
// IMPORTANT: Put specific routes BEFORE parameterized routes
router.get("/users/me", verifyToken, controller.getMyProfile);        // ← Move this FIRST
router.get("/users/search", controller.searchUsers);                  // ← Move this BEFORE :username
router.get("/users/blocked", verifyToken, controller.listBlockedUsers); // ← Move this BEFORE :username
router.get("/users/:username", controller.getUserByUsername);          // ← Keep this LAST

// =================== FRIENDSHIP ===================
router.post("/friendship/sendRequest", verifyToken, controller.sendFriendRequest);
router.post("/friendship/acceptRequest", verifyToken, controller.acceptFriendRequest);
router.get("/friendship/list/:username", verifyToken, controller.listFriends);
router.get("/friendship/pendingRequests", verifyToken, controller.listPendingRequests);
router.get("/friendship/sentRequests", verifyToken, controller.getSentRequests);
router.post("/friendship/cancelRequest", verifyToken, controller.cancelFriendRequest);
router.post("/friendship/unfriend", verifyToken, controller.unfriend);
router.post("/friendship/declineRequest", verifyToken, controller.declineFriendRequest);

// =================== MESSAGING ===================
router.post("/message/send", verifyToken, controller.sendMessage);
router.get("/message/conversation/:friend_id", verifyToken, controller.getConversation);

// =================== BLOCKING ===================
router.post("/block", verifyToken, controller.blockUser);
router.post("/unblock", verifyToken, controller.unblockUser);
// Note: listBlockedUsers is already included above in the USERS section

// =================== PROFILE UPDATE ===================
router.put("/users/update", verifyToken, upload.single("profileImage"), controller.updateUserProfile);

module.exports = router;