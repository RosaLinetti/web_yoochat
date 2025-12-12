const jwt = require("jsonwebtoken");
const { encryptHill } = require("../Cryptography/Hill_Cipher");
const userModel = require("../models/model");

module.exports = (io) => {
  
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication failed: No token"));

    try {
      const decoded = jwt.verify(token, process.env.secret_key);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Authentication failed: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.user_id;
    console.log(`🔌 User connected: ${userId}`);
  
    socket.join(`user_${userId}`);

    // Real-time messaging
    socket.on("send_message", async ({ to, content, is_media }) => {
      try {
        if (!to || !content) return;

        const isFriend = await userModel.checkFriendshipExists(userId, to);
        if (!isFriend) {
          console.warn(`Blocked message: ${userId} is not friends with ${to}`);
          return; 
        }

        const encryptedContent = encryptHill(content, process.env.HILL_KEY);
        const savedMessage = await userModel.sendMessage(userId, to, encryptedContent, is_media);

        const sender = await userModel.findUserById(userId);

        // 1. Message object for the SENDER (Unencrypted for instant display)
    const senderMessage = {
      message_id: savedMessage.message_id,
      sender_id: userId,
      sender_name: sender.username,
      content: content,
      is_media,
      timestamp: savedMessage.message_time,
    };

    // 2. Message object for the RECEIVER 
    const receiverMessage = {
      message_id: savedMessage.message_id,
      sender_id: userId,
      sender_name: sender.username,
      content: encryptedContent, 
      timestamp: savedMessage.message_time,
    };

// 3. Emit
io.to(`user_${to}`).emit("receive_message", receiverMessage); // Send ENCRYPTED to recipient
io.to(`user_${userId}`).emit("receive_message", senderMessage); // Send UNENCRYPTED back to sender
      } catch (err) {
        console.error("Error sending message:", err.message);
      }
    });

    // Real-time friend request sent
    socket.on("send_friend_request", async ({ receiver_id }) => {
      try {
        if (!receiver_id) return;

        await userModel.createFriendRequest(userId, receiver_id);
        // Notify receiver in real-time
        io.to(`user_${receiver_id}`).emit("new_friend_request", {
          sender_id: userId,
          sender_name: (await userModel.findUserById(userId)).username,
        });
      } catch (err) {
        console.error("Error sending friend request:", err.message);
      }
    });

    // Real-time accept friend request
    socket.on("accept_friend_request", async ({ sender_id }) => {
      try {
        if (!sender_id) return;
        await userModel.acceptFriendRequest(sender_id, userId);

        // Notify sender that request accepted
        io.to(`user_${sender_id}`).emit("friend_request_accepted", {
          user_id: userId,
          username: (await userModel.findUserById(userId)).username,
        });
      } catch (err) {
        console.error("Error accepting friend request:", err.message);
      }
    });

    // Real-time decline friend request
    socket.on("decline_friend_request", async ({ sender_id }) => {
      try {
        if (!sender_id) return;
        await userModel.declineFriendRequest(sender_id, userId);

        // Optional: Notify sender that request was declined
        io.to(`user_${sender_id}`).emit("friend_request_declined", {
          user_id: userId,
          username: (await userModel.findUserById(userId)).username,
        });
      } catch (err) {
        console.error("Error declining friend request:", err.message);
      }
    });

    // Real-time cancel friend request
    socket.on("cancel_friend_request", async ({ receiver_id }) => {
      try {
        if (!receiver_id) return;
        await userModel.cancelFriendRequest(userId, receiver_id);

        // Notify receiver that request was cancelled
        io.to(`user_${receiver_id}`).emit("friend_request_cancelled", {
          user_id: userId,
        });
      } catch (err) {
        console.error("Error cancelling friend request:", err.message);
      }
    });

    // Real-time unfriend
    socket.on("unfriend", async ({ user2_id }) => {
      try {
        if (!user2_id) return;
        await userModel.unfriend(userId, user2_id);

        io.to(`user_${user2_id}`).emit("unfriended", {
          user_id: userId,
        });
      } catch (err) {
        console.error("Error unfriending:", err.message);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
    });
  });
};
