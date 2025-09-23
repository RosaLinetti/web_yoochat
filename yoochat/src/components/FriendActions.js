// src/components/FriendActions.js
import React, { useState } from "react";
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
} from "../api/api";

const FriendActions = ({ user, type, onActionComplete, token, sentRequests }) => {
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);

  // Base button style
  const baseButtonStyle = {
    padding: "6px 16px",
    borderRadius: "999px",
    border: "none",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background 0.2s",
  };

  const acceptStyle = { ...baseButtonStyle, backgroundColor: "#9333ea" };
  const declineStyle = { ...baseButtonStyle, backgroundColor: "#7c2be2" };
  const cancelStyle = { ...baseButtonStyle, backgroundColor: "#7c2be2" };
  const addStyle = { ...baseButtonStyle, backgroundColor: "#9333ea" };

  // Send Friend Request
  const handleAdd = async () => {
    setLoading(true);
    try {
      await sendFriendRequest(user.user_id, token);
      setDisabled(true);
      if (onActionComplete) onActionComplete(user.user_id, "sent");
    } catch (err) {
      console.error("Add friend error:", err);
    }
    setLoading(false);
  };

  // Accept received friend request
  const handleAccept = async () => {
    setLoading(true);
    try {
      await acceptFriendRequest(user.sender_id, token);
      // Pass the full user object so Home can update friends properly
      if (onActionComplete) onActionComplete(user.sender_id, "accepted", user);
    } catch (err) {
      console.error("Accept friend error:", err);
    }
    setLoading(false);
  };

  // Decline received friend request
  const handleDecline = async () => {
    setLoading(true);
    try {
      await declineFriendRequest(user.sender_id, token);
      if (onActionComplete) onActionComplete(user.sender_id, "declined");
    } catch (err) {
      console.error("Decline friend error:", err);
    }
    setLoading(false);
  };

  // Cancel sent request
  const handleCancel = async () => {
    setLoading(true);
    try {
      await cancelFriendRequest(user.receiver_id, token);
      if (onActionComplete) onActionComplete(user.receiver_id, "cancelled");
    } catch (err) {
      console.error("Cancel request error:", err);
    }
    setLoading(false);
  };

  // Disable Add Friend if already sent
  const alreadySent = sentRequests?.some(
    (s) => s.receiver_id === user.user_id
  );

  // Render buttons
  if (type === "add") {
    return (
      <button
        onClick={handleAdd}
        disabled={disabled || loading || alreadySent}
        style={addStyle}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#7c2be2")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#9333ea")}
      >
        {disabled || alreadySent
          ? "Request Sent"
          : loading
          ? "Sending..."
          : "Add Friend"}
      </button>
    );
  }

  if (type === "pending") {
    return (
      <div style={{ display: "flex", gap: "6px" }}>
        {user.sender_id && (
          <>
            <button
              onClick={handleAccept}
              disabled={loading}
              style={acceptStyle}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#7c2be2")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#9333ea")}
            >
              {loading ? "Processing..." : "Accept"}
            </button>
            <button
              onClick={handleDecline}
              disabled={loading}
              style={declineStyle}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#7c2be2")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#9333ea")}
            >
              {loading ? "Processing..." : "Decline"}
            </button>
          </>
        )}
        {user.receiver_id && (
          <button
            onClick={handleCancel}
            disabled={loading}
            style={cancelStyle}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#7c2be2")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#9333ea")}
          >
            {loading ? "Cancelling..." : "Cancel"}
          </button>
        )}
      </div>
    );
  }

  return null;
};

export default FriendActions;
