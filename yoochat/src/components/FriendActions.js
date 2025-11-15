import React, { useState } from "react";
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
} from "../api/api";
import "./FriendActions.css"; // Ensure this file contains .purple-btn & .purple-btn-small

const FriendActions = ({ user, type, onActionComplete, token, sentRequests }) => {
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const alreadySent = sentRequests?.some(
    (s) => s.receiver_id === user.user_id
  );

  // Handlers
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

  const handleAccept = async () => {
    setLoading(true);
    try {
      await acceptFriendRequest(user.sender_id, token);
      if (onActionComplete) onActionComplete(user.sender_id, "accepted", user);
    } catch (err) {
      console.error("Accept friend error:", err);
    }
    setLoading(false);
  };

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

  // Render buttons
  if (type === "add") {
    return (
      <button
        className="purple-btn"
        onClick={handleAdd}
        disabled={disabled || loading || alreadySent}
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
      <div className="friend-action">
        {user.sender_id && (
          <>
            <button
              className="purple-btn purple-btn-small"
              onClick={handleAccept}
              disabled={loading}
            >
              {loading ? "Processing..." : "Accept"}
            </button>
            <button
              className="purple-btn purple-btn-small"
              onClick={handleDecline}
              disabled={loading}
            >
              {loading ? "Processing..." : "Decline"}
            </button>
          </>
        )}
        {user.receiver_id && (
          <button
            className="purple-btn purple-btn-small"
            onClick={handleCancel}
            disabled={loading}
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
